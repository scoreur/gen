/* Wrapper for accessing strings through sequential reads */
// TODO: use typed array
function Stream(str) {
	var position = 0;
	var instr = str==undefined? "": str;
	
	function read(length) {
		var result = instr.substr(position, length);
		position += length;
		return result;
	}
	function write(s){
		instr += s;
		return position += s.length;
	}
	
	/* read a big-endian 32-bit integer */
	function readInt32() {
		var result = (
			(instr.charCodeAt(position) << 24)
			+ (instr.charCodeAt(position + 1) << 16)
			+ (instr.charCodeAt(position + 2) << 8)
			+ instr.charCodeAt(position + 3));
		position += 4;
		return result;
	}
	function writeInt32(i){
		instr += String.fromCharCode((i>>24)&0xFF,(i>>16)&0xFF,(i>>8)&0xFF,i&0xFF);
		return position += 4;
	}

	/* read a big-endian 16-bit integer */
	function readInt16() {
		var result = (
			(instr.charCodeAt(position) << 8)
			+ instr.charCodeAt(position + 1));
		position += 2;
		return result;
	}
	function writeInt16(i){
        instr += String.fromCharCode((i>>8)&0xFF,i&0xFF);
		return position += 2;
	}
	
	/* read an 8-bit integer */
	function readInt8(signed) {
		var result = instr.charCodeAt(position);
		if (signed && result > 127) result -= 256;
		position += 1;
		return result;
	}
	function writeInt8(i){
        instr += String.fromCharCode(i&0xFF);
        return position += 1;
	}
	
	function eof() {
		return position >= instr.length;
	}
	
	/* read a MIDI-style variable-length integer
		(big-endian value in groups of 7 bits,
		with top bit set to signify that another byte follows)
	*/
	function readVarInt() {
		var result = 0;
		while (true) {
			var b = readInt8();
			if (b & 0x80) {
				result += (b & 0x7f);
				result <<= 7;
			} else {
				/* b is the last byte */
				return result + b;
			}
		}
	}
	function writeVarInt(i){
		var ret = String.fromCharCode(i&0x7F);
		while(i>0x7F){
			i >>= 7;
            ret = String.fromCharCode(0x80|(i&0x7F)) + ret;
		}
		instr += ret;
		return position += ret.length;
	}
    function reset(){
    	position = 0;
    	instr = "";
    }
	function readAll(){
		return instr;
	}
	function pos(){
		return position;
	}

	if(typeof str == "string"){
		return {
			'eof': eof,
			'read': read,
			'readInt32': readInt32,
			'readInt16': readInt16,
			'readInt8': readInt8,
			'readVarInt': readVarInt,
			'readAll': readAll,
			'reset': reset,
			'pos': pos
	    }

	}else{
		return {
			'write': write,
			'writeInt32': writeInt32,
			'writeInt16': writeInt16,
			'writeInt8': writeInt8,
			'writeVarInt': writeVarInt,
			'readAll': readAll,
			'reset': reset,
			'pos': pos
		}

	}
}

// test case
var TEST = TEST || {};
TEST.testStream = function (){
	
	var r = Stream('abcdefghijklmn12');
	var w = Stream();
	while(!r.eof()){
		w.writeInt32(r.readInt32());
	}
	if(r.readAll() == w.readAll()){
		console.log('PASS: writeInt32');
	}else{
		console.log('Fail: writeInt32', w.readAll());
		return false;
	}

	r.reset();
	w = Stream();
	while(!r.eof()){
		w.writeInt16(r.readInt16());
	}
	if(r.readAll() == w.readAll()){
		console.log('PASS: writeInt16');
	}else{
		console.log('Fail: writeInt16', w.readAll());
		return false;
	}

	w = Stream();
	w.writeVarInt(0x8FFF);
	w.writeInt8(0x1F);
	w.writeVarInt(0x76FF32);
	r = Stream(w.readAll());
	if(r.readVarInt() == 0x8FFF  && r.readInt8(true) == 0x1F && r.readVarInt() == 0x76FF32){
		console.log('PASS: writeVarInt');
	}else{
		console.log('Fail: writeVarInt', w.readAll(), r.readAll());
		return false;
	}

	return true;
}

if(typeof module!='undefined'){
	module.exports.Stream = Stream;
}
;/*
class to parse the .mid file format
(depends on stream.js)
*/

var Stream = Stream || (module && require && require('./stream').Stream);

var MIDI = MIDI || {};

MIDI.eventCode = {
	'sequenceNumber': 0x00,
	'text': 0x01,
	'copyrightNotice': 0x02,
	'trackName': 0x03,
	'instrumentName': 0x04,
	'lyrics': 0x05,
	'marker': 0x06,
	'cuePoint': 0x07,
	'midiChannelPrefix': 0x20,
	'endOfTrack': 0x2f,
	'setTempo': 0x51,
	'smpteOffset': 0x54,
	'timeSignature': 0x58,
	'keySignature': 0x59,
	'sequencerSpecific': 0x7f,
	'unknown': 0xff,
	'meta': 0xff,
	'sysEx': 0xf0,
	'dividedSysEx': 0xf7,

	'noteOff': 0x08,
	'noteOn': 0x09,
	'noteAftertouch': 0x0a,
	'controller': 0x0b,
	'programChange': 0x0c,
	'channelAftertouch': 0x0d,
	'pitchBend': 0x0e,
}

function MidiFile(data) {
	function readChunk(stream) {
		var id = stream.read(4);
		var length = stream.readInt32();
		return {
			'id': id,
			'length': length,
			'data': stream.read(length)
		};
	}
	
	var lastEventTypeByte;
	
	function readEvent(stream) {
		var event = {};
		event.deltaTime = stream.readVarInt();
		var eventTypeByte = stream.readInt8();
		if ((eventTypeByte & 0xf0) == 0xf0) {
			/* system / meta event */
			if (eventTypeByte == 0xff) {
				/* meta event */
				event.type = 'meta';
				var subtypeByte = stream.readInt8();
				var length = stream.readVarInt();
				switch(subtypeByte) {
					case 0x00:
						event.subtype = 'sequenceNumber';
						if (length != 2) throw "Expected length for sequenceNumber event is 2, got " + length;
						event.number = stream.readInt16();
						return event;
					case 0x01:
						event.subtype = 'text';
						event.text = stream.read(length);
						return event;
					case 0x02:
						event.subtype = 'copyrightNotice';
						event.text = stream.read(length);
						return event;
					case 0x03:
						event.subtype = 'trackName';
						event.text = stream.read(length);
						return event;
					case 0x04:
						event.subtype = 'instrumentName';
						event.text = stream.read(length);
						return event;
					case 0x05:
						event.subtype = 'lyrics';
						event.text = stream.read(length);
						return event;
					case 0x06:
						event.subtype = 'marker';
						event.text = stream.read(length);
						return event;
					case 0x07:
						event.subtype = 'cuePoint';
						event.text = stream.read(length);
						return event;
					case 0x20:
						event.subtype = 'midiChannelPrefix';
						if (length != 1) throw "Expected length for midiChannelPrefix event is 1, got " + length;
						event.channel = stream.readInt8();
						return event;
					case 0x2f:
						event.subtype = 'endOfTrack';
						if (length != 0) throw "Expected length for endOfTrack event is 0, got " + length;
						return event;
					case 0x51:
						event.subtype = 'setTempo';
						if (length != 3) throw "Expected length for setTempo event is 3, got " + length;
						event.microsecondsPerBeat = (
							(stream.readInt8() << 16)
							+ (stream.readInt8() << 8)
							+ stream.readInt8()
						)
						return event;
					case 0x54:
						event.subtype = 'smpteOffset';
						if (length != 5) throw "Expected length for smpteOffset event is 5, got " + length;
						var hourByte = stream.readInt8();
						event.frameRate = {
							0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30
						}[hourByte & 0x60];
						event.hour = hourByte & 0x1f;
						event.min = stream.readInt8();
						event.sec = stream.readInt8();
						event.frame = stream.readInt8();
						event.subframe = stream.readInt8();
						return event;
					case 0x58:
						event.subtype = 'timeSignature';
						if (length != 4) throw "Expected length for timeSignature event is 4, got " + length;
						event.numerator = stream.readInt8();
						event.denominator = Math.pow(2, stream.readInt8());
						event.metronome = stream.readInt8();
						event.thirtyseconds = stream.readInt8();
						return event;
					case 0x59:
						event.subtype = 'keySignature';
						if (length != 2) throw "Expected length for keySignature event is 2, got " + length;
						event.key = stream.readInt8(true);
						event.scale = stream.readInt8();
						return event;
					case 0x7f:
						event.subtype = 'sequencerSpecific';
						event.data = stream.read(length);
						return event;
					default:
						// console.log("Unrecognised meta event subtype: " + subtypeByte);
						event.subtype = 'unknown'
						event.data = stream.read(length);
						return event;
				}
				event.data = stream.read(length);
				return event;
			} else if (eventTypeByte == 0xf0) {
				event.type = 'sysEx';
				var length = stream.readVarInt();
				event.data = stream.read(length);
				return event;
			} else if (eventTypeByte == 0xf7) {
				event.type = 'dividedSysEx';
				var length = stream.readVarInt();
				event.data = stream.read(length);
				return event;
			} else {
				throw "Unrecognised MIDI event type byte: " + eventTypeByte;
			}
		} else {
			/* channel event */
			var param1;
			if ((eventTypeByte & 0x80) == 0) {
				/* running status - reuse lastEventTypeByte as the event type.
					eventTypeByte is actually the first parameter
				*/
				param1 = eventTypeByte;
				eventTypeByte = lastEventTypeByte;
			} else {
				param1 = stream.readInt8();
				lastEventTypeByte = eventTypeByte;
			}
			var eventType = eventTypeByte >> 4;
			event.channel = eventTypeByte & 0x0f;
			event.type = 'channel';
			switch (eventType) {
				case 0x08:
					event.subtype = 'noteOff';
					event.noteNumber = param1;
					event.velocity = stream.readInt8();
					return event;
				case 0x09:
					event.noteNumber = param1;
					event.velocity = stream.readInt8();
					if (event.velocity == 0) {
						event.subtype = 'noteOff';
					} else {
						event.subtype = 'noteOn';
					}
					return event;
				case 0x0a:
					event.subtype = 'noteAftertouch';
					event.noteNumber = param1;
					event.amount = stream.readInt8();
					return event;
				case 0x0b:
					event.subtype = 'controller';
					event.controllerType = param1;
					event.value = stream.readInt8();
					return event;
				case 0x0c:
					event.subtype = 'programChange';
					event.programNumber = param1;
					return event;
				case 0x0d:
					event.subtype = 'channelAftertouch';
					event.amount = param1;
					return event;
				case 0x0e:
					event.subtype = 'pitchBend';
					event.value = param1 + (stream.readInt8() << 7);
					return event;
				default:
					throw "Unrecognised MIDI event type: " + eventType
					/* 
					console.log("Unrecognised MIDI event type: " + eventType);
					stream.readInt8();
					event.subtype = 'unknown';
					return event;
					*/
			}
		}
	}
	
	var stream = Stream(data);
	var headerChunk = readChunk(stream);
	if (headerChunk.id != 'MThd' || headerChunk.length != 6) {
		throw "Bad .mid file - header not found";
	}
	var headerStream = Stream(headerChunk.data);
	var formatType = headerStream.readInt16();
	var trackCount = headerStream.readInt16();
	var timeDivision = headerStream.readInt16();
	
	if (timeDivision & 0x8000) {
		throw "Expressing time division in SMTPE frames is not supported yet"
	} else {
		ticksPerBeat = timeDivision;
	}
	
	var header = {
		'formatType': formatType,
		'trackCount': trackCount,
		'ticksPerBeat': ticksPerBeat
	}
	var tracks = [];
	for (var i = 0; i < header.trackCount; i++) {
		tracks[i] = [];
		var trackChunk = readChunk(stream);
		if (trackChunk.id != 'MTrk') {
			throw "Unexpected chunk - expected MTrk, got "+ trackChunk.id;
		}
		var trackStream = Stream(trackChunk.data);
		while (!trackStream.eof()) {
			var event = {};
			try{
				event = readEvent(trackStream);
				tracks[i].push(event);
			}catch(e){
				console.log(e,i);
			}finally{
				//console.log(event);
			}
			

		}
	}
	
	return new simpMidi(header, tracks);
}



function MidiWriter(data){

	var lastEventTypeByte = "nothing";

	var eventCode = MIDI.eventCode;
	var defaultLength = {
		'sequenceNumber': 2,
		'midiChannelPrefix': 1,
		'endOfTrack': 0,
		'setTempo': 3,
		'smpteOffset': 5,
		'timeSignature': 4,
		'keySignature': 2,
	}

    function writeEvent(event, stream){
    	stream.writeVarInt(event.deltaTime);
    	if(event.type == 'meta'){
    		stream.writeInt8(eventCode[event.type]);
    		stream.writeInt8(eventCode[event.subtype]);
    		var length = defaultLength[event.subtype] | 
    		(event.data && event.data.length) |
    		(event.text && event.text.length) ;

    		var content = Stream();
    		switch(event.subtype){
    			case 'sequenceNumber':
    			    content.writeInt16(event.number);
    			    break;
	            case 'midiChannelPrefix':
	                content.writeInt8(event.channel);
	                break;
	            case 'endOfTrack': 
	                break;
	            case 'setTempo':
	                content.writeInt8((event.microsecondsPerBeat>>16)&0xFF);
	                content.writeInt8((event.microsecondsPerBeat>>8)&0xFF);
	                content.writeInt8(event.microsecondsPerBeat&0xFF);
	                break;
	            case 'smpteOffset': 
	                var frameBits = {24:0x00, 25:0x20, 29:0x40, 30:0x60}[event.frameRate] & 0x60;
	                content.writeInt8(frameBits | (0x1f&event.hour));
	                content.writeInt8(event.min);
	                content.writeInt8(event.sec);
	                content.writeInt8(event.frame);
	                content.writeInt8(event.subframe);
	                break;
	            case 'timeSignature':
	                content.writeInt8(event.numerator);
	                content.writeInt8(Math.log2(event.denominator) >> 0);
	                content.writeInt8(event.metronome);
	                content.writeInt8(event.thirtyseconds);
	                break;
	            case 'keySignature':
	                content.writeInt8(event.key);
	                content.writeInt8(event.scale);
                    break;
    			default:

    		}
    		stream.writeVarInt(length);
    		stream.write(event.data || event.text || content.readAll());

    	}else if(event.type == 'sysEx' || event.type == 'dividedSysEx'){
    		stream.writeInt8(eventCode[event.type]);
    		stream.writeVarInt(event.data.length);
            stream.write(event.data);

    	}else if(event.type == 'channel'){
    		// channel event
    		var eventTypeByte = (eventCode[event.subtype] << 4) | (event.channel & 0x0f);
    		if(lastEventTypeByte != eventTypeByte){
    			stream.writeInt8(eventTypeByte);
    			lastEventTypeByte = eventTypeByte;
    		}
    		switch(event.subtype){
    			case 'noteOff': case 'noteOn':
    			    stream.writeInt8(event.noteNumber);
    			    stream.writeInt8(event.velocity);
    			    break;
    			case 'noteAftertouch':
    			    stream.writeInt8(event.noteNumber);
    			    stream.writeInt8(event.amount);
    			    break;
    			case 'controller':
    			    stream.writeInt8(event.controllerType);
    			    stream.writeInt8(event.value);
    			    break;
    			case 'programChange':
    			    stream.writeInt8(event.programNumber);
    			    break;
    			case 'channelAftertouch':
    			    stream.writeInt8(event.amount);
    			    break;
    			case 'pitchBend':
    			    stream.writeInt8(event.value & 0x7f);
    			    stream.writeInt8(event.value >> 7);
    			    break;
    			default:

    		}


    	}

	}

	function writeTrack(track){
		var res = Stream();
		for(var i=0;i<track.length;++i){
			writeEvent(track[i], res);
		}
		return res.readAll();
	}

	function write(d){
		var res = Stream();
		res.write('MThd');
		res.writeInt32(6);
		var header = d.header;
		var tracks = d.tracks;
		res.writeInt16(header.formatType);
		res.writeInt16(header.trackCount);
		res.writeInt16(header.ticksPerBeat);
		for(var j=0;j<tracks.length;++j){
			var t = writeTrack(tracks[j]);
			res.write('MTrk');
			res.writeInt32(t.length);
			res.write(t);
		}
		return res.readAll();
	}

	return write(data);
}



function simpEvent(deltaTime, subtype, param0, param1){
	var event = {};
	event.deltaTime = deltaTime;
	event.subtype = subtype;
	switch(subtype){
		case 'timeSignature':
		    event.type = 'meta';
		    event.numerator = param0;
	        event.denominator = param1;
	        event.metronome = 24;
	        event.thirtyseconds = 8;
	        break;
	    case 'keySignature':
	        event.type = 'meta';
	        event.key = param0;
	        event.scale = {"maj":0, "min":1}[param1]
            break;
    	case 'setTempo':
    	    event.type = 'meta';
    	    event.microsecondsPerBeat = 60000000/param0 >> 0;
    	    break;
    	case 'endOfTrack':
    	    event.type = 'meta';
    	    break;

    	case 'noteOff': case 'noteOn':
            event.type = 'channel';
            event.channel = param0;
    		event.noteNumber = param1[0];
    	    event.velocity = param1[1];
    	    break;
    	case 'programChange':
    	    event.type = 'channel';
    	    event.channel = param0;
    	    event.programNumber = param1;
    	    break;

	}
	return event;
}

function simpMidi(header, tracks){
	this.header = header || {
		'formatType': 1,
		'trackCount': 2,
		'ticksPerBeat': 500
	};
	this.tracks = tracks;
	this.getTimeSignature(); //simpEvent(0, 'timeSignature', 4,4);
    this.getKeySignature(); //simpEvent(0, 'keySignature', 0, 'maj');
    this.getTempo(); // simpEvent(0, 'setTempo', 120);
	this.tracks = this.tracks || [[
	    this.tsig,
	    this.ksig,
	    this.tempo
	],[
	    ]];

}

simpMidi.prototype.setDefaultTempo = function(tempo){
	tempo = tempo || 120;
	this.header.ticksPerBeat = Math.floor(60000/tempo);
};

simpMidi.prototype.getDefaultTempo = function(){
	return Math.floor(60000/this.header.ticksPerBeat);
}

simpMidi.prototype.getMeta = function(subtype){
	if(this.tracks == null) return null;
	var res = null;
	var track = this.tracks[0];
	for (var i = 0; i < track.length; ++i) {
		if (track[i].type == 'meta' && track[i].subtype == subtype) {
			res = track[i];
			break;
		}
	}
	return res;
}

simpMidi.prototype.getTimeSignature = function(){
	this.tsig = this.tsig || simpMidi.prototype.getMeta.call(this,'timeSignature') || simpEvent(0, 'timeSignature', 4,4);
	return [this.tsig.numerator, this.tsig.denominator];
};

simpMidi.prototype.getTempo = function(){
	// TODO: handle tempo change
	this.tempo = this.tempo || simpMidi.prototype.getMeta.call(this,'setTempo') || simpEvent(0, 'setTempo', 120);
	return 60000000/this.tempo.microsecondsPerBeat >>> 0

}

simpMidi.prototype.getKeySignature = function(){
	this.ksig = this.ksig || simpMidi.prototype.getMeta.call(this,'keySignature') || simpEvent(0, 'keySignature', 0, 'maj');
	return [this.ksig.key, this.ksig.scale];
}

simpMidi.prototype.write = function(lazy){
	return this.raw_midi = lazy? (this.raw_midi || MidiWriter(this)): MidiWriter(this);
}

simpMidi.prototype.setTimeSignature = function(n,d){
	this.tsig.numerator = n;
	this.tsig.denominator = d;
}
simpMidi.prototype.setKeySignature = function(k,m){
	this.ksig.key = k;
	this.ksig.scale = {"maj":0, "min":1}[m];
}
simpMidi.prototype.setTempo = function(t){
	this.tempo.microsecondsPerBeat = 60000000/t >>> 0;
}

simpMidi.prototype.addEvent = function(){
	var arg = Array.prototype.slice.call(arguments);
	this.tracks[arg.shift()].push(simpEvent(...arg));
}

simpMidi.prototype.finish = function(){
	for(var i=0;i<this.tracks.length;++i){
		this.tracks[i].push(simpEvent(0,'endOfTrack'));
	}
}
simpMidi.prototype.addTrack = function(){
	this.tracks.push([]);
	return this.header.trackCount = this.tracks.length;
}
simpMidi.prototype.addNotes = function(l,dur,notes,vols,rollTime,delta){
	var delta = delta || 0;
	var rollTime = rollTime || 0;
	var vols = vols || [110]
	if(typeof vols == 'number'){
		vols = [vols];
	}
	if(typeof notes == 'number'){
		notes = [notes];
	}
	if(l < 1){l = 1;}
	if(l >= this.tracks.length){ l = this.tracks.length - 1}
	var track = this.tracks[l];

	// the track l use the  channel l - 1
 	track.push(simpEvent(delta, 'noteOn', l-1, [notes[0], vols[0]]));
	notes.slice(1).forEach( function(e, i){
	    track.push(simpEvent(rollTime, 'noteOn', l-1, [e,vols[i] || vols[0]]));
	});
	track.push(simpEvent(dur-(notes.length-1)*rollTime, 'noteOn', l-1, [notes[0], 0]));
	notes.slice(1).forEach( function(e){
		track.push(simpEvent(0, 'noteOn', l-1, [e,0]));
	});

}

simpMidi.prototype.quantize = function(ctrl_per_beat){
	var ctrl_per_beat = ctrl_per_beat || 8;
	var ticks = this.header.ticksPerBeat;
	var res = [];
	for(var i=1;i<this.tracks.length;++i){
		var tmp = [];
		var delta = 0;
		this.tracks[i].forEach(function(e,i){
			if(e.type=='channel'){
				if(e.deltaTime > 0){
					delta += e.deltaTime
				}
				var tmp2 = [Math.round(delta / ticks * ctrl_per_beat)];
				switch(e.subtype){
					case 'noteOn':case 'noteOff':
						tmp2.push(e.subtype, e.noteNumber, e.velocity);
						break;
					case 'programChange':
						tmp2.push(e.subtype, e.programNumber);
						break;
					default:
						console.log(e.subtype);
						return;
				}
				tmp.push(tmp2);
			}
		});
        res.push(tmp);
	}
	return res;
};

var TEST = TEST || {};

TEST.testMidi = function(m){
	if(m==undefined) return true;
	var m1 = typeof m == 'string'? MidiFile(m): m;
	var f1 = MidiWriter(m1);
	var m2 = MidiFile(f1);
	var f2 = MidiWriter(m2);
	var m3 = MidiFile(f2);
	if(f1 == f2){
		console.log('PASS: MidiWriter',JSON.stringify(m2)==JSON.stringify(m3));
	}else{
		var diff = 0;
		while(true){
			if(f1.charCodeAt(diff) != f2.charCodeAt(diff)) break;
			diff++;
		}
		console.log('FAIL: MidiWriter', diff);
		return false;
	}
	return true;
}

if(typeof module!='undefined'){
	(function(t){	
		t.MidiFile = MidiFile;
		t.MidiWriter = MidiWriter;
		t.simpEvent = simpEvent;
		t.simpMidi = simpMidi;
	})(module.exports);
};
function Replayer(midiFile, timeWarp, eventProcessor, bpm) {
	var trackStates = [];
	var ticksPerBeat = midiFile.header.ticksPerBeat;
	var beatsPerMinute = bpm || Math.floor(60000 / ticksPerBeat); //bpm ? bpm : 120;
	var bpmOverride = bpm ? true : false;


	
	for (var i = 0; i < midiFile.tracks.length; i++) {
		trackStates[i] = {
			'nextEventIndex': 0,
			'ticksToNextEvent': (
				midiFile.tracks[i].length ?
					midiFile.tracks[i][0].deltaTime :
					null
			)
		};
	}

	//var nextEventInfo;
	//var samplesToNextEvent = 0;
	
	function getNextEvent() {
		var ticksToNextEvent = null;
		var nextEventTrack = null;
		var nextEventIndex = null;
		
		for (var i = 0; i < trackStates.length; i++) {
			if (
				trackStates[i].ticksToNextEvent != null
				&& (ticksToNextEvent == null || trackStates[i].ticksToNextEvent < ticksToNextEvent)
			) {
				ticksToNextEvent = trackStates[i].ticksToNextEvent;
				nextEventTrack = i;
				nextEventIndex = trackStates[i].nextEventIndex;
			}
		}
		if (nextEventTrack != null) {
			/* consume event from that track */
			var nextEvent = midiFile.tracks[nextEventTrack][nextEventIndex];
			if (midiFile.tracks[nextEventTrack][nextEventIndex + 1]) {
				trackStates[nextEventTrack].ticksToNextEvent += midiFile.tracks[nextEventTrack][nextEventIndex + 1].deltaTime;
			} else {
				trackStates[nextEventTrack].ticksToNextEvent = null;
			}
			trackStates[nextEventTrack].nextEventIndex += 1;
			/* advance timings on all tracks by ticksToNextEvent */
			for (var i = 0; i < trackStates.length; i++) {
				if (trackStates[i].ticksToNextEvent != null) {
					trackStates[i].ticksToNextEvent -= ticksToNextEvent
				}
			}
			return {
				"ticksToEvent": ticksToNextEvent,
				"event": nextEvent,
				"track": nextEventTrack
			}
		} else {
			return null;
		}
	};
	//
	var midiEvent;
	var temporal = [];
	//
	function processEvents() {
		function processNext() {
		    if (!bpmOverride && midiEvent.event.type == "meta" && midiEvent.event.subtype == "setTempo" ) {
				// tempo change events can occur anywhere in the middle and affect events that follow
				beatsPerMinute = 60000000 / midiEvent.event.microsecondsPerBeat;
			}
			///
			var beatsToGenerate = 0;
			var secondsToGenerate = 0;
			if (midiEvent.ticksToEvent > 0) {
				beatsToGenerate = midiEvent.ticksToEvent / ticksPerBeat;
				secondsToGenerate = beatsToGenerate / (beatsPerMinute / 60);
			}
			///
			var time = (secondsToGenerate * 1000 * timeWarp) || 0;
			temporal.push([ midiEvent, time]);
			midiEvent = getNextEvent();
		};
		///
		if (midiEvent = getNextEvent()) {
			while(midiEvent) processNext(true);
		}
	};

	function clone(o) {
		if (typeof o != 'object') return (o);
		if (o == null) return (o);
		var ret = (typeof o.length == 'number') ? [] : {};
		for (var key in o) ret[key] = clone(o[key]);
		return ret;
	};

	processEvents();
	return {
		"getData": function() {
			return clone(temporal);
		}
	};
};

if(typeof module != 'undefined'){
	module.exports.Replayer = Replayer;
}
;/*
	----------------------------------------------------------
	MIDI.audioDetect : 2015-05-16
	----------------------------------------------------------
	https://github.com/mudcube/MIDI.js
	----------------------------------------------------------
	Probably, Maybe, No... Absolutely!
	Test to see what types of <audio> MIME types are playable by the browser.
	----------------------------------------------------------
*/

if (typeof MIDI === 'undefined') MIDI = {};

(function(root) { 'use strict';

	var supports = {}; // object of supported file types
	var pending = 0; // pending file types to process
	///
	function canPlayThrough(src) { // check whether format plays through
		pending ++;
		///
		var body = document.body;
		var audio = new Audio();
		var mime = src.split(';')[0];
		audio.id = 'audio';
		audio.setAttribute('preload', 'auto');
		audio.setAttribute('audiobuffer', true);
		audio.addEventListener('error', function() {
			body.removeChild(audio);
			supports[mime] = false;
			pending --;
		}, false);
		audio.addEventListener('canplaythrough', function() {
			body.removeChild(audio);
			supports[mime] = true;
			pending --;
		}, false);
		audio.src = 'data:' + src;
		body.appendChild(audio);
	};

	root.audioDetect = function(onsuccess) {

		/// detect midi plugin
		if (navigator.requestMIDIAccess) {
			var toString = Function.prototype.toString;
			var isNative = toString.call(navigator.requestMIDIAccess).indexOf('[native code]') !== -1;
			if (isNative) { // has native midi support
				supports['webmidi'] = true;
			} else { // check for jazz plugin support
				for (var n = 0; navigator.plugins.length > n; n ++) {
					var plugin = navigator.plugins[n];
					if (plugin.name.indexOf('Jazz-Plugin') >= 0) {
						supports['webmidi'] = true;
					}
				}
			}
		}

		/// check whether <audio> tag is supported
		if (typeof Audio === 'undefined') {
			onsuccess(supports);
			return;
		} else {
			supports['audiotag'] = true;

			/// check for webaudio api support
			if (window.AudioContext || window.webkitAudioContext) {
				supports['webaudio'] = true;
			}

			/// check whether canPlayType is supported
			var audio = new Audio();
			if (audio.canPlayType) {

				/// see what we can learn from the browser
				var vorbis = audio.canPlayType('audio/ogg; codecs="vorbis"');
				vorbis = (vorbis === 'probably' || vorbis === 'maybe');
				var mpeg = audio.canPlayType('audio/mpeg');
				mpeg = (mpeg === 'probably' || mpeg === 'maybe');

				// maybe nothing is supported
				if (!vorbis && !mpeg) {
					onsuccess(supports);
					return;
				}

				/// or maybe something is supported
				if (vorbis) canPlayThrough('audio/ogg;base64,T2dnUwACAAAAAAAAAADqnjMlAAAAAOyyzPIBHgF2b3JiaXMAAAAAAUAfAABAHwAAQB8AAEAfAACZAU9nZ1MAAAAAAAAAAAAA6p4zJQEAAAANJGeqCj3//////////5ADdm9yYmlzLQAAAFhpcGguT3JnIGxpYlZvcmJpcyBJIDIwMTAxMTAxIChTY2hhdWZlbnVnZ2V0KQAAAAABBXZvcmJpcw9CQ1YBAAABAAxSFCElGVNKYwiVUlIpBR1jUFtHHWPUOUYhZBBTiEkZpXtPKpVYSsgRUlgpRR1TTFNJlVKWKUUdYxRTSCFT1jFloXMUS4ZJCSVsTa50FkvomWOWMUYdY85aSp1j1jFFHWNSUkmhcxg6ZiVkFDpGxehifDA6laJCKL7H3lLpLYWKW4q91xpT6y2EGEtpwQhhc+211dxKasUYY4wxxsXiUyiC0JBVAAABAABABAFCQ1YBAAoAAMJQDEVRgNCQVQBABgCAABRFcRTHcRxHkiTLAkJDVgEAQAAAAgAAKI7hKJIjSZJkWZZlWZameZaouaov+64u667t6roOhIasBACAAAAYRqF1TCqDEEPKQ4QUY9AzoxBDDEzGHGNONKQMMogzxZAyiFssLqgQBKEhKwKAKAAAwBjEGGIMOeekZFIi55iUTkoDnaPUUcoolRRLjBmlEluJMYLOUeooZZRCjKXFjFKJscRUAABAgAMAQICFUGjIigAgCgCAMAYphZRCjCnmFHOIMeUcgwwxxiBkzinoGJNOSuWck85JiRhjzjEHlXNOSuekctBJyaQTAAAQ4AAAEGAhFBqyIgCIEwAwSJKmWZomipamiaJniqrqiaKqWp5nmp5pqqpnmqpqqqrrmqrqypbnmaZnmqrqmaaqiqbquqaquq6nqrZsuqoum65q267s+rZru77uqapsm6or66bqyrrqyrbuurbtS56nqqKquq5nqq6ruq5uq65r25pqyq6purJtuq4tu7Js664s67pmqq5suqotm64s667s2rYqy7ovuq5uq7Ks+6os+75s67ru2rrwi65r66os674qy74x27bwy7ouHJMnqqqnqq7rmarrqq5r26rr2rqmmq5suq4tm6or26os67Yry7aumaosm64r26bryrIqy77vyrJui67r66Ys67oqy8Lu6roxzLat+6Lr6roqy7qvyrKuu7ru+7JuC7umqrpuyrKvm7Ks+7auC8us27oxuq7vq7It/KosC7+u+8Iy6z5jdF1fV21ZGFbZ9n3d95Vj1nVhWW1b+V1bZ7y+bgy7bvzKrQvLstq2scy6rSyvrxvDLux8W/iVmqratum6um7Ksq/Lui60dd1XRtf1fdW2fV+VZd+3hV9pG8OwjK6r+6os68Jry8ov67qw7MIvLKttK7+r68ow27qw3L6wLL/uC8uq277v6rrStXVluX2fsSu38QsAABhwAAAIMKEMFBqyIgCIEwBAEHIOKQahYgpCCKGkEEIqFWNSMuakZM5JKaWUFEpJrWJMSuaclMwxKaGUlkopqYRSWiqlxBRKaS2l1mJKqcVQSmulpNZKSa2llGJMrcUYMSYlc05K5pyUklJrJZXWMucoZQ5K6iCklEoqraTUYuacpA46Kx2E1EoqMZWUYgupxFZKaq2kFGMrMdXUWo4hpRhLSrGVlFptMdXWWqs1YkxK5pyUzDkqJaXWSiqtZc5J6iC01DkoqaTUYiopxco5SR2ElDLIqJSUWiupxBJSia20FGMpqcXUYq4pxRZDSS2WlFosqcTWYoy1tVRTJ6XFklKMJZUYW6y5ttZqDKXEVkqLsaSUW2sx1xZjjqGkFksrsZWUWmy15dhayzW1VGNKrdYWY40x5ZRrrT2n1mJNMdXaWqy51ZZbzLXnTkprpZQWS0oxttZijTHmHEppraQUWykpxtZara3FXEMpsZXSWiypxNhirLXFVmNqrcYWW62ltVprrb3GVlsurdXcYqw9tZRrrLXmWFNtBQAADDgAAASYUAYKDVkJAEQBAADGMMYYhEYpx5yT0ijlnHNSKucghJBS5hyEEFLKnINQSkuZcxBKSSmUklJqrYVSUmqttQIAAAocAAACbNCUWByg0JCVAEAqAIDBcTRNFFXVdX1fsSxRVFXXlW3jVyxNFFVVdm1b+DVRVFXXtW3bFn5NFFVVdmXZtoWiqrqybduybgvDqKqua9uybeuorqvbuq3bui9UXVmWbVu3dR3XtnXd9nVd+Bmzbeu2buu+8CMMR9/4IeTj+3RCCAAAT3AAACqwYXWEk6KxwEJDVgIAGQAAgDFKGYUYM0gxphhjTDHGmAAAgAEHAIAAE8pAoSErAoAoAADAOeecc84555xzzjnnnHPOOeecc44xxhhjjDHGGGOMMcYYY4wxxhhjjDHGGGOMMcYYY0wAwE6EA8BOhIVQaMhKACAcAABACCEpKaWUUkoRU85BSSmllFKqFIOMSkoppZRSpBR1lFJKKaWUIqWgpJJSSimllElJKaWUUkoppYw6SimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaVUSimllFJKKaWUUkoppRQAYPLgAACVYOMMK0lnhaPBhYasBAByAwAAhRiDEEJpraRUUkolVc5BKCWUlEpKKZWUUqqYgxBKKqmlklJKKbXSQSihlFBKKSWUUkooJYQQSgmhlFRCK6mEUkoHoYQSQimhhFRKKSWUzkEoIYUOQkmllNRCSB10VFIpIZVSSiklpZQ6CKGUklJLLZVSWkqpdBJSKamV1FJqqbWSUgmhpFZKSSWl0lpJJbUSSkklpZRSSymFVFJJJYSSUioltZZaSqm11lJIqZWUUkqppdRSSiWlkEpKqZSSUmollZRSaiGVlEpJKaTUSimlpFRCSamlUlpKLbWUSkmptFRSSaWUlEpJKaVSSksppRJKSqmllFpJKYWSUkoplZJSSyW1VEoKJaWUUkmptJRSSymVklIBAEAHDgAAAUZUWoidZlx5BI4oZJiAAgAAQABAgAkgMEBQMApBgDACAQAAAADAAAAfAABHARAR0ZzBAUKCwgJDg8MDAAAAAAAAAAAAAACAT2dnUwAEAAAAAAAAAADqnjMlAgAAADzQPmcBAQA=');
				if (mpeg) canPlayThrough('audio/mpeg;base64,/+MYxAAAAANIAUAAAASEEB/jwOFM/0MM/90b/+RhST//w4NFwOjf///PZu////9lns5GFDv//l9GlUIEEIAAAgIg8Ir/JGq3/+MYxDsLIj5QMYcoAP0dv9HIjUcH//yYSg+CIbkGP//8w0bLVjUP///3Z0x5QCAv/yLjwtGKTEFNRTMuOTeqqqqqqqqqqqqq/+MYxEkNmdJkUYc4AKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');

				/// lets find out!
				var startTime = Date.now();
				var interval = setInterval(function() {
					var maxExecution = Date.now() - startTime > 5000;
					if (!pending || maxExecution) {
						clearInterval(interval);
						onsuccess(supports);
					}
				}, 1);
			} else {
				onsuccess(supports);
				return;
			}
		}
	};

})(MIDI);;/*
	----------------------------------------------------------
	GeneralMIDI : 2012-01-06
	----------------------------------------------------------
*/

(function(MIDI) { 'use strict';

	function asId(name) {
		return name.replace(/[^a-z0-9_ ]/gi, '').
				    replace(/[ ]/g, '_').
				    toLowerCase();
	};
	
	var GM = (function(arr) {
		var res = {};
		var byCategory = res.byCategory = {};
		var byId = res.byId = {};
		var byName = res.byName = {};
		///
		for (var key in arr) {
			var list = arr[key];
			for (var n = 0, length = list.length; n < length; n++) {
				var instrument = list[n];
				if (instrument) {
					var id = parseInt(instrument.substr(0, instrument.indexOf(' ')), 10);
					var name = instrument.replace(id + ' ', '');
					var nameId = asId(name);
					var categoryId = asId(key);
					///
					var spec = {
						id: nameId,
						name: name,
						program: --id,
						category: key
					};
					///
					byId[id] = spec;
					byName[nameId] = spec;
					byCategory[categoryId] = byCategory[categoryId] || [];
					byCategory[categoryId].push(spec);
				}
			}
		}
		return res;
	})({
		'Piano': ['1 Acoustic Grand Piano', '2 Bright Acoustic Piano', '3 Electric Grand Piano', '4 Honky-tonk Piano', '5 Electric Piano 1', '6 Electric Piano 2', '7 Harpsichord', '8 Clavinet'],
		'Chromatic Percussion': ['9 Celesta', '10 Glockenspiel', '11 Music Box', '12 Vibraphone', '13 Marimba', '14 Xylophone', '15 Tubular Bells', '16 Dulcimer'],
		'Organ': ['17 Drawbar Organ', '18 Percussive Organ', '19 Rock Organ', '20 Church Organ', '21 Reed Organ', '22 Accordion', '23 Harmonica', '24 Tango Accordion'],
		'Guitar': ['25 Acoustic Guitar (nylon)', '26 Acoustic Guitar (steel)', '27 Electric Guitar (jazz)', '28 Electric Guitar (clean)', '29 Electric Guitar (muted)', '30 Overdriven Guitar', '31 Distortion Guitar', '32 Guitar Harmonics'],
		'Bass': ['33 Acoustic Bass', '34 Electric Bass (finger)', '35 Electric Bass (pick)', '36 Fretless Bass', '37 Slap Bass 1', '38 Slap Bass 2', '39 Synth Bass 1', '40 Synth Bass 2'],
		'Strings': ['41 Violin', '42 Viola', '43 Cello', '44 Contrabass', '45 Tremolo Strings', '46 Pizzicato Strings', '47 Orchestral Harp', '48 Timpani'],
		'Ensemble': ['49 String Ensemble 1', '50 String Ensemble 2', '51 Synth Strings 1', '52 Synth Strings 2', '53 Choir Aahs', '54 Voice Oohs', '55 Synth Choir', '56 Orchestra Hit'],
		'Brass': ['57 Trumpet', '58 Trombone', '59 Tuba', '60 Muted Trumpet', '61 French Horn', '62 Brass Section', '63 Synth Brass 1', '64 Synth Brass 2'],
		'Reed': ['65 Soprano Sax', '66 Alto Sax', '67 Tenor Sax', '68 Baritone Sax', '69 Oboe', '70 English Horn', '71 Bassoon', '72 Clarinet'],
		'Pipe': ['73 Piccolo', '74 Flute', '75 Recorder', '76 Pan Flute', '77 Blown Bottle', '78 Shakuhachi', '79 Whistle', '80 Ocarina'],
		'Synth Lead': ['81 Lead 1 (square)', '82 Lead 2 (sawtooth)', '83 Lead 3 (calliope)', '84 Lead 4 (chiff)', '85 Lead 5 (charang)', '86 Lead 6 (voice)', '87 Lead 7 (fifths)', '88 Lead 8 (bass + lead)'],
		'Synth Pad': ['89 Pad 1 (new age)', '90 Pad 2 (warm)', '91 Pad 3 (polysynth)', '92 Pad 4 (choir)', '93 Pad 5 (bowed)', '94 Pad 6 (metallic)', '95 Pad 7 (halo)', '96 Pad 8 (sweep)'],
		'Synth Effects': ['97 FX 1 (rain)', '98 FX 2 (soundtrack)', '99 FX 3 (crystal)', '100 FX 4 (atmosphere)', '101 FX 5 (brightness)', '102 FX 6 (goblins)', '103 FX 7 (echoes)', '104 FX 8 (sci-fi)'],
		'Ethnic': ['105 Sitar', '106 Banjo', '107 Shamisen', '108 Koto', '109 Kalimba', '110 Bagpipe', '111 Fiddle', '112 Shanai'],
		'Percussive': ['113 Tinkle Bell', '114 Agogo', '115 Steel Drums', '116 Woodblock', '117 Taiko Drum', '118 Melodic Tom', '119 Synth Drum'],
		'Sound effects': ['120 Reverse Cymbal', '121 Guitar Fret Noise', '122 Breath Noise', '123 Seashore', '124 Bird Tweet', '125 Telephone Ring', '126 Helicopter', '127 Applause', '128 Gunshot'],
		'Reserved Channel': ['129 Percussion']
	});
	
	GM.getProgramSpec = function(program) {
		var spec;
		if (typeof program === 'string') {
			spec = GM.byName[asId(program)];
		} else {
			spec = GM.byId[program];
		}
		if (spec) {
			return spec;
		} else {
			MIDI.handleError('invalid program', arguments);
		}
	};


	/* getProgram | programChange
	--------------------------------------------------- */
	MIDI.getProgram = function(channelId) {
		return getParam('program', channelId);
	};

	MIDI.programChange = function(channelId, program, delay) {
		var spec = GM.getProgramSpec(program);
		if (spec && isFinite(program = spec.program)) {
			setParam('program', channelId, program, delay);
		}
	};


	/* getMono | setMono
	--------------------------------------------------- */
	MIDI.getMono = function(channelId) {
		return getParam('mono', channelId);
	};

	MIDI.setMono = function(channelId, truthy, delay) {
		if (isFinite(truthy)) {
			setParam('mono', channelId, truthy, delay);
		}
	};


	/* getOmni | setOmni
	--------------------------------------------------- */
	MIDI.getOmni = function(channelId) {
		return getParam('omni', channelId);
	};

	MIDI.setOmni = function(channelId, truthy, delay) {
		if (isFinite(truthy)) {
			setParam('omni', channelId, truthy, delay);
		}
	};


	/* getSolo | setSolo
	--------------------------------------------------- */
	MIDI.getSolo = function(channelId) {
		return getParam('solo', channelId);
	};

	MIDI.setSolo = function(channelId, truthy, delay) {
		if (isFinite(truthy)) {
			setParam('solo', channelId, truthy, delay);
		}
	};
	
	function getParam(param, channelId) {
		var channel = channels[channelId];
		if (channel) {
			return channel[param];
		}
	};

	function setParam(param, channelId, value, delay) {
		var channel = channels[channelId];
		if (channel) {
			if (delay) {
				setTimeout(function() { //- is there a better option?
					channel[param] = value;
				}, delay);
			} else {
				channel[param] = value;
			}
			///
			var wrapper = MIDI.messageHandler[param] || messageHandler[param];
			if (wrapper) {
				wrapper(channelId, value, delay);
			}
		}
	};


	/* channels
	--------------------------------------------------- */
	var channels = (function() {
		var res = {};
		for (var number = 0; number <= 15; number++) {
			res[number] = {
				number: number,
				program: number,
				pitchBend: 0,
				mute: false,
				mono: false,
				omni: false,
				solo: false
			};
		}
		return res;
	})();


	/* note conversions
	--------------------------------------------------- */
	MIDI.keyToNote = {}; // C8  == 108
	MIDI.noteToKey = {}; // 108 ==  C8

	(function() {
		var A0 = 0x15; // first note
		var C8 = 0x6C; // last note
		var number2key = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
		var number2key2 = ['B#', 'C#', 'D', 'D#', 'Fb', 'E#', 'F#', 'G', 'G#', 'A', 'A#', 'Cb'];
		for (var n = A0; n <= C8; n++) {
			var octave = (n - 12) / 12 >> 0;
			var name = number2key[n % 12] + octave;
			var name2 = number2key2[n % 12 ] + octave;
			MIDI.keyToNote[name] = n;
			MIDI.keyToNote[name2] = n;
			MIDI.noteToKey[n] = name;
		}

	})();
	

	/* expose
	--------------------------------------------------- */
	MIDI.channels = channels;
	MIDI.GM = GM;
	

	/* handle message
	--------------------------------------------------- */
	MIDI.messageHandler = {}; // overrides
	
	var messageHandler = { // defaults
		program: function(channelId, program, delay) {
			if (MIDI.__api) {
				if (MIDI.player.isPlaying) {
					MIDI.player.pause();
					MIDI.loadProgram(program, MIDI.player.play);
				} else {
					MIDI.loadProgram(program);
				}
			}
		}
	};


	/* handle errors
	--------------------------------------------------- */
	MIDI.handleError = function(type, args) {
		if (console && console.error) {
			console.error(type, args);
		}
	};

})(MIDI);;/*
	----------------------------------------------------------------------
	AudioTag <audio> - OGG or MPEG Soundbank
	----------------------------------------------------------------------
	http://dev.w3.org/html5/spec/Overview.html#the-audio-element
	----------------------------------------------------------------------
*/

(function(MIDI) { 'use strict';

	window.Audio && (function() {
		var midi = MIDI.AudioTag = { api: 'audiotag' };
		var noteToKey = {};
		var volumeCh = Array(16).fill(127); // floating point
		var buffer_nid = -1; // current channel
		var audioBuffers = []; // the audio channels
		var notesOn = []; // instrumentId + noteId that is currently playing in each 'channel', for routing noteOff/chordOff calls
		var notes = {}; // the piano keys
		for (var nid = 0; nid < 12; nid ++) {
			audioBuffers[nid] = new Audio();
		}

		function playChannel(channel, note) {
			if (!MIDI.channels[channel]) return;
			var instrument = MIDI.channels[channel].program;
			if(channelId == 9){
				// reserved for percussion
				instrument = 128;//need to check
			}
			var instrumentId = MIDI.GM.byId[instrument].id;
			var note = notes[note];
			if (note) {
				var instrumentNoteId = instrumentId + '' + note.id;
				var nid = (buffer_nid + 1) % audioBuffers.length;
				var audio = audioBuffers[nid];
				notesOn[ nid ] = instrumentNoteId;
				if (!MIDI.Soundfont[instrumentId]) {
					MIDI.DEBUG && console.log('404', instrumentId);
					return;
				}
				audio.src = MIDI.Soundfont[instrumentId][note.id];
				audio.volume = volumeCh[channel] / 127;
				audio.play();
				buffer_nid = nid;
			}
		};

		function stopChannel(channel, note) {
			if (!MIDI.channels[channel]) return;
			var instrument = MIDI.channels[channel].program;
			if(channelId == 9){
				// reserved for percussion
				instrument = 128;
			}
			var instrumentId = MIDI.GM.byId[instrument].id;
			var note = notes[note];
			if (note) {
				var instrumentNoteId = instrumentId + '' + note.id;
				for (var i = 0, len = audioBuffers.length; i < len; i++) {
				    var nid = (i + buffer_nid + 1) % len;
				    var cId = notesOn[nid];
				    if (cId && cId == instrumentNoteId) {
				        audioBuffers[nid].pause();
				        notesOn[nid] = null;
				        return;
				    }
				}
			}
		};
		///
		midi.audioBuffers = audioBuffers;
		midi.messageHandler = {};
		///
		midi.send = function(data, delay) { };
		midi.setController = function(channel, type, value, delay) { };
		midi.setVolume = function(channel, n) {
			volumeCh[channel] = n; //- should be channel specific volume
		};

		midi.pitchBend = function(channel, program, delay) { };

		midi.noteOn = function(channel, note, velocity, delay) {
			var id = noteToKey[note];
			if (notes[id]) {
				if (delay) {
					return setTimeout(function() {
						playChannel(channel, id);
					}, delay * 1000);
				} else {
					playChannel(channel, id);
				}
			}
		};
	
		midi.noteOff = function(channel, note, delay) {
// 			var id = noteToKey[note];
// 			if (notes[id]) {
// 				if (delay) {
// 					return setTimeout(function() {
// 						stopChannel(channel, id);
// 					}, delay * 1000)
// 				} else {
// 					stopChannel(channel, id);
// 				}
// 			}
		};
	
		midi.chordOn = function(channel, chord, velocity, delay) {
			for (var idx = 0; idx < chord.length; idx ++) {
				var n = chord[idx];
				var id = noteToKey[n];
				if (notes[id]) {
					if (delay) {
						return setTimeout(function() {
							playChannel(channel, id);
						}, delay * 1000);
					} else {
						playChannel(channel, id);
					}
				}
			}
		};
	
		midi.chordOff = function(channel, chord, delay) {
			for (var idx = 0; idx < chord.length; idx ++) {
				var n = chord[idx];
				var id = noteToKey[n];
				if (notes[id]) {
					if (delay) {
						return setTimeout(function() {
							stopChannel(channel, id);
						}, delay * 1000);
					} else {
						stopChannel(channel, id);
					}
				}
			}
		};
	
		midi.stopAllNotes = function() {
			for (var nid = 0, length = audioBuffers.length; nid < length; nid++) {
				audioBuffers[nid].pause();
			}
		};
	
		midi.connect = function(opts) {
			MIDI.setDefaultPlugin(midi);
			///
			for (var key in MIDI.keyToNote) {
				noteToKey[MIDI.keyToNote[key]] = key;
				notes[key] = {id: key};
			}
			///
			opts.onsuccess && opts.onsuccess();
		};
	})();

})(MIDI);

/*
	----------------------------------------------------------
	Web Audio API - OGG | MPEG Soundbank
	----------------------------------------------------------
	http://webaudio.github.io/web-audio-api/
	----------------------------------------------------------
*/

(function(MIDI) { 'use strict';

	window.AudioContext && (function() {

		var audioContext = null; // new AudioContext();
		var useStreamingBuffer = false; // !!audioContext.createMediaElementSource;
		var midi = MIDI.WebAudio = {api: 'webaudio'};
		var ctx; // audio context
		var sources = {};
		var effects = {};
		var volumeCh = Array(16).fill(127);
		var audioBuffers = {};
		///
		midi.audioBuffers = audioBuffers;
		midi.messageHandler = {};
		///
		midi.send = function(data, delay) {
		
		};

		midi.setController = function(channelId, type, value, delay) {
		
		};

		midi.setVolume = function(channelId, volume, delay) {
			if (delay) {
				setTimeout(function() {
					volumeCh[channelId] = volume;
				}, delay * 1000);
			} else {
				volumeCh[channelId] = volume;
			}
		};

		midi.pitchBend = function(channelId, bend, delay) {
			var channel = MIDI.channels[channelId];
			if (channel) {
				if (delay) {
					setTimeout(function() {
						channel.pitchBend = bend;
					}, delay);
				} else {
					channel.pitchBend = bend;
				}
			}
		};

		midi.noteOn = function(channelId, noteId, velocity, delay) {
			delay = delay || 0;

			/// check whether the note exists
			var channel = MIDI.channels[channelId];
			var instrument = channel.program;
			if(channelId == 9){
				// reserved for percussion
				instrument = 128;
				velocity *= 0.75;
			}
			var bufferId = instrument + 'x' + noteId;
			var buffer = audioBuffers[bufferId];
			if (buffer) {
				/// convert relative delay to absolute delay
				if (delay < ctx.currentTime) {
					delay += ctx.currentTime;
				}
		
				/// create audio buffer
				if (useStreamingBuffer) {
					var source = ctx.createMediaElementSource(buffer);
				} else { // XMLHTTP buffer
					var source = ctx.createBufferSource();
					source.buffer = buffer;
				}

				/// add effects to buffer
				if (effects) {
					var chain = source;
					for (var key in effects) {
						chain.connect(effects[key].input);
						chain = effects[key];
					}
				}

				/// add gain + pitchShift
				var gain = (velocity / 127) * (volumeCh[channelId] / 127) * 2 - 1;
				source.connect(ctx.destination);
				source.playbackRate.value = 1; // pitch shift 
				source.gainNode = ctx.createGain(); // gain
				source.gainNode.connect(ctx.destination);
				source.gainNode.gain.value = Math.min(1.0, Math.max(-1.0, gain));
				source.connect(source.gainNode);
				///
				if (useStreamingBuffer) {
					if (delay) {
						return setTimeout(function() {
							buffer.currentTime = 0;
							buffer.play()
						}, delay * 1000);
					} else {
						buffer.currentTime = 0;
						buffer.play()
					}
				} else {
					source.start(delay || 0);
				}
				///
				sources[channelId + 'x' + noteId] = source;
				///
				return source;
			} else {
				MIDI.handleError('no buffer', arguments);
			}
		};

		midi.noteOff = function(channelId, noteId, delay) {
			delay = delay || 0;

			/// check whether the note exists
			var channel = MIDI.channels[channelId];
			var instrument = channel.program;
			if(channelId == 9){
				// percussion
				instrument = 128;
			}
			var bufferId = instrument + 'x' + noteId;
			var buffer = audioBuffers[bufferId];
			if (buffer) {
				if (delay < ctx.currentTime) {
					delay += ctx.currentTime;
				}
				///
				var source = sources[channelId + 'x' + noteId];
				if (source) {
					if (source.gainNode) {
						// @Miranet: 'the values of 0.2 and 0.3 could of course be used as 
						// a 'release' parameter for ADSR like time settings.'
						// add { 'metadata': { release: 0.3 } } to soundfont files
						var gain = source.gainNode.gain;
						gain.linearRampToValueAtTime(gain.value, delay);
						gain.linearRampToValueAtTime(-1.0, delay + 0.3);
					}
					///
					if (useStreamingBuffer) {
						if (delay) {
							setTimeout(function() {
								buffer.pause();
							}, delay * 1000);
						} else {
							buffer.pause();
						}
					} else {
						if (source.noteOff) {
							source.noteOff(delay + 0.5);
						} else {
							source.stop(delay + 0.5);
						}
					}
					///
					delete sources[channelId + 'x' + noteId];
					///
					return source;
				}
			}
		};

		midi.chordOn = function(channel, chord, velocity, delay) {
			var res = {};
			for (var n = 0, note, len = chord.length; n < len; n++) {
				res[note = chord[n]] = midi.noteOn(channel, note, velocity, delay);
			}
			return res;
		};

		midi.chordOff = function(channel, chord, delay) {
			var res = {};
			for (var n = 0, note, len = chord.length; n < len; n++) {
				res[note = chord[n]] = midi.noteOff(channel, note, delay);
			}
			return res;
		};

		midi.stopAllNotes = function() {
			for (var sid in sources) {
				var delay = 0;
				if (delay < ctx.currentTime) {
					delay += ctx.currentTime;
				}
				var source = sources[sid];
				source.gain.linearRampToValueAtTime(1, delay);
				source.gain.linearRampToValueAtTime(0, delay + 0.3);
				if (source.noteOff) { // old api
					source.noteOff(delay + 0.3);
				} else { // new api
					source.stop(delay + 0.3);
				}
				delete sources[sid];
			}
		};

		midi.setEffects = function(list) {
			if (ctx.tunajs) {
				for (var n = 0; n < list.length; n ++) {
					var data = list[n];
					var effect = new ctx.tunajs[data.type](data);
					effect.connect(ctx.destination);
					effects[data.type] = effect;
				}
			} else {
				MIDI.handleError('effects not installed.', arguments);
				return;
			}
		};

		midi.connect = function(opts) {
			MIDI.setDefaultPlugin(midi);
			midi.setContext(ctx || createAudioContext(), opts.onsuccess);
		};
	
		midi.getContext = function() {
			return ctx;
		};
	
		midi.setContext = function(newCtx, onsuccess, onprogress, onerror) {
			ctx = newCtx;

			/// tuna.js effects module - https://github.com/Dinahmoe/tuna
			if (typeof Tuna !== 'undefined') {
				if (!(ctx.tunajs instanceof Tuna)) {
					ctx.tunajs = new Tuna(ctx);
				}
			}
		
			/// loading audio files
			var urls = [];
			var notes = MIDI.keyToNote;
			for (var key in notes) {
				urls.push(key);
			}
			///
			function waitForEnd(instrument) {
				for (var key in bufferPending) { // has pending items
					if (bufferPending[key]) {
						return;
					}
				}
				if (onsuccess) { // run onsuccess once
					onsuccess();
					onsuccess = null;
				}
			};

			function requestAudio(soundfont, programId, index, key) {
				var url = soundfont[key];
				if (url) {
					bufferPending[programId] ++;
					loadAudio(url, function(buffer) {
						buffer.id = key;
						var noteId = MIDI.keyToNote[key];
						audioBuffers[programId + 'x' + noteId] = buffer;
						///
						if (--bufferPending[programId] === 0) {
							var percent = index / 87;
							soundfont.isLoaded = true;
							MIDI.DEBUG && console.log('loaded: ', instrument);
							waitForEnd(instrument);
						}
					}, function() {
						MIDI.handleError('audio could not load', arguments);
					});
				}
			};
			///
			var bufferPending = {};
			var soundfonts = MIDI.Soundfont;
			for (var instrument in soundfonts) {
				var soundfont = soundfonts[instrument];
				if (soundfont.isLoaded) {
					continue;
				} else {
					var spec = MIDI.GM.byName[instrument];
					if (spec) {
						var programId = spec.program;
						///
						bufferPending[programId] = 0;
						///
						for (var index = 0; index < urls.length; index++) {
							var key = urls[index];
							requestAudio(soundfont, programId, index, key);
						}
					}
				}
			}
			///
			setTimeout(waitForEnd, 1);
		};


		/* Load audio file: streaming | base64 | arraybuffer
		---------------------------------------------------------------------- */
		function loadAudio(url, onsuccess, onerror) {
			if (useStreamingBuffer) {
				var audio = new Audio();
				audio.src = url;
				audio.controls = false;
				audio.autoplay = false;
				audio.preload = false;
				audio.addEventListener('canplay', function() {
					onsuccess && onsuccess(audio);
				});
				audio.addEventListener('error', function(err) {
					onerror && onerror(err);
				});
				document.body.appendChild(audio);
			} else if (url.indexOf('data:audio') === 0) { // Base64 string
				var base64 = url.split(',')[1];
				var buffer = Base64Binary.decodeArrayBuffer(base64);
				ctx.decodeAudioData(buffer, onsuccess, onerror);
			} else { // XMLHTTP buffer
				var request = new XMLHttpRequest();
				request.open('GET', url, true);
				request.responseType = 'arraybuffer';
				request.onload = function() {
					ctx.decodeAudioData(request.response, onsuccess, onerror);
				};
				request.send();
			}
		};
		
		function createAudioContext() {
			return new (window.AudioContext || window.webkitAudioContext)();
		};
	})();
})(MIDI);

/*
	----------------------------------------------------------------------
	Web MIDI API - Native Soundbanks
	----------------------------------------------------------------------
	http://webaudio.github.io/web-midi-api/
	----------------------------------------------------------------------
*/

(function(MIDI) { 'use strict';

	var output = null;
	var channels = [];
	var midi = MIDI.WebMIDI = {api: 'webmidi'};

	midi.messageHandler = {};
	midi.messageHandler.program = function(channelId, program, delay) { // change patch (instrument)
		output.send([0xC0 + channelId, program], delay * 1000);
	};

	midi.send = function(data, delay) {
		output.send(data, delay * 1000);
	};

	midi.setController = function(channelId, type, value, delay) {
		output.send([channelId, type, value], delay * 1000);
	};

	midi.setVolume = function(channelId, volume, delay) { // set channel volume
		output.send([0xB0 + channelId, 0x07, volume], delay * 1000);
	};

	midi.pitchBend = function(channelId, program, delay) { // pitch bend
		output.send([0xE0 + channelId, program], delay * 1000);
	};

	midi.noteOn = function(channelId, note, velocity, delay) {
		output.send([0x90 + channelId, note, velocity], delay * 1000);
	};

	midi.noteOff = function(channelId, note, delay) {
		output.send([0x80 + channelId, note, 0], delay * 1000);
	};

	midi.chordOn = function(channelId, chord, velocity, delay) {
		for (var n = 0; n < chord.length; n ++) {
			var note = chord[n];
			output.send([0x90 + channelId, note, velocity], delay * 1000);
		}
	};

	midi.chordOff = function(channelId, chord, delay) {
		for (var n = 0; n < chord.length; n ++) {
			var note = chord[n];
			output.send([0x80 + channelId, note, 0], delay * 1000);
		}
	};

	midi.stopAllNotes = function() {
		output.cancel();
		for (var channelId = 0; channelId < 16; channelId ++) {
			output.send([0xB0 + channelId, 0x7B, 0]);
		}
	};

	midi.connect = function(opts) {
		var onsuccess = opts.onsuccess;
		var onerror = opts.onerror;
		///
		MIDI.setDefaultPlugin(midi);
		///
		function errFunction(err) { // well at least we tried!
			onerror && onerror(err);
			///
			if (window.AudioContext) { // Chrome
				opts.api = 'webaudio';
			} else if (window.Audio) { // Firefox
				opts.api = 'audiotag';
			} else { // no support
				return;
			}
			///
			MIDI.loadPlugin(opts);
		};
		///
		navigator.requestMIDIAccess().then(function(access) {
			var pluginOutputs = access.outputs;
			if (typeof pluginOutputs == 'function') { // Chrome pre-43
				output = pluginOutputs()[0];
			} else { // Chrome post-43
				output = pluginOutputs[0];
			}
			if (output === undefined) { // no outputs
				errFunction();
			} else {
				onsuccess && onsuccess();
			}
		}, onerror);
	};

})(MIDI);
;/*
	----------------------------------------------------------
	MIDI.Plugin : 2015-06-04
	----------------------------------------------------------
	https://github.com/mudcube/MIDI.js
	----------------------------------------------------------
	Inspired by javax.sound.midi (albeit a super simple version): 
		http://docs.oracle.com/javase/6/docs/api/javax/sound/midi/package-summary.html
	----------------------------------------------------------
	Technologies
	----------------------------------------------------------
		Web MIDI API - no native support yet (jazzplugin)
		Web Audio API - firefox 25+, chrome 10+, safari 6+, opera 15+
		HTML5 Audio Tag - ie 9+, firefox 3.5+, chrome 4+, safari 4+, opera 9.5+, ios 4+, android 2.3+
	----------------------------------------------------------
*/

if (typeof MIDI === 'undefined') MIDI = {};

MIDI.Soundfont = MIDI.Soundfont || {};
MIDI.player = MIDI.player || {};

(function(MIDI) { 'use strict';

	if (typeof console !== 'undefined' && console.log) {
		console.log('MIDI.js 0.4.2');
	}

	MIDI.DEBUG = true;
	MIDI.USE_XHR = true;
	MIDI.soundfontUrl = './soundfont/';

	/*
		MIDI.loadPlugin({
			audioFormat: 'mp3', // optionally can force to use MP3 (for instance on mobile networks)
			onsuccess: function() { },
			onprogress: function(state, percent) { },
			instrument: 'acoustic_grand_piano', // or 1 (default)
			instruments: [ 'acoustic_grand_piano', 'acoustic_guitar_nylon' ] // or multiple instruments
		});
	*/

	MIDI.loadPlugin = function(opts, onsuccess, onerror, onprogress) {
		if (typeof opts === 'function') opts = {onsuccess: opts};
		opts = opts || {};
		opts.api = opts.api || MIDI.__api;
		
		function onDetect(supports) {
			var hash = location.hash;
			var api = '';

			/// use the most appropriate plugin if not specified
			if (supports[opts.api]) {
				api = opts.api;
			} else if (supports[hash.substr(1)]) {
				api = hash.substr(1);
			} else if (supports.webmidi) {
				api = 'webmidi';
			} else if (window.AudioContext) { // Chrome
				api = 'webaudio';
			} else if (window.Audio) { // Firefox
				api = 'audiotag';
			}

			if (connect[api]) {
				/// use audio/ogg when supported
				if (opts.audioFormat) {
					var audioFormat = opts.audioFormat;
				} else { // use best quality
					var audioFormat = supports['audio/ogg'] ? 'ogg' : 'mp3';
				}

				/// load the specified plugin
				MIDI.__api = api;
				MIDI.__audioFormat = audioFormat;
				MIDI.supports = supports;
				MIDI.loadProgram(opts);
			}
		};

		///		
		if (opts.soundfontUrl) {
			MIDI.soundfontUrl = opts.soundfontUrl;
		}

		/// Detect the best type of audio to use
		if (MIDI.supports) {
			onDetect(MIDI.supports);
		} else {
			MIDI.audioDetect(onDetect);
		}
	};

	/*
		MIDI.loadProgram('banjo', onsuccess, onerror, onprogress);
		MIDI.loadProgram({
			instrument: 'banjo',
			onsuccess: function(){},
			onerror: function(){},
			onprogress: function(state, percent){}
		})
	*/

	MIDI.loadProgram = (function() {

		function asList(opts) {
			var res = opts.instruments || opts.instrument || MIDI.channels[0].program;
			if (typeof res !== 'object') {
				if (res === undefined) {
					res = [];
				} else {
					res = [res];
				}
			}
			/// program number -> id
			for (var i = 0; i < res.length; i ++) {
				var instrument = res[i];
				if (instrument === +instrument) { // is numeric
					if (MIDI.GM.byId[instrument]) {
						res[i] = MIDI.GM.byId[instrument].id;
					}
				}
			}
			return res;
		};

		return function(opts, onsuccess, onerror, onprogress) {
			opts = opts || {};
			if (typeof opts !== 'object') opts = {instrument: opts};
			if (onerror) opts.onerror = onerror;
			if (onprogress) opts.onprogress = onprogress;
			if (onsuccess) opts.onsuccess = onsuccess;
			///
			opts.format = MIDI.__audioFormat;
			opts.instruments = asList(opts);
			///
			connect[MIDI.__api](opts);
		};
	})();
	
	var connect = {
		webmidi: function(opts) {
			// cant wait for this to be standardized!
			MIDI.WebMIDI.connect(opts);
		},
		audiotag: function(opts) {
			// works ok, kinda like a drunken tuna fish, across the board
			// http://caniuse.com/audio
			requestQueue(opts, 'AudioTag');
		},
		webaudio: function(opts) {
			// works awesome! safari, chrome and firefox support
			// http://caniuse.com/web-audio
			requestQueue(opts, 'WebAudio');
		}
	};

	function requestQueue(opts, context) {
		var audioFormat = opts.format;
		var instruments = opts.instruments;
		var onprogress = opts.onprogress;
		var onerror = opts.onerror;
		///
		var length = instruments.length;
		var pending = length;
		///
		function onEnd() {
			onprogress && onprogress('load', 1.0);
			MIDI[context].connect(opts);
		};
		///
		if (length) {
			for (var i = 0; i < length; i ++) {
				var programId = instruments[i];
				if (MIDI.Soundfont[programId]) { // already loaded
					!--pending && onEnd();
				} else { // needs to be requested
					sendRequest(instruments[i], audioFormat, function(evt, progress) {
						var fileProgress = progress / length;
						var queueProgress = (length - pending) / length;
						onprogress && onprogress('load', fileProgress + queueProgress, programId);
					}, function() {
						!--pending && onEnd();
					}, onerror);
				}
			}
		} else {
			onEnd();
		}
	};

	function sendRequest(programId, audioFormat, onprogress, onsuccess, onerror) {
		var soundfontPath = MIDI.soundfontUrl + programId + '-' + audioFormat + '.js';
		if (MIDI.USE_XHR) {
			galactic.util.request({
				url: soundfontPath,
				format: 'text',
				onerror: onerror,
				onprogress: onprogress,
				onsuccess: function(event, responseText) {
					var script = document.createElement('script');
					script.language = 'javascript';
					script.type = 'text/javascript';
					script.text = responseText;
					document.body.appendChild(script);
					onsuccess();
				}
			});
		} else {
			dom.loadScript.add({
				url: soundfontPath,
				verify: 'MIDI.Soundfont["' + programId + '"]',
				onerror: onerror,
				onsuccess: function() {
					onsuccess();
				}
			});
		}
	};

	MIDI.setDefaultPlugin = function(midi) {
		for (var key in midi) {
			MIDI[key] = midi[key];
		}
	};

})(MIDI);
;/*
	----------------------------------------------------------
	MIDI.Player : 0.3.1 : 2015-03-26
	----------------------------------------------------------
	https://github.com/mudcube/MIDI.js
	----------------------------------------------------------
*/

if (typeof MIDI === 'undefined') MIDI = {};
if (typeof MIDI.Player === 'undefined') MIDI.Player = {};

(function() { 'use strict';

var midi = MIDI.Player;
midi.currentTime = 0;
midi.endTime = 0; 
midi.restart = 0; 
midi.playing = false;
midi.timeWarp = 1;
midi.startDelay = 0;
midi.BPM = 120;

midi.start =
midi.resume = function(onsuccess) {
    if (midi.currentTime < -1) {
    	midi.currentTime = -1;
    }
    startAudio(midi.currentTime, null, onsuccess);
};

midi.pause = function() {
	var tmp = midi.restart;
	stopAudio();
	midi.restart = tmp;
};

midi.stop = function() {
	stopAudio();
	midi.restart = 0;
	midi.currentTime = 0;
};

midi.addListener = function(onsuccess) {
	onMidiEvent = onsuccess;
};

midi.removeListener = function() {
	onMidiEvent = undefined;
};

midi.clearAnimation = function() {
	if (midi.animationFrameId)  {
		cancelAnimationFrame(midi.animationFrameId);
	}
};

midi.setAnimation = function(callback) {
	var currentTime = 0;
	var tOurTime = 0;
	var tTheirTime = 0;
	//
	midi.clearAnimation();
	///
	var frame = function() {
		midi.animationFrameId = requestAnimationFrame(frame);
		///
		if (midi.endTime === 0) {
			return;
		}
		if (midi.playing) {
			currentTime = (tTheirTime === midi.currentTime) ? tOurTime - Date.now() : 0;
			if (midi.currentTime === 0) {
				currentTime = 0;
			} else {
				currentTime = midi.currentTime - currentTime;
			}
			if (tTheirTime !== midi.currentTime) {
				tOurTime = Date.now();
				tTheirTime = midi.currentTime;
			}
		} else { // paused
			currentTime = midi.currentTime;
		}
		///
		var endTime = midi.endTime;
		var percent = currentTime / endTime;
		var total = currentTime / 1000;
		var minutes = (total / 60) >>>0;
		var seconds = (total - (minutes * 60)) >>>0;
		var t1 = minutes * 60 + seconds;
		var t2 = (endTime / 1000);
		///
		if (t2 - t1 < -1.0) {
			return;
		} else {
			callback({
				now: t1,
				end: t2,
				percent: percent,
				events: noteRegistrar
			});
		}
	};
	///
	requestAnimationFrame(frame);
};

// helpers

midi.loadMidiFile = function(onsuccess, onprogress, onerror) {
	try {
		midi.replayer = new Replayer(MidiFile(midi.currentData), midi.timeWarp, null);//, midi.BPM);// not override
		midi.data = midi.replayer.getData();
		midi.endTime = getLength();
		///
		MIDI.loadPlugin({
 			instruments: midi.getFileInstruments(),
			onsuccess: onsuccess,
			onprogress: onprogress,
			onerror: onerror
		});
	} catch(event) {
		onerror && onerror(event);
	}
};

midi.loadFile = function(file, onsuccess, onprogress, onerror) {
	midi.stop();
	if (file.indexOf('base64,') !== -1) {
		var data = window.atob(file.split(',')[1]);
		midi.currentData = data;
		midi.loadMidiFile(onsuccess, onprogress, onerror);
	} else {
		var fetch = new XMLHttpRequest();
		fetch.open('GET', file);
		fetch.overrideMimeType('text/plain; charset=x-user-defined');
		fetch.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					var t = this.responseText || '';
					var ff = [];
					var mx = t.length;
					var scc = String.fromCharCode;
					for (var z = 0; z < mx; z++) {
						ff[z] = scc(t.charCodeAt(z) & 255);
					}
					///
					var data = ff.join('');
					midi.currentData = data;
					midi.loadMidiFile(onsuccess, onprogress, onerror);
				} else {
					onerror && onerror('Unable to load MIDI file');
				}
			}
		};
		fetch.send();
	}
};

midi.getFileInstruments = function(data) {
	data = data || midi.data;
	var instruments = {};
	var programs = {};
	for (var n = 0; n < data.length; n++) {
		var event = data[n][0].event;
		if (event.type !== 'channel') {
			continue;
		}
		var channel = event.channel;
		switch(event.subtype) {
			case 'controller':
//				console.log(event.channel, MIDI.defineControl[event.controllerType], event.value);
				break;
			case 'programChange':
				programs[channel] = event.programNumber;
				break;
			case 'noteOn':
				var program = programs[channel];
				var gm = MIDI.GM.byId[isFinite(program) ? program : channel];
				if(channel == 9){
					instruments['percussion'] = true; // synth_drum for percussion
				}
				instruments[gm.id] = true;
				break;
		}
	}
	var ret = [];
	for (var key in instruments) {
		ret.push(key);
	}
	console.log('get Instruments');
	return ret;
};

// Playing the audio

var eventQueue = []; // hold events to be triggered
var queuedTime; // 
var startTime = 0; // to measure time elapse
var noteRegistrar = {}; // get event for requested note
var onMidiEvent = undefined; // listener
var scheduleTracking = function(channel, note, currentTime, offset, message, velocity, time) {
	return setTimeout(function() {
		var data = {
			channel: channel,
			note: note,
			now: currentTime,
			end: midi.endTime,
			message: message,
			velocity: velocity
		};
		//
		if (message === 128) {
			delete noteRegistrar[note];
		} else {
			noteRegistrar[note] = data;
		}
		if (onMidiEvent) {
			onMidiEvent(data);
		}
		midi.currentTime = currentTime;
		///
		eventQueue.shift();
		///
		if (eventQueue.length < 1000) {
			startAudio(queuedTime, true);
		} else if (midi.currentTime === queuedTime && queuedTime < midi.endTime) { // grab next sequence
			startAudio(queuedTime, true);
		}
	}, currentTime - offset);
};

var getContext = function() {
	if (MIDI.api === 'webaudio') {
		return MIDI.WebAudio.getContext();
	} else {
		midi.ctx = {currentTime: 0};
	}
	return midi.ctx;
};

var getLength = function() {
	var data =  midi.data;
	var length = data.length;
	var totalTime = 0.5;
	for (var n = 0; n < length; n++) {
		totalTime += data[n][1];
	}
	return totalTime;
};

var __now;
var getNow = function() {
    if (window.performance && window.performance.now) {
        return window.performance.now();
    } else {
		return Date.now();
	}
};

var startAudio = function(currentTime, fromCache, onsuccess) {
	if (!midi.replayer) {
		console.log('no replayer!')
		return;
	}
	if (!fromCache) {
		if (typeof currentTime === 'undefined') {
			currentTime = midi.restart;
		}
		///
		midi.playing && stopAudio();
		midi.playing = true;
		midi.data = midi.replayer.getData();
		midi.endTime = getLength();
	}

	///
	var note;
	var offset = 0;
	var messages = 0;
	var data = midi.data;
	var ctx = getContext();
	var length = data.length;
	//
	queuedTime = 0.5;
	///
	var interval = eventQueue[0] && eventQueue[0].interval || 0;
	var foffset = currentTime - midi.currentTime;
	///
	if (MIDI.api !== 'webaudio') { // set currentTime on ctx
		var now = getNow();
		__now = __now || now;
		ctx.currentTime = (now - __now) / 1000;
	}
	///
	startTime = ctx.currentTime;

	//console.log('replayer start audio', currentTime, data);
	///
	for (var n = 0; n < length && messages < 100; ++n) {
		var obj = data[n];


        // fix: change <= to <
		if ((queuedTime += obj[1]) <= currentTime ) {
			offset = queuedTime;
			//console.log('skip',queuedTime, currentTime, obj[0].event);
			continue;
		}
		///
		currentTime = queuedTime - offset;
		///
		var event = obj[0].event;
		if (event.type !== 'channel') {
			continue;
		}
		///
		var channelId = event.channel;
		var channel = MIDI.channels[channelId];
		var delay = ctx.currentTime + ((currentTime + foffset + midi.startDelay) / 1000);
		var queueTime = queuedTime - offset + midi.startDelay;
		switch (event.subtype) {
			case 'controller':
				MIDI.setController(channelId, event.controllerType, event.value, delay);
				break;
			case 'programChange':
				MIDI.programChange(channelId, event.programNumber, delay);
				console.log('replayer programChange')
				break;
			case 'pitchBend':
				MIDI.pitchBend(channelId, event.value, delay);
				break;
			case 'noteOn':
				if (channel.mute) break;
				note = event.noteNumber - (midi.MIDIOffset || 0);
				eventQueue.push({
				    event: event,
				    time: queueTime,
				    source: MIDI.noteOn(channelId, event.noteNumber, event.velocity, delay),
				    interval: scheduleTracking(channelId, note, queuedTime + midi.startDelay, offset - foffset, 144, event.velocity)
				});
				//console.log('replayer noteOn');
				messages++;
				break;
			case 'noteOff':
				if (channel.mute) break;
				note = event.noteNumber - (midi.MIDIOffset || 0);
				eventQueue.push({
				    event: event,
				    time: queueTime,
				    source: MIDI.noteOff(channelId, event.noteNumber, delay),
				    interval: scheduleTracking(channelId, note, queuedTime, offset - foffset, 128, 0)
				});
				break;
			default:
				break;
		}
	}
	///
	onsuccess && onsuccess(eventQueue);
};

var stopAudio = function() {
	var ctx = getContext();
	midi.playing = false;
	midi.restart += (ctx.currentTime - startTime) * 1000;
	// stop the audio, and intervals
	while (eventQueue.length) {
		var o = eventQueue.pop();
		window.clearInterval(o.interval);
		if (!o.source) continue; // is not webaudio
		if (typeof(o.source) === 'number') {
			window.clearTimeout(o.source);
		} else { // webaudio
			o.source.disconnect(0);
		}
	}
	// run callback to cancel any notes still playing
	for (var key in noteRegistrar) {
		var o = noteRegistrar[key]
		if (noteRegistrar[key].message === 144 && onMidiEvent) {
			onMidiEvent({
				channel: o.channel,
				note: o.note,
				now: o.now,
				end: o.end,
				message: 128,
				velocity: o.velocity
			});
		}
	}
	// reset noteRegistrar
	noteRegistrar = {};
};

})();


var TEST = TEST || {};
MIDI.setMidi = function(m, autostart){
	var f = typeof m=='object'? MidiWriter(m): m;
	MIDI.Player.loadFile('base64,'+btoa(f),function(){
		if(autostart) MIDI.Player.start();
		if(f==MIDI.Player.currentData){
			console.log('PASS: loadFile');
		}
	});
	
}

TEST.testMidiPlayer = function (){
	var m = new simpMidi();
	for(var i=0;i<10;++i){
		m.addEvent(0,'noteOn', 0, [60+i*2, 100]);
	    m.addEvent(500,'noteOff', 0, [60+i*2, 0]);

	}
	m.finish();
	MIDI.Player.loadFile('./mid/test.mid', function(){
		TEST.testMidi(MIDI.Player.currentData);
		//MIDI.Player.start();
		MIDI.setMidi(m,true);
	});
	return TEST.testMidi(m);
}
var debugFlag = true;
function log(){
	if(debugFlag) console.log('debug:',...arguments);
	return debugFlag;
}
instrs = {
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
		'Sound effects': ['120 Reverse Cymbal', '121 Guitar Fret Noise', '122 Breath Noise', '123 Seashore', '124 Bird Tweet', '125 Telephone Ring', '126 Helicopter', '127 Applause', '128 Gunshot']
	};


var white_key_num = [0,2,4,5,7,9,11];
var black_key_num = [1,3,6,8,10];
var black_key_offset = [0,1,3,4,5];
var chord_num = {
	"maj":[0,4,7],
	"min":[0,3,7],
	"dim":[0,3,6],
	"aug":[0,4,8],
	"maj6":[0,4,7,9],
	"min6":[0,3,7,9],
	"dom7":[0,4,7,10],
	"maj7":[0,4,7,11],
	"min7":[0,3,7,10],
	"aug7":[0,4,8,10],
	"dim7":[0,3,6,9],
}

var keyrange = 23;
var pressed = [];
var chord_name = {
	"maj":"Major triad",
	"min":"Minor triad",
	"aug":"Augmented triad",
	"dim":"Diminished triad",
	"maj6":"Major sixth chord",
	"min6":"Minor sixth chord",
	"dom7":"Dominant seventh chord",
	"maj7":"Major seventh chord",
	"min7":"Minor seventh chord",
	"aug7":"Augmented seventh chord",
	"dim7":"Diminished seventh chord",
}

function make_keyboard(n_octaves, x0, ww, bw){
    res = '';
	for(var i=0;i<n_octaves;++i){
		for(j=0;j<7;++j){
			res += '<button type="button" class="white_key kb" data-piano-key-number="'+(12*i+white_key_num[j])+'" style="left:';
			res += (x0+(i*7+j)*ww) +'px"></button>';

		}
		for(var j=0;j<5;++j){
			res += '<button type="button" class="black_key kb" data-piano-key-number="'+(12*i+black_key_num[j])+'" style="left:';
			res += (x0+(i*7+black_key_offset[j])*ww+ww-bw/2) +'px"></button>';

		}

	}
	keyrange = n_octaves*12-1;
	return res;


}

function make_modeboard(keys){
	res = '<input type="radio" name="musicMode" value="single" checked>Single note<br>\n';
	for(var i in keys){
		var j = chord_name[keys[i]]; 
		if(j != undefined){
			res += '<input type="radio" name="musicMode" value="' + (keys[i]) + '">'+ (j) + '<br>\n';
		}
	}
	return res;
}


var this_pitch, this_key, this_amplitude;
var lowest_pitch=60; // The MIDI pitch number for the first (left) keyboard key



function pressing(){
	var mode = $(":radio[name=musicMode]:checked").val();
	pressed = mode == "single"? [0]: chord_num[mode];
  
  pressed.forEach(function(el){
  	if(this_pitch+el>108) return;
  	MIDI.noteOn(0, this_pitch+el, this_amplitude);
  	var tgt = $('button[data-piano-key-number='+(this_key+el)+']');
  	tgt.css("background", tgt.hasClass("white_key")? "#DDD": "#444");
  });
}

function handlePianoKeyPress(evt) {
	// Show a simple message in the console
    console.log("Key press event!");

	lowest_pitch = parseInt($("input#lowest_pitch").val());
	if(lowest_pitch< 21){
		lowest_pitch = 21;
		$("input#lowest_pitch").val(21);
	}
	if(lowest_pitch+keyrange>108){
		lowest_pitch = 108-keyrange;
		$("input#lowest_pitch").val(108-keyrange)
	}

  // Determine which piano key has been pressed.
  // 'evt.target' tells us exactly which item triggered this function.
  // The piano key number is taken from the 'data-piano-key-number' attribute of each button.
  // The piano key number is a value in the range 0 to keyrange inclusive.
  this_key = parseInt($(evt.target).data("piano-key-number"));	
  this_pitch = lowest_pitch + this_key;

  // Extract the amplitude value from the slider
  this_amplitude = parseInt($("#amplitude").val());

  // Use the two numbers to start a MIDI note
  // Handle chord mode
  pressing();
  
 

};



function handlePianoKeyRelease(evt) {
  if(pressed.length == 0) return;
  // Show a simple message in the console
  if(evt!=null) console.log("Key release event!");
  // Send the note off message to match the pitch of the current note on event
  pressed.forEach(function(el){
  	if(this_pitch+el>108) return;
  	MIDI.noteOff(0, this_pitch+el);
  	var tgt = $('button[data-piano-key-number='+(this_key+el)+']');
  	tgt.css("background", tgt.hasClass("white_key")? "white": "black");
  });
  pressed = [];
};



var seqPlayer = {
	channel:0,
	enabled:false,
	q:[],
	midi: null,
	raw_midi: "",
	sample_q:[[490,60,127],[10,0],[490,62,127],[10,0],[490,64,127],[10,0]],

	play:function(){
		if(this.q.length <= 0){
			return;
		}
		this.enabled = true;
		var q = this.q;
		var cur = q.shift();
		var next = q.length? q[0]: null;
		var channel = this.channel;
		function loop(){
			if(cur[1]>=21 && cur[1]<=108){
				MIDI.noteOn(channel, cur[1], cur[2]);
			}
        	setTimeout(function(){
        	    if(cur[1]>=21 && cur[1]<=108){
        		    MIDI.noteOff(channel,cur[1]);

        		}
        		if(next == null){
        			seqPlayer.enabled = false;
        		}else{
        		    cur = next;
        		    q.shift();
        		    next = (seqPlayer.enabled && q.length>0)? q[0]:null;
        		    console.log('next',next);

        		    loop();
        	    }
        	},cur[0]);
				

	    }
	    setTimeout(loop, 0);



	},
	pause:function(){
		this.enabled = false;

	},
	stop:function(){
		this.enabled = false;
		this.q = [];

	},
	setQ:function(arr){
		arr = arr==undefined? this.sample_q: arr;
		this.q = arr.slice(0);
	},
	toMidi:function(src){
		var q = src == undefined? this.q : this.parseQ(src);
		if(q.length<=0) return false;

		this.q = q;
		var m = new simpMidi();
		var delta = 0;
		log('toMidi')
		// one melody line
		for(var i=0;i<q.length;++i){
			if(q[i][1]<21){ // valid lower bound
                delta += q[i][0];
			}else{
				m.addEvent(delta,'noteOn',0,[q[i][1],q[i][2]]);
				m.addEvent(q[i][0], 'noteOff', 0, [q[i][1],0]);
				delta = 0;
			}
		}
		if(src != undefined){
			m.setTimeSignature(...src.time_sig);
			m.setKeySignature(src.key_sig, 'maj');
			m.setTempo(src.tempo);
		}
		m.finish();

		this.midi = m;
		this.raw_midi = MidiWriter(m);

	},
	saveMidi:function(){
		if(this.raw_midi.length<1) return;
		var bf = new Uint8Array(this.raw_midi.split("").map(function(e){return e.charCodeAt(0);}));
		saveAs(new File([bf], 'sample.mid', {type:"audio/mid"}));
		log('midi saved');
	},
	parseQ:function(score){
		var ctrlTicks = Math.floor(60*1000.0/score.tempo/score.ctrl_per_beat);
		var measures = score.measures.mel.split(/\s*\/\s*/);

		var res = [];
		var tied = false;
		var ref = score.key_ref;
		while(measures.length>0){
			var notes = measures[0].split(/\s+/);
			measures.shift();
			for(var i=0;i<notes.length;++i){
				if(notes[i][0]==':'){
					switch(notes[i][1]){
						case '+':
						    ref += 12;
						    break;
						case '-':
						    ref -= 12;
						    break;
						default:
						    ref = score.key_ref;
						    ctrlTicks = Math.floor(60*1000.0/score.tempo/score.ctrl_per_beat);
						    break;
					}
				}else{
					var terms = notes[i].split(',');
					var num = parseInt(terms[0]);
					var pitch = num<=0 ? 0: ref+white_key_num[num-1];
					var dur = ctrlTicks * (terms.length>=2? parseInt(terms[1]):1);
					//console.log(pitch,'dur',dur);
					if(tied){
						// TODO: check pitch
						log('before tie', res[res.length-1]);
						res[res.length-1][0] += dur;
						log('after tie', res[res.length-1]);
						tied = false;
						dur = 0;
					}
					if(terms.length>=3){
						for(var j=0;j<terms[2].length;++j){
							switch(terms[2][j]){
								case '+':
							    pitch += 12;
							    break;
							case '-':
							    pitch -= 12;
							    break;
							case '#':
							    pitch += 1;
							    break;
							case 'b':
							    pitch -= 1;
							    break;
							case '^':
							    tied = true;
							    break;
							default:

							}
						}
						
					}
					if(dur>0){
						// TODO: add amplitude control
						res.push([dur,pitch,127]);

					} 

				}
			}



		}
		return res;
	}
}

const score_summer = {
	tempo: 120,
	time_sig: [4,4],
	key_sig: 0, // C key
	key_ref:60, // middle C
	ctrl_per_beat: 2,
	incomplete_measure: true,
	measures:{
		mel:":+ 3,2 1,2/3,8,^/\n3,2 2 1 2 3 1,2/\n:- 6,4 3,4,^/3,4 :+ 3,2 1,2/2 2,7,^/\n2,2 1 6,1,- 1 6,1,- 1,2/:- 7,8,^/\n7,4 0 :+ 3,2 1/3 3,2 3,5,^/\n3,2 2 1 2 3 1,2/\n:- 6,4 3,4,^/3,6 3,2/5,2 3 5 6,2 :+ 1,2/\n3 2,3 1,4/:- 6,8,^/\n6,4 :+ 3,2 1,2",
		harmony:""
	}
}

var cur_score = score_summer;

var schema_summer = {
	structure:"c,4;A,32;B,32;A,32;C,28;c,4",
	mode:'min',
	funcs:{
		'A':"1,8/4,8/1,4 2,4/1,8",
		'B':"4,8/6,8/2,4 5,4/5,8",
		'C':"3,4 1,4/2,4 5,4/1,4 2,4/2,4",
		'c':"5,4"
	},

	chords:{
		'A':"",
		'B':"",
		'C':"",
		'c':""
	}
}

function score_gen(schema){

	var res = {};

	return res;

}

function testScale(){
	//var q = seqPlayer.parseQ(score_summer);
	//console.log(q);
	var arr = white_key_num.map(function(v){
		return [200,60+v,127];
	});
	seqPlayer.setQ(arr);
	seqPlayer.play();
}

function setMidi(m, autostart){
	MIDI.Player.loadFile('base64,'+btoa(MidiWriter(m)));
	MIDI.Player.loadMidiFile();
	if(autostart) MIDI.Player.start();
}

function testMidi(){
	MIDI.Player.loadFile('./mid/rachmaninov3.mid', function(){
		//MIDI.Player.start();
	});
	var m = new simpMidi();
	for(var i=0;i<5;++i){
		m.addEvent(0,'noteOn', 0, [60+i*2, 100]);
	    m.addEvent(1000,'noteOff', 0, [60+i*2, 0]);

	}
	
	m.finish();
	setMidi(m,true);

	return m;
}


    






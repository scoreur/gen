var debugFlag = true;
function log(){
	if(debugFlag) console.log(...arguments);
	return debugFlag;
}




var keyrange = 23;
var pressed = [];


function make_keyboard(n_octaves, x0, ww, bw){
	var black_key_offset = [0,1,3,4,5];
    var res = '';
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
	var res = '<input type="radio" name="musicMode" value="single" checked>Single note<br>\n';
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

// TODO: migrate to ScoreObj
var ScoreObj = function(options){
	var options = options || {};
	this.tempo = options.tempo || 120;
	this.time_sig = options.time_sig || [4,4];
	this.key_sig = options.key_sig || 'C';
	this.ctrl_per_beat = options.ctrl_per_beat || 4;
	
	var len = 0;


	var init_ref = MIDI.keyToNote[options.key_sig+'4'];
	function parseMelody(m){
	    var res = [];
		var ref = init_ref;
		var res = m.map(function(e){
			var measure = [];
			var notes = e.trim().split(/\s+/);
			for(var i=0;i<notes.length;++i){
				if(notes[i][0]==':'){
					switch(notes[i][1]){
						case '+':
						    ref += 12;
						    break;
						case '-':
						    ref -= 12;
						    break;
						default: // restore
						    ref = init_ref;
						    break;
					}
				}else{
					var terms = notes[i].split(',');
					var num = parseInt(terms[0]);
					// TODO: support note name
					if(num == NaN) continue;
					var pitch = num<=0 ? 0: ref+white_key_num[num-1];
					var dur = (terms.length>=2? parseInt(terms[1]):1);
					var tied = false;
					if(terms.length >= 3){
						for(var j=0;j<terms[2].length;++j){
							pitch += {'+':12,'-':-12,'#':1,'b':-1}[terms[2][j]] | 0;
							if(terms[2][j]=='^'){
								tied = true;
							}
						}
					}
					measure.push(tied? [dur, pitch, true]: [dur, pitch]);
				}
			}
			return measure;
		});
		return res;

	}
	function parseHarmony(h){


		return h;

	}
	function parseTexture(t){

		return t;

	}
	function addMeasure(m, h, t){

		return len = len+1;

	}
	this.melody = parseMelody(options.melody);
	this.harmony = parseHarmony(options.harmony);
	this.texture = parseTexture(options.texture);

}


ScoreObj.prototype.parse = function(options){
	var init_ctrlTicks = (60000.0/options.tempo/options.ctrl_per_beat) >>>0;
	var init_ref = MIDI.keyToNote[options.key_sig+'4'];
	function parseMelody(measures){
		var ctrlTicks = init_ctrlTicks;
				var res = [];
		var tied = false;
		var ref = init_ref;
		for(var k=0;k<measures.length;++k){
			var notes = measures[k].trim().split(/\s+/);
			var vol = 110;
			for(var i=0;i<notes.length;++i){
				if(notes[i][0]==':'){
					switch(notes[i][1]){
						case '+':
						    ref += 12;
						    break;
						case '-':
						    ref -= 12;
						    break;
						default: // restore
						    ref = init_ref;
						    ctrlTicks = init_ctrlTicks;
						    break;
					}
				}else{
					var terms = notes[i].split(',');
					var num = parseInt(terms[0]);
					// TODO: support note name
					if(num == NaN) continue;
					var pitch = num<=0 ? 0: ref+white_key_num[num-1];
					var dur = ctrlTicks * (terms.length>=2? parseInt(terms[1]):1);
					//console.log(pitch,'dur',dur);
					if(tied){
						// TODO: check pitch
						//log('before tie', res[res.length-1]);
						res[res.length-1][0] += dur;
						//log('after tie', res[res.length-1]);
						tied = false;
						dur = 0;
					}
					if(terms.length>=3){
						for(var j=0;j<terms[2].length;++j){
							pitch += {'+':12,'-':-12,'#':1,'b':-1}[terms[2][j]] | 0;
							if(terms[2][j]=='^'){
								tied = true;
							}
						}
						
					}
					if(dur>0){
						// TODO: add amplitude control
						res.push([dur,pitch,vol]);

					} 

				}
			}

		}
		return res;
	}
	var q = parseMelody(options.melody);

	function parseHarmony(measures){
		var res = [];
		var ctrlTicks = init_ctrlTicks;
		for(var k=0;k<measures.length;++k){
			var chords = measures[k].trim().split(/\s+/);
			var ex = /[ABCDEFG][b#]?/;
			var octave = 3;
			var vol = 80;
			for(var i=0;i<chords.length;++i){
				var terms = chords[i].split(',');
				var root = ex.exec(terms[0])[0];
				var root_pitch = MIDI.keyToNote[root+octave];
				var name = terms[0].substr(ex.lastIndex+root.length);
				// alias
				name = {'7':'dom7','':'maj','M':'maj','m':'min','mi':'min','m7':'min7'}[name] || name;
				var chord_pitches = chords_inv[name] || chords_inv['maj']; // default maj
				var dur = ctrlTicks * (terms.length>=2? parseInt(terms[1]):1);
				res.push([dur,root_pitch,chord_pitches,vol]);
			}
		}
		return res;

	}
	
	var c = parseHarmony(options.harmony);

	function parseTexture(measures){
		var res = [];
		var ctrlTicks = init_ctrlTicks;
		var delta = 0, refc = [], refi = -1;
		for(var k=0;k<measures.length;++k){
			var arrange = measures[k].trim().split(/\s+/);
			var vol = 80;
			for(var i=0;i<arrange.length;++i){
				if(arrange[i][0]==':'){
					var refk = MIDI.keyToNote['C3']; // 48
					while(refi<c.length && delta>=0){
						delta -= c[++refi][0];
					}
					var inv = /:i*/.exec(arrange[i])[0].length - 1;
					var bass = (c[refi][1]+c[refi][2][inv])%12;
					var chord = chords_inv.inv(c[refi][2], inv);
					inv += 1;
					while(arrange[i][inv]=='+' || arrange[i][inv]=='-'){
						refk += {'+':12, '-':-12}[arrange[i][inv]];
						inv++;
					}
					bass += refk;
					refc = [];
					for(var j=inv;j<arrange[i].length;++j){
						var s = arrange[i][j];
						switch(s){
							case '0': case '1': case '2': case '3':
							    refc.push(bass+chord[parseInt(s)]);
							    break;
							case '+': 
							    refc[refc.length-1] += 12; break;
							case '-':
							    refc[refc.length-1] -= 12; break;
							default:
							    log('skip unknown config '+s);
						}
					}
				}else{
					var terms = arrange[i].split(',');
					var dur = ctrlTicks * (terms.length>=2? parseInt(terms[1]):1);
					var tmp = [dur, Array.prototype.map.call(terms[0],function(e){
						return refc[e]? refc[e]: (console.log('invalid syntac', refc, terms), 0);
					}), vol];
					res.push(tmp);
					delta += dur;
				}
			}


		}
		return res;
	}
	var t = parseTexture(options.texture);
	return {
		melody: q,
		harmony: c,
		texture: t
	}

}

ScoreObj.prototype.toMidiObj = function(options){
	var src = ScoreObj.prototype.parse(options);
	var q = src.melody, t = src.texture, c = src.harmony;
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
	m.setTimeSignature(...options.time_sig);
	m.setKeySignature(MIDI.key_sig[options.key_sig], 'maj');
	m.setTempo(options.tempo);
	
	var l = m.addTrack() - 1;
	m.addEvent(l,0,'programChange',l-1,0);
	function addNotes(dur, notes, vol){
		var rollTime = 10;
		m.addEvent(l,0,'noteOn', l-1, [notes[0],vol]);
		notes.slice(1).forEach(function(e){
			m.addEvent(l,rollTime,'noteOn', l-1, [e,vol]);
		});
		m.addEvent(l,dur-(notes.length-1)*rollTime,'noteOff', l-1, [notes[0],0]);
		notes.slice(1).forEach(function(e){
			m.addEvent(l,0,'noteOff', l-1, [e,0]);
		});
	}
	t.forEach(function(e){
		addNotes(...e);
	});
	m.finish();
	return {
		src: src,
		midi: m,
		raw_midi: MidiWriter(m)
	}
}


var seqPlayer = {
	channel:0,
	enabled:false,
	src: {q:[],c:[],t:[]},
	midi: null,
	raw_midi: "",
	play:function(){
		if(this.src.q.length <= 0){
			return;
		}
		this.enabled = true;
		var q = this.src.q;
		var nexti = 1;
		var cur = q[0];
		var channel = this.channel;

		function loop(){
			if(cur[1]>=21 && cur[1]<=108 &&cur[0]>0){
				MIDI.noteOn(channel, cur[1], cur[2]);
			}
        	setTimeout(function(){
        	    
        		if(nexti < 0){
        			if(cur[1]>=21 && cur[1]<=108){
        		        MIDI.noteOff(channel,cur[1]);
        		    }
        			seqPlayer.enabled = false;
        			seqPlayer.onend();
        		}else{
        			if(cur[1]>=21 && cur[1]<=108 && q[nexti][0]>0){
        		        MIDI.noteOff(channel,cur[1]);
        		    }
        		    cur = q[nexti];
        		    nexti = (seqPlayer.enabled && nexti+1<q.length)? nexti+1 :-1;
        		    //log('next',q[nexti]);

        		    loop();
        	    }
        	},cur[0]>=0? cur[0]: -cur[0]);
				

	    }
	    setTimeout(loop, 0);



	},
	toQ(score){


	},
	pause:function(){
		this.enabled = false;

	},
	stop:function(){
		this.enabled = false;
		this.src.q = [];

	},
	onend:function(){},
	toMidi:function(src){
		var res = ScoreObj.prototype.toMidiObj(src);
		this.src.q = res.src.melody;
		this.src.c = res.src.harmony;
		this.src.t = res.src.texture;
		this.midi = res.midi;
		this.raw_midi = res.raw_midi;

	},
	saveMidi:function(){
		if(this.raw_midi.length<1) return;
		var bf = new Uint8Array(this.raw_midi.split("").map(function(e){return e.charCodeAt(0);}));
		saveAs(new File([bf], 'sample.mid', {type:"audio/midi"}));
		log('midi saved');
	}
}




var cur_schema = schema_summer;
var cur_score = score_summer;

function rndChoice(choices, weights){
	//console.log(choices,weights);
	var s = weights.reduce(function(a,b){return a+b;}, 0);
	var p = weights.map(function(e){return e/s;});
	s = 0;
	for(var i=0;i<p.length;++i){
		s = (p[i] += s);
	}
	// TODO: add random seed
	//var seed = Date.now();
	function generate(){
		var r = Math.random();
		for(var i=0;i<p.length;++i){
			if(r<p[i]){
				return choices[i];
			}
		}
		return choices[p.length-1];
	}
	return {
		gen: generate
	}
}



function load_local_midi(file, onsuccess){
	if(file.type != 'audio/midi'){
		console.log('file type cannot be ' + file.type);
		return false;
	}
	var reader = new FileReader();
	reader.onload = function(e){
		onsuccess && onsuccess(e.target.result);
	}	
	reader.readAsDataURL(file)
	return true;

}
function load_json(file, onsuccess){
	log('load json')
	var reader = new FileReader();
	reader.onload = function(e){
		var res = JSON.parse(e.target.result);
		onsuccess && onsuccess(res);
	}	
	reader.readAsText(file)
	return true;
}

var TEST = TEST || {};

TEST.testSeqPlayer = function (){
	//var q = seqPlayer.parseQ(score_summer);
	//console.log(q);
	var arr = white_key_num.map(function(v){
		return [200,60+v,127];
	});
	seqPlayer.setQ(arr);
	seqPlayer.play();
	return true;
}

var ScoreRenderer = function(c){
	// migrate to vexflow
	this.c = document.getElementById(c);
	this.r = new Vex.Flow.Renderer(this.c, Vex.Flow.Renderer.Backends.CANVAS);
	this.ctx = this.r.getContext();
	this.geo = {system_width:800,system_height:80,system_interval:20,left_padding:10,top_padding:10}
	this.layout = {measure_per_system:4}
	this.r.resize(1000,800);







	return;
	this.c = new fabric.StaticCanvas(c, {
		width: 500,
		height: 400,
		backgroundColor: 'rgb(250,250,250)'
	});
	this.sys = [];
	this.s = {}

}
ScoreRenderer.prototype.old_render = function(score){
	var s = this.s = new ScoreObj(score);
	var nSystems = Math.ceil(s.melody.length/this.layout.measure_per_system);
	this.sys = [];
	for(var i=0;i<nSystems;++i){
		this.sys.push(new fabric.Rect({
			width:460,
			height:50,
			left:0,
			top:0,
			fill:'rgb(240,240,240)',
		}))
	}
	var top_padding = 30;
	var left_padding = 20;
	var system_dis = 20;
	this.c.clear();
	for(var i=0;i<nSystems;++i){
		this.sys[i].set({top:top_padding+(50+system_dis)*i, left:left_padding});
		this.c.add(mds.sys[i]);
		
	}
	this.c.renderAll();
	console.log('rendered');

}

var dur_mapper = ["16","8","8d","4","4","4d","4dd","2","2","2","2","2d","2d","2dd","2ddd","1"];
function dur_map(dur){
	dur = (dur*4) >>> 0;
	//console.log(dur);
	return dur_mapper[dur-1];
}
// m-th measure
ScoreRenderer.prototype.newStave = function(m){
	var i = m % this.layout.measure_per_system;
	var j = (m / this.layout.measure_per_system) >>> 0;
	var w = this.geo.system_width / this.layout.measure_per_system;
	var x = this.geo.left_padding + i * w;
	var y = this.geo.top_padding + j * (this.geo.system_height + this.geo.system_interval);
	//console.log(x,y,w);
	if(i % this.layout.measure_per_system == 0){
		return new Vex.Flow.Stave(x, y, w).addClef('treble');
	}else{
		return new Vex.Flow.Stave(x, y, w);
	}
	
}
ScoreRenderer.prototype.render = function(score){
	this.r.resize(1000,800);
	var ctx = this.ctx;
	var w = (this.geo.system_width / this.layout.measure_per_system * 0.9) >>> 0;
	var s = this.s = new ScoreObj(score);
	var nSystems = Math.ceil(s.melody.length/this.layout.measure_per_system);

	this.sys = [];
	var sys = [];
	for(var i=0;i<s.melody.length;++i){
		var stave = this.newStave(i);
		var dur_tot = 0;
		var notes = s.melody[i].map(function(e){
			var key = MIDI.noteToKey[e[1]];
			dur_tot += e[0];
			var duration =  dur_map(e[0]/s.ctrl_per_beat);
			
			if(key == undefined){
			    key = "Bb4"; // rest
			    duration += 'r';
			}
			key = key.substr(0,key.length-1)+'/'+key.substr(-1);
			var res = new Vex.Flow.StaveNote({keys:[key], duration: duration});
			if(duration.substr(-1)=='d'){
				res.addDotToAll();
			}
			return res;
		});
		// add barline


	  // Create a voice in 4/4
	  var voice = new Vex.Flow.Voice({
	    num_beats: (dur_tot/s.ctrl_per_beat)>>>0,
	    beat_value: s.time_sig[1],
	    resolution: Vex.Flow.RESOLUTION
	  });

	  // Add notes to voice
	  voice.addTickables(notes);

	  // Format and justify the notes to 500 pixels
	  
	  var formatter = new Vex.Flow.Formatter().
	    joinVoices([voice]).format([voice], w-5);
	   
	  this.sys.push({voices:[voice],stave:stave});

	}
    
	this.sys.forEach(function(e){
		e.stave.setContext(ctx).draw();
		e.voices.forEach(function(v){v.draw(ctx, e.stave);});
	});

} 


var Generator = function(schema){
	this.schema = schema;

}
Generator.prototype.melody = function(mode,options,dur){
	return {
		'random':function(options, dur){
			var res = {dur:[],pitch:[]};
			var n = dur/options.rhythm[0] >>>0;
			var rc1 = rndChoice(options.rhythm[1], options.rhythm[2]);
			var rc2 = rndChoice(options.interval.choices,options.interval.weights);
			for(var i=0;i<n;++i){
				res.dur.push(rc1.gen());
				var tmp = []
				for(var j=0;j<res.dur[i].length;++j){
					tmp.push(rc2.gen());
				}
				res.pitch.push(tmp);
			}

			return res;
		},
		'transpose':function(options,dur){
			var res = '';

			return this.random(options,dur);

			return res;
		},
		'chord':function(options,dur){
			var res = '';


			return this.random(options,dur);

			return res;
		}
	}[mode](options, dur);
	
}

function score_gen(schema){
    var st = schema.structure.map(function(e){return e.split(',');});
    var sec = schema.ctrl_per_beat*schema.time_sig[0]; // separate bar
	var res = {};
	var mel = {};
	 // convert to score str
    function b2score(b,pre){
    	var dur = _.flatten(b.dur);
		var pitch = _.flatten(b.pitch);
    	var tmp = [':'];
		var delta = 0;
		var sc = [];
		for(var j=0;j<dur.length;++j){
			function ct(d,p){
				var ret = '';
				var cur_p = pre+p;

				
				delta += d;
				var oct = (cur_p/7 >>>0) - (pre/7 >>>0);
				if(oct!=0){
					var mm = {"-1":'-',"-2":'--',1:'+',2:'++'};
					ret += ':'+ (mm[oct] || '');
				}
				ret += ' '+(cur_p%7+1);
				if(d>1){ret += ','+d;}
				pre = cur_p;
				//console.log(cur_p, flag);
				return ret;
			}
			if(delta>=sec){
			    delta -= sec;
			    sc.push(tmp.join(' '));
			    log(i,tmp);
			    tmp = [];
			}
			tmp.push(ct(dur[j],pitch[j]));
			

		}
		if(tmp != []){ // incomplete measure
				sc.push(tmp.join(' '));
		}
		return sc;

	}	

    
    var res1 = {};
    for(var i in schema.blocks){
    	var dur = schema.blocks[i];
    	var mode = schema.melody[i];
    	res1[i] = Generator.prototype.melody(mode.mode,mode.options,dur);
        mel[i] = b2score(res1[i],7*4);
    }
	//log('melody',mel,res1);
   
    
    var melody = schema.structure.map(function(e){return mel[e];});


	return {
		melody: _.flatten(melody,true),
		harmony: {},
		texture: {}
	}

}

TEST.testGen = function(){
	var res = score_gen(cur_schema);
	console.log(res.melody);
	cur_score.melody = res.melody;
	return true;
}



    






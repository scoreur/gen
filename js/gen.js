

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
	nexti: 0,
	src: {q:[],c:[],t:[]},
	midi: null,
	raw_midi: "",
	play:function(){
		if(this.src.q.length <= 0){
			return;
		}
		this.enabled = true;
		var q = this.src.q;
		var nexti = this.nexti;
		var cur = q[nexti];
		nexti++;
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
					if(seqPlayer.enabled){
						nexti++;
						if(nexti>= q.length){
							nexti = -1;
							seqPlayer.nexti = 0;
						}
					}else{
						seqPlayer.nexti = nexti;
						nexti = -1;
					}
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
		this.nexti = 0;

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



var Generator = function(schema){
	this.schema = schema;

}
Generator.prototype.melody = function(mode,options,dur,res1){
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
			var res = {dur:[],pitch:[]};
			var src = res1[options.src];
			// TODO: handle offset
			var refd = 0, refp = 0;
			
			while(dur>0){
                var tmp = [];
				src.dur[refd].map(function(e,i){
					if(dur-e>=0){
						tmp.push(e);
						res.pitch.push(src.pitch[refd][i]);
						dur -= e;
					}else if(dur>0){
						tmp.push(dur);
						res.pitch.push(src.pitch[refd][i]);
						dur = 0;
					}
				});
				refd++;
				res.dur.push(tmp);

			}
			log(res.pitch[0]);
			res.pitch[0] += options.interval;
			log(res.pitch[0]);
			return res;
		},
		'chord':function(options,dur){
			var chords = options.chords.map(function(e){
				return e.split(',');
			});
			// obtain chords pitch
			var res = {pitch:[], dur:[]};


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
    	res1[i] = Generator.prototype.melody(mode.mode,mode.options,dur,res1);
        mel[i] = b2score(res1[i],7*4);
    }
	log('melody',mel,res1);
   
    
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



    






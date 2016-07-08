
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
    fromScore:function (src) {
        var ctrlTicks = (60000.0 / src.tempo / src.ctrl_per_beat) >>> 0;
        var obj = new ScoreObj(src);
        var vol = 110;
        var q = [];
        var m = _.flatten(obj.melody,true);
        for (var j = 0; j < m.length; ++j) {
            var delta = m[j][0];
            while (m[j][2] == true && j + 1 < m.length) {

                j++;
                delta += m[j][0];
            }
            q.push([delta * ctrlTicks, m[j][1], vol])
        }
        this.src = {c: obj.harmony, t: obj.texture, q: q};
        this.midi = obj.toMidi();
        this.raw_midi = MidiWriter(this.midi);

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


// TODO: migrate to Generator.coffee

Generator.prototype.melody = function(mode,options,dur){
	return {
		'random':function(options, dur){
			// not chromatic
			var res = {dur:[],pitch:[]};
			var n = dur/options.rhythm[0] >>>0;
			var rc1 = rndChoice(options.rhythm[1], options.rhythm[2]);
			var rc2 = rndChoice(options.interval.choices,options.interval.weights);
			var pre = 60;
			for(var i=0;i<n;++i){
				res.dur.push(rc1.gen());
				var tmp = []
				for(var j=0;j<res.dur[i].length;++j){
					pre += rc2.gen();
					tmp.push(white_key_num[pre%7]+12*((pre/7)>>>0));
				}
				res.pitch.push(tmp);
			}
			return res;
		},
		'transpose':function(options,dur,self){
			var res = {dur:[],pitch:[]};
			var src = self.res[options.src];
			// TODO: handle offset
			var refd = 0, refp = 0;
			
			while(dur>0){
                var tmp = [];
				src.dur[refd].map(function(e,i){
					if(dur-e>=0){
						tmp.push(e);
						res.pitch.push(options.interval + src.pitch[refd][i]);
						dur -= e;
					}else if(dur>0){
						tmp.push(dur);
						res.pitch.push(options.interval + src.pitch[refd][i]);
						dur = 0;
					}
				});
				refd++;
				res.dur.push(tmp);

			}
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
	}[mode](options, dur, this);
	
};

Generator.prototype.toScore = function(){
	if(this.res == {}){
		// not generate
		this.generate();
	}

	var pitchSimple = this.pitchSimple;
	var sec = this.schema.ctrl_per_beat*this.schema.time_sig[0]; // separate bar

	
	function b2score(b){
		var dur = _.flatten(b.dur);
        var pitch = _.flatten(b.pitch);
        var prep = 60;
		    	
    	var tmp = [':'];
		var delta = 0;
		
		var sc = [];
		for(var j=0;j<dur.length;++j){
			function ct(d,p){
				var ret = '';
				delta += d;
				var oct = (p/12 >>>0) - (prep/12 >>>0);
				if(oct!=0){
					var mm = {"-1":'-',"-2":'--',1:'+',2:'++'};
					ret += ':'+ (mm[oct] || '');
				}

				ret += ' '+pitchSimple(p);
				if(d>1){ret += ','+d;}
				prep = p;
				//console.log(p, flag);
				return ret;
			}
			if(delta>=sec){
			    delta -= sec;
			    sc.push(tmp.join(' '));
			    tmp = [];
			}
			tmp.push(ct(dur[j],pitch[j]));

	    }
		if(tmp != []){ // incomplete measure
			sc.push(tmp.join(' '));
		}
		return sc;

	}	

	var res = this.res;

	var melody = this.schema.structure.map(function(e){return b2score(res[e]);});

	return {
		melody: _.flatten(melody,true),
		harmony: {},
		texture: {}
	}
}


TEST.testGen = function(){
	var res = new Generator(cur_schema).generate();
	console.log(res.melody);
	cur_score.melody = res.melody;
	return true;
};



    






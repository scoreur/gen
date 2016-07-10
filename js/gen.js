function dataURLtoBlob(dataurl) {
	var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
			bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
	while(n--){
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new Blob([u8arr], {type:mime});
}
var seqPlayer = {
	channel:0,
	src: {q:[],c:[],t:[]},
	tracks: [],
	playing:[],
	cur_i:[],
	midi: null,
	raw_midi: "",
	play:function(n){
		n = n || 0;
		if(!this.tracks[n] || this.tracks[n].length<=0){
			return;
		}
		this.playing[n] = true;
		var q = this.tracks[n];
		var nexti = this.cur_i[n];

		var cur = q[nexti];
		nexti++;
		var channel = this.channel;

		function loop(){
			if(cur[0]>0){ // not tied
				var notes = typeof cur[1] == 'number'? [cur[1]] : cur[1];
				notes.forEach(function(e){
					if(e>=21 && e<=108) {
						MIDI.noteOn(channel, e, cur[2]);
					}
				});
			}
        	setTimeout(function(){
				var notes = typeof cur[1] == 'number'? [cur[1]] : cur[1];
        		if(nexti < 0){

					notes.forEach(function(e){
						if(e>=21 && e<=108){
							MIDI.noteOff(channel,e);
						}
					});

        			seqPlayer.playing[n] = false;
        			seqPlayer.onend();
        		}else{

        			if(q[nexti][0]>0){
						notes.forEach(function(e){
							if(e>=21 && e<= 108){
								MIDI.noteOff(channel,e);
							}
						});

        		    }
        		    cur = q[nexti];
					if(seqPlayer.playing[n]){
						nexti++;
						if(nexti>= q.length){
							nexti = -1;
							seqPlayer.cur_i[n] = 0;
						}
					}else{
						seqPlayer.cur_i[n] = nexti;
						nexti = -1;
					}
        		    //log('next',q[nexti]);
        		    loop();
        	    }
        	},cur[0]>=0? cur[0]: -cur[0]);
				

	    }
	    setTimeout(loop, 0);



	},
	toQ: function(arr, ctrlTicks, vol){
		var vol = vol || 110;
		var m = _.flatten(arr, true);
		var res = [];
		for (var j = 0; j < m.length; ++j) {
			var delta = m[j][0];
			while (m[j][2] == true && j + 1 < m.length) {
				j++;
				delta += m[j][0];
			}
			res.push([delta * ctrlTicks, m[j][1], vol])
		}
		return res;

	},
	pause:function(n){
		var n = n || 0;
		if(n >= this.tracks.length){
			return;
		}
		this.playing[n] = false;

	},
	stop:function(n){
		var n = n || 0;
		if(n >= this.tracks.length){
			return;
		}
		this.playing[n] = false;
		this.cur_i[n] = 0;

	},
	onend:function(){},
    fromScore:function (src) {
        var obj = new ScoreObj(src);
		var ctrlTicks = obj.init_ctrlTicks;
		// TODO: add volume control
		var q = this.toQ(obj.melody, ctrlTicks, 110);
		var t = this.toQ(obj.texture, ctrlTicks, 60);
		this.tracks = [];
		this.tracks.push(q, t);
		this.playing = [false, false];
		this.cur_i = [0,0];
        this.src = {c: obj.harmony, t: t, q: q};
        this.midi = obj.toMidi();
        this.raw_midi = MidiWriter(this.midi);

    },
	saveMidi:function(){
		if(this.raw_midi.length<1) return;
		var bf = new Uint8Array(this.raw_midi.split("").map(function(e){return e.charCodeAt(0);}));
		saveAs(new File([bf], 'sample.mid', {type:"audio/midi"}));
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
};


// TODO: migrate to Generator.coffee

Generator.prototype.melody = function(mode,options,dur){
	var rndChoice = this.rndPicker;
	var pitchSimple = this.pitchSimple;
	return {
		'random':function(options, dur){
			// not chromatic
			var res = {dur:[],pitch:[]};
			var n = dur/options.rhythm[0] >>>0;

			var rc1 = rndChoice(options.rhythm[1], options.rhythm[2]);
			console.log(options.rhythm);
			var rc2 = rndChoice(options.interval.choices,options.interval.weights);
			var pre = 28;
			for(var i=0;i<n;++i){
				res.dur.push(rc1.gen());
				var tmp = [];
				for(var j=0;j<res.dur[i].length;++j){
					pre += rc2.gen();
					if(pre < 21) pre = 21;
					if(pre > 108) pre = 108;
					tmp.push(pitchSimple(pre));
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
				var tmp2 = []; // pitch
				src.dur[refd].map(function(e,i){
					if(dur-e>=0){
						tmp.push(e);
						tmp2.push(options.interval + src.pitch[refd][i]);
						dur -= e;
					}else if(dur>0){
						tmp.push(dur);
						tmp2.push(options.interval + src.pitch[refd][i]);
						dur = 0;
					}
				});
				refd++;
				res.dur.push(tmp);
				res.pitch.push(tmp2);
			}
			return res;
		},
		'chord':function(options,dur){
			var chords = _.flatten(ScoreObj.prototype.parseHarmony(options.chords, 1),true);
            console.log('chords', chords);
			var refc = 0;
			var refdur = chords[refc][0];

			// obtain chords pitch

			// not chromatic
			var res = {dur:[],pitch:[]};
			var n = dur/options.rhythm[0] >>>0;

			var rc1 = rndChoice(options.rhythm[1], options.rhythm[2]);
			var rc2 = rndChoice(options.interval.choices,options.interval.weights);
			var pre = 28;
			for(var i=0;i<n;++i){
				res.dur.push(rc1.gen());
				var tmp = [];
				for(var j=0;j<res.dur[i].length;++j){
					if(Math.random()>0.9){
						pre += rc2.gen();
					}else{
						var r = Math.random()*9;
						var ii = (r%3) >>>0;
						if(refc+1<chords.length && refdur<0){
							refdur += chords[++refc][0];
						}
						pre = chords[refc][1] + chords[refc][2][ii] + 12*((r/3)>>>0);
						//console.log(pre, chords[refc])
					}
					refdur -= options.rhythm[0];


					if(pre < 21) pre = 21;
					if(pre > 108) pre = 108;
					tmp.push(pitchSimple(pre));
				}
				res.pitch.push(tmp);
			}
			return res;

		}
	}[mode](options, dur, this);
	
};


TEST.testGen = function(){
	var res = new Generator(cur_schema).generate();
	console.log(res.melody);
	cur_score.melody = res.melody;
	return true;
};



    






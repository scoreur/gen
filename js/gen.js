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
        			seqPlayer.onend(n);
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
Generator.prototype.gen_transpose = function(dur, options){
	var res = {dur:[],pitch:[]};
	var src = this.res[options.src];
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
};
Generator.prototype.gen_random = function(dur, options){
	var toPitch = this.pitchSimple;
	var scale_len = MG.scale_class[this.scale].length;
	var res = {dur:[],pitch:[]};
	var n = dur/options.rhythm[0] >>>0;

	var rc1 = this.rndPicker(options.rhythm[1], options.rhythm[2]);
	console.log(options.rhythm);
	var rc2 = this.rndPicker(options.interval.choices,options.interval.weights);
	var pre = scale_len * 4;
	for(var i=0;i<n;++i){
		res.dur.push(rc1.gen());
		var tmp = [];
		for(var j=0;j<res.dur[i].length;++j){
			pre += rc2.gen();
			if(pre < 0) pre = 0;
			if(pre > scale_len*8) pre = scale_len*8;
			//console.log(pre, toPitch(pre));
			tmp.push(toPitch(pre));
		}
		res.pitch.push(tmp);
	}
	return res;
}

Generator.prototype.gen_chord = function(dur, options){
	var toPitch = MG.scaleToPitch(this.scale, this.schema.key_sig);
	var toScale = MG.pitchToScale(this.scale, this.schema.key_sig);
	var chords = _.flatten(ScoreObj.prototype.parseHarmony(options.chords, 1),true);
	var scale_len = MG.scale_class[this.scale].length;
	console.log('chords', chords, 'scale len', scale_len);
	var refc = 0;
	var refdur = chords[refc][0];

	// obtain chords pitch

	// not chromatic
	var res = {dur:[],pitch:[]};
	var n = dur/options.rhythm[0] >>>0;

	var rc1 = this.rndPicker(options.rhythm[1], options.rhythm[2]);
	var rc2 = this.rndPicker(options.interval.choices,options.interval.weights);
	var pre = scale_len * 4, pre2 = pre;
	for(var i=0;i<n;++i){
		res.dur.push(rc1.gen());
		var tmp = [];
		for(var j=0;j<res.dur[i].length;++j){
			if(Math.random()>0.6){
				pre += rc2.gen();
				if(pre < 0) pre = 0;
				if(pre > scale_len*8) pre = scale_len * 8;

				tmp.push(toPitch(pre));
			}else{
				var r = (Math.random()*9)>>0;
				var ii = r % 3;
				if(refc+1<chords.length && refdur<0){
					refdur += chords[++refc][0];
				}
				pre = toPitch(pre);
				var new_pre = chords[refc][1] + chords[refc][2][ii] + 12*(Math.floor(r/3)-1);
				while(new_pre - pre > 12) new_pre -= 12;
				while(pre - new_pre > 12) new_pre += 12;

				if(new_pre<21) new_pre = 21;
				if(new_pre>108) new_pre = 108;
				tmp.push(new_pre);
				var fix = toScale(new_pre);
				pre = fix[0] + fix[1]*scale_len;

				//console.log(pre, chords[refc])
			}
			refdur -= options.rhythm[0];


		}
		res.pitch.push(tmp);
	}
	return res;

}



TEST.testGen = function(){
	var res = new Generator(cur_schema);
	res.generate();
	cur_score.melody = res.toScoreObj().melody
	return true;
};

TEST.analysis = function(data, ctrl_per_beat){
	var ctrl_per_beat = ctrl_per_beat || 4;
	var m = MidiFile(data);
	var q = simpMidi.prototype.quantize.call(m, ctrl_per_beat);

	var tracks =  q.map(function(track){
		var res = [];
		var tmp = [];
		// handle
		var delta = 0;
		track.forEach(function(e){
			if(e[0]>delta){
				if(tmp.length>0){
					res.push([e[0]-delta, tmp]);
					tmp = [];
				}else{
					res.push([e[0]-delta, [0]]);//rest
				}
				delta = e[0];
			}else{
				// ignore 'noteOff' and velocity == 0
				if(e[1] == 'noteOn' && e[3] != 0){
					tmp.push(e[2]); //noteNumber
				}
			}
		});
		res = _.unzip(res);
		res = {dur:res[0], pitch:res[1]};
		return Generator.prototype.b2score.call({},res,ctrl_per_beat);
	});
	var info =  tracks.map(function(e){
		return midi_statistics(e);
	});
	
	return true;
};

function midi_statistics(obj){
	function obj_sort(data){
		var k = Object.keys(data);
		var v = k.map(function(key){return data[key]});
		var kv = _.zip(k,v);
		kv.sort(function(a,b){return b[1]-a[1]});// decending
		return kv;
	}
	var info = {rhythm:{}, melody:{one:{}, two:{}}};
	var one = {}, two = {};
	var n_one = 0, n_two = 0;
	obj.forEach(function(e){
		var measure = _.unzip(e);
		var r = measure[0];
		info.rhythm[r] = 1+ (info.rhythm[r] || 0);
		r = measure[1];
		if(r.length<2) return;
		var c = [r[0] % 12, (r[1]-r[0])%12];
		one[c] = 1+ (one[c] || 0); n_one ++;
		for(var i=2;i < r.length;++i){
			c = [r[i-1]%12, (r[i]-r[i-1])%12];
			one[c] = 1 + (one[c]||0); n_one ++;
			c = [r[i-2] % 12, (r[i-1] - r[i-2]) % 12, c[1]];
			two[c] = 1 + (two[c]||0); n_two ++;
		}
	});

	info = {
		rhythm: obj_sort(info.rhythm),
		melody: {
			one: obj_sort(one),
			two: obj_sort(two),
			n: [0,n_one, n_two]
		}
	};
	return info;


}



    






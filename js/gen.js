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



    






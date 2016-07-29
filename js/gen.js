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
	harmony:[],
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
    fromScore:function (src, contents) {
        var obj = new ScoreObj(src,contents);
		var ctrlTicks = obj.init_ctrlTicks;
		// TODO: add volume control
		var q = this.toQ(obj.tracks[0], ctrlTicks, src.volumes[0]);
		var t = this.toQ(obj.tracks[1], ctrlTicks, src.volumes[1]);
		this.tracks = [];
		this.tracks.push(q, t);
		this.playing = [false, false];
		this.cur_i = [0,0];
        this.harmony = obj.harmony;
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



TEST.analysis = function(data, ctrl_per_beat){
	var data = data || MIDI.Player.currentData;
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

	return info;
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


function wavFile(data){
	var header = new Int8Array([
		82, 73, 70, 70, // RIFF
		255, 255, 255, 255, // 36 +
		87, 65, 86, 69, // WAVE
		102, 109, 116, 32, // "fmt "
		16, 0, 0, 0, // fmt chunk size
		1, 0, 2, 0, // pcm, 2 channel
		128, 187, 0, 0, // sampleps
		0, 119, 1, 0, // bytes per sec
		4, 0, 16, 0, // blockAlign, bits per sample
		100, 97, 116, 97, // data
		255, 255, 255, 255 // datasize
	]);

	var bL = data[0], bR = data[1];
	var len = bL.length, max = 0x7fff-1;
	var buffer = new Int16Array(len*2);
	for(var i=0;i<len;++i){
		buffer[i*2] = Math.floor(max * bL[i]);
		buffer[i*2+1] = Math.floor(max * bR[i]);
	}


	function setHeader(datasize, sampleps){
		var dv = new DataView(header.buffer);
		dv.setInt32(40,datasize, true);
		dv.setInt32(4,datasize+36, true);
		dv.setInt32(24,sampleps, true);
	}
	function toBlob(){
		setHeader(4 * len, 44100);// datasize = blockAlign * length
		return new Blob([header, buffer], {type:'audio/wav'});
	}
	return toBlob();

}
function midi2wav(midifile, sampleps){
	var sampleps = sampleps || 44100;
	// currently ignore setTempo
	var rep = new Replayer(midifile, 1, null);
	var data = rep.getData();
	var endTime = 500.0 * 2; // extra 500ms *2
	data.forEach(function(e){
		endTime += e[1];
	});


	var len = Math.floor(sampleps/1000 * endTime);
	console.log('length', len);
	var chL = new Float32Array(len), chR = new Float32Array(len);
	var curTime = 500.0; // in miliseconds
	var sources = {};
	function noteOn(channelId, noteId, velocity){
		var channel = MIDI.channels[channelId];
		var instrument = channel.program;
		var bufferId = instrument + 'x' + noteId;
		var buffer = MIDI.audioBuffers[bufferId];
		if(buffer == null){
			console.log('no buffer', bufferId);
			return;
		}
		// check if already noteOn;
		sources[channelId + 'x' + noteId] = {buffer:buffer, cur_i:0, vol:velocity/127, fade_out:-1};

	}
	function noteOff(channelId, noteId){
		var source = sources[channelId + 'x' + noteId];
		if(source){
			var fade_time = source.vol * 0.15; // should get from metadata
			source.fade_out = Math.floor(fade_time * sampleps);
		}

	}
	function forward(n){
		if(n<=0){
			return ;
		}

		var start_i = Math.floor(curTime * sampleps / 1000);
		//console.log('forward', n, start_i);

		for(var s in sources){
			var source = sources[s];
			var bL = source.buffer.getChannelData(0),
					bR = source.buffer.getChannelData(1),
					vol = source.vol;
			var i_to = start_i, i_from = source.cur_i;
			var real_n = n;
			if(i_from + real_n> bL.length){
				real_n = bL.length - i_from;
			}
			if(source.fade_out<0){
				// noteOn
				for(var i=0;i<real_n;++i, ++i_to, ++i_from){
					chL[i_to] += bL[i_from] * vol;
					chR[i_to] += bR[i_from] * vol;
				}
			}else{
				// noteOff, fade out
				var delta = vol/source.fade_out;
				if(source.fade_out<real_n){
					real_n = source.fade_out;
				}
				for(var i=0;i<real_n;++i, ++i_to, ++i_from){
					chL[i_to] += bL[i_from] * vol;
					chR[i_to] += bR[i_from] * vol;
					vol -= delta;
				}
				source.fade_out -= real_n;
				source.vol = vol;


			}
			source.cur_i = i_from;
			if(source.fade_out == 0 || source.cur_i >= bL.length){
				delete sources[s];
			}


		}


	}
	function processing(e){
		// TODO: add fade out
		forward(Math.floor(sampleps/1000 * e[1]));
		curTime += e[1];
		if(e[0].event.type !== 'channel'){
			return; //ignore non-channel event
		}
		var event = e[0].event;
		var channelId = event.channel;
		var channel = MIDI.channels[channelId];

		switch(event.subtype){
			case 'controller':
				MIDI.setController(channelId, event.controllerType, event.value, 0);// should check
				break;
			case 'programChange':
				MIDI.programChange(channelId, event.programNumber, 0);
				console.log('to mp3, programChange', event.programNumber);
				break;
			case 'pitchBend':
				MIDI.pitchBend(channelId, event.value, 0);
				break;
			case 'noteOn':
				if (channel.mute) break;
				noteOn(channelId, event.noteNumber, event.velocity);
				break;
			case 'noteOff':
				if (channel.mute) break;
				noteOff(channelId, event.noteNumber);
				break;
			default:
				break;
		}
	}

	// load all instruments
	MIDI.loadPlugin({
		instruments: MIDI.Player.getFileInstruments(data)
	}, function(){
		// after success
		console.log('loadededed');

	});
	data.forEach(processing);
	console.log('midi to mp3 processed');

	return [chL, chR];
}



    






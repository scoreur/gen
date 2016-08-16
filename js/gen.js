function dataURLtoBlob(dataurl) {
	var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
			bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
	while(n--){
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new Blob([u8arr], {type:mime});
}


var TEST = TEST || {};



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
		if(channelId == 9){
			instrument = 128;
			velocity *= 0.75;
			//console.log('percussion');
		}
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



    






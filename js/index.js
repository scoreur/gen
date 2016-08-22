
function load_local_midi(file, onsuccess){
	if(file.type != 'audio/midi'){
		console.log('file type cannot be ' + file.type);
		return false;
	}
	var reader = new FileReader();
	reader.onload = function(e){
		onsuccess && onsuccess(e.target.result);
	};
	reader.readAsDataURL(file);
	return true;

}
function load_json(file, onsuccess){
	var reader = new FileReader();
	reader.onload = function(e){
		var res = JSON.parse(e.target.result);
		onsuccess && onsuccess(res);
	};
	reader.readAsText(file);
	return true;
}



var lame_worker;

var recorder = (function(){
	navigator.getUserMedia = navigator.getUserMedia ||
			navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia ||
			navigator.msGetUserMedia;
	if(navigator.getUserMedia == null){
		$.notify('microphone not supported', 'warn');
		return null;
	}
	var context = new AudioContext();
	var mic, processor;
	var dataBuf = [];
	function begin(stream){
		mic = context.createMediaStreamSource(stream);
		processor = context.createScriptProcessor(16384, 1, 1);
		processor.onaudioprocess = function(e){
			var arr = e.inputBuffer.getChannelData(0);
			lame_worker.postMessage({type:'record_process', floatData:arr});
			console.log('recording', e.inputBuffer.sampleRate, arr.length);
			dataBuf = dataBuf.concat(arr);

		};
		mic.connect(processor);
		processor.connect(context.destination);
		return function stopRecord(){
			return dataBuf;
		}
	}


	function start(){

		if(typeof lame_worker == 'undefined'){
			init_worker();
		}
		lame_worker.postMessage({type:'record_start'});
		navigator.getUserMedia({audio: true}, function (stream) {
			// Begin recording and get a function that stops the recording.
			var stopRecording = begin(stream);
			recorder.startTime = Date.now();

		}, function(err){
			console.log(err);
		});
	}
	function stop(){
		if(typeof lame_worker == 'undefined'){
			return;
		}
		lame_worker.postMessage({type:'record_end'});
		if (processor && mic) {
			// Clean up the Web Audio API resources.
			mic.disconnect();
			processor.disconnect();
			processor.onaudioprocess = null;
			// Return the buffers array. Note that there may be more buffers pending here.
			return dataBuf;
		}

	}
	return {
		start: start,
		stop:stop
	}
})();

var keybinder = function(){
	var ele;
	var act = [];
	function testFunc(e){
		console.log(e.key);
	}
	function bind(id, f1, f2){
		ele = $(id);
		act = [f1, f2];
		if(act[0] == null)
			act[0] = testFunc;
		ele.on('keydown',act[0]);
		ele.on('keyup', act[1]);
	}
	function unbind(){
		if(ele == null){
			return;
		}
		ele.off('keydown', act[0]);
		ele.off('keyup', act[1]);
		ele = null;
		act = [];
	}
	this.bind = bind;
	this.unbind = unbind;

};

var tapper = (function(dur){
	var rate = 1;
	var cur = 0;
	var ref = null;
	var buf = null;
	var dur = dur || 1000;
	var offset = 0;
	var cue = function(){
		if(ref == null){
			return;
		}
		buf.push((Date.now() - ref)/dur);
		var adjust =  (buf[buf.length - 1] - cur) % 1.0 + 1;
		if(adjust < 0.5){
			// should be slower
			offset = Math.floor(adjust * dur / 2);
		}else{
			// should be faster
			offset = -Math.floor(( 1 - adjust) * dur / 2);
		}
		console.log('offset', adjust);
	};
	function loop(){
		console.log('current number ', cur++);
		MIDI.noteOn(0, 60 + cur % 12, 100);

		ref = Date.now();
		setTimeout(function(){
			if(ref == null){
				MIDI.noteOff(0, 60 + cur % 12);
			}else{
				MIDI.noteOff(0, 60 + cur % 12);
				loop();
			}
		}, dur + offset);
		offset = Math.floor(offset / 4);
	}
	function start(){
		if(ref != null){
			return;
		}
		ref = Date.now();
		buf = [];
		cur = 0;
		keybinder.bind('body', cue);
		setTimeout(loop, 0);
	}
	function stop(){
		if(ref == null){
			return null;
		}else{
			ref = null;
			var ret = buf.slice();
			console.log(ret);
			buf = null;
			keybinder.unbind();
			return ret;
		}
	}
	return {
		start: start,
		stop: stop
	}
})();

function init_worker(){
	lame_worker = new Worker('js/lame-worker.js');
	lame_worker.onmessage = function(res){
		switch(res.data.type){
			case 'mp3':
				$.notify('mp3 encoded!', 'success');
				lame_worker.pending = false;
				saveAs(res.data.blob, 'sample.mp3');
				break;
			case 'wav':
				$.notify('wav encoded!', 'success');
				saveAs(res.data.blob, 'sample.wav');
				break;
			case 'percent':
				onprocess && onprocess(res.data.percent);
				break;
			case 'freq':
				console.log(res.data.freq);
				break;
			default:
				console.log('unknown message type: ', res.data.type);
		}
	}

}
function saveMp3(floatData,boot,blockSize,onprocess){
	if(typeof Worker == 'undefined'){
		$.notify('Worder not support, use inline encoder may block the UI', 'warning');
		return; // TODO: add inline worker
	}else{
		if(lame_worker == null){
			init_worker();

		}else if(lame_worker.pending){
			$.notify('mp3 encoding in process, try later!', 'info');
			return;
		}
		lame_worker.postMessage({type:'wav',floatData:floatData, boot:boot, blockSize:blockSize, onprocess:typeof onprocess != 'undefined'});
		lame_worker.pending = true;
		return;
	}
}
function saveWav(data){
	if(typeof Worker == 'undefined'){
		$.notify('Worder not support, use inline encoder may block the UI', 'warning');
		return; // TODO: add inline worker
	}else{
		if(lame_worker == null){
			init_worker();
		}
		lame_worker.postMessage({type:'raw', data:data});
		return;
	}

}




var appUI;
var app;


var click_event_list = {
	'parse': function(){
        app.parse();
		MIDI.Player.loadFile('base64,'+btoa(app.player.raw_midi),function(){
			$('#endTime').html((MIDI.Player.endTime/1000)>>>0);
			$.notify('MIDI loaded!', 'success');
			$('#play_slider').val(''+0);
			app.renderer.render(app.obj);
			$('li[data-target="#midi_viewer"]').click();
		});

	},
	'gen': function(){
		app.generate()
		$.notify('Melody generated!', 'success');
		click_event_list.parse();

	},
	'eg_load_json':function(){
		$.ajax('score/sample.json').done(function(res){

			var obj = typeof res == 'string'? JSON.parse(res): res;
			if(typeof obj != 'object'){
				$.notify('wrong JSON!', 'warning');
			}
			app.reset(obj);
			$.notify('sample JSON loaded!', 'success');
			click_event_list.parse();
		});

	},
	'eg_load_pdf': function(){
	    var pre = use_local_store()?'':'https://scoreur.github.io/gen/';
	    load_pdf( pre + 'score/invent.pdf');
		$('li[data-target="#pdf_viewer"]').click();
		$.notify('sample PDF loaded!', 'success');

    },
	'eg_load_midi':function(){
		MIDI.Player.loadFile('score/sample.mid', function(){
			$('#endTime').html((MIDI.Player.endTime/1000)>>>0);
			$.notify('sample MIDI loaded!', 'success');
		})

	},
	'play_MIDI':function(){
		if(!MIDI.Player.playing){
            MIDI.Player.start();
		}else{
			MIDI.Player.pause();
		}
		$('#play_MIDI>span.glyphicon').toggleClass('glyphicon-play glyphicon-pause');

	},
	'save_midi': function(){
		app.player.saveMidi();
		$.notify('MIDI saved!', 'success');
	},
	'save_wav': function(){
		var f = MidiFile(MIDI.Player.currentData);
		setTimeout(function(){
			var res = midi2wav(f);
			$.notify('wav file generated', 'info');
			saveWav(res);
		});

	},
	'save_mp3': function(){
		var f = MidiFile(MIDI.Player.currentData);
		setTimeout(function(){
			var res = midi2wav(f);
			$.notify('wav file generated, start encoding mp3', 'info');
			// do not block, should change to web worker
			saveMp3(res, null, 2304);

		}, 0);



	},
	'save_score': function(){
		$('#midi_score')[0].toBlob(function(blob){
			saveAs(blob, 'sample.png');
			// not detect abort
			$.notify('Score Image Saved!', 'success');

		});//default image/png
	},
	'console_eval': function(){
		$('#console_result').html(eval($('#console_panel').val()));
	},
	'export': function(){
		var ext = JSON.stringify(app.export());
		var file = new File([ext],'sample.json',{type:"application/json"});
		saveAs(file);
		$.notify('JSON exported!', 'success');

	},
	'analyze_midi': function(){
		if(typeof MIDI.Player.currentData == 'undefined'){
			$.notify('No MIDI', 'info');
			return;
		}
	    app.analysis(null, 16);
		$('li[data-target="#midi_viewer"]').click();
	},
	'set_seed': function(){
		var seeds = _.keys(app.schema);

		var seed_id = $('#ctrl_seed').val();
		if(seeds.indexOf(seed_id)<0 || app.schema[seed_id].mode != 'distribution'){
			return $.notify('distribution id not exist!', 'warning');
		}
		if(MG.ref_midi_info == null){
			if(MIDI.Player.currentData == null){
				return $.notify('No MIDI analyzed', 'warning');
			}else{
				app.analysis(null, 16);
			}
		}
		// get data, transform duration
		var seed = app.schema[seed_id];
		console.log (seed);

		if ("dur" in seed){
			// rhythm
			var tmp = _.unzip(MG.ref_midi_info.rhythm);
			seed.choices = tmp[0].map(function(ee){
				return ee.split(',');
			});
			seed.weights = tmp[1];


		}else{
			// interval
			var one = MG.ref_midi_info.melody.one;
			one = _.groupBy(one, function(ee){
				return ee[0].split(',')[1];
			});
			for(var ee in one){
				// sum
				one[ee] = _.reduce(one[ee], function(a,b){return a+b[1];}, 0);
			}
			seed.choices = _.keys(one);
			seed.weights = _.values(one);


		}
		app.updateEditor();
		$.notify('seed '+seed_id+' set!', 'success');



	},
	'harmony_absolute': function(){

	},
	'harmony_relative': function(){
		var data = app.editor.harmony.getValue().split(/[/\n]+/);
		var toRoman = MG.keyToRoman(app.settings.key_sig || 'C');
		data = data.map(function(e1){
			return e1.split(/\s+/).map(function(e2){
				var r = /[A-G][b#]{0,2}/.exec(e2);
				if(r == null) {
					return e2;
				}else {
					return e2.replace(r[0], toRoman(r[0])).replace(/b#/g, '').replace(/#b/g, '');
				}
			}).join(' ');
		});
		app.editor.harmony.setValue(data.join('\n'), -1);
	},
	'reset_editor': function(){
		app.reset();
		app.updateEditor();
	},
	'inc_ctrl': function(){
		var mul;
		try{
			mul = $('#ctrl_mul').val();
			if(mul == '') mul = 2;
			mul = parseInt(mul);
		}catch(e){
			mul = 1;
			$.notify('Bad parameter!', 'info');
		}finally {
			if(mul == 1 || mul == NaN){
				$.notify('NOT updated!', 'info');
				return;
			}
			var obj = JSON.parse(app.editor.settings.getValue());
			['melody', 'harmony', 'texture'].forEach(function(e0){
				var data = app.editor[e0].getValue().split(/[/\n]+/);
				data = data.map(function(e1){
					return e1.split(/\s+/).map(function(e2){
						if(e2[0]==':' || e2[0]=='@'){
							return e2;
						}else{
							if(e2 == '') return e2;
							var e3 = e2.split(',');
							if(e3.length<2){
								e3.push(mul);
							}else{
								var orna = e3[1].indexOf('^') > -1;
								e3[1]  = parseInt(e3[1]) * mul;
								if(orna) e3[1] += '^';
							}
							return e3.join(',');
						}
					}).join(' ');
				});
				obj[e0] = data;
				app.editor[e0].setValue(data.join('\n'), -1);
			});

			obj.ctrl_per_beat *= mul;
			app.editor.settings.setValue(JSON.stringify(obj, null, 2), -1);
			obj = JSON.parse(app.editor.schema.getValue());
			obj.ctrl_per_beat *= mul;
			app.editor.schema.setValue(JSON.stringify(obj, null, 2), -1);
			$.notify('Ctrl per beat updated!', 'success');
		}
	}

};

var file_open_handlers = {
	'open_midi': function(evt){
		load_local_midi(evt.target.files[0], function(res){
			MIDI.Player.loadFile(res, function(){
				$('#endTime').html((MIDI.Player.endTime/1000)>>>0);
				$('#play_slider').val(''+0);
			});
		});
	},
	'open_img': function(evt){
	    var reader = new FileReader();
	    reader.onload = function(e){
	    	$('#score_img').attr('src', e.target.result);
			$('li[data-target="#img_viewer"]').click();
	    }	
	    reader.readAsDataURL(evt.target.files[0]);
    },
    'open_json': function(evt){
	    load_json(evt.target.files[0], function(res){
			app.reset(res);
			click_event_list.parse();
	    });
	},
	'open_pdf': function(evt){
		var reader = new FileReader();
        reader.onload = function(e){
        	load_pdf(e.target.result);
			$('li[data-target="#pdf_viewer"]').click();
        };
		reader.readAsArrayBuffer(evt.target.files[0]);
	}
};

function registerEvents(){
	for(var i in click_event_list){
		$('#'+i).on('click', click_event_list[i]);
	}
	for(var id in file_open_handlers){
		openFor(id, file_open_handlers[id]);
	}
	MIDI.Player.setAnimation(function(res){
		//console.log(res.percent)
		$('#midi_progress').val(''+(100*res.percent)>>>0);
		if(MIDI.Player.playing){
			$('#play_slider').val(''+(100*res.percent)>>>0);
			$('#currentTime').html(res.now);
			//$('#endTime').html(res.end);
		}else{
			//
		}
		
	});

	$('#play_slider').on('change', function(){
		MIDI.Player.currentTime = parseInt($('#play_slider').val())/100*MIDI.Player.endTime;
	});


	// Set up the event handlers for all the buttons
	$(".kb").on("mousedown", handlePianoKeyPress)
	  .on("mouseout", handlePianoKeyRelease)
	  .on("mouseup", handlePianoKeyRelease);
}

function use_local_store(){
	return location.origin=="file://" || location.href.indexOf('http://localhost')>-1;
}
function initUI(){
    var ww = 9, wh = 130;
	$("#keyboard").css({"height": wh, "width": ww * 104}).html(make_keyboard());
	$('#mode_panel').html(make_modeboard(["maj","min","aug", "dim", "dom7", "maj7"]));

	appUI = {
		editor: [['melody','texture'], ['settings','schema', 'harmony',]],
		modes: [['score', 'score'],['json', 'text', 'score']],
		renderer: ['midi_score', 'midi_pointer'],
		playbtns: ['a[href="#track_0"]', 'a[href="#track_1"]'],
		tracks_container: '#tracks_container',
		options_container: '#options_container'
	};
	app = new AppMG(appUI);
	app.keyboard = new keybinder();
	app.keyboard.bind('#amplitude',keyHandlers[0],keyHandlers[1]);
	app.drums = new keybinder();
	app.drums.bind('#drum_amplitude', drumHandlers[0], drumHandlers[1]);

	app.tapper = tapper;
	// ace editor
	//$('#score_img').attr('src','./score/summertime.png');
	$( "#tracks_resizable" ).resizable({
		handles: "s",
		resize: function() {
			app.ui.editor[0].forEach(function(e){app.editor[e].resize();});
		}
	});


}

$( document ).ready( function() {
	
	var pre = use_local_store()?'':'https://scoreur.github.io/gen/';
	
	MIDI.loadPlugin({
		soundfontUrl: pre + "soundfont/",
		instrument: ["trumpet","acoustic_grand_piano", "percussion"],
		onprogress: function(state, progress) {
			//console.log(state, progress);
		},
		onsuccess: function() {
			// At this point the MIDI system is ready to be used
			MIDI.setVolume(0, 100); // Set the general volume level
			MIDI.programChange(0, 0);
			MIDI.programChange(1,0);
			MIDI.programChange(9,128);
			MIDI.setVolume(9, 96);
		}
	});

	initUI();
	registerEvents();
	click_event_list.parse();

});

if (typeof TEST != 'undefined') {
	Object.defineProperty(TEST, 'result', {
		get: function() {
			for (var t in this) {
				if (typeof this[t] == 'function' && !this[t]()) {
					return false;
				}
			}
			//console.log('All PASS');
			return true;
		}
	});
}
console.log('All JS loaded!')

    // You can also require other files to run in this process
 if(typeof require != 'undefined') require('./renderer.js');
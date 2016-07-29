



function setupEditor(id){
	var editor = ace.edit('ace_'+id);
	editor.setTheme("ace/theme/clouds");
	editor.getSession().setMode("ace/mode/score");
	//editor.getSession().setUseWrapMode(true);
	editor.setFontSize(16);
	editor.$blockScrolling = Infinity;
	return editor;

}

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
function saveMp3(floatData,boot,blockSize,onprocess){
	if(typeof Worker == 'undefined'){
		$.notify('Worder not support, use inline encoder may block the UI', 'warning');
		return; // TODO: add inline worker
	}else{
		if(lame_worker == null){
			lame_worker = new Worker('js/lame-worker.js');
			lame_worker.onmessage = function(res){
				switch(res.data.type){
					case 'mp3':
					    $.notify('mp3 encoded!', 'success');
						lame_worker.pending = false;
					    saveAs(res.data.blob, 'sample.mp3');
						break;
					case 'percent':
						onprocess && onprocess(res.data.percent);
						break;
					default:
						console.log('unknown message type: ', res.data.type);
				}
			}

		}else if(lame_worker.pending){
			$.notify('mp3 encoding in process, try later!', 'info');
			return;
		}
		lame_worker.postMessage({type:'wav',floatData:floatData, boot:boot, blockSize:blockSize, onprocess:typeof onprocess != 'undefined'});
		lame_worker.pending = true;
		return;
	}
}
function testSaveMp3(){
	var a = MIDI.audioBuffers['0x60'];
	saveMp3([a.getChannelData(0), a.getChannelData(1)]);
}


// store all editors
var eds = {};
var mds = new ScoreRenderer('midi_score', undefined,  'midi_pointer');
var appUI = {
	editor: eds,
	renderer: mds,
	player: seqPlayer,
	playbtns:[$('#play_melody>span.glyphicon'), $('#play_harmony>span.glyphicon')]
};

var app = new AppMG(appUI);



var click_event_list = {
	'parse': function(){
        app.parse()

		MIDI.Player.loadFile('base64,'+btoa(seqPlayer.raw_midi),function(){
			$('#endTime').html((MIDI.Player.endTime/1000)>>>0);
			$.notify('MIDI loaded!', 'success');
			$('#play_slider').val(''+0);
		});
	},
	'eg_load_json':function(){
		$.ajax('score/sample.json').done(function(res){

			var obj = typeof res == 'string'? JSON.parse(res): res;
			if(typeof obj != 'object'){
				$.notify('wrong JSON!', 'warning');
			}
			app = new AppMG(appUI,obj)
			app.updateEditor();
			$.notify('sample JSON loaded!', 'success');
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
	'play_melody': function(){
		app.play(0)
	},
	'play_harmony': function(){
		app.play(1)
	},
	'save_midi': function(){
		app.player.saveMidi();
		$.notify('MIDI saved!', 'success');
	},
	'save_wav': function(){
		var f = MidiFile(MIDI.Player.currentData);
	    var res = midi2wav(f);
	    $.notify('wav file generated', 'info');
	    // do not block, should change to web worker
		saveAs(wavFile(res), 'sample.wav');
        $.notify('wav file saved', 'success');

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
	'gen': function(){
		app.schema = JSON.parse(eds.schema.getValue());
        var generator = new Generator(app.settings, app.schema);
        generator.generate();
		var score = generator.toScoreObj()
		console.log('to Text')
	    app.contents.melody = score.toText();
		app.settings = score.getSettings()
	    app.updateEditor();
		$.notify('Melody generated!', 'success');

	},
	'render':function(){
		app.renderer.render(app.settings, app.contents);
		$('li[data-target="#midi_viewer"]').click();
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
	'melody_absolute': function(){

	},
	'melody_relative': function(){

	},
	'harmony_absolute': function(){

	},
	'harmony_relative': function(){

	},
	'reset_editor': function(){
		app = new AppMG(appUI);
		updateEditor();
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
			var obj = JSON.parse(eds.score.getValue());
			['melody', 'harmony', 'texture'].forEach(function(e0){
				var data = eds[e0].getValue().split(/[/\n]+/);
				data = data.map(function(e1){
					return e1.split(/\s+/).map(function(e2){
						if(e2[0]==':'){
							return e2;
						}else{
							var e3 = e2.split(',');
							if(e3.length<2){
								e3.push(mul);
							}else{
								e3[1]  = parseInt(e3[1]) * mul;
							}
							return e3.join(',');
						}
					}).join(' ');
				});
				obj[e0] = data;
				eds[e0].setValue(data.join('\n'), -1);
			});

			obj.ctrl_per_beat *= mul;
			eds.score.setValue(JSON.stringify(obj, null, 2), -1);
			obj = JSON.parse(eds.schema.getValue());
			obj.ctrl_per_beat *= mul;
			eds.schema.setValue(JSON.stringify(obj, null, 2), -1);
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
			app = new AppMG(appUI, res);
			updateEditor();
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
	seqPlayer.onend = function(n){
		var i = seqPlayer.cur_i[n];
		if(i>0 && i<seqPlayer.tracks[n].length)
		  return;
		switch(n){
			case 0:
				$('#play_melody>span.glyphicon').toggleClass('glyphicon-play glyphicon-pause');
				break;
			case 1:
				$('#play_harmony>span.glyphicon').toggleClass('glyphicon-play glyphicon-pause');
				break;
			default:
		};

	};

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
    /*
	['melody','harmony','texture'].forEach(function(e){
		var r = ['melody','harmony','texture'];
		r.splice(r.indexOf(e),1);
		eds[e].getSession().selection.on('changeCursor', function(e2){
			var line = eds[e].selection.getCursor().row+1;
			r.forEach(function(e3){
				eds[e3].gotoLine(line);
			});
		});
	});
	*/

	$('#play_slider').on('change', function(){
		MIDI.Player.currentTime = parseInt($('#play_slider').val())/100*MIDI.Player.endTime;
	});


	// Set up the event handlers for all the buttons
	$("button.kb").on("mousedown", handlePianoKeyPress)
	  .on("mouseout", handlePianoKeyRelease)
	  .on("mouseup", handlePianoKeyRelease);
}

function use_local_store(){
	return location.origin=="file://" || location.href.indexOf('http://localhost')>-1;
}
function initUI(){
	var n_oct = 3;
	$('#keyboard_panel').html(make_keyboard(n_oct,20,36,28));
	$('input#lowest_pitch').attr("max",109-n_oct*12);
	$('label[for=lowest_pitch]').html("MIDI lowest pitch (21-"+(109-n_oct*12)+"):");
	$('#mode_panel').html(make_modeboard(["maj","min","aug", "dim", "dom7", "maj7"]));

	// ace editor
	['melody','harmony','texture'].forEach(function(e){
		eds[e] = setupEditor(e);
	});

	['score','schema'].forEach(function(id){
		var editor = ace.edit('ace_'+id);
		editor.setTheme("ace/theme/clouds");
		editor.getSession().setMode("ace/mode/json");
		editor.getSession().setUseWrapMode(true);
		editor.$blockScrolling = Infinity;
		eds[id] = editor;
		return editor;
	});
	app.updateEditor();

	$('#score_img').attr('src','./score/summertime.png');
}

$( document ).ready( function() {
	
	var pre = use_local_store()?'':'https://scoreur.github.io/gen/';
	
	MIDI.loadPlugin({
		soundfontUrl: pre + "soundfont/",
		instrument: ["trumpet","acoustic_grand_piano"],
		onprogress: function(state, progress) {
			console.log(state, progress);
		},
		onsuccess: function() {
			// At this point the MIDI system is ready to be used
			MIDI.setVolume(0, 100); // Set the general volume level
			MIDI.programChange(0, 0);
			MIDI.programChange(1,0);
		}
	});

	initUI();
	registerEvents();
	

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
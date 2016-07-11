



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

// store all editors
var eds = {};

var mds = new ScoreRenderer('midi_score', undefined,  'midi_pointer');

var cur_schema = Object.assign({},schema_summer);
var cur_score = Object.assign({},score_summer);



var click_event_list = {
	'parse': function(){
		try{
			cur_score = JSON.parse(eds.score.getValue());
		}catch(e){
			$.notify('Bad score format!', 'warning');
		}

		//eds.score.setValue(JSON.stringify(cur_score, null, 2), -1);
		['melody','harmony','texture'].forEach(function(e){
			//console.log(e);
			cur_score[e] = eds[e].getValue().split(/[/\n]+/);

		});
		seqPlayer.fromScore(cur_score);
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
			cur_score = obj.score;
			cur_schema = obj.schema;
			updateEditor();
			$.notify('sample JSON loaded!', 'success');
		});

	},
	'eg_load_midi':function(){
		MIDI.Player.loadFile('score/sample.mid', function(){
			$('#endTime').html((MIDI.Player.endTime/1000)>>>0);
			$.notify('sample MIDI loaded!', 'success');
		})

	},
	'start':function(){
		if(!MIDI.Player.playing){
            MIDI.Player.start();
			$('button#start').html('Pause MIDI');

		}else{
			MIDI.Player.pause();
			$('button#start').html('Play MIDI');
		}

	},
	'play_melody': function(){
		if(!seqPlayer.playing[0]){
            seqPlayer.play(0);
			$('button#play_melody').html('Pause Melody');

		}else{
			seqPlayer.pause(0);
			$('button#play_melody').html('Play Melody');
		}
	},
	'play_harmony': function(){
		if(!seqPlayer.playing[1]){
			seqPlayer.play(1);
			$('button#play_harmony').html('Pause Harmony');

		}else{
			seqPlayer.pause(1);
			$('button#play_harmony').html('Play Harmony');
		}

	},
	'save_midi': function(){
		seqPlayer.saveMidi();
		$.notify('MIDI saved!', 'success');
	},
	'save_score': function(){
		$('#midi_score')[0].toBlob(function(blob){
			saveAs(blob, 'sample.png');
			// not detect abort
			$.notify('Score Image Saved!', 'success');

		});//default image/png
	},
	'gen': function(){
		cur_schema = JSON.parse(eds.schema.getValue());
        var generator = new Generator(cur_schema);
        generator.generate();
		var score = generator.toScoreObj()
		console.log('to Text')
	    cur_score.melody = score.toText();
	    updateEditor();
		$.notify('Music generated!', 'success');

	},
	'render':function(){
		mds.render(cur_score);
		$('li[data-target="#midi_viewer"]').click();
	},
	'console_eval': function(){
		$('#console_result').html(eval($('#console_panel').val()));
	},
	'export': function(){
		var ext = JSON.stringify({score:cur_score,schema:cur_schema});
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
		cur_schema = Object.assign({},schema_summer);
		cur_score = Object.assign({},score_summer);
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
		    cur_score = res.score;
	        cur_schema = res.schema;
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
		switch(n){
			case 0:
				$('button#play_melody').html('Play Melody');
				break;
			case 1:
				$('button#play_harmony').html('Play Harmony');
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
			$('button#start').html('Play MIDI');
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
function updateEditor(){

	['melody','harmony','texture'].forEach(function(e){
		eds[e].setValue(cur_score[e].join('\n'), -1);
	});
	var tmp1 = cur_score.melody, tmp2 = cur_score.harmony, tmp3 = cur_score.texture;
	cur_score.melody = cur_score.harmony = cur_score.texture = undefined;
	eds.score.setValue(JSON.stringify(cur_score, null, 2), -1);
	eds.schema.setValue(JSON.stringify(cur_schema, null, 2), -1);
	cur_score.melody = tmp1;
	cur_score.harmony = tmp2;
	cur_score.texture = tmp3;
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
	updateEditor();

	var pre = use_local_store()?'':'https://scoreur.github.io/gen/';
	//load_pdf( pre + 'score/invent.pdf');
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
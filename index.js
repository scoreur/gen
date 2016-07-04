



function setupEditor(id){
	var editor = ace.edit(id);
	editor.setTheme("ace/theme/clouds");
	editor.getSession().setMode("ace/mode/score");
	editor.getSession().setUseWrapMode(true);
	editor.$blockScrolling = Infinity;
	return editor;

}
var eds = {};
['melody','score','schema','harmony','texture'].forEach(function(e){
	eds[e] = setupEditor(e);
});


var mds = new ScoreRenderer('midi_score');



var btn_event_list = {
	'parse': function(){
		cur_score = JSON.parse(eds.score.getValue());
		['melody','harmony','texture'].forEach(function(e){
			console.log(e);
			cur_score[e] = eds[e].getValue().split(/[/\n]+/);

		});
		eds.score.setValue(JSON.stringify(cur_score));
		mds.render(cur_score);
		seqPlayer.toMidi(cur_score);
		setMidi(seqPlayer.midi,false);
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
	'play': function(){
		if(!seqPlayer.enabled){
            seqPlayer.play();
			$('button#play').html('Pause Melody');

		}else{
			seqPlayer.pause();
			$('button#play').html('Play Melody');
		}
	},
	'stop': function(){
		seqPlayer.stop();
	},
	'save_midi': function(){
		seqPlayer.saveMidi();
	},
	'gen': function(){
		cur_schema = JSON.parse(eds.schema.getValue());
		var res = score_gen(cur_schema);
	    console.log(res.melody);
	    cur_score.melody = res.melody;
	    updateEditor();

	},
	'render':function(){

	},
	'console_eval': function(){
		$('#console_result').html(eval($('#console_panel').val()));
	},
	'export': function(){
		var ext = JSON.stringify({score:cur_score,schema:cur_schema});
		var file = new File([ext],'sample.json',{type:"application/json"});
		saveAs(file);

	}
}

var file_open_handlers = {
	'open_midi': function(evt){
		load_local_midi(evt.target.files[0], function(res){
			MIDI.Player.loadFile(res);
		});
	},
	'open_img': function(evt){
	    var reader = new FileReader();
	    reader.onload = function(e){
	    	$('#score_img').attr('src', e.target.result);
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
        }
		reader.readAsArrayBuffer(evt.target.files[0]);
	}
}

function registerEvents(){
	for(var i in btn_event_list){
		$('#'+i).on('click', btn_event_list[i]);
	}
	for(var id in file_open_handlers){
		openFor(id, file_open_handlers[id]);
	}
	seqPlayer.onend = function(){
		$('button#play').html('Play Melody');
	}	

	MIDI.Player.setAnimation(function(res){
		//console.log(res.percent)
		$('#midi_progress').val(''+(100*res.percent)>>>0);
		if(MIDI.Player.playing){
			$('#play_slider').val(''+(100*res.percent)>>>0);
		}else{
			$('button#start').html('Play MIDI');
		}
		
	})

	$('#play_slider').on('change', function(){
		MIDI.Player.currentTime = parseInt($('#play_slider').val())/100*MIDI.Player.endTime;
	})


	// Set up the event handlers for all the buttons
	$("button.kb").on("mousedown", handlePianoKeyPress);
	$("button.kb").on("mouseout", handlePianoKeyRelease);
	$("button.kb").on("mouseup", handlePianoKeyRelease);
}
function updateEditor(){
	eds.score.setValue(JSON.stringify(cur_score));
	eds.schema.setValue(JSON.stringify(cur_schema));
	['melody','harmony','texture'].forEach(function(e){
		eds[e].setValue(cur_score[e].join('\n'));
	})
}
function initUI(){
	var n_oct = 3;
	$('#keyboard_panel').html(make_keyboard(n_oct,20,36,28));
	$('input#lowest_pitch').attr("max",109-n_oct*12);
	$('label[for=lowest_pitch]').html("MIDI lowest pitch (21-"+(109-n_oct*12)+"):");
	$('#mode_panel').html(make_modeboard(["maj","min","aug", "dim", "dom7", "maj7"]));
	updateEditor();
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
	load_pdf('./score/invent.pdf');
	$('#score_img').attr('src','./score/summertime.png');
}

$( document ).ready( function() {
	function use_local_soundfont(){
		return location.origin="file://" || location.href.indexOf('http:/localhost')>-1;
	}
	var soundfont_cdn = "https://scoreur.github.io/gen/soundfont/";
	
	MIDI.loadPlugin({
		soundfontUrl: use_local_soundfont()? "./soundfont/": soundfont_cdn,
		instrument: ["trumpet","acoustic_grand_piano"],
		onprogress: function(state, progress) {
			log(state, progress);
		},
		onsuccess: function() {
			// At this point the MIDI system is ready to be used
			MIDI.setVolume(0, 127); // Set the general volume level			
			MIDI.programChange(0, 0);
			MIDI.programChange(1,0);
		}
	});

	initUI();
	registerEvents();
	

});

    // You can also require other files to run in this process
 if(typeof require != 'undefined') require('./renderer.js');
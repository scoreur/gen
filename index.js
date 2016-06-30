
function setupEditor(id){
	var editor = ace.edit(id);
	editor.setTheme("ace/theme/clouds");
	editor.getSession().setMode("ace/mode/text");
	editor.getSession().setUseWrapMode(true);
	editor.$blockScrolling = Infinity;
	return editor;

}
var eds = {};
['melody','score','schema','harmony'].forEach(function(e){
	eds[e] = setupEditor(e);
});


var mds = new ScoreRenderer('midi_score');

var btn_event_list = {
	'parse': function(){
		cur_score = JSON.parse(eds.score.getValue())
		cur_score.melody = eds.melody.getValue().split(/[/\n]+/);
		cur_score.harmony = eds.harmony.getValue().split(/[/\n]+/);
		eds.score.setValue(JSON.stringify(cur_score));
		seqPlayer.setQ(seqPlayer.parseQ(cur_score));
		mds.render(cur_score);
		seqPlayer.toMidi(cur_score);
		setMidi(seqPlayer.midi,false);
	},
	'start':function(){
		if($('button#start').html()=='Play (with harnony)'){
            MIDI.Player.start();
			$('button#start').html('Pause (with harnony)');

		}else{
			MIDI.Player.pause();
			$('button#start').html('Play (with harnony)');
		}

	},
	'play': function(){
		if($('button#play').html()=='Play'){
            seqPlayer.play();
			$('button#play').html('Pause');

		}else{
			seqPlayer.pause();
			$('button#play').html('Play');
		}
	},
	'stop': function(){
		seqPlayer.stop();
	},
	'save_midi': function(){
		seqPlayer.saveMidi();
	},
	'open_midi': function(){
		$('input#midi_file_input')[0].click();
	},
	'open_img': function(){
		$('input#img_file_input')[0].click();
	},
	'gen': function(){

	},
	'render':function(){

	},
	'console_eval': function(){
		$('#console_result').html(eval($('#console_panel').val()));
	},
	'import': function(){
		$('input#json_file_input')[0].click();
	},
	'export': function(){
		var ext = JSON.stringify({score:cur_score,schema:cur_schema});
		var file = new File([ext],'sample.json',{type:"application/json"});
		saveAs(file);

	}
}
function registerEvents(){
	for(var i in btn_event_list){
		$('#'+i).on('click', btn_event_list[i]);
	}
	seqPlayer.onend = function(){
		$('button#play').html('Play');
	}

	$('input#midi_file_input').on('change', function(evt){
		load_local_midi(evt.target.files[0]);
		
	})
	$('input#json_file_input').on('change', function(evt){
		load_json(evt.target.files[0], updateEditor);
	})
	$('input#img_file_input').on('change', function(evt){
		var reader = new FileReader();
	    reader.onload = function(e){
	    	$('#score_img').attr('src', e.target.result);
	    }	
	    reader.readAsDataURL(evt.target.files[0]);
	})


	// Set up the event handlers for all the buttons
	$("button.kb").on("mousedown", handlePianoKeyPress);
	$("button.kb").on("mouseout", handlePianoKeyRelease);
	$("button.kb").on("mouseup", handlePianoKeyRelease);
}
function updateEditor(){
	eds.score.setValue(JSON.stringify(cur_score));
	eds.schema.setValue(JSON.stringify(cur_schema));
	eds.melody.setValue(cur_score.melody.join('\n'));
	eds.harmony.setValue(cur_score.harmony.join('\n'));
}
function initUI(){
	var n_oct = 3;
	$('#keyboard_panel').html(make_keyboard(n_oct,20,36,28));
	$('input#lowest_pitch').attr("max",109-n_oct*12);
	$('label[for=lowest_pitch]').html("MIDI lowest pitch (21-"+(109-n_oct*12)+"):");
	$('#mode_panel').html(make_modeboard(["maj","min","aug", "dim", "dom7", "maj7"]));
	updateEditor();

}

$( document ).ready( function() {
	
	MIDI.loadPlugin({
		soundfontUrl: "./soundfont/",
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
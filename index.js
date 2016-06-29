var editor = ace.edit('score_editor');
editor.setTheme("ace/theme/terminal");
editor.getSession().setMode("ace/mode/javascript");

var ed1 = ace.edit('score');
ed1.setTheme("ace/theme/clouds");
ed1.getSession().setMode("ace/mode/text");
ed1.getSession().setUseWrapMode(true);

var ed2 = ace.edit('schema');
ed2.setTheme('ace/theme/clouds');
ed2.getSession().setMode("ace/mode/text");
ed2.getSession().setUseWrapMode(true);


var btn_event_list = {
	'parse': function(){
		cur_score = JSON.parse(ed1.getValue())
		cur_score.melody = editor.getValue().split(/\n+/);
		ed1.setValue(JSON.stringify(cur_score));
		seqPlayer.setQ(seqPlayer.parseQ(cur_score));
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
		seqPlayer.toMidi(cur_score);
		seqPlayer.saveMidi();
	},
	'gen': function(){

	},
	'console_eval': function(){
		$('label#console_result').html(eval($('input#console_panel').val()));
	}
}
function registerEvents(){
	for(var i in btn_event_list){
		$('button#'+i).on('click', btn_event_list[i]);
	}
	seqPlayer.onend = function(){
		$('button#play').html('Play');
	}
}

$( document ).ready( function() {
	var n_oct = 3;
	$('#keyboard_panel').html(make_keyboard(n_oct,20,36,28));
	$('input#lowest_pitch').attr("max",109-n_oct*12);
	$('label[for=lowest_pitch]').html("MIDI lowest pitch (21-"+(109-n_oct*12)+"):");
	$('#mode_panel').html(make_modeboard(["maj","min","aug", "dim", "dom7", "maj7"]));
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
		}
	});
	// Set up the event handlers for all the buttons
	$("button.kb").on("mousedown", handlePianoKeyPress);
	$("button.kb").on("mouseout", handlePianoKeyRelease);
	$("button.kb").on("mouseup", handlePianoKeyRelease);

	ed1.setValue(JSON.stringify(score_summer));
	ed2.setValue(JSON.stringify(schema_summer));
	editor.setValue(score_summer.melody.join('\n'));
	registerEvents();
	

});

    // You can also require other files to run in this process
 if(typeof require != 'undefined') require('./renderer.js');
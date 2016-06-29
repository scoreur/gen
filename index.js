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

$( document ).ready( function() {
	var n_oct = 3;
	$('#keyboard_panel').html(make_keyboard(n_oct,20,36,28));
	$('input#lowest_pitch').attr("max",109-n_oct*12);
	$('label[for=lowest_pitch]').html("MIDI lowest pitch (21-"+(109-n_oct*12)+"):");
	$('#mode_panel').html(make_modeboard(["maj","min","aug", "dim", "dom7", "maj7", "dim7", "maj6"]));
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
	$('button#parse_score').on('click',function(){
		cur_score = JSON.parse(ed1.getValue())
		cur_score.measures.mel = editor.getValue();
		ed1.setValue(JSON.stringify(cur_score));
		seqPlayer.setQ(seqPlayer.parseQ(cur_score));
	});
	$('button#play').on('click',function(){
		seqPlayer.play();
	});
	$('button#stop').on('click',function(){
		seqPlayer.pause();
	});
	$('button#save_midi').on('click', function(){
		seqPlayer.toMidi(cur_score);
		seqPlayer.saveMidi();
	})
	$('button#gen').on('click',function(){

	});

	editor.setValue(score_summer.measures.mel);

});


    // You can also require other files to run in this process
 if(typeof require != 'undefined') require('./renderer.js');
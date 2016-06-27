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
			console.log(state, progress);
		},
		onsuccess: function() {

			// At this point the MIDI system is ready to be used
			MIDI.setVolume(0, 127); // Set the general volume level			
			MIDI.programChange(1, 56); // Use the General MIDI 'French horn' number
			MIDI.setVolume(1, 127);
			MIDI.programChange(0, 0);

			// Set up the event handlers for all the buttons

			$("button.kb").on("mousedown", handlePianoKeyPress);
			$("button.kb").on("mouseout", handlePianoKeyRelease);
			$("button.kb").on("mouseup", handlePianoKeyRelease);
		}
	});

	ed1.setValue(JSON.stringify(score_summer));
	ed2.setValue(JSON.stringify(schema_summer));
	$('button#parse_score').on('click',function(){


		
		var q = JSON.parse(ed1.getValue())
		q.measures.mel = editor.getValue();
		ed1.setValue(JSON.stringify(q));
		seqPlayer.setQ(seqPlayer.parseQ(q));
		seqPlayer.play();
	});

	$('button#stop').on('click',function(){
		seqPlayer.stop();
	});
	$('button#gen').on('click',function(){

	});

	editor.setValue(score_summer.measures.mel);

	

});
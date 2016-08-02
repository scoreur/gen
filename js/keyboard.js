
(function(self, wh, bh, bw, ww) {
    var pressed = [];

// JavaScript Document


    function keyshape(type, pos_x) {

        switch (type) {
            case 1:
            case 4:
            case 6:
            case 9:
            case 11://blackkey
                return (pos_x - bw) + ',0 '
                    + (pos_x + bw) + ',0 '
                    + (pos_x + bw) + ',' + (bh) + ' '
                    + (pos_x - bw) + ',' + (bh);
            case 0:
            case 5:
            case 10://whitenormal
                return (pos_x - ww + bw) + ',0 '
                    + (pos_x + ww - bw) + ',0 '
                    + (pos_x + ww - bw) + ',' + (bh) + ' '
                    + (pos_x + ww) + ',' + (bh) + ' '
                    + (pos_x + ww) + ',' + (wh) + ' '
                    + (pos_x - ww) + ',' + (wh) + ' '
                    + (pos_x - ww) + ',' + (bh) + ' '
                    + (pos_x - ww + bw) + ',' + (bh);
                break;

            case 3:
            case 8:
            case -1://whiteleft
                return (pos_x - ww) + ',0 '
                    + (pos_x + ww - bw) + ',0 '
                    + (pos_x + ww - bw) + ',' + (bh) + ' '
                    + (pos_x + ww) + ',' + (bh) + ' '
                    + (pos_x + ww) + ',' + (wh) + ' '
                    + (pos_x - ww) + ',' + (wh);

            case 2:
            case 7://whiteright
                return (pos_x - ww + bw) + ',0 '
                    + (pos_x + ww) + ',0 '
                    + (pos_x + ww) + ',' + (wh) + ' '
                    + (pos_x - ww) + ',' + (wh) + ' '
                    + (pos_x - ww) + ',' + (bh) + ' '
                    + (pos_x - ww + bw) + ',' + (bh);
                break;
            case -2://whitewhole
                return (pos_x - ww) + ',0 '
                    + (pos_x + ww) + ',0 '
                    + (pos_x + ww) + ',' + (wh) + ' '
                    + (pos_x - ww) + ',' + (wh);
                break;
            default:
                return "";
                break;
        }
    }

    var keycolor = Array(12).fill(0).map(function (e, type) {
        switch (type) {
            case 1:
            case 3:
            case 6:
            case 8:
            case 10:
                return 'black';
            default:
                return 'white';
        }
    });


    function make_keyboard() {
        var temp = "";
        for (pos_x = ww, i = 0; i < 88; ++i) {
            if (i == 0)type = -1;
            else if (i == 87)
                type = -2;
            else
                type = i % 12;
            temp += '<polygon class="kb" data-piano-key-number="' + (21 + i) + '" points="' + keyshape(type, pos_x)
                + '" style="fill:' + keycolor[(i + 9) % 12] + ';stroke:gray;stroke-width:1;fill-rule:odd;"></polygon>>';
            pos_x += ww;
            if (type == 2 || type == 7) pos_x += ww;
        }
        return temp;
    }

    function make_modeboard(keys) {
        var res = '<input type="radio" name="musicMode" value="single" checked>Single note<br>\n';
        for (var i in keys) {
            var j = MG.chord_class_label[keys[i]];
            if (j != undefined) {
                res += '<input type="radio" name="musicMode" value="' + (keys[i]) + '">' + (j) + '<br>\n';
            }
        }
        return res;
    }


    var this_pitch, this_amplitude;


    function pressing() {
        var mode = $(":radio[name=musicMode]:checked").val();
        pressed = mode == "single" ? [0] : MG.chord_class[mode];

        pressed.forEach(function (el) {
            if (this_pitch + el > 108) return;
            MIDI.noteOn(0, this_pitch + el, this_amplitude);
            var tgt = $('.kb[data-piano-key-number=' + (this_pitch + el) + ']');
            var color = "#444";
            if (keycolor[(this_pitch + el) % 12] == 'white') {
                color = "#DDD";
            }
            tgt.css("fill", color);
        });
    }

    function handlePianoKeyPress(evt) {


        this_pitch = parseInt($(evt.target).data("piano-key-number"));

        // Extract the amplitude value from the slider
        this_amplitude = parseInt($("#amplitude").val());

        // Use the two numbers to start a MIDI note
        // Handle chord mode
        pressing();
    };


    function handlePianoKeyRelease(evt) {
        if (pressed.length == 0) return;
        // Show a simple message in the console
        if (evt != null) console.log("Key release event!");
        // Send the note off message to match the pitch of the current note on event
        pressed.forEach(function (el) {
            if (this_pitch + el > 108) return;
            MIDI.noteOff(0, this_pitch + el);
            $('.kb[data-piano-key-number=' + (this_pitch + el) + ']').css("fill", keycolor[(this_pitch + el) % 12]);

        });
        pressed = [];
    };
    self.handlePianoKeyRelease = handlePianoKeyRelease;
    self.handlePianoKeyPress = handlePianoKeyPress;
    self.make_keyboard = make_keyboard;
    self.make_modeboard = make_modeboard;
})(this, 130, 70, 6, 9);


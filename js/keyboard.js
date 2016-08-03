
(function(self, wh, bh, bw, ww) {


    var oct = 5, offset = 0;
    var pitches = {};
    var keymap = (function(){
        var ret = {};
        'awsedfujikol;'.split('').forEach(function(e,i){
            ret[e] = i;
        });
        return ret;
    })();
    var keydown = function(evt){
        switch(evt.key){
            default:
                var pitch = keymap[evt.key];
                if(pitch == null) break;
                if(pitch - offset < 0) pitch += 12;
                if(pitch - offset > 12) pitch -= 12
                pitch += oct * 12;
                pitches[evt.key] = pitch;
                pressing(pitch);
        }
    };
    function keyup(evt){
        switch(evt.key){
            case 'q':
                if(oct * 12 + offset >= 33)
                    oct--;
                break;
            case 'p':
                if(oct * 12 + offset <= 84)
                  oct++;
                break;
            case 'g':
                if(oct * 12 + offset < 95)
                    offset += 2;
                if(offset > 6){
                    offset -= 12;
                    oct++;
                }
                break;
            case 'v':
                if(oct * 12 + offset < 96)
                    offset++;
                if(offset > 6){
                    offset -= 12;
                    oct++;
                }
                break;
            case 'h':
                if(oct * 12 + offset > 22)
                    offset -= 2;
                if(offset < -6){
                    offset += 12;
                    oct--;
                }
                break;
            case 'n':
                if(oct * 12 + offset > 21)
                    offset --;
                if(offset < -6){
                    offset += 12;
                    oct--;
                }
                break;
            default:
                var pitch = pitches[evt.key];
                if(pitch == null) break;
                release(pitch);
                delete pitches[evt.key];
        }
    }

    var pressed = {};
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
        var pos_x = ww;
        for (var i = 0; i < 88; ++i) {
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


    var this_amplitude = 110;


    function pressing(pitch) {
        if(typeof pressed[pitch] != 'undefined'){
            return;
        }
        var mode = $(":radio[name=musicMode]:checked").val();
        pressed[pitch] = mode == "single" ? [0] : MG.chord_class[mode];
        this_amplitude = parseInt($("#amplitude").val());

        pressed[pitch].forEach(function (el) {
            if (pitch + el > 108) return;
            MIDI.noteOn(0, pitch + el, this_amplitude);
            var tgt = $('.kb[data-piano-key-number=' + (pitch + el) + ']');
            var color = "#444";
            if (keycolor[(pitch + el) % 12] == 'white') {
                color = "#DDD";
            }
            tgt.css("fill", color);
        });
    }

    function release(pitch) {
        if (typeof pressed[pitch] == 'undefined') return;
        // Show a simple message in the console
        // Send the note off message to match the pitch of the current note on event
        pressed[pitch].slice().forEach(function (el) {
            if (pitch + el > 108) return;
            MIDI.noteOff(0, pitch + el);
            $('.kb[data-piano-key-number=' + (pitch + el) + ']').css("fill", keycolor[(pitch + el) % 12]);

        });
        delete pressed[pitch];
    };

    self.handlePianoKeyRelease = function(evt){
        release(parseInt($(evt.target).data("piano-key-number")));
    };
    self.handlePianoKeyPress = function handlePianoKeyPress(evt) {
        var pitch = parseInt($(evt.target).data("piano-key-number"));
        pressing(pitch);
    };
    self.make_keyboard = make_keyboard;
    self.make_modeboard = make_modeboard;
    self.keyHandlers = [keydown, keyup];

})(this, 130, 70, 6, 9);


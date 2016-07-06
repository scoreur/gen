
var keyrange = 23;
var pressed = [];


function make_keyboard(n_octaves, x0, ww, bw){
    var black_key_offset = [0,1,3,4,5];
    var res = '';
    for(var i=0;i<n_octaves;++i){
        for(j=0;j<7;++j){
            res += '<button type="button" class="white_key kb" data-piano-key-number="'+(12*i+white_key_num[j])+'" style="left:';
            res += (x0+(i*7+j)*ww) +'px"></button>';

        }
        for(var j=0;j<5;++j){
            res += '<button type="button" class="black_key kb" data-piano-key-number="'+(12*i+black_key_num[j])+'" style="left:';
            res += (x0+(i*7+black_key_offset[j])*ww+ww-bw/2) +'px"></button>';

        }

    }
    keyrange = n_octaves*12-1;
    return res;


}

function make_modeboard(keys){
    var res = '<input type="radio" name="musicMode" value="single" checked>Single note<br>\n';
    for(var i in keys){
        var j = chord_name[keys[i]];
        if(j != undefined){
            res += '<input type="radio" name="musicMode" value="' + (keys[i]) + '">'+ (j) + '<br>\n';
        }
    }
    return res;
}


var this_pitch, this_key, this_amplitude;
var lowest_pitch=60; // The MIDI pitch number for the first (left) keyboard key



function pressing(){
    var mode = $(":radio[name=musicMode]:checked").val();
    pressed = mode == "single"? [0]: chord_num[mode];

    pressed.forEach(function(el){
        if(this_pitch+el>108) return;
        MIDI.noteOn(0, this_pitch+el, this_amplitude);
        var tgt = $('button[data-piano-key-number='+(this_key+el)+']');
        tgt.css("background", tgt.hasClass("white_key")? "#DDD": "#444");
    });
}

function handlePianoKeyPress(evt) {

    lowest_pitch = parseInt($("input#lowest_pitch").val());
    if(lowest_pitch< 21){
        lowest_pitch = 21;
        $("input#lowest_pitch").val(21);
    }
    if(lowest_pitch+keyrange>108){
        lowest_pitch = 108-keyrange;
        $("input#lowest_pitch").val(108-keyrange)
    }

    // Determine which piano key has been pressed.
    // 'evt.target' tells us exactly which item triggered this function.
    // The piano key number is taken from the 'data-piano-key-number' attribute of each button.
    // The piano key number is a value in the range 0 to keyrange inclusive.
    this_key = parseInt($(evt.target).data("piano-key-number"));
    this_pitch = lowest_pitch + this_key;

    // Extract the amplitude value from the slider
    this_amplitude = parseInt($("#amplitude").val());

    // Use the two numbers to start a MIDI note
    // Handle chord mode
    pressing();
};



function handlePianoKeyRelease(evt) {
    if(pressed.length == 0) return;
    // Show a simple message in the console
    if(evt!=null) console.log("Key release event!");
    // Send the note off message to match the pitch of the current note on event
    pressed.forEach(function(el){
        if(this_pitch+el>108) return;
        MIDI.noteOff(0, this_pitch+el);
        var tgt = $('button[data-piano-key-number='+(this_key+el)+']');
        tgt.css("background", tgt.hasClass("white_key")? "white": "black");
    });
    pressed = [];
};


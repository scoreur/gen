var instrs = {
		'Piano': ['1 Acoustic Grand Piano', '2 Bright Acoustic Piano', '3 Electric Grand Piano', '4 Honky-tonk Piano', '5 Electric Piano 1', '6 Electric Piano 2', '7 Harpsichord', '8 Clavinet'],
		'Chromatic Percussion': ['9 Celesta', '10 Glockenspiel', '11 Music Box', '12 Vibraphone', '13 Marimba', '14 Xylophone', '15 Tubular Bells', '16 Dulcimer'],
		'Organ': ['17 Drawbar Organ', '18 Percussive Organ', '19 Rock Organ', '20 Church Organ', '21 Reed Organ', '22 Accordion', '23 Harmonica', '24 Tango Accordion'],
		'Guitar': ['25 Acoustic Guitar (nylon)', '26 Acoustic Guitar (steel)', '27 Electric Guitar (jazz)', '28 Electric Guitar (clean)', '29 Electric Guitar (muted)', '30 Overdriven Guitar', '31 Distortion Guitar', '32 Guitar Harmonics'],
		'Bass': ['33 Acoustic Bass', '34 Electric Bass (finger)', '35 Electric Bass (pick)', '36 Fretless Bass', '37 Slap Bass 1', '38 Slap Bass 2', '39 Synth Bass 1', '40 Synth Bass 2'],
		'Strings': ['41 Violin', '42 Viola', '43 Cello', '44 Contrabass', '45 Tremolo Strings', '46 Pizzicato Strings', '47 Orchestral Harp', '48 Timpani'],
		'Ensemble': ['49 String Ensemble 1', '50 String Ensemble 2', '51 Synth Strings 1', '52 Synth Strings 2', '53 Choir Aahs', '54 Voice Oohs', '55 Synth Choir', '56 Orchestra Hit'],
		'Brass': ['57 Trumpet', '58 Trombone', '59 Tuba', '60 Muted Trumpet', '61 French Horn', '62 Brass Section', '63 Synth Brass 1', '64 Synth Brass 2'],
		'Reed': ['65 Soprano Sax', '66 Alto Sax', '67 Tenor Sax', '68 Baritone Sax', '69 Oboe', '70 English Horn', '71 Bassoon', '72 Clarinet'],
		'Pipe': ['73 Piccolo', '74 Flute', '75 Recorder', '76 Pan Flute', '77 Blown Bottle', '78 Shakuhachi', '79 Whistle', '80 Ocarina'],
		'Synth Lead': ['81 Lead 1 (square)', '82 Lead 2 (sawtooth)', '83 Lead 3 (calliope)', '84 Lead 4 (chiff)', '85 Lead 5 (charang)', '86 Lead 6 (voice)', '87 Lead 7 (fifths)', '88 Lead 8 (bass + lead)'],
		'Synth Pad': ['89 Pad 1 (new age)', '90 Pad 2 (warm)', '91 Pad 3 (polysynth)', '92 Pad 4 (choir)', '93 Pad 5 (bowed)', '94 Pad 6 (metallic)', '95 Pad 7 (halo)', '96 Pad 8 (sweep)'],
		'Synth Effects': ['97 FX 1 (rain)', '98 FX 2 (soundtrack)', '99 FX 3 (crystal)', '100 FX 4 (atmosphere)', '101 FX 5 (brightness)', '102 FX 6 (goblins)', '103 FX 7 (echoes)', '104 FX 8 (sci-fi)'],
		'Ethnic': ['105 Sitar', '106 Banjo', '107 Shamisen', '108 Koto', '109 Kalimba', '110 Bagpipe', '111 Fiddle', '112 Shanai'],
		'Percussive': ['113 Tinkle Bell', '114 Agogo', '115 Steel Drums', '116 Woodblock', '117 Taiko Drum', '118 Melodic Tom', '119 Synth Drum'],
		'Sound effects': ['120 Reverse Cymbal', '121 Guitar Fret Noise', '122 Breath Noise', '123 Seashore', '124 Bird Tweet', '125 Telephone Ring', '126 Helicopter', '127 Applause', '128 Gunshot']
	};


var white_key_num = [0,2,4,5,7,9,11];
var black_key_num = [1,3,6,8,10];
var chord_num = {
	"maj":[0,4,7],
	"min":[0,3,7],
	"dim":[0,3,6],
	"aug":[0,4,8],
	"dom7":[0,4,7,10],
	"maj7":[0,4,7,11],
	"min7":[0,3,7,10],
	"aug7":[0,4,8,10],
	"dim7":[0,3,6,9],
}

var chords_inv = (function(){
	function inverted(arr,n){
		var n = typeof n=='undefined'? 1: n%arr.length;
		if(n<0){
			n += arr.length;
		}
		var ret = new Array(arr.length);
		for(var i=0;i<arr.length;++i){
			ret[i] = (arr[(n+i)%arr.length]-arr[n]+12) % 12;
		}
	    return ret;
    }
    var res = {};
    for(var c in chord_num){
    	var ci = c+'';
    	for(var i=0;i<chord_num[c].length;++i){
    		res[ci] = inverted(chord_num[c],i);
    		ci += 'i';
    	}
    }
    res.inv = inverted;
    // alias

    return res;
})();


var scales = (function(){
	var kn = 'CDEFGAB'.split('');
	var res = {0:{},1:{},'maj':{},'min':{}};
	for(var i=0;i<white_key_num.length;++i){
		res[0][kn[i]] = res['maj'][white_key_num[i]] = i+1;
		res[1][kn[i]] = res['min'][white_key_num[i]] = (i+2)%7 + 1;
	}
	return res;
})();

var chord_name = {
	"maj":"Major triad",
	"min":"Minor triad",
	"aug":"Augmented triad",
	"dim":"Diminished triad",
	"dom7":"Dominant seventh chord",
	"maj7":"Major seventh chord",
	"min7":"Minor seventh chord",
	"aug7":"Augmented seventh chord",
	"dim7":"Diminished seventh chord",
}

var score_summer = {
	tempo: 120,
	time_sig: [4,4],
	key_sig: 'C',
	ctrl_per_beat: 2,
	incomplete_measure: true,
	melody: ':+ 3,2 1,2/3,8,^/3,2 2 1 2 3 1,2/:- 6,4 3,4,^/3,4 :+ 3,2 1,2/2 2,7,^/2,2 1 6,1,- 1 6,1,- 1,2/:- 7,8,^/7,4 0 :+ 3,2 1/3 3,2 3,5,^/3,2 2 1 2 3 1,2/:- 6,4 3,4,^/3,6 3,2/5,2 3 5 6,2 :+ 1,2/3 2,3 1,4/:- 6,8,^/6,4 :+ 3,2 1,2'.split('/'),
	harmony: "E7,4/Amin,8/Bb7,8/Amin,4 E7,4/Amin,4 A7,4/Dmin,8/F7,8/F#min7,4 B7,4/E7,8/Am,8/Bb7,8/Am,8/D7,8/C,4 Am,4/D7,4 E7,4/Am,4 D7,4/Bm7,4 E7,4".split('/'),
	texture: ":-012 012,4/:-00-21+ 01,2 2,2 3,2 2,2/:iii-00-21+ 01,2 2,2 3,2 2,2/:-012 012,4 :-012 012,4/:-012 012,4 :-012 012,4/:-00-21+ 01,2 2,2 3,2 2,2/:-00-21+ 01,2 2,2 3,2 2,2/:-012 012,4 012,4/:-00-21+ 01,2 2,2 3,2 2,2/:-012 012,4 012,4/:-012 012,4 012,4/:-012 012,4 012,4/:-012 012,4 012,4/:-012 012,4 :-012 012,4/:-012 012,4 :-012 012,4/:-012 012,4 :-012 012,4/:-012 012,4 :-012 012,4".split('/')
}

var gen_modes = ['random', 'transpose', 'chord'];

var sample_mode = {
	mode:'random',
	options:{
		rhythm:[4,
		    '1 1 1 1/2 1 1/1 1 2/1 2 1/1 3/3 1/2 2/4'.split('/').map(function(e){return e.split(/\s+/).map(function(e2){return parseInt(e2);});}),
		    [2,3,3,2,1,1,2,1]
		],
		interval:{
			chromatic:false,
			weights: [1,1,2,2,1,0,1,  1,2,3,2,2,1,0,1],
			choices: (function(){
				return Array(15).fill().map(function(e,i){return i-7;});
			})()

		}
	}
}




var schema_summer = {
	ctrl_per_beat: 2,
	time_sig: [4,4],
	key_sig: 'C',
	blocks: (function(a,b){
		var res = {};
		a.split('').forEach(function(e,i){res[e] = b[i];});
		return res;
	})('cABC',[4,32,32,28]),
	structure:"c/A/B/A/C/c".split('/'),
	scale:'min',
	funcs:{
		'A':"1,8/4,8/1,4 2,4/1,8".split('/'),
		'B':"4,8/6,8/2,4 5,4/5,8".split('/'),
		'C':"3,4 1,4/2,4 5,4/1,4 2,4/2,4".split('/'),
		'c':"5,4"
	},
	melody:{
		'c': sample_mode,
		'A':{
			mode:'random',
			options:{}
		},
		'B':{
			mode:'transpose',
			options:{}
		},
		'C':{
			mode:'chord',
			options:{}
		}
	},
	harmony:{
		'A':"",
		'B':"",
		'C':"",
		'c':""
	}
}
schema_summer.melody.A = schema_summer.melody.B = schema_summer.melody.C = sample_mode;
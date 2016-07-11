// Generated by CoffeeScript 1.10.0
(function() {
  var MG, ref1,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  MG = (ref1 = this.MG) != null ? ref1 : {};

  MG.instrs = {
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

  this.chord_num = MG.chord_class = {
    "maj": [0, 4, 7],
    "min": [0, 3, 7],
    "dim": [0, 3, 6],
    "aug": [0, 4, 8],
    "dom7": [0, 4, 7, 10],
    "maj7": [0, 4, 7, 11],
    "min7": [0, 3, 7, 10],
    "aug7": [0, 4, 8, 10],
    "dim7": [0, 3, 6, 9]
  };

  MG.inverted = function(arr, n) {
    var i, j, ref2, ret;
    n = typeof n === 'undefined' ? 1 : n % arr.length;
    if (n < 0) {
      n += arr.length;
    }
    ret = new Array(arr.length);
    for (i = j = 0, ref2 = arr.length; j < ref2; i = j += 1) {
      ret[i] = modulo(arr[(n + i) % arr.length] - arr[n], 12);
    }
    return ret;
  };

  this.chords_inv = MG.chords = (function() {
    var c, ci, i, j, ref2, ref3, res, v;
    res = {};
    ref2 = MG.chord_class;
    for (c in ref2) {
      v = ref2[c];
      ci = c + '';
      for (i = j = 0, ref3 = v.length; j < ref3; i = j += 1) {
        res[ci] = MG.inverted(v, i);
        ci += 'i';
      }
    }
    res.inv = MG.inverted;
    return res;
  })();

  MG.interval_class = {
    'u1': 0,
    'm2': 1,
    'M2': 2,
    'm3': 3,
    'M3': 4,
    'p4': 5,
    'a4': 6,
    'd5': 6,
    'p5': 7,
    'm6': 8,
    'M6': 9,
    'm7': 10,
    'M7': 11,
    'o8': 12
  };

  MG.key_class = (function() {
    var kn1, kn2, res;
    kn1 = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    kn2 = ['B#', 'C#', 'D', 'D#', 'Fb', 'E#', 'F#', 'G', 'G#', 'A', 'A#', 'Cb'];
    res = {};
    kn1.forEach(function(e, i) {
      res[e] = i;
    });
    kn2.forEach(function(e, i) {
      res[e] = i;
    });
    return res;
  })();

  MG.scale_class = {
    'maj': [0, 2, 4, 5, 7, 9, 11],
    'min': [0, 2, 3, 5, 7, 8, 10],
    'min_harmonic': [0, 2, 3, 5, 7, 8, 11],
    'min_melodic': [0, 2, 3, 5, 7, 9, 11],
    'pent': [0, 2, 4, 7, 9],
    'pent_min': [0, 3, 5, 7, 10],
    'blues': [0, 3, 5, 6, 7, 10]
  };

  this.white_key_num = [0, 2, 4, 5, 7, 9, 11];

  this.black_key_num = [1, 3, 6, 8, 10];

  MG.scaleToPitch = function(mode, tonic) {
    var ref, ref2, ref3, scale;
    scale = (ref2 = MG.scale_class[mode]) != null ? ref2 : MG.scale_class['maj'];
    ref = (ref3 = MG.key_class[tonic]) != null ? ref3 : 0;
    return function(num) {
      return ref + (Math.floor(num / scale.length)) * 12 + scale[modulo(num, scale.length)] + 12;
    };
  };

  MG.pitchToScale = function(mode, tonic) {
    var ref, ref2, ref3, scale;
    scale = (ref2 = MG.scale_class[mode]) != null ? ref2 : MG.scale_class['maj'];
    ref = (ref3 = MG.key_class[tonic]) != null ? ref3 : 0;
    return function(pitch) {
      var i, j, oct, ref4;
      pitch -= ref;
      oct = Math.floor(pitch / 12) - 1;
      pitch = modulo(pitch, 12);
      for (i = j = ref4 = scale.length - 1; j >= 0; i = j += -1) {
        if (pitch >= scale[i]) {
          return i + oct * scale.length;
        }
      }
      return oct * scale.length;
    };
  };

  MG.keyToPitch = function(key) {
    var key_class, oct, ref, ref2, ref3;
    key_class = /[CDEFGAB][#b]{0,2}/.exec(key)[0];
    if (key_class == null) {
      key_class = 'C';
    }
    ref = (ref2 = MG.key_class[key_class]) != null ? ref2 : 0;
    oct = /[0-9]/.exec(key)[0];
    oct = (ref3 = parseInt(oct)) != null ? ref3 : 4;
    return 12 + ref + oct * 12;
  };

  MG.pitchToKey = function(pitch, sharp) {
    var kn, oct, ref;
    if (pitch < 21 || pitch > 108) {
      return void 0;
    }
    kn = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    if (sharp === true) {
      kn = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }
    oct = Math.floor(pitch / 12) - 1;
    ref = pitch % 12;
    return [kn[ref], oct];
  };

  this.chord_name = MG.chord_class_label = {
    "maj": "Major triad",
    "min": "Minor triad",
    "aug": "Augmented triad",
    "dim": "Diminished triad",
    "dom7": "Dominant seventh chord",
    "maj7": "Major seventh chord",
    "min7": "Minor seventh chord",
    "aug7": "Augmented seventh chord",
    "dim7": "Diminished seventh chord"
  };

  this.MG = MG;

  this.score_summer = {
    tempo: 120,
    time_sig: [4, 4],
    key_sig: 'C',
    scale: 'maj',
    ctrl_per_beat: 2,
    incomplete_measure: true,
    melody: ':+ 3,2 1,2/3^,8/3,2 2 1 2 3 1,2/:- 6,4 3^,4/3,4 :+ 3,2 1,2/2 2^,7/2,2 1 6-,1 1 6-,1 1,2/:- 7^,8/7,4 0 :+ 3,2 1/3 3,2 3^,1 3^,4/3,2 2 1 2 3 1,2/:- 6,4 3^,4/3,6 3,2/5,2 3 5 6,2 :+ 1,2/3 2,3 1,4/:- 6^,8/6,4 :+ 3,2 1,2'.split('/'),
    harmony: "E7,4/Amin,8/Bb7,8/Amin,4 E7,4/Amin,4 A7,4/Dmin,8/F7,8/F#min7,4 B7,4/E7,8/Am,8/Bb7,8/Am,8/D7,8/C,4 Am,4/D7,4 E7,4/Am,4 D7,4/Bm7,4 E7,4".split('/'),
    texture: ":-012 012,4/:-00-21+ 01,2 2,2 3,2 2,2/:iii-00-21+ 01,2 2,2 3,2 2,2/:-012 012,4 :-012 012,4/:-012 012,4 :-012 012,4/:-00-21+ 01,2 2,2 3,2 2,2/:-00-21+ 01,2 2,2 3,2 2,2/:-012 012,4 012,4/:-00-21+ 01,2 2,2 3,2 2,2/:-012 012,4 012,4/:-012 012,4 012,4/:-012 012,4 012,4/:-012 012,4 012,4/:-012 012,4 :-012 012,4/:-012 012,4 :-012 012,4/:-012 012,4 :-012 012,4/:-012 012,4 :-012 012,4".split('/')
  };

  this.gen_modes = ['random', 'transpose', 'chord'];

  this.sample_rand_mode = {
    mode: 'random',
    options: {
      rhythm: [
        4, '1 1 1 1/2 1 1/1 1 2/1 2 1/1 3/3 1/2 2/4'.split('/').map(function(e) {
          return e.split(/\s+/).map(function(e2) {
            return parseInt(e2);
          });
        }), [2, 3, 3, 5, 1, 3, 2, 1]
      ],
      interval: {
        chromatic: false,
        weights: [1, 1, 2, 5, 12, 6, 8, 4, 7, 12, 8, 3, 1, 0, 1],
        choices: (function() {
          return Array(15).fill().map(function(e, i) {
            return i - 7;
          });
        })()
      }
    }
  };

  this.sample_transpose_mode = {
    mode: 'transpose',
    options: {
      src: "A",
      offset: 0,
      interval: 7
    }
  };

  this.sample_chord_mode = {
    mode: 'chord',
    options: {
      chords: "C,4 Am,4/D7,4 E7,4/Am,4 D7,4/Bm7,4".split('/'),
      rhythm: [
        4, '1 1 1 1/2 1 1/1 1 2/1 2 1/1 3/3 1/2 2/4'.split('/').map(function(e) {
          return e.split(/\s+/).map(function(e2) {
            return parseInt(e2);
          });
        }), [2, 3, 3, 5, 1, 3, 2, 1]
      ],
      interval: {
        chromatic: false,
        weights: [1, 1, 2, 5, 12, 6, 8, 4, 7, 12, 8, 3, 1, 0, 1],
        choices: (function() {
          return Array(15).fill().map(function(e, i) {
            return i - 7;
          });
        })()
      }
    }
  };

  this.schema_summer = {
    ctrl_per_beat: 2,
    time_sig: [4, 4],
    key_sig: 'C',
    scale: 'maj',
    blocks: (function(a, b) {
      var res;
      res = {};
      a.split('').forEach(function(e, i) {
        return res[e] = b[i];
      });
      return res;
    })('cABC', [4, 32, 32, 28]),
    structure: "c/A/B/A/C/c".split('/'),
    scale: 'maj',
    funcs: {
      'A': "1,8/4,8/1,4 2,4/1,8".split('/'),
      'B': "4,8/6,8/2,4 5,4/5,8".split('/'),
      'C': "3,4 1,4/2,4 5,4/1,4 2,4/2,4".split('/'),
      'c': "5,4"
    },
    melody: {
      'c': sample_rand_mode,
      'A': {
        mode: 'random',
        options: {}
      },
      'B': {
        mode: 'transpose',
        options: {}
      },
      'C': {
        mode: 'chord',
        options: {}
      }
    },
    harmony: {
      'A': "Amin,8/Bb7,8/Amin,4 E7,4/Amin,4 A7,4".split('/'),
      'B': "Dmin,8/F7,8/F#min7,4 B7,4/E7,8".split('/'),
      'C': "C,4 Am,4/D7,4 E7,4/Am,4 D7,4/Bm7,4".split('/'),
      'c': ""
    }
  };

  this.schema_summer.melody.A = this.sample_rand_mode;

  this.schema_summer.melody.B = this.sample_transpose_mode;

  this.schema_summer.melody.C = this.sample_chord_mode;

}).call(this);

//# sourceMappingURL=musical.js.map
;// Generated by CoffeeScript 1.10.0
(function() {
  var MG, ref,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  MG = (ref = this.MG) != null ? ref : {};

  this.Generator = (function() {
    function Generator(schema) {
      var ref1;
      this.schema = schema;
      this.keyref = MIDI.keyToNote[this.schema.key_sig + '4'];
      this.scale = (ref1 = this.schema.scale) != null ? ref1 : 'maj';
      this.pitchSimple = MG.scaleToPitch(this.scale, this.schema.key_sig);
      this.res = {};
    }

    Generator.prototype.generate = function() {
      var dur, i, mode, ref1;
      ref1 = this.schema.blocks;
      for (i in ref1) {
        dur = ref1[i];
        mode = this.schema.melody[i];
        switch (mode.mode) {
          case 'random':
            this.res[i] = this.gen_random(dur, mode.options);
            break;
          case 'transpose':
            this.res[i] = this.gen_transpose(dur, mode.options);
            break;
          case 'chord':
            this.res[i] = this.gen_chord(dur, mode.options);
        }
      }
      return this.res;
    };

    Generator.prototype.toScoreObj = function() {
      var b, delta, dur, e0, obj, pitch, ref1, res, ret, sec, tmp;
      if (res === {}) {
        this.generate();
      }
      sec = this.schema.ctrl_per_beat * this.schema.time_sig[0];
      res = {};
      console.log('to Score obj');
      ref1 = this.res;
      for (e0 in ref1) {
        b = ref1[e0];
        dur = _.flatten(b.dur);
        pitch = _.flatten(b.pitch);
        ret = [];
        tmp = [];
        delta = 0;
        dur.forEach(function(e, j) {
          while (delta + e > sec) {
            tmp.push([sec - delta, pitch[j], true]);
            ret.push(tmp);
            tmp = [];
            e -= sec - delta;
            delta = 0;
          }
          tmp.push([e, pitch[j]]);
          delta += e;
          if (delta === sec) {
            ret.push(tmp);
            tmp = [];
            return delta = 0;
          }
        });
        if (tmp.length > 0) {
          ret.push(tmp);
        }
        res[e0] = ret;
      }
      res = this.schema.structure.map(function(e) {
        return res[e];
      });
      obj = new ScoreObj({
        ctrl_per_beat: this.schema.ctrl_per_beat
      });
      obj.melody = _.flatten(res, true);
      return obj;
    };

    Generator.prototype.rndPicker = function(choices, weights) {
      var i, k, p, ref1, s;
      s = weights.reduce((function(a, b) {
        return a + b;
      }), 0);
      p = weights.map(function(e) {
        return e / s;
      });
      s = 0;
      for (i = k = 0, ref1 = p.length; k < ref1; i = k += 1) {
        s = (p[i] += s);
      }
      return {
        gen: function() {
          var l, r, ref2;
          r = Math.random();
          for (i = l = 0, ref2 = p.length; l < ref2; i = l += 1) {
            if (r < p[i]) {
              return choices[i];
            }
          }
          return choices[p.length - 1];
        }
      };
    };

    Generator.prototype.gen_random_new = function(end_pos, states, start, constraint) {
      var cur, merge, nexts, picker, res, val;
      res = [];
      cur = {
        state: start.state,
        pos: {
          start: start.pos,
          val: start.val
        }
      };
      while (cur.pos < end_pos) {
        nexts = states[cur.state].choices.map(function(func) {
          var val, weight;
          val = func(cur.pos, cur.val);
          weight = constraint(cur.pos, cur.val, val);
          return [val, weight];
        });
        merge = _.unzip(nexts);
        picker = this.rndPicker(merge[0], merge[1]);
        val = picker.gen();
        if (cur.pos + val.dur >= end_pos) {
          val.dur = end_pos - cur.pos;
        }
        cur.state = states.transition(cur.pos, val);
        cur.pos += val.dur;
        cur.val = val;
        res.push(val);
      }
      return res;
      return {
        sample_start: {
          state: 'start',
          pos: 0,
          val: {
            dur: 2,
            val: 60,
            weight: []
          }
        },
        sample_states: {
          transition: function(pos, val) {},
          'start': {
            choices: function(pos, val) {}
          },
          'middle': {
            choices: function(pos, val) {}
          },
          'other': {
            choices: function(pos, val) {}
          }
        },
        sample_constraint: function(pos, preval, val) {
          var weights;
          weights = [4, 2, 4, 6, 6, 8, 1, 8, 6, 6, 2, 2];
          return weights[modulo(val.val - preval.val, 12)];
        }
      };
    };

    return Generator;

  })();

}).call(this);

//# sourceMappingURL=Generator.js.map
;// Generated by CoffeeScript 1.10.0
(function() {
  var MG, ref1,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  MG = (ref1 = this.MG) != null ? ref1 : {};

  this.ScoreObj = (function() {
    function ScoreObj(options) {
      if (options == null) {
        options = {};
      }
      this.tempo = options.tempo, this.time_sig = options.time_sig, this.key_sig = options.key_sig, this.ctrl_per_beat = options.ctrl_per_beat, this.scale = options.scale;
      if (this.tempo == null) {
        this.tempo = 120;
      }
      if (this.time_sig == null) {
        this.time_sig = [4, 4];
      }
      if (this.key_sig == null) {
        this.key_sig = 'C';
      }
      if (this.ctrl_per_beat == null) {
        this.ctrl_per_beat = 4;
      }
      this.init_ref = MG.key_class[this.key_sig] + 60;
      this.init_ctrlTicks = (60000.0 / this.tempo / this.ctrl_per_beat) >>> 0;
      if (this.scale == null) {
        this.scale = 'maj';
      }
      this.options = options;
      this.parse(options);
    }

    ScoreObj.prototype.parse = function(options) {
      if (options == null) {
        options = this.options;
      }
      this.measures = _.zip(options.melody, options.harmony, options.texture);
      this.melody = options.melody ? this.parseMelody(options.melody) : null;
      this.harmony = options.harmony ? this.parseHarmony(options.harmony) : null;
      return this.texture = options.texture ? this.parseTexture(options.texture) : null;
    };

    ScoreObj.prototype.parseMelody = function(m) {
      var ref, res, scale;
      if (m == null) {
        m = this.options.melody;
      }
      scale = MG.scale_class[this.scale];
      ref = this.init_ref;
      res = m.map((function(_this) {
        return function(e) {
          var measure, notes;
          notes = e.trim().split(/\s+/);
          measure = [];
          notes.forEach(function(e2) {
            var dur, pitches, ref2, terms, tied;
            if (e2[0] === ':') {
              switch (e2[1]) {
                case '+':
                  ref += 12;
                  break;
                case '-':
                  ref -= 12;
                  break;
                default:
                  ref = _this.init_ref;
              }
            } else {
              tied = false;
              terms = e2.split(',');
              pitches = [];
              Array.prototype.forEach.call(terms[0], function(e3) {
                switch (e3) {
                  case '0':
                    return pitches.push(0);
                  case '1':
                  case '2':
                  case '3':
                  case '4':
                  case '5':
                  case '6':
                  case '7':
                    return pitches.push(ref + scale[e3 - '1']);
                  case '+':
                  case '-':
                  case '#':
                  case 'b':
                    return pitches[pitches.length - 1] += {
                      '+': 12,
                      '-': -12,
                      '#': 1,
                      'b': -1
                    }[e3];
                  case '^':
                    return tied = true;
                  default:
                    return console.log('skip invalid flag ' + e3);
                }
              });
              dur = terms.length >= 2 ? (ref2 = parseInt(terms[1])) != null ? ref2 : 1 : 1;
              if (tied) {
                measure.push([dur, pitches, true]);
              } else {
                measure.push([dur, pitches]);
              }
            }
          });
          return measure;
        };
      })(this));
      return res;
    };

    ScoreObj.prototype.parseHarmony = function(measures, ctrlTicks) {
      var alias, ex, res;
      if (measures == null) {
        measures = this.options.harmony;
      }
      ex = /[ABCDEFG][b#]?/;
      alias = {
        '7': 'dom7',
        '': 'maj',
        'M': 'maj',
        'm': 'min',
        'mi': 'min',
        'm7': 'min7'
      };
      res = measures.map(function(e) {
        var chords, measure, octave;
        measure = [];
        chords = e.trim().split(/\s+/);
        octave = 3;
        chords.forEach((function(_this) {
          return function(e2) {
            var chord_pitches, dur, name, ref2, root, root_pitch, terms;
            terms = e2.split(',');
            root = ex.exec(terms[0])[0];
            root_pitch = MG.keyToPitch(root + octave);
            name = terms[0].substr(ex.lastIndex + root.length);
            name = (ref2 = alias[name]) != null ? ref2 : name;
            chord_pitches = MG.chords[name] || MG.chords['maj'];
            dur = terms.length >= 2 ? parseInt(terms[1]) : 1;
            return measure.push([dur, root_pitch, chord_pitches]);
          };
        })(this));
        return measure;
      });
      return res;
    };

    ScoreObj.prototype.parseTexture = function(measures) {
      var c, delta, refc, refi, res;
      if (measures == null) {
        measures = this.options.texture;
      }
      c = _.flatten(this.harmony, true);
      delta = 0;
      refc = [];
      refi = -1;
      res = measures.map(function(e) {
        var arrange, measure;
        measure = [];
        arrange = e.trim().split(/\s+/);
        arrange.forEach(function(e2) {
          var bass, chord, dur, e3, inv, j, k, n, ref2, ref3, ref4, ref5, refk, results, s, terms, tied, tmp;
          if (e2[0] === ':') {
            refk = MG.keyToPitch('C3');
            while (refi < c.length && delta >= 0) {
              delta -= c[++refi][0];
            }
            inv = /:i*/.exec(e2)[0].length - 1;
            bass = (c[refi][1] + c[refi][2][inv]) % 12;
            chord = MG.inverted(c[refi][2], inv);
            inv += 1;
            while ((ref2 = e2[inv]) === '+' || ref2 === '-') {
              refk += {
                '+': 12,
                '-': -12
              }[e2[inv++]];
            }
            bass += refk;
            refc = [];
            results = [];
            for (j = k = ref3 = inv, ref4 = e2.length; k < ref4; j = k += 1) {
              switch (s = e2[j]) {
                case '0':
                case '1':
                case '2':
                case '3':
                  results.push(refc.push(bass + chord[parseInt(s)]));
                  break;
                case '+':
                case '-':
                case '#':
                case 'b':
                  results.push(refc[refc.length - 1] += {
                    '+': 12,
                    '-': -12,
                    '#': 1,
                    'b': -1
                  }[s]);
                  break;
                default:
                  results.push(console.log('skip unknown config ' + s));
              }
            }
            return results;
          } else {
            tied = false;
            terms = e2.split(',');
            dur = terms.length >= (2 != null) ? parseInt(terms[1]) : 1;
            tmp = [];
            for (j = n = 0, ref5 = terms[0].length; n < ref5; j = n += 1) {
              e3 = terms[0][j];
              if (e3 === '^') {
                tied = true;
              } else if (refc[e3]) {
                tmp.push(refc[e3]);
              } else {
                console.log('invalid texture ' + e3);
              }
            }
            measure.push(tied ? [dur, tmp, true] : [dur, tmp]);
            return delta += dur;
          }
        });
        return measure;
      });
      return res;
    };

    ScoreObj.prototype.toText = function() {
      var pitchSimple, ref_oct, res, scale_len;
      console.log('to score text');
      if (this.melody === null) {
        return;
      }
      pitchSimple = MG.pitchToScale(this.scale, this.key_sig);
      scale_len = MG.scale_class[this.scale].length;
      ref_oct = 4;
      res = this.melody.map(function(e) {
        var ret;
        ret = [];
        e.forEach(function(e1) {
          var o;
          o = '';
          if (typeof e1[1] === 'number') {
            e1[1] = [e1[1]];
          }
          e1[1].forEach(function(e2) {
            var oct, tmp;
            tmp = pitchSimple(e2);
            oct = Math.floor(tmp / scale_len);
            o += 1 + (modulo(tmp, scale_len));
            return o += {
              '-2': '--',
              '-1': '-',
              1: '+',
              2: '++'
            }[oct - ref_oct] || '';
          });
          if (e1[2] === true) {
            o += '^';
          }
          if (e1[0] > 1) {
            o += ',' + e1[0];
          }
          return ret.push(o);
        });
        return ret.join(' ');
      });
      return res;
    };

    ScoreObj.prototype.toMidi = function() {
      var ctrlTicks, delta, dur, e, i, l, m, q, t, vol;
      console.log('to midi');
      ctrlTicks = this.init_ctrlTicks;
      q = _.flatten(this.melody, true);
      t = this.texture ? _.flatten(this.texture, true) : null;
      m = new simpMidi();
      delta = 0;
      vol = 110;
      i = 0;
      while (i < q.length) {
        e = q[i];
        if (typeof e[1] === 'number' && e[1] < 21 && e[1] > 108) {
          delta += e[0];
        } else {
          dur = e[0];
          while (q[i][2] === true && i + 1 < q.length) {
            dur += q[++i][0];
          }
          m.addNotes(1, dur * ctrlTicks, q[i][1], vol, 0, delta * ctrlTicks);
          delta = 0;
        }
        ++i;
      }
      m.setTimeSignature.apply(m, this.time_sig);
      m.setKeySignature(MIDI.key_sig[this.key_sig], 'maj');
      m.setTempo(this.tempo);
      if (t === null) {
        m.finish();
        return m;
      }
      vol = 80;
      l = m.addTrack() - 1;
      m.addEvent(l, 0, 'programChange', l - 1, 0);
      t.forEach(function(e) {
        return m.addNotes(l, e[0] * ctrlTicks, e[1], vol);
      });
      m.finish();
      return m;
    };

    return ScoreObj;

  })();

}).call(this);

//# sourceMappingURL=ScoreObj.js.map
;// Generated by CoffeeScript 1.10.0
(function() {
  this.ScoreRenderer = (function() {
    var dur_mapper;

    function ScoreRenderer(c, p) {
      this.c = document.getElementById(c);
      this.r = new Vex.Flow.Renderer(this.c, Vex.Flow.Renderer.Backends.CANVAS);
      this.ctx = this.r.getContext();
      this.geo = {
        system_width: 820,
        system_height: 80,
        system_interval: 30,
        left_padding: 25,
        top_padding: 10,
        reserved_width: 48
      };
      this.layout = {
        measure_per_system: 4
      };
      this.r.resize(1000, 800);
      if (p != null) {
        this.p = new fabric.StaticCanvas(p, {
          width: $('.canvas-wrapper').width(),
          height: $('.canvas-wrapper').height(),
          backgroundColor: 'rgba(240,250,240, 5)'
        });
      }
    }

    ScoreRenderer.prototype.newStave = function(m, k) {
      var i, j, w, x, y;
      i = m % this.layout.measure_per_system;
      j = Math.floor(m / this.layout.measure_per_system);
      w = Math.floor((this.geo.system_width - this.geo.reserved_width) / this.layout.measure_per_system);
      x = this.geo.left_padding + i * w;
      y = this.geo.top_padding + j * (this.geo.system_height + this.geo.system_interval);
      if (i === 0) {
        return new Vex.Flow.Stave(x, y, w + this.geo.reserved_width).addClef('treble').addKeySignature(k);
      } else {
        x += this.geo.reserved_width;
        return new Vex.Flow.Stave(x, y, w);
      }
    };

    dur_mapper = ["16", "8", "8d", "4", "4", "4d", "4dd", "2", "2", "2", "2", "2d", "2d", "2dd", "2ddd", "1"];

    ScoreRenderer.prototype.dur_map = function(dur) {
      dur = (dur * 4) >>> 0;
      return dur_mapper[dur - 1];
    };

    ScoreRenderer.prototype.render = function(score) {
      var beams, ctx, dur_tot, formatter, i, l, notes, num_beats, raw_w, ref, sharp, stave, voice, w;
      this.r.resize(1000, 800);
      raw_w = Math.floor((this.geo.system_width - this.geo.reserved_width) / this.layout.measure_per_system);
      this.s = new ScoreObj(score);
      sharp = MIDI.key_sig[this.s.key_sig] >= 0;
      this.sys = [];
      for (i = l = 0, ref = this.s.melody.length; l < ref; i = l += 1) {
        stave = this.newStave(i, this.s.key_sig);
        if (i === 0) {
          stave.addTimeSignature(this.s.time_sig.join('/'));
        }
        dur_tot = 0;
        notes = this.s.melody[i].map((function(_this) {
          return function(e) {
            var duration, keys, res;
            dur_tot += e[0];
            duration = _this.dur_map(e[0] / _this.s.ctrl_per_beat);
            keys = [];
            if (typeof e[1] === 'number') {
              e[1] = [e[1]];
            }
            e[1].forEach(function(e1) {
              var key;
              if ((key = MG.pitchToKey(e1, sharp)) != null) {
                return keys.push(key.join('/'));
              }
            });
            if (keys.length <= 0) {
              keys.push('Bb/4');
              duration += 'r';
            }
            res = new Vex.Flow.StaveNote({
              keys: keys,
              duration: duration,
              auto_stem: true
            });
            if (duration.substr(-1) === 'd') {
              res.addDotToAll();
              if (duration.substr(-2, 1) === 'd') {
                res.addDotToAll();
              }
            }
            return res;
          };
        })(this));
        num_beats = Math.floor(dur_tot / this.s.ctrl_per_beat);
        voice = new Vex.Flow.Voice({
          num_beats: num_beats,
          beat_value: this.s.time_sig[1],
          resolution: Vex.Flow.RESOLUTION
        });
        voice.addTickables(notes);
        Vex.Flow.Accidental.applyAccidentals([voice], this.s.key_sig);
        beams = Vex.Flow.Beam.applyAndGetBeams(voice);
        w = raw_w;
        if (i % this.layout.measure_per_system === 0) {
          w -= 30;
        }
        if (i === 0) {
          w -= 10;
        }
        formatter = new Vex.Flow.Formatter().joinVoices([voice]).format([voice], w - 10);
        this.sys.push({
          voices: [voice],
          stave: stave,
          beams: beams
        });
      }
      ctx = this.ctx;
      return this.sys.forEach(function(e) {
        e.stave.setContext(ctx).draw();
        e.voices.forEach(function(v) {
          return v.draw(ctx, e.stave);
        });
        return e.beams.forEach(function(v) {
          return v.setContext(ctx).draw();
        });
      });
    };

    return ScoreRenderer;

  })();

}).call(this);

//# sourceMappingURL=ScoreRenderer.js.map
;function dataURLtoBlob(dataurl) {
	var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
			bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
	while(n--){
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new Blob([u8arr], {type:mime});
}
var seqPlayer = {
	channel:0,
	src: {q:[],c:[],t:[]},
	tracks: [],
	playing:[],
	cur_i:[],
	midi: null,
	raw_midi: "",
	play:function(n){
		n = n || 0;
		if(!this.tracks[n] || this.tracks[n].length<=0){
			return;
		}
		this.playing[n] = true;
		var q = this.tracks[n];
		var nexti = this.cur_i[n];

		var cur = q[nexti];
		nexti++;
		var channel = this.channel;

		function loop(){
			if(cur[0]>0){ // not tied
				var notes = typeof cur[1] == 'number'? [cur[1]] : cur[1];
				notes.forEach(function(e){
					if(e>=21 && e<=108) {
						MIDI.noteOn(channel, e, cur[2]);
					}
				});
			}
        	setTimeout(function(){
				var notes = typeof cur[1] == 'number'? [cur[1]] : cur[1];
        		if(nexti < 0){

					notes.forEach(function(e){
						if(e>=21 && e<=108){
							MIDI.noteOff(channel,e);
						}
					});

        			seqPlayer.playing[n] = false;
        			seqPlayer.onend(n);
        		}else{

        			if(q[nexti][0]>0){
						notes.forEach(function(e){
							if(e>=21 && e<= 108){
								MIDI.noteOff(channel,e);
							}
						});

        		    }
        		    cur = q[nexti];
					if(seqPlayer.playing[n]){
						nexti++;
						if(nexti>= q.length){
							nexti = -1;
							seqPlayer.cur_i[n] = 0;
						}
					}else{
						seqPlayer.cur_i[n] = nexti;
						nexti = -1;
					}
        		    //log('next',q[nexti]);
        		    loop();
        	    }
        	},cur[0]>=0? cur[0]: -cur[0]);
				

	    }
	    setTimeout(loop, 0);



	},
	toQ: function(arr, ctrlTicks, vol){
		var vol = vol || 110;
		var m = _.flatten(arr, true);
		var res = [];
		for (var j = 0; j < m.length; ++j) {
			var delta = m[j][0];
			while (m[j][2] == true && j + 1 < m.length) {
				j++;
				delta += m[j][0];
			}
			res.push([delta * ctrlTicks, m[j][1], vol])
		}
		return res;

	},
	pause:function(n){
		var n = n || 0;
		if(n >= this.tracks.length){
			return;
		}
		this.playing[n] = false;

	},
	stop:function(n){
		var n = n || 0;
		if(n >= this.tracks.length){
			return;
		}
		this.playing[n] = false;
		this.cur_i[n] = 0;

	},
	onend:function(){},
    fromScore:function (src) {
        var obj = new ScoreObj(src);
		var ctrlTicks = obj.init_ctrlTicks;
		// TODO: add volume control
		var q = this.toQ(obj.melody, ctrlTicks, 110);
		var t = this.toQ(obj.texture, ctrlTicks, 60);
		this.tracks = [];
		this.tracks.push(q, t);
		this.playing = [false, false];
		this.cur_i = [0,0];
        this.src = {c: obj.harmony, t: t, q: q};
        this.midi = obj.toMidi();
        this.raw_midi = MidiWriter(this.midi);

    },
	saveMidi:function(){
		if(this.raw_midi.length<1) return;
		var bf = new Uint8Array(this.raw_midi.split("").map(function(e){return e.charCodeAt(0);}));
		saveAs(new File([bf], 'sample.mid', {type:"audio/midi"}));
	}
}



var TEST = TEST || {};

TEST.testSeqPlayer = function (){
	//var q = seqPlayer.parseQ(score_summer);
	//console.log(q);
	var arr = white_key_num.map(function(v){
		return [200,60+v,127];
	});
	seqPlayer.setQ(arr);
	seqPlayer.play();
	return true;
};


// TODO: migrate to Generator.coffee
Generator.prototype.gen_transpose = function(dur, options){
	var res = {dur:[],pitch:[]};
	var src = this.res[options.src];
	// TODO: handle offset
	var refd = 0, refp = 0;
	while(dur>0){
		var tmp = [];
		var tmp2 = []; // pitch
		src.dur[refd].map(function(e,i){
			if(dur-e>=0){
				tmp.push(e);
				tmp2.push(options.interval + src.pitch[refd][i]);
				dur -= e;
			}else if(dur>0){
				tmp.push(dur);
				tmp2.push(options.interval + src.pitch[refd][i]);
				dur = 0;
			}
		});
		refd++;
		res.dur.push(tmp);
		res.pitch.push(tmp2);
	}
	return res;
};
Generator.prototype.gen_random = function(dur, options){
	var pitchSimple = this.pitchSimple;
	var res = {dur:[],pitch:[]};
	var n = dur/options.rhythm[0] >>>0;

	var rc1 = this.rndPicker(options.rhythm[1], options.rhythm[2]);
	console.log(options.rhythm);
	var rc2 = this.rndPicker(options.interval.choices,options.interval.weights);
	var pre = 28;
	for(var i=0;i<n;++i){
		res.dur.push(rc1.gen());
		var tmp = [];
		for(var j=0;j<res.dur[i].length;++j){
			pre += rc2.gen();
			if(pre < 21) pre = 21;
			if(pre > 108) pre = 108;
			tmp.push(pitchSimple(pre));
		}
		res.pitch.push(tmp);
	}
	return res;
}

Generator.prototype.gen_chord = function(dur, options){
	var pitchSimple = this.pitchSimple;
	var chords = _.flatten(ScoreObj.prototype.parseHarmony(options.chords, 1),true);
	console.log('chords', chords);
	var refc = 0;
	var refdur = chords[refc][0];

	// obtain chords pitch

	// not chromatic
	var res = {dur:[],pitch:[]};
	var n = dur/options.rhythm[0] >>>0;

	var rc1 = this.rndPicker(options.rhythm[1], options.rhythm[2]);
	var rc2 = this.rndPicker(options.interval.choices,options.interval.weights);
	var pre = 28;
	for(var i=0;i<n;++i){
		res.dur.push(rc1.gen());
		var tmp = [];
		for(var j=0;j<res.dur[i].length;++j){
			if(Math.random()>0.9){
				pre += rc2.gen();
			}else{
				var r = Math.random()*9;
				var ii = (r%3) >>>0;
				if(refc+1<chords.length && refdur<0){
					refdur += chords[++refc][0];
				}
				pre = chords[refc][1] + chords[refc][2][ii] + 12*((r/3)>>>0);
				//console.log(pre, chords[refc])
			}
			refdur -= options.rhythm[0];


			if(pre < 21) pre = 21;
			if(pre > 108) pre = 108;
			tmp.push(pitchSimple(pre));
		}
		res.pitch.push(tmp);
	}
	return res;

}



TEST.testGen = function(){
	var res = new Generator(cur_schema);
	res.generate();
	cur_score.melody = res.toScoreObj().melody
	return true;
};



    






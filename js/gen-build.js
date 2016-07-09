// Generated by CoffeeScript 1.8.0
(function() {
  var MG, _ref,
    __modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  MG = (_ref = this.MG) != null ? _ref : {};

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
    var i, ret, _i, _ref1;
    n = typeof n === 'undefined' ? 1 : n % arr.length;
    if (n < 0) {
      n += arr.length;
    }
    ret = new Array(arr.length);
    for (i = _i = 0, _ref1 = arr.length; _i < _ref1; i = _i += 1) {
      ret[i] = __modulo(arr[(n + i) % arr.length] - arr[n], 12);
    }
    return ret;
  };

  this.chords_inv = MG.chords = (function() {
    var c, ci, i, res, v, _i, _ref1, _ref2;
    res = {};
    _ref1 = MG.chord_class;
    for (c in _ref1) {
      v = _ref1[c];
      ci = c + '';
      for (i = _i = 0, _ref2 = v.length; _i < _ref2; i = _i += 1) {
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
    var ref, scale, _ref1, _ref2;
    scale = (_ref1 = MG.scale_class[mode]) != null ? _ref1 : MG.scale_class['maj'];
    ref = (_ref2 = MG.key_class[tonic]) != null ? _ref2 : 0;
    return function(num) {
      return ref + (Math.floor(num / scale.length)) * 12 + scale[__modulo(num, scale.length)] + 12;
    };
  };

  MG.pitchToScale = function(mode, tonic) {
    var ref, scale, _ref1, _ref2;
    scale = (_ref1 = MG.scale_class[mode]) != null ? _ref1 : MG.scale_class['maj'];
    ref = (_ref2 = MG.key_class[tonic]) != null ? _ref2 : 0;
    return function(pitch) {
      var i, oct, _i, _ref3;
      pitch -= ref;
      oct = Math.floor(pitch / 12) - 1;
      pitch = __modulo(pitch, 12);
      for (i = _i = _ref3 = scale.length - 1; _i >= 0; i = _i += -1) {
        if (pitch >= scale[i]) {
          return i + oct * scale.length;
        }
      }
      return oct * scale.length;
    };
  };

  MG.keyToPitch = function(key) {
    var key_class, oct, ref, _ref1, _ref2;
    key_class = /[CDEFGAB][#b]{0,2}/.exec(key)[0];
    if (key_class == null) {
      key_class = 'C';
    }
    ref = (_ref1 = MG.key_class[key_class]) != null ? _ref1 : 0;
    oct = /[0-9]/.exec(key)[0];
    oct = (_ref2 = parseInt(oct)) != null ? _ref2 : 4;
    return 12 + ref + oct * 12;
  };

  MG.pitchToKey = function(pitch, sharp) {
    var kn, oct, ref;
    if (pitch < 21 || pitch > 108) {
      return void 0;
    }
    kn = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    if (sharp === true) {
      kn = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
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
;// Generated by CoffeeScript 1.8.0
(function() {
  var MG, _ref,
    __modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  MG = (_ref = this.MG) != null ? _ref : {};

  this.Generator = (function() {
    function Generator(schema) {
      var _ref1;
      this.schema = schema;
      this.keyref = MIDI.keyToNote[this.schema.key_sig + '4'];
      this.scale = (_ref1 = this.schema.scale) != null ? _ref1 : 'maj';
      this.pitchSimple = MG.scaleToPitch(this.scale, this.schema.key_sig);
      this.res = {};
    }

    Generator.prototype.generate = function() {
      var dur, i, mode, _ref1;
      _ref1 = this.schema.blocks;
      for (i in _ref1) {
        dur = _ref1[i];
        mode = this.schema.melody[i];
        this.res[i] = this.melody(mode.mode, mode.options, dur);
      }
    };

    Generator.prototype.toScoreObj = function() {
      var b, delta, dur, e0, obj, pitch, res, ret, sec, tmp, _ref1;
      if (res === {}) {
        this.generate();
      }
      sec = this.schema.ctrl_per_beat * this.schema.time_sig[0];
      res = {};
      console.log('to Score obj');
      _ref1 = this.res;
      for (e0 in _ref1) {
        b = _ref1[e0];
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
      var i, p, s, _i, _ref1;
      s = weights.reduce((function(a, b) {
        return a + b;
      }), 0);
      p = weights.map(function(e) {
        return e / s;
      });
      s = 0;
      for (i = _i = 0, _ref1 = p.length; _i < _ref1; i = _i += 1) {
        s = (p[i] += s);
      }
      return {
        gen: function() {
          var r, _j, _ref2;
          r = Math.random();
          for (i = _j = 0, _ref2 = p.length; _j < _ref2; i = _j += 1) {
            if (r < p[i]) {
              return choices[i];
            }
          }
          return choices[p.length - 1];
        }
      };
    };

    Generator.prototype.gen_random = function(end_pos, states, start, constraint) {
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
          return weights[__modulo(val.val - preval.val, 12)];
        }
      };
    };

    return Generator;

  })();

}).call(this);

//# sourceMappingURL=Generator.js.map
;// Generated by CoffeeScript 1.8.0
(function() {
  var MG, _ref,
    __modulo = function(a, b) { return (+a % (b = +b) + b) % b; },
    __slice = [].slice;

  MG = (_ref = this.MG) != null ? _ref : {};

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
            var dur, pitches, terms, tied, _ref1;
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
              dur = terms.length >= 2 ? (_ref1 = parseInt(terms[1])) != null ? _ref1 : 1 : 1;
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
      if (ctrlTicks == null) {
        ctrlTicks = this.init_ctrlTicks;
      }
      res = measures.map(function(e) {
        var chords, measure, octave, vol;
        measure = [];
        chords = e.trim().split(/\s+/);
        octave = 3;
        vol = 50;
        chords.forEach((function(_this) {
          return function(e2) {
            var chord_pitches, dur, name, root, root_pitch, terms, _ref1;
            terms = e2.split(',');
            root = ex.exec(terms[0])[0];
            root_pitch = MG.keyToPitch(root + octave);
            name = terms[0].substr(ex.lastIndex + root.length);
            name = (_ref1 = alias[name]) != null ? _ref1 : name;
            chord_pitches = MG.chords[name] || MG.chords['maj'];
            dur = terms.length >= 2 ? parseInt(terms[1]) : 1;
            dur *= ctrlTicks;
            return measure.push([dur, root_pitch, chord_pitches, vol]);
          };
        })(this));
        return measure;
      });
      return res;
    };

    ScoreObj.prototype.parseTexture = function(measures) {
      var c, ctrlTicks, delta, refc, refi, res;
      if (measures == null) {
        measures = this.options.texture;
      }
      c = _.flatten(this.harmony, true);
      ctrlTicks = this.init_ctrlTicks;
      delta = 0;
      refc = [];
      refi = -1;
      res = measures.map(function(e) {
        var arrange, measure, vol;
        measure = [];
        arrange = e.trim().split(/\s+/);
        vol = 80;
        arrange.forEach(function(e2) {
          var bass, chord, dur, inv, j, refk, s, terms, tmp, _i, _ref1, _ref2, _results;
          if (e2[0] === ':') {
            refk = MG.keyToPitch('C3');
            while (refi < c.length && delta >= 0) {
              delta -= c[++refi][0];
            }
            inv = /:i*/.exec(e2)[0].length - 1;
            bass = (c[refi][1] + c[refi][2][inv]) % 12;
            chord = MG.inverted(c[refi][2], inv);
            inv += 1;
            while ((_ref1 = e2[inv]) === '+' || _ref1 === '-') {
              refk += {
                '+': 12,
                '-': -12
              }[e2[inv++]];
            }
            bass += refk;
            refc = [];
            _results = [];
            for (j = _i = inv, _ref2 = e2.length; _i < _ref2; j = _i += 1) {
              switch (s = e2[j]) {
                case '0':
                case '1':
                case '2':
                case '3':
                  _results.push(refc.push(bass + chord[parseInt(s)]));
                  break;
                case '+':
                  _results.push(refc[refc.length - 1] += 12);
                  break;
                case '-':
                  _results.push(refc[refc.length - 1] -= 12);
                  break;
                default:
                  _results.push(console.log('skip unknown config ' + s));
              }
            }
            return _results;
          } else {
            terms = e2.split(',');
            dur = terms.length >= (2 != null) ? parseInt(terms[1]) : 1;
            dur *= ctrlTicks;
            tmp = Array.prototype.map.call(terms[0], function(e3) {
              var _ref3;
              return (_ref3 = refc[e3]) != null ? _ref3 : 0;
            });
            measure.push([dur, tmp, vol]);
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
            o += 1 + (__modulo(tmp, scale_len));
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
      l = m.addTrack() - 1;
      m.addEvent(l, 0, 'programChange', l - 1, 0);
      t.forEach(function(e) {
        return m.addNotes.apply(m, [l].concat(__slice.call(e), [15]));
      });
      m.finish();
      return m;
    };

    return ScoreObj;

  })();

}).call(this);

//# sourceMappingURL=ScoreObj.js.map
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
	enabled:false,
	nexti: 0,
	src: {q:[],c:[],t:[]},
	midi: null,
	raw_midi: "",
	play:function(){
		if(this.src.q.length <= 0){
			return;
		}
		this.enabled = true;
		var q = this.src.q;
		var nexti = this.nexti;
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

        			seqPlayer.enabled = false;
        			seqPlayer.onend();
        		}else{

        			if(q[nexti][0]>0){
						notes.forEach(function(e){
							if(e>=21 && e<= 108){
								MIDI.noteOff(channel,e);
							}
						});

        		    }
        		    cur = q[nexti];
					if(seqPlayer.enabled){
						nexti++;
						if(nexti>= q.length){
							nexti = -1;
							seqPlayer.nexti = 0;
						}
					}else{
						seqPlayer.nexti = nexti;
						nexti = -1;
					}
        		    //log('next',q[nexti]);
        		    loop();
        	    }
        	},cur[0]>=0? cur[0]: -cur[0]);
				

	    }
	    setTimeout(loop, 0);



	},
	toQ: function(score){


	},
	pause:function(){
		this.enabled = false;

	},
	stop:function(){
		this.enabled = false;
		this.nexti = 0;

	},
	onend:function(){},
    fromScore:function (src) {
        var ctrlTicks = (60000.0 / src.tempo / src.ctrl_per_beat) >>> 0;
        var obj = new ScoreObj(src);
        var vol = 110;
        var q = [];
        var m = _.flatten(obj.melody,true);
        for (var j = 0; j < m.length; ++j) {
            var delta = m[j][0];
            while (m[j][2] == true && j + 1 < m.length) {

                j++;
                delta += m[j][0];
            }
            q.push([delta * ctrlTicks, m[j][1], vol])
        }
        this.src = {c: obj.harmony, t: obj.texture, q: q};
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

Generator.prototype.melody = function(mode,options,dur){
	var rndChoice = this.rndPicker;
	var pitchSimple = this.pitchSimple;
	return {
		'random':function(options, dur){
			// not chromatic
			var res = {dur:[],pitch:[]};
			var n = dur/options.rhythm[0] >>>0;

			var rc1 = rndChoice(options.rhythm[1], options.rhythm[2]);
			console.log(options.rhythm);
			var rc2 = rndChoice(options.interval.choices,options.interval.weights);
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
		},
		'transpose':function(options,dur,self){
			var res = {dur:[],pitch:[]};
			var src = self.res[options.src];
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
		},
		'chord':function(options,dur){
			var chords = _.flatten(ScoreObj.prototype.parseHarmony(options.chords, 1),true);
            console.log('chords', chords);
			var refc = 0;
			var refdur = chords[refc][0];

			// obtain chords pitch

			// not chromatic
			var res = {dur:[],pitch:[]};
			var n = dur/options.rhythm[0] >>>0;

			var rc1 = rndChoice(options.rhythm[1], options.rhythm[2]);
			var rc2 = rndChoice(options.interval.choices,options.interval.weights);
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
	}[mode](options, dur, this);
	
};


TEST.testGen = function(){
	var res = new Generator(cur_schema).generate();
	console.log(res.melody);
	cur_score.melody = res.melody;
	return true;
};



    






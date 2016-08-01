
# namespace for Music Generator

MG = @MG ? {}
MG.instrs =
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


@chord_num = MG.chord_class =
  "maj":[0,4,7],
  "min":[0,3,7],
  "dim":[0,3,6],
  "aug":[0,4,8],
  "dom7":[0,4,7,10],
  "maj7":[0,4,7,11],
  "min7":[0,3,7,10],
  "aug7":[0,4,8,10],
  "dim7":[0,3,6,9],

MG.inverted = (arr,n) ->
  n ?= 1
  n = n %% arr.length
  ret = new Array(arr.length);
  for i in [0...arr.length] by 1
    ret[i] = (arr[(n+i)%arr.length]-arr[n]) %% 12
  return ret

MG.chords = ( ->
  res = {}
  for c,v of MG.chord_class
    ci = c + ''
    for i in [0...v.length] by 1
      res[ci] = MG.inverted(v,i)
      ci += 'i'
  # TODO: alias
  return res;
)()

MG.interval_class =
  'u1': 0,
  'm2': 1, 'M2': 2,
  'm3': 3, 'M3': 4,
  'p4': 5, 'a4': 6,
  'd5': 6, 'p5': 7,
  'm6': 8, 'M6': 9,
  'm7': 10, 'M7': 11,
  'o8': 12

MG.key_class = ( ->
  kn1 = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  kn2 = ['B#', 'C#', 'D', 'D#', 'Fb', 'E#', 'F#', 'G', 'G#', 'A', 'A#', 'Cb']
  res = {}
  kn1.forEach (e,i)->
    res[e] = i
    return
  kn2.forEach (e,i)->
    res[e] = i
    return
  return res
)()

MG.scale_class =
  'maj': [0,2,4,5,7,9,11],
  'min': [0,2,3,5,7,8,10],
  'min_harmonic': [0,2,3,5,7,8,11],
  'min_melodic': [0,2,3,5,7,9,11], # up, down = min
  'chromatic': [0,1,2,3,4,5,6,7,8,9,10,11], # use a-e for 10-15
  'octatonic': [0,1,3,4,6,7,9,10],
  'whole': [0,2,4,6,8,10],
  # add [Dorian, Phrygian, Lydian, Mixolydian]
  'dorian': [0,2,3,5,7,9,10],
  'lydian': [0,2,4,6,7,9,11],
  'pent': [0,2,4,7,9], # Gong
  # add [Gong, Shang, Jue, Zhi, Yu]
  'pent_min': [0,3,5,7,10], # Yu
  'zhi': [0,2,5,7,9],
  'blues': [0,3,5,6,7,10]

@white_key_num = [0,2,4,5,7,9,11]
@black_key_num = [1,3,6,8,10]

MG.scaleToPitch = (mode, tonic) ->
  scale = MG.scale_class[mode] ? MG.scale_class['maj']
  ref = MG.key_class[tonic] ? 0
  return (num) ->
    return ref + (num // scale.length) * 12 + scale[num %% scale.length] + 12 # lowest 12

MG.pitchToScale = (mode, tonic) ->
  scale = MG.scale_class[mode] ? MG.scale_class['maj']
  ref = MG.key_class[tonic] ? 0
  return (pitch) ->

    pitch -= ref
    oct = pitch // 12 - 1
    pitch = pitch %% 12
    for i in [scale.length-1 ..0] by -1
      if pitch >= scale[i]
        return [i, oct, pitch - scale[i]]
    return [0, oct, pitch-scale[0]]

MG.testPitchScaleConversion = ()->
  for scale, mode of MG.scale_class
    flag = true
    for tonic of MG.key_class
      toPitch = MG.scaleToPitch(scale, tonic)
      toScale = MG.pitchToScale(scale, tonic)
      for i in [21..108]
        tmp = toScale(i)
        j = toPitch(tmp[0]+mode.length*tmp[1]) + tmp[2]
        if j != i
          flag = false
          console.log tonic, scale, i, tmp, j
    if flag
      console.log scale, 'success'
  return

MG.keyToPitch = (key) ->
  key_class = /[CDEFGAB][#b]{0,2}/.exec(key)[0]
  key_class ?= 'C'
  ref = MG.key_class[key_class] ? 0
  oct = /[0-9]/.exec(key)[0]
  oct = parseInt(oct) ? 4
  return 12 + ref + oct * 12



MG.pitchToKey = (pitch, sharp, nooct) ->
  if pitch < 21 || pitch > 108
    return undefined
  kn = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  if sharp == true
    kn = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  ref = pitch % 12
  return if nooct? then kn[ref] else [kn[ref],pitch // 12 -1]

MG.testPitchKeyConversion = ()->
  flag = true
  for i in [21..108]
    tmp = MG.pitchToKey(i,true)
    j = MG.keyToPitch(tmp[0]+tmp[1])
    if j != i
      flag = false
      console.log i, tmp, j
  if flag
    console.log 'success'
  return

# transpose pitch in scale degree
MG.transposer = (scale_name, key_sig) ->
  scale_name ?= 'chromatic'
  console.log scale_name, 'transposer'
  key_sig ?= 'C'
  scale_len = MG.scale_class[scale_name].length # default chromatic
  toScale = MG.pitchToScale(scale_name, key_sig)
  toPitch = MG.scaleToPitch(scale_name, key_sig)
  return (pitch, diff)->
    tmp = toScale(pitch)
    return toPitch(tmp[0]+tmp[1]*scale_len+diff) + tmp[2]


ex = /[ABCDEFG][b#]{0,2}/
alias = {'7':'dom7','':'maj','M':'maj','m':'min','mi':'min','m7':'min7'}
MG.getChords = (chord_str, oct)->
  oct ?= 4
  root = ex.exec(chord_str)[0]
  root_pitch = MG.keyToPitch(root + oct)
  chord_name = chord_str.substr(ex.lastIndex+root.length)
  chord_name = alias[chord_name] ? chord_name
  chord_pitches = MG.chords[chord_name] || MG.chords['maj'] # default maj
  return [root_pitch, chord_pitches]


MG.key_sig_rev = {}
MG.key_sig = (()->
  kn = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  res = {}
  for i in [0...12] by 1
    j = (i*7)%12;
    l = (i+6)%12 - 6;
    res[kn[j]] = l;
    MG.key_sig_rev[l] = kn[j];

  res['F#'] = 6;
  MG.key_sig_rev[6] = 'F#'
  return res
)()

# all valid note names for the pitch class
MG.keyNames = (()->
  res = new Array(12).fill(0).map (e)-> []
  ref = MG.scale_class['maj']
  "CDEFGAB".split("").forEach (key,i)->
    #console.log ref[i]
    res[(ref[i]-2)%%12].push(key + 'bb')
    res[(ref[i]-1)%%12].push(key + 'b')
    res[ref[i]%12].push(key)
    res[(ref[i]+1)%12].push(key+'#')
    res[(ref[i]+2)%12].push(key+'##')
  return res
)()

# note names in the major scale
MG.scale_keys = (()->
  kn = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  res = {}
  res['C'] = "CDEFGAB".split("")
  ref = MG.scale_class['maj']
  kn.forEach (e,i)->
    if e == 'C'
      return
    res[e] = [e]
    for j in [1...ref.length] by 1
      pitch = (i + ref[j]) % 12
      notes = MG.keyNames[pitch]

      for k,v of notes
        if v[0] == res['C'][(res['C'].indexOf(e[0])+j)%7]
          res[e].push v
          break
  return res
)()


@chord_name = MG.chord_class_label =
  "maj": "Major triad",
  "min": "Minor triad",
  "aug": "Augmented triad",
  "dim": "Diminished triad",
  "dom7": "Dominant seventh chord",
  "maj7": "Major seventh chord",
  "min7": "Minor seventh chord",
  "aug7": "Augmented seventh chord",
  "dim7": "Diminished seventh chord",

@score_summer = MG.score_summer =
  settings:
    tempo: 120,
    time_sig: [4,4],
    key_sig: 'C',
    scale: 'maj',
    ctrl_per_beat: 2,
    incomplete_measure: true,
    volumes: [110,80],
    instrs: [1,1]
  contents:
    melody: ':+ 3,2 1,2/3,8^/3,2 2 1 2 3 1,2/:- 6,4 3,4^/3,4 :+ 3,2 1,2/2 2,7^/2,2 1 6-,1 1 6-,1 1,2/:- 7,8^/7,4 0 :+ 3,2 1/3 3,2 3,1^ 3,4^/3,2 2 1 2 3 1,2/:- 6,4 3,4^/3,6 3,2/5,2 3 5 6,2 :+ 1,2/3 2,3 1,4/:- 6,8^/6,4 :+ 3,2 1,2'.split('/'),
    harmony: "E7,4/Amin,8/Bb7,8/Amin,4 E7,4/Amin,4 A7,4/Dmin,8/F7,8/F#min7,4 B7,4/E7,8/Am,8/Bb7,8/Am,8/D7,8/C,4 Am,4/D7,4 E7,4/Am,4 D7,4/Bm7,4 E7,4".split('/'),
    texture: "@-123 123,4/@-11-32+ 12,2 3,2 4,2 3,2/@iii-11-32+ 12,2 3,2 4,2 3,2/@-123 123,4 @-123 123,4/@-123 123,4 @-123 123,4/@-11-32+ 12,2 3,2 4,2 3,2/@-11-32+ 12,2 3,2 4,2 3,2/@-123 123,4 123,4/@-11-32+ 12,2 3,2 4,2 3,2/@-123 123,4 123,4/@-123 123,4 123,4/@-123 123,4 123,4/@-123 123,4 123,4/@-123 123,4 @-123 123,4/@-123 123,4 @-123 123,4/@-123 123,4 @-123 123,4/@-123 123,4 @-123 123,4".split('/')


@gen_modes = ['random', 'transpose', 'chord', 'reverse', 'sequence']


@schema_summer = MG.schema_summer =
  blocks: ((a,b)->
    res = {}
    a.split('/').forEach (e,i)->
      res[e] = b[i]
    return res
  )('c/A/B/Br/C',[4,32,16,16,28]),
  structure: "c/A/B/Br/A/C/c".split('/'),
  scale:'maj',
  funcs:
    'A': "1,8/4,8/1,4 2,4/1,8".split('/'),
    'B':"4,8/6,8".split('/'),
    'Br':"2,4 5,4/5,8".split('/'),
    'C':"3,4 1,4/2,4 5,4/1,4 2,4/2,4".split('/'),
    'c':"5,4"
  ,
  seeds:
    's1':
      dur: 4,
      choices:
        ('1 1 1 1/2 1 1/1 1 2/1 2 1/1 3/3 1/2 2/4'.split('/').map (e)->
          e.split(/\s+/).map (e2)-> parseInt(e2)
        )
      weights:
        [2,3,3,5,1,3,2,1]
    's2':
      weights: [1,1,2,5,12,6,8,  4,7,12,8,3,1,0,1],
      choices: (->
        Array(15).fill().map (e,i)->
          i-7
      )()


  melody:
    'c':
      mode: 'random'
      options:
        rhythm:
          seed: 's1'

        interval:
          chromatic: false
          seed: 's2'
    'A':
      mode:'random'
      options:
        chords: [
          "Amin,8",
          "Bb7,8",
          "Amin,4 E7,4",
          "Amin,4 A7,4"
        ]
        rhythm:
          seed: 's1'

        interval:
          chromatic: false
          seed: 's2'

    'B':
      mode:'transpose'
      options:
        src: "A",
        offset: 0,
        scale: 'maj',
        interval: 4
    'Br':
      mode:'reverse',
      options:
        src: 'B',
        deep: 'false'

    'C':
      mode: 'chord',
      options:
        chords: "C,4 Am,4/D7,4 E7,4/Am,4 D7,4/Bm7,4".split('/'),
        rhythm:
          seed: 's1'
        interval:
          chromatic: false,
          seed: 's2'

@MG = MG

if module?
  module.exports = MG

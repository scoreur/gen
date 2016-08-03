MG = (module? && require? && require('./musical')) || @MG

###
  player for note sequence
  warn: based of setTimeout, may slow down in background
###
class seqPlayer
  constructor: ->
    @harmony = []
    @instrs = []
    @tracks = []
    @playing = []
    @cur_i = []
    @midi = null
    @raw_midi = '' # midifile as string
    @onend = (n)->
      console.log("track #{n} finished")

  ## play track n
  play: (n) ->

    n ?= 0
    if not @tracks[n]? or @tracks[n].length <= 0
      return

    q = @tracks[n]
    nexti = @cur_i[n]
    cur = q[nexti]
    nexti++
    channel = n
    rate = 1
    onend = @onend
    playing = @playing
    playing[n] = true

    loop1 = =>

      if cur[0] > 0
        notes = if typeof cur[1] != 'object' then [ cur[1] ] else cur[1]
        notes.forEach (e) ->
          if e >= 21 and e <= 108
            MIDI.noteOn channel, e, cur[2]
          return
      dur = if cur[0] >= 0 then cur[0] else -cur[0]
      dur *= rate

      setTimeout (=>
        notes = if typeof cur[1] != 'object' then [ cur[1] ] else cur[1]
        if nexti < 0
          notes.forEach (e) =>
            if e >= 21 and e <= 108
              MIDI.noteOff channel, e
            return
          playing[n] = false
          onend n
        else
          if q[nexti][0] > 0
            notes.forEach (e) =>
              if e >= 21 and e <= 108
                MIDI.noteOff channel, e
              return
          cur = q[nexti]
          if playing[n]
            nexti++
            if nexti >= q.length
              nexti = -1
              @cur_i[n] = 0
          else
            @cur_i[n] = nexti
            nexti = -1

          loop1()
        return
      ), dur
      return

    setTimeout loop1, 0
    return

  # to note sequence, array of [dur, [pitches], vol] (single voice)
  toQ: (arr, ctrlTicks, vol) ->
    vol ?= 110
    m = _.flatten(arr, true)
    res = []
    j = 0
    while j < m.length
      delta = m[j][0]
      while m[j][2] == true and j + 1 < m.length
        j++
        delta += m[j][0]
      res.push [
        delta * ctrlTicks
        m[j][1]
        vol
      ]
      ++j
    res
  # pause track n
  pause: (n) ->
    n ?= 0
    if n >= @tracks.length
      return
    @playing[n] = false
    return
  # stop track n
  stop: (n) ->
    n ?= 0
    if n >= @tracks.length
      return
    @playing[n] = false
    @cur_i[n] = 0
    return
  setOnend: (func)->
    console.log 'set onend'
    @onend = func
  # get note sequence from score
  fromScore: (obj) ->

    ctrlTicks = obj.init_ctrlTicks

    q = @toQ(obj.tracks[0], ctrlTicks, obj.volumes[0])
    t = @toQ(obj.tracks[1], ctrlTicks, obj.volumes[1])
    @tracks = []
    @instrs = obj.instrs
    @tracks.push q, t
    @playing = [
      false
      false
    ]
    @cur_i = [
      0
      0
    ]
    @harmony = obj.harmony
    @midi = obj.toMidi()
    @raw_midi = MidiWriter(@midi)
    return
  saveMidi: ->
    if @raw_midi.length < 1
      return
    bf = new Uint8Array(@raw_midi.split('').map((e) ->
      e.charCodeAt 0
    ))
    saveAs new File([ bf ], 'sample.mid', type: 'audio/midi')
    return

class Analyzer
  constructor: (@key_sig, @scale_name)->
    @scale = MG.scale_class[@scale_name]
    @key_ref = MG.key_class[@key_sig]
    @toScale = MG.pitchToScale(@scale_name, @key_sig)
    @key_sig_acc = MG.key_sig[@key_sig]
  pitch_info: (pitch, chord)->
    info = {}
    if chord?
      if typeof chord == 'string'
        chord = MG.getChords(chord,3,@key_sig)
      info.isChordTone = false
      for i,p of chord[1]
        if (chord[0]+p-pitch)%12 == 0
          info.isChordTone = true
          break

    tmp = @toScale(pitch)
    info.inScale = tmp[2] == 0

    key = MG.scale_keys[s.key_sig][tmp[0]]
    # adjust
    sharp = MG.key_sig[@key_sig] >= 0
    info.keyName = if info.inScale then [key, pitch//12 - ({'Cb':0, 'B#':2}[key] || 1)] else MG.pitchToKey(pitch, sharp)
    return info

obj_sort = (data) ->
  kv = _.zip(_.keys(data), _.values(data))
  kv.sort (a, b) ->
    b[1] - (a[1])
  # decending
  kv

MG.midi_statistics = midi_statistics = (obj) ->
  info =
    rhythm: {}
    melody:
      one: {}
      two: {}
    range:[]
  one = {}
  two = {}
  n_one = 0
  n_two = 0


  obj.forEach (e,ii) ->
    measure = _.unzip(e)
    r = measure[0]
    info.rhythm[r] = 1 + (info.rhythm[r] || 0)
    r = measure[1]
    info.range.push _.max(r) - _.min(r)

    if r.length < 2
      return
    c = [
      r[0] % 12
      (r[1] - (r[0])) % 12
    ]
    one[c] ?= 0
    one[c]++
    n_one++
    i = 2
    while i < r.length
      c = [
        r[i - 1] % 12
        (r[i] - (r[i - 1])) % 12
      ]
      one[c] = 1 + (one[c] or 0)
      n_one++
      c = [
        r[i - 2] % 12
        (r[i - 1] - (r[i - 2])) % 12
        c[1]
      ]
      two[c] = 1 + (two[c] or 0)
      n_two++
      ++i
    return
  info =
    rhythm: obj_sort(info.rhythm)
    melody:
      one: obj_sort(one)
      two: obj_sort(two)
      n: [
        0
        n_one
        n_two
      ]
    range: info.range




class @AppMG
  constructor: (ui, options) ->
    if options?
      {@schema, @settings, @contents}  = options
    else
      @schema = Object.assign({}, MG.schema_summer)
      @settings = Object.assign({}, MG.score_summer.settings)
      @contents = Object.assign({}, MG.score_summer.contents)
      @obj = null
    if ui?
      {@editor, @renderer, @playbtns} = ui
      @player = new seqPlayer()
    return

  export: ->
      settings: @settings
      schema: @schema
      contents: @contents

  updateEditor: ->
    ['melody', 'harmony', 'texture'].forEach (e) =>
      @editor[e].setValue @contents[e].join('\n'), -1
      return
    @editor.score.setValue JSON.stringify(@settings, null, 2), -1
    @editor.schema.setValue JSON.stringify(@schema, null, 2), -1
    return

  play: (n)->
    if !@player.playing[n]
      @player.play(n)
    else
      @player.pause(n)
    @playbtns[n].toggleClass('glyphicon-play glyphicon-pause')

  parse: ->
    try
      @settings = JSON.parse(@editor.score.getValue())
    catch e
      $.notify('Bad score format!', 'warning')
    ['melody','harmony','texture'].forEach (e)=>
      @contents[e] = @editor[e].getValue().split(/[/\n]+/)
    @obj = new ScoreObj(@settings, @contents)
    @player.fromScore(@obj)
    return @obj

  # analyze midi file
  analysis: (data, ctrl_per_beat) ->
    data ?= MIDI.Player.currentData
    ctrl_per_beat ?=  8
    m = MidiFile(data)
    settings = {
      key_sig: MG.key_sig_rev[simpMidi::getKeySignature.call(m)[0]],
      time_sig: simpMidi::getTimeSignature.call(m),
      ctrl_per_beat: ctrl_per_beat
    }
    q = simpMidi::quantize.call(m, ctrl_per_beat)
    tracks = q.map((track) ->
      res = []
      tmp = []
      # handle
      delta = 0
      track.forEach (e) ->
        if e[0] > delta
          if tmp.length > 0
            res.push [
              e[0] - delta
              tmp
            ]
            tmp = []
          else
            res.push [
              e[0] - delta
              [ 0 ]
            ]
          #rest
          delta = e[0]
        # ignore 'noteOff' and velocity == 0
        if e[1] == 'noteOn' and e[3] != 0
          tmp.push e[2]
        #noteNumber
        return
      res = _.unzip(res)
      res =
        dur: res[0]
        pitch: res[1]
      ret = Generator::b2score.call {}, res, ctrl_per_beat * settings.time_sig[0]
      ret.info = midi_statistics(Generator::b2score.call {}, res, ctrl_per_beat)
      return ret
    )

    obj = new ScoreObj(settings)

    obj.setMelody tracks[0], true
    obj.setTexture tracks[1], [], true
    @obj = obj
    @editor.score.setValue(JSON.stringify(@obj.getSettings(),null,2), -1);
    @editor.melody.setValue(@obj.toText().join('\n'), -1);
    #@renderer.render(@obj)
    info =  tracks.map (e)-> e.info
    console.log info
    MG.ref_midi_info = info[0]
    return info





MG = (module? && require? && require('./musical')) || @MG

class seqPlayer
  constructor: ->
    @harmony = []
    @instrs = []
    @tracks = []
    @playing = []
    @cur_i = []
    @midi = null
    @raw_midi = ''
  play: (n) ->

    n ?= 0
    if not @tracks[n]? or @tracks[n].length <= 0
      return
    @playing[n] = true
    q = @tracks[n]
    nexti = @cur_i[n]
    cur = q[nexti]
    nexti++
    channel = n
    rate = 1

    loop1 = =>

      if cur[0] > 0
# not tied
        notes = if typeof cur[1] == 'number' then [ cur[1] ] else cur[1]
        notes.forEach (e) ->
          if e >= 21 and e <= 108
            MIDI.noteOn channel, e, cur[2]
          return
      dur = if cur[0] >= 0 then cur[0] else -cur[0]
      dur *= rate

      setTimeout (=>
        notes = if typeof cur[1] == 'number' then [ cur[1] ] else cur[1]
        if nexti < 0
          notes.forEach (e) =>
            if e >= 21 and e <= 108
              MIDI.noteOff channel, e
            return
          @playing[n] = false
          @onend n
        else
          if q[nexti][0] > 0
            notes.forEach (e) =>
              if e >= 21 and e <= 108
                MIDI.noteOff channel, e
              return
          cur = q[nexti]
          if @playing[n]
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
  pause: (n) ->
    n ?= 0
    if n >= @tracks.length
      return
    @playing[n] = false
    return
  stop: (n) ->
    n ?= 0
    if n >= @tracks.length
      return
    @playing[n] = false
    @cur_i[n] = 0
    return
  onend: ->
  fromScore: (src, contents) ->
    obj = new ScoreObj(src, contents)
    ctrlTicks = obj.init_ctrlTicks
    # TODO: add volume control
    q = @toQ(obj.tracks[0], ctrlTicks, src.volumes[0])
    t = @toQ(obj.tracks[1], ctrlTicks, src.volumes[1])
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
    return obj
  saveMidi: ->
    if @raw_midi.length < 1
      return
    bf = new Uint8Array(@raw_midi.split('').map((e) ->
      e.charCodeAt 0
    ))
    saveAs new File([ bf ], 'sample.mid', type: 'audio/midi')
    return

class @AppMG
  constructor: (ui, options) ->
    if options?
      {@schema, @settings, @contents}  = options
    else
      @schema = Object.assign({}, MG.schema_summer)
      @settings = Object.assign({}, MG.score_summer.settings)
      @contents = Object.assign({}, MG.score_summer.contents)
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
    @player.fromScore(@settings, @contents);


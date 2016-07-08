
class @ScoreObj
  constructor: (options) ->
    options ?= {}
    @tempo = options.tempo ? 120
    @time_sig = options.time_sig ? [4,4]
    @key_sig = options.key_sig ? 'C'
    @ctrl_per_beat = options.ctrl_per_beat ? 4
    @init_ref = MIDI.keyToNote[@key_sig+'4'];
    @init_ctrlTicks = (60000.0/@.tempo/@.ctrl_per_beat) >>>0
    @parse(options)
    @options = options

  parse: (options) ->
    options ?= @options
    @melody = @parseMelody(options.melody)
    @harmony = @parseHarmony(options.harmony)
    @texture = @parseTexture(options.texture)

  parseMelody: (m) ->
    m ?= @options.melody
    ref = @init_ref;
    res = m.map (e)=>
      notes = e.trim().split(/\s+/);
      measure = [];
      notes.forEach (e2) =>
        if e2[0]==':'
          switch e2[1]
            when '+' then ref += 12
            when '-' then ref -= 12
            else ref = @init_ref
          return
        else
          terms = e2.split(',')
          num = parseInt(terms[0])
          # console.log(num, terms)
          # TODO: support note name
          if num == NaN
            return
          pitch = if num<=0 then 0 else ref+white_key_num[num-1]
          dur = if terms.length>=2 then parseInt(terms[1]) else 1
          tied = false;
          if terms.length>=3
            for j in [0...terms[2].length] by 1
              pitch += {'+':12,'-':-12,'#':1,'b':-1}[terms[2][j]] | 0
              if terms[2][j]=='^'
                tied = true

          # TODO: add amplitude control
          if tied
            measure.push [dur, pitch, true]
          else
            measure.push [dur, pitch]

          return
      return measure
    return res

  parseHarmony: (measures) ->
    measures ?= @options.harmony
    ex = /[ABCDEFG][b#]?/
    alias = {'7':'dom7','':'maj','M':'maj','m':'min','mi':'min','m7':'min7'}
    ctrlTicks = @init_ctrlTicks
    res = measures.map (e) =>
      measure = []
      chords = e.trim().split(/\s+/)
      octave = 3
      vol = 50
      chords.forEach (e2) =>
        terms = e2.split(',')
        root = ex.exec(terms[0])[0]
        root_pitch = MIDI.keyToNote[root+octave]
        name = terms[0].substr(ex.lastIndex+root.length)
        name = alias[name] ? name
        chord_pitches = chords_inv[name] || chords_inv['maj'] # default maj
        dur =  if terms.length>=2 then parseInt(terms[1]) else 1
        dur *= ctrlTicks
        measure.push [dur,root_pitch,chord_pitches,vol]
      return measure
    return res


  parseTexture: (measures) ->
    measures ?= @options.texture
    c = _.flatten(@harmony, true)
    ctrlTicks = @init_ctrlTicks
    delta = 0
    refc = []
    refi = -1
    res = measures.map (e) =>
      measure = []
      arrange = e.trim().split(/\s+/)
      vol = 80
      arrange.forEach (e2) =>
        if e2[0] == ':'
          refk = MIDI.keyToNote['C3'] # 48
          while refi < c.length && delta>=0
            delta -= c[++refi][0]
          inv = /:i*/.exec(e2)[0].length - 1
          bass = (c[refi][1]+c[refi][2][inv])%12
          chord = chords_inv.inv(c[refi][2], inv)
          inv += 1;
          while e2[inv] in ['+','-']
            refk += {'+':12, '-':-12}[e2[inv++]]
          bass += refk
          refc = [];
          for j in [inv...e2.length] by 1
            switch s = e2[j]
              when '0','1','2','3'
                refc.push(bass+chord[parseInt(s)])
              when '+' then refc[refc.length-1] += 12
              when '-' then refc[refc.length-1] -= 12
              else console.log('skip unknown config '+s);
        else
          terms = e2.split(',');
          dur = if terms.length>=2? then parseInt(terms[1]) else 1
          dur *=  ctrlTicks
          tmp = Array.prototype.map.call terms[0], (e3)=>
            return refc[e3] ? 0 # console.log('invalid syntac', refc, terms)
          measure.push([dur, tmp, vol])
          delta += dur
      return measure
    return res

  toMidi: ->
    console.log('to midi')
    ctrlTicks = @init_ctrlTicks
    q = _.flatten(@melody, true)
    t = _.flatten(@texture, true)
    m = new simpMidi()
    delta = 0
    vol = 110
    i = 0
    while i < q.length
      e = q[i]
      if e[1] < 21 && e[1] > 108
        delta += e[0]
      else
        m.addEvent delta * ctrlTicks, 'noteOn', 0, [q[i][1], vol]
        delta = e[0]
        while q[i][2] == true && i+1 < q.length
          delta += q[++i][0]
        m.addEvent delta * ctrlTicks, 'noteOff', 0, [q[i][1], 0]
        delta = 0
      ++i

    m.setTimeSignature @time_sig...
    m.setKeySignature MIDI.key_sig[@key_sig], 'maj'
    m.setTempo @tempo

    l = m.addTrack() - 1
    m.addEvent l, 0, 'programChange', l-1, 0
    addNotes = (dur, notes, vol) ->
      rollTime = 10
      m.addEvent l, 0, 'noteOn', l-1, [notes[0], vol-40]
      notes.slice(1).forEach (e)->
        m.addEvent l, rollTime, 'noteOn', l-1, [e,vol]
      m.addEvent l, dur-(notes.length-1)*rollTime, 'noteOff', l-1, [e, vol]
      notes.slice(1).forEach (e) ->
        m.addEvent l, 0, 'noteOff', l-1, [e, 0]
    t.forEach (e) ->
      addNotes e...
    m.finish()
    return m






MG = @MG ? {}

class @ScoreObj
  constructor: (options) ->
    options ?= {}
    {@tempo, @time_sig, @key_sig, @ctrl_per_beat, @scale} = options
    @tempo ?= 120
    @time_sig ?= [4,4]
    @key_sig ?='C'
    @ctrl_per_beat ?= 4
    @init_ref = MG.key_class[@key_sig] + 60 # C4 ~ B4
    @init_ctrlTicks = (60000.0/@tempo/@ctrl_per_beat) >>>0
    @scale ?= 'maj'
    # remove this
    @options = options
    @parse(options)



  parse: (options) ->
    options ?= @options
    @measures = _.zip(options.melody, options.harmony, options.texture)
    @melody = if options.melody then @parseMelody(options.melody) else null
    @harmony = if options.harmony then @parseHarmony(options.harmony) else null
    @texture = if options.texture then @parseTexture(options.texture) else null

  parseMelody: (m) ->
    m ?= @options.melody
    scale = MG.scale_class[@scale]
    ref = @init_ref
    res = m.map (e)=>
      notes = e.trim().split(/\s+/);
      measure = []
      notes.forEach (e2) =>
        if e2[0]==':'
          switch e2[1]
            when '+' then ref += 12
            when '-' then ref -= 12
            else ref = @init_ref
          return
        else
          tied = false
          terms = e2.split(',')
          pitches = []
          Array.prototype.forEach.call terms[0], (e3)->
            switch e3
              when '0'
                pitches.push(0) # rest
              when '1','2','3','4','5','6','7'
                pitches.push ref+scale[e3 - '1']
              when '+','-','#','b'
                pitches[pitches.length-1] += {
                  '+': 12, '-': -12, '#': 1, 'b': -1
                }[e3]
              when '^'
                tied = true
              else
                console.log 'skip invalid flag ' + e3

          dur = if terms.length>=2 then (parseInt(terms[1]) ? 1) else 1
          # TODO: add amplitude control
          if tied
            measure.push [dur, pitches, true]
          else
            measure.push [dur, pitches]
          return
      return measure
    return res

  parseHarmony: (measures, ctrlTicks) ->
    measures ?= @options.harmony
    ex = /[ABCDEFG][b#]?/
    alias = {'7':'dom7','':'maj','M':'maj','m':'min','mi':'min','m7':'min7'}
    res = measures.map (e) ->
      measure = []
      chords = e.trim().split(/\s+/)
      octave = 3
      chords.forEach (e2) =>
        terms = e2.split(',')
        root = ex.exec(terms[0])[0]
        root_pitch = MG.keyToPitch(root+octave)
        name = terms[0].substr(ex.lastIndex+root.length)
        name = alias[name] ? name
        chord_pitches = MG.chords[name] || MG.chords['maj'] # default maj
        dur =  if terms.length>=2 then parseInt(terms[1]) else 1
        measure.push [dur,root_pitch,chord_pitches]
      return measure
    return res


  parseTexture: (measures) ->
    measures ?= @options.texture
    c = _.flatten(@harmony, true)

    delta = 0
    refc = []
    refi = -1
    res = measures.map (e) ->
      measure = []
      arrange = e.trim().split(/\s+/)
      arrange.forEach (e2) ->
        if e2[0] == ':'
          refk = MG.keyToPitch('C3') # 48

          while refi < c.length && delta >= 0
            delta -= c[++refi][0]
          inv = /:i*/.exec(e2)[0].length - 1
          bass = (c[refi][1]+c[refi][2][inv])%12
          chord = MG.inverted(c[refi][2], inv)
          inv += 1;
          while e2[inv] in ['+','-']
            refk += {'+':12, '-':-12}[e2[inv++]]
          bass += refk
          refc = []
          for j in [inv...e2.length] by 1
            switch s = e2[j]
              when '0','1','2','3'
                refc.push(bass+chord[parseInt(s)])
              when '+', '-', '#', 'b'
                refc[refc.length-1] += {
                  '+': 12, '-': -12, '#': 1, 'b':-1
                }[s]
              else console.log('skip unknown config '+s);
        else
          tied = false
          terms = e2.split(',')
          dur = if terms.length>=2? then parseInt(terms[1]) else 1
          tmp = []
          for j in [0...terms[0].length] by 1
            e3 = terms[0][j]
            if  e3 == '^'
              tied = true
            else if refc[e3]
              tmp.push(refc[e3])
            else
              console.log 'invalid texture ' + e3
          measure.push(if tied then [dur, tmp, true] else [dur, tmp])
          delta += dur
      return measure
    return res

  toText: ->
    console.log 'to score text'
    if @melody == null
      return
    pitchSimple = MG.pitchToScale(@scale,@key_sig)
    scale_len = MG.scale_class[@scale].length
    ref_oct = 4
    res = @melody.map (e)->
      ret = []
      e.forEach (e1)->
        o = ''
        if typeof e1[1] == 'number'
          e1[1] = [e1[1]]
        e1[1].forEach (e2)->
          if e2<21 || e2>108
            o += '0'
          else
            tmp = pitchSimple(e2)
            #console.log(e2, tmp)
            o += 1 + tmp[0]
            o += {'-2':'--','-1':'-',1:'+',2:'++'}[tmp[1]-ref_oct] || ''
            o += {1:'#',2:'##',3:'###'}[tmp[2]] || ''
        if e1[2] == true
          o += '^'
        if e1[0] > 1
          o += ',' + e1[0] # dur
        ret.push o
      #console.log 'text', e, ret
      return ret.join(' ')

    return res


  toMidi: ->
    console.log('to midi')
    ctrlTicks = @init_ctrlTicks
    q = _.flatten(@melody, true)
    t = if @texture then _.flatten(@texture, true) else null
    m = new simpMidi()
    delta = 0
    vol = 110
    i = 0
    while i < q.length
      e = q[i]
      if typeof e[1] == 'number' && e[1] < 21 && e[1] > 108
        delta += e[0] # skip invalid note
      else
        dur = e[0]
        while q[i][2] == true && i+1 < q.length # tied
          dur += q[++i][0]
        m.addNotes 1, dur * ctrlTicks, q[i][1], vol, 0, delta * ctrlTicks
        delta = 0
      ++i

    m.setTimeSignature @time_sig...
    m.setKeySignature MIDI.key_sig[@key_sig], 'maj'
    m.setTempo @tempo

    if t == null
      m.finish()
      return m
    vol = 80
    l = m.addTrack() - 1
    m.addEvent l, 0, 'programChange', l-1, 0
    t.forEach (e) ->
      m.addNotes l, e[0]*ctrlTicks, e[1], vol
    m.finish()
    return m






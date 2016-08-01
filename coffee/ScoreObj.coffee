MG = @MG ? {}
parser = @parser ? require('./js/parser.js')
class @ScoreObj
  constructor: (options, contents) ->
    options ?= {}
    {@tempo, @time_sig, @key_sig, @ctrl_per_beat, @scale, @volumes, @instrs} = options
    @tempo ?= 120
    @time_sig ?= [4,4]
    @key_sig ?='C'
    @ctrl_per_beat ?= 4
    @scale ?= 'maj'
    @volumes ?= [110,80]
    @instrs ?= [1,1]

    @init_ref = MG.scaleToPitch(@scale, @key_sig)(4 * MG.scale_class[@scale].length)
    @init_ctrlTicks = (60000.0/@tempo/@ctrl_per_beat) >>>0

    @tracks = []
    @harmony = []

    if contents?
      @parse(contents)

  getSettings: ()->
    return{
      tempo: @tempo,
      time_sig: @time_sig,
      key_sig: @key_sig,
      ctrl_per_beat: @ctrl_per_beat,
      scale: @scale,
      volumes: @volumes
    }

  setMelody: (melody, parsed)->
     if parsed? && parsed==true
       @tracks[0] = melody
     else
       @tracks[0] = @parseMelody(melody, {scale: MG.scale_class[@scale],init_ref: @init_ref})

  setTexture: (texture, harmony, parsed)->
    if parsed? && parsed == true
      @harmony = harmony
      @tracks[1] = texture
    else
      @harmony = @parseHarmony(harmony)
      @tracks[1] = @parseMelody(texture, {harmony: @harmony})


  parse: (options) ->
    #@measures = _.zip(options.melody, options.harmony, options.texture)
    if options.melody?
      @setMelody(options.melody, false)
    if options.harmony? && options.texture
      @setTexture(options.texture, options.harmony)


  parseMelody: (m, options)->
    try
      obj = parser.parse(m.join('\n')+'\n')
    catch e
      console.log e.message
      return
    ornamental = (pitch, ref, scale)->
      p = if typeof pitch is 'number' then pitch else pitch.original
      if p > scale.length
        console.log 'exceed scale length'
        p = scale.length
      else if p == 0
        # rest
        return 0
      p = ref + scale[p-1]
      if typeof pitch isnt  'number'
          pitch.ornament.forEach (e)->
            if typeof e == 'number'
              p += e
      return p

    switch obj.mode
      when 'melody'
        {scale, init_ref, harmony} = options
      when 'harmony'
        harmony = options.harmony
    refc = null
    chorder = (()->
      c = if harmony?  then _.flatten(harmony, true) else []
      refi = -1
      delta = 0
      bass = (inv)->
        return (c[refi][1] + c[refi][2][inv]) % 12
      incr = ()->
        return delta -= c[++refi][0]

      chord = (inv) ->
        return MG.inverted(c[refi][2],inv)
      forward = (d)->
        delta += d

      process = ()->
        while refi < c.length && delta >= 0
          incr()

      return {
      bass: bass,
      chord: chord,
      process: process,
      forward: forward
      }

    )()
    # do something
    # 1 set up states
    scale ?= MG.scale_class['maj']
    init_ref ?= 60 # C4
    ref = init_ref
    # 2 iterate obj.data
    res = obj.data.map (m)=>
      #console.log m
      measure = []
      m.forEach (e)->
        if e.ctrl?
          # set options
          switch e.ctrl
            when 'reset'
              ref = init_ref
            when 'normal','repeat_start'
              for k,v of e
                switch k
                  when 't' then 1 # set time_sig
                  when 's' then scale = MG.scale_class[v]
                  when 'k' then 1 # set key_sig
                  when 'r' then 1 # set tempo
                  when 'v' then 1 # set volume
                  when 'o' then 1 # set output instrument
                  when 'i' then 1 # inverse chord
                  when 'p' then ref += v
            when 'chord'
              ref = MG.keyToPitch('C3') # 48
              chorder.process()
              bass = chorder.bass(e.inv)
              chord = chorder.chord(e.inv)

              ref += e.transpose
              bass += ref
              refc = e.pitch.map (p)->
                return ornamental(p,bass,chord)
        else
          # add notes
          pitches = []
          e.pitch.forEach (p)->

            if typeof p == 'string'
              # handle barline
            else if refc?
              if refc[p-1]?
                pitches.push(refc[p-1])
            else
              pitches.push(ornamental(p, ref, scale))
          #console.log 'add pitch', pitches
          if typeof e.dur == 'number'
            measure.push([e.dur, pitches])
            chorder.forward(e.dur)
          else
            measure.push([e.dur.original, pitches, true]);
            chorder.forward(e.dur.original)
      return measure
    return res

  parseHarmony: (measures) ->
    if typeof measures == 'undefined'
      console.log 'empty harmony'
      return
    measures.map (e) ->
      e.trim().split(/\s+/).map (e2) ->
        terms = e2.split(',')
        chord_info = MG.getChords(terms[0],3)
        dur =  if terms.length>=2 then parseInt(terms[1]) else 1
        [dur,chord_info[0],chord_info[1]]

  toText: (m)->
    console.log 'to score text'
    m ?= @tracks[0] # melody
    if ! m?
      console.log 'null melody'
      return
    toScale = MG.pitchToScale(@scale,@key_sig)
    ref_oct = 4
    res = m.map (e)->
      ret = []
      e.forEach (e1)->
        o = ''
        if typeof e1[1] == 'number'
          e1[1] = [e1[1]]
        e1[1].forEach (e2)->
          if e2<21 || e2>108
            o += '0'
          else
            tmp = toScale(e2)
            diff = tmp[1]-ref_oct
            if diff < -1 || diff > 1
              o += ':'
              while diff < -1
                o += '-'
                ref_oct--
                diff++
              while diff > 1
                o += '+'
                ref_oct++
                diff--
              o += ' '

            o += 1 + tmp[0]
            o += {'-1':'-',1:'+'}[diff] || ''
            o += {1:'#',2:'##'}[tmp[2]] || ''
        if e1[2] == true
          o += '^'
        if e1[0] > 1
          o += ',' + e1[0] # dur
        ret.push o
      return ret.join(' ')

    return res


  toMidi: ->
    console.log('to midi')
    ctrlTicks = @init_ctrlTicks
    q = _.flatten(@tracks[0], true)
    t = if @tracks[1] then _.flatten(@tracks[1], true) else null
    m = new simpMidi()
    delta = 0
    vol = @volumes[0]
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
    m.setKeySignature MG.key_sig[@key_sig], 'maj'
    m.setTempo @tempo
    m.setDefaultTempo @tempo
    m.setInstr(@instrs[0])
    MIDI.programChange(0,@instrs[0]-1)

    if t == null
      m.finish()
      return m

    l = m.addTrack() - 1
    vol = @volumes[l-1]
    m.addEvent l, 0, 'programChange', l-1, @instrs[l-1]-1
    MIDI.programChange(l-1,@instrs[l-1]-1)
    t.forEach (e) ->
      m.addNotes l, e[0]*ctrlTicks, e[1], vol
    m.finish()
    return m






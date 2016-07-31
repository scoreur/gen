MG = @MG ? {}
parser = @parser ? require('./js/parser.js')
class @ScoreObj
  constructor: (options, contents) ->
    options ?= {}
    {@tempo, @time_sig, @key_sig, @ctrl_per_beat, @scale, @volumes} = options
    @tempo ?= 120
    @time_sig ?= [4,4]
    @key_sig ?='C'
    @ctrl_per_beat ?= 4
    @scale ?= 'maj'
    @volumes ?= [110,80]

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
    @tracks[0] = if parsed? && parsed==true then melody else @parseMelody(melody,  MG.scale_class[@scale], @init_ref)
  setTexture: (texture, harmony, parsed)->
    if parsed? && parsed == true
      @harmony = harmony
      @tracks[1] = texture
    else
      @harmony = @parseHarmony(harmony)
      @tracks[1] = @parseTexture(texture, @harmony)


  parse: (options) ->
    #@measures = _.zip(options.melody, options.harmony, options.texture)
    if options.melody?
      @setMelody(options.melody, false)
    if options.harmony? && options.texture
      @setTexture(options.texture, options.harmony)


  parseMelody: (m, scale, init_ref)->
    # obj.mode = 'melody'
    # 1 set up states
    try
      obj = parser.parse(m.join('\n')+'\n')
      #console.log obj
      return res
    catch e
      console.log e.message
    scale ?= MG.scale_class['maj']
    init_ref ?= 60 # C4
    ref = init_ref

    ornamental = (pitch)->
      p = if typeof pitch is 'number' then pitch else pitch.original
      if p > scale.length
        console.log 'exceed scale length'
        p = scale.length
      else if p == 0
        # rest
        return 0
      p = ref + scale[p-1]
      if typeof pitch is 'number'
        pitch.ornament.forEach (e)->
          if typeof e == 'number'
            p += e
      return p

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
                  when 'p' then ref += v

        else
          # add notes
          pitches = []
          e.pitch.forEach (p)->
            if typeof p == 'string'
              # handle barline
            else
              pitches.push(ornamental(p))
          #console.log 'add pitch', pitches
          if typeof e.dur == 'number'
            measure.push([e.dur, pitches])
          else
            measure.push([e.dur.original, pitches, true]);
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



  parseTexture: (measures, harmony) ->
    if typeof measures == 'undefined' || typeof harmony == 'undefined'
      console.log 'empty texture'
      return
    c = _.flatten(harmony, true)

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

    if t == null
      m.finish()
      return m
    vol = @volumes[1]
    l = m.addTrack() - 1
    m.addEvent l, 0, 'programChange', l-1, 0
    t.forEach (e) ->
      m.addNotes l, e[0]*ctrlTicks, e[1], vol
    m.finish()
    return m






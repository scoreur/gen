MG = @MG ? {}
parser = @score_parser ? require('./js/parser.js')
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
    @harmony_text = []

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
      instrs: @instrs
    }

  setMelody: (melody, parsed)->
     if parsed? && parsed==true
       @tracks[0] = melody
     else
       options = @getSettings()
       options.scale = MG.scale_class[options.scale]
       options.init_ref = @init_ref
       @tracks[0] = @parseMelody(melody, options)

  setTexture: (texture, harmony, parsed)->
    if parsed? && parsed == true
      @harmony = harmony
      @tracks[1] = texture
    else
      @harmony = @parseHarmony(harmony, @ctrl_per_beat * @time_sig[0])
      options = @getSettings()
      options.harmony = @harmony
      @tracks[1] = @parseMelody(texture, options)


  parse: (options) ->
    #@measures = _.zip(options.melody, options.harmony, options.texture)
    if options.melody?
      @setMelody(options.melody, false)
    if options.harmony? && options.texture
      @harmony_text = options.harmony
      @setTexture(options.texture, options.harmony)


  # @return: array of measures with info
  parseMelody: (m, options)->
    try
      obj = parser.parse(m.join('\n')+'\n')
    catch e
      $.notify('parsing error!', 'warning')
      console.log e.message
      return

    #console.log 'parse melody', options
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

    tatum = options.ctrl_per_beat * options.time_sig[0]
    refc = null
    chorder = (()->
      m_i = 0
      b_i = -1
      delta = 0
      bass = (inv)->
        curchord = harmony[m_i][b_i]
        return (curchord[1] + curchord[2][inv]) % 12
      incr = ()->
        b_i++
        if b_i >= harmony[m_i].length
          b_i = 0
          m_i++
          if m_i >= harmony.length
            m_i = harmony.length - 1
        delta -= harmony[m_i][b_i][0]

        return delta

      chord = (inv) ->
        return MG.inverted(harmony[m_i][b_i][2],inv)
      forward = (d)->
        delta += d

      process = ()->
        while m_i < harmony.length && delta >= 0
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
    tempo_map = {0:options.tempo}
    key_sig_map = {0:options.key_sig}
    time_sig_map = {0:options.time_sig}

    init_ref ?= 60 # C4
    ref = init_ref
    # 2 iterate obj.data
    res = obj.data.map (m,i)=>
      console.log 'parse measure', i
      measure = []
      dur_tot = 0

      m.forEach (e)->

        if e.ctrl?
          # set options
          switch e.ctrl
            when 'reset'
              ref = init_ref
            when 'normal','repeat_start'
              for k,v of e
                switch k
                  when 't' # set time_sig
                    time_sig_map[i] = v
                    tatum = options.ctrl_per_beat * v[0]

                  when 's' then scale = MG.scale_class[v]
                  when 'k'  # set key_sig
                    key_sig_map[i] = v
                    ref = init_ref = MG.keyToPitch(v+4)
                  when 'r' # set tempo
                    tempo_map[i] = v
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
            dur_tot += e.dur
          else
            measure.push([e.dur.original, pitches, true]);
            chorder.forward(e.dur.original)
            dur_tot += e.dur.original
      # renormalize
      if tatum?
        r = tatum / dur_tot
        dur_tot = 0

        measure.forEach (ee)->
          dur_tot += (ee[0] = Math.floor(ee[0] * r))
          return
        measure[measure.length - 1][0] += (tatum - dur_tot)
      return measure
    res.info = {
      time_sigs: time_sig_map,
      key_sigs: key_sig_map,
      tempi: tempo_map
    }
    return res

  parseHarmony: (measures, tatum) ->
    if typeof measures == 'undefined'
      console.log 'empty harmony'
      return
    key_sig = @key_sig
    measures.map (e) ->
      durs = []
      ret = e.trim().split(/\s+/).map (e2) ->
        terms = e2.split(',')
        chord_info = MG.getChords(terms[0],3,key_sig)
        dur =  if terms.length>=2 then parseInt(terms[1]) else 1
        durs.push dur
        [dur,chord_info[0],chord_info[1]]
      if tatum?
        r = tatum / math.sum(durs)
        durs = []
        ret.forEach (ee,ii)->
          durs.push(ret[ii][0] = Math.floor(ee[0] * r))
        ret[ret.length - 1][0] += (tatum - math.sum(durs))
      ret






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
        if typeof e1[1] != 'object'
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
          e1[0] = (e1[0] + '^').replace('^^','^')
        if typeof e1[0] == 'string' || e1[0] > 1
          o += ',' + e1[0] # dur
        ret.push o
      return ret.join(' ')

    return res

  harmony_roman: ->
    toRoman = MG.keyToRoman(@key_sig)
    ex = /[A-G][b#]{0,2}/
    @harmony_text = @harmony_text.map (e,i)->
      e.split(/\s+/).map (e2)->
        r = ex.exec(e2)
        if r == null
          return e2
        else
          return e2.replace(r[0],toRoman(r[0])).replace(/b#/g,'').replace(/#b/g,'')
      .join(' ')
    return @harmony_text.join('\n')

  toMidi: ->
    console.log('to midi')
    ctrlTicks = @init_ctrlTicks
    q = _.flatten(@tracks[0], true)
    t = if @tracks[1] then _.flatten(@tracks[1], true) else null
    m = new simpMidi()
    delta = 0
    vol = @volumes[0]
    m.addEvent 1, 0, 'programChange', 0, @instrs[0]-1
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






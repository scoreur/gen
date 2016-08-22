MG = @MG ? {}
parser = MG.score_parser


###
  measure with data(pitch, dur) and properties
###
class @Measure
  constructor: (@time_sig, @tatum)->
    @pitch = []
    @dur = []
    @time_sig ?= [4,4]
    @tatum ?= 8

  copy: (measure)->
    # copy this measure
    if(arguments.length == 0)
      measure = new Measure(MG.clone(@time_sig), @tatum)
      measure.pitch = MG.clone(@pitch)
      measure.dur = MG.clone(@dur)
      MG.condCopy(@, measure, ['tie', 'incomplete_start'])
      return measure
    # copy from other measure
    @time_sig = MG.clone(measure.time_sig)
    @tatum = measure.tatum
    @pitch = MG.clone(measure.pitch)
    @dur = MG.clone(measure.dur)
    MG.condCopy(measure, @, ['tie','incomplete_start'])

  add: (pitch, dur)->
    @pitch.push pitch
    @dur.push dur
    return

  # get note
  note: (i)->
    [@dur[i], @pitch[i]]
  last: ->
    @note(@len() - 1)
  first: ->
    @note(0)

  setNote: (i, note)->
    @dur[i] = note[0]
    @pitch[i] = note[1]

  len: ->
    @dur.length

  incomplete: ->
    return math.sum(@dur) < @tatum * @time_sig[0]
  overflow: ->
    return math.sum(@dur) > @tatum * @time_sig[0]
  # get pitch at pos, not tested yet
  pos: (beat, tatum)->
    if @dur.length == 0
      return null
    tatum ?= 0
    offset = beat * @tatum + tatum
    d_i = 0
    while d_i < @dur.length && offset > 0
      offset -= @dur[d_i]
      d_i++
    if offset < 0
      d_i--

    if d_i >= @dur.length
      d_i = @dur.length - 1
    return @pitch[d_i]

###
  snippet
  data: array of measures
###
class @Snippet
  constructor: (pitch, dur, options)->
    if arguments.length == 0
      @data = []
      return
    while typeof dur[0] != 'number'
      dur = _.flatten(dur, true)
      pitch = _.flatten(pitch, true)
    tatum = options.tatum ? 8
    time_sig = options.time_sig ? [4,4]
    sec = tatum * time_sig[0]

    MG.condCopy(options, @, ['incomplete_start', 'tie'])

    delta = @incomplete_start ? sec

    m_i = 0
    measure = new Measure(time_sig, tatum)
    res = []
    dur.forEach (e,i)=>

      if delta - e >= 0
        measure.pitch.push pitch[i]
        measure.dur.push e
        delta -= e
        if delta == 0
          res.push measure
          measure = new Measure(time_sig, tatum)
          delta = sec
      else #tie
        while delta < e
          measure.dur.push delta
          measure.pitch.push pitch[i]
          measure.tie = true
          res.push measure
          e -= delta
          delta = sec
          measure = new Measure(time_sig, tatum)
          m_i++
    if delta < sec
      @incomplete_end = sec - delta
      res.push measure
    @data = res
    return
  last: ->
    if @data.length == 0
      return null
    @data[@data.length - 1]
  first: ->
    if @data.length == 0
      return null
    @data[0]
  copy: (s)->
    if arguments.length == 0
      s = new Snippet()
      s.data = @data.map (e)-> e.copy()
      MG.condCopy(@, s, ['incomplete_start', 'tie'])
      return s

    @data = s.data.map (e)-> e.copy()
    condCopy(s, @, ['incomplete_start', 'tie'])



  # concat with other snippet
  join: (s, modify)->
    ret = @copy()
    s = s.copy()


    if ret.data.length > 0
      if modify? && modify.smooth?
        last_measure = ret.last()
        first_measure = s.first()
        console.log 'new smooth', last_measure, first_measure
        last_note = last_measure.last()
        first_note = first_measure.first()
        if last_measure.len() > 1
          pre_note = last_measure.note(last_measure.len() - 2)
          if (last_note[1] > pre_note[1] && last_note[1] > first_note[1]) || (last_note[1] < pre_note[1] && last_note[1] < first_note[1])
            # swap, make smooth
            last_measure.setNote(last_measure.len() - 2, last_note)
            last_note = pre_note
            pre_note = last_measure.note(last_measure.len() - 2)

        if last_note[1] - first_note[1] <= -12
          last_note[1] += 12
        else if last_note[1] - first_note[1] >= 12
          last_note[1] -= 12
        #console.log i, last_note, first_note
        last_measure.setNote(last_measure.len() - 1, last_note)
        console.log 'smooth', last_measure, first_measure

      tmp = ret.data.pop()
      measure = null
      if @incomplete_end? && s.incomplete_start?
        measure = new Measure()
        measure.pitch = tmp.pitch.concat(s.data[0].pitch)
        measure.dur = tmp.dur.concat(s.data[0].dur)
        if s.data[0].tie? && s.data[0].tie == true
          measure.tie = s.data[0].tie
        s.data.shift()
      else
        measure = tmp.copy()
      ret.data.push measure

    ret.data = ret.data.concat(s.data)
    MG.condCopy(s, ret, ['incomplete_end'])

    return ret


  cadence: (key)->
    last_measure = @last()
    last_measure.dur.sort()
    tonic = MG.key_class[key]
    last_note = last_measure.last()
    adjust = (tonic - (last_note[1] % 12)) %% 12
    if adjust > 6
      adjust -= 12
    last_note[1] += adjust
    console.log adjust, 'adjust->', last_note
    if last_measure.len() > 1
      pre_note = last_measure.note(last_measure.len() - 2)

      #console.log 'pre_note', pre_note
      if last_note[1] - pre_note[1] >= 12
        last_note[1] -= 12;
      if last_note[1] == pre_note[1]
        #console.log 'may merge last two notes', last_note
        return
    last_measure.setNote(last_measure.len() - 1, last_note)
  toScore: ()->
    @data.map (measure)->
      ret = _.zip(measure.dur, measure.pitch)
      if measure.tie? && measure.tie = true
        ret[ret.length - 1].push(true)
      ret


###
  score object, with tracks and settings
  one track is an array of measure, with property
###
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
    @instrs ?= [1,1] #grand_piano

    @init_ref = MG.scaleToPitch(@scale, @key_sig)(4 * MG.scale_class[@scale].length)
    @init_ctrlTicks = (60000.0/@tempo/@ctrl_per_beat) >>>0

    @tracks = []
    @harmony = []
    @harmony_text = []

    if contents?
      if contents.melody?
        @setMelody(contents.melody, false)
      if contents.harmony? && contents.texture?
        @harmony_text = contents.harmony
        @setTexture(contents.texture, contents.harmony)

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
       @tracks[0] = MG.parseMelody(melody, options)

  setTexture: (texture, harmony, parsed)->
    if parsed? && parsed == true
      @harmony = harmony
      @tracks[1] = texture
    else
      @harmony = MG.parseHarmony(harmony, @key_sig, @ctrl_per_beat * @time_sig[0])
      options = @getSettings()
      options.harmony = @harmony
      @tracks[1] = MG.parseMelody(texture, options)


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
    #console.log('to midi')
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






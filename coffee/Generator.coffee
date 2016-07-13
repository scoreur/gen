MG = @MG ? {}

class @Generator
  constructor: (@schema) ->
    @keyref = MIDI.keyToNote[@schema.key_sig+'4'];
    @scale = @schema.scale ? 'maj'
    @pitchSimple = MG.scaleToPitch(@scale, @schema.key_sig)
    @res = {}

  generate: ->
    for i,dur of @schema.blocks
      mode = @schema.melody[i]
      switch mode.mode
        when 'random'
          @res[i] = @gen_random(dur, mode.options)
        when 'transpose'
          @res[i] = @gen_transpose(dur, mode.options)
        when 'chord'
          @res[i] = @gen_chord(dur, mode.options)
    return @res

  gen_transpose: (dur, options) ->
    res =
      dur: []
      pitch: []
    transpose = MG.transposer(options.scale, @schema.key_sig)
    src = @res[options.src]
    # TODO: handle offset
    refd = 0
    while dur > 0
      tmp = []
      tmp2 = []
      # pitch
      src.dur[refd].map (e, i) ->
        if dur - e >= 0
          tmp.push e
          tmp2.push transpose(src.pitch[refd][i], options.interval)
          dur -= e
        else if dur > 0
          tmp.push dur
          tmp2.push transpose(src.pitch[refd][i], options.interval)
          dur = 0
        return
      refd++
      res.dur.push tmp
      res.pitch.push tmp2
    res

  gen_random:  (dur, options) ->
    toPitch = MG.scaleToPitch(@scale, @schema.key_sig)
    scale_len = MG.scale_class[@scale].length
    res =
      dur: []
      pitch: []
    n = dur / options.rhythm[0] >>> 0
    rc1 = @rndPicker(options.rhythm[1], options.rhythm[2])
    console.log options.rhythm
    rc2 = @rndPicker(options.interval.choices, options.interval.weights)
    pre = scale_len * 4
    i = 0
    while i < n
      res.dur.push rc1.gen()
      tmp = []
      j = 0
      while j < res.dur[i].length
        pre += rc2.gen()
        if pre < 0
          pre = 0
        if pre > scale_len * 8
          pre = scale_len * 8
        #console.log(pre, toPitch(pre));
        tmp.push toPitch(pre)
        ++j
      res.pitch.push tmp
      ++i
    res

  gen_chord: (dur, options) ->
    toPitch = MG.scaleToPitch(@scale, @schema.key_sig)
    toScale = MG.pitchToScale(@scale, @schema.key_sig)
    chords = _.flatten(ScoreObj::parseHarmony(options.chords, 1), true)
    scale_len = MG.scale_class[@scale].length
    console.log 'chords', chords, 'scale len', scale_len
    refc = 0
    refdur = chords[refc][0]
    # obtain chords pitch
    # not chromatic
    res =
      dur: []
      pitch: []
    n = dur / options.rhythm[0] >>> 0
    rc1 = @rndPicker(options.rhythm[1], options.rhythm[2])
    rc2 = @rndPicker(options.interval.choices, options.interval.weights)
    pre = scale_len * 4
    pre2 = pre
    i = 0
    while i < n
      res.dur.push rc1.gen()
      tmp = []
      j = 0
      while j < res.dur[i].length
        if Math.random() > 0.6
          pre += rc2.gen()
          if pre < 0
            pre = 0
          if pre > scale_len * 8
            pre = scale_len * 8
          tmp.push toPitch(pre)
        else
          r = Math.random() * 9 >> 0
          ii = r % 3
          if refc + 1 < chords.length and refdur < 0
            refdur += chords[++refc][0]
          pre = toPitch(pre)
          new_pre = chords[refc][1] + chords[refc][2][ii] + 12 * (Math.floor(r / 3) - 1)
          while new_pre - pre > 12
            new_pre -= 12
          while pre - new_pre > 12
            new_pre += 12
          if new_pre < 21
            new_pre = 21
          if new_pre > 108
            new_pre = 108
          tmp.push new_pre
          fix = toScale(new_pre)
          pre = fix[0] + fix[1] * scale_len
        #console.log(pre, chords[refc])
        refdur -= options.rhythm[0]
        ++j
      res.pitch.push tmp
      ++i
    res


  b2score: (b, sec, flat) ->
    dur = if flat then b.dur else _.flatten(b.dur, true);
    pitch = if flat then else _.flatten(b.pitch, true);
    # console.log dur.length == pitch.length
    ret = []
    # separate measure, add ties
    tmp = []
    delta = 0
    dur.forEach (e,j)->
      while delta + e > sec # exceed
        tmp.push [sec-delta, pitch[j], true] # tie
        ret.push tmp
        tmp = []
        e -= sec-delta
        delta = 0
      tmp.push [e, pitch[j]]
      delta += e
      if delta == sec
        ret.push tmp
        tmp = []
        delta = 0
    if tmp.length > 0
      ret.push tmp  # incomplete measure
    return ret


  toScoreObj: ->
    if res == {}
      @generate()
    sec = @schema.ctrl_per_beat * @schema.time_sig[0] # separate bar
    res = {}
    console.log 'to Score obj'
    for e0, b of @res
      res[e0] = @b2score(b, sec)
    res = @schema.structure.map (e)-> res[e]

    obj = new ScoreObj({
      ctrl_per_beat:@schema.ctrl_per_beat,
      tempo: @schema.tempo,
      time_sig: @schema.time_sig,
      key_sig: @schema.key_sig,
      scale: @schema.scale
    })

    obj.melody = _.flatten res, true
    return obj

  rndPicker: (choices, weights) ->
    s = weights.reduce ((a,b)-> a+b), 0
    p = weights.map (e)-> e/s
    s = 0
    for i in [0...p.length] by 1
      s = (p[i] += s)

    # TODO: add random seed
    # seed = Date.now();
    return gen:  ->
      r = Math.random()
      for i in [0...p.length] by 1
        if r < p[i]
          return choices[i]
      return choices[p.length-1]

  gen_random_new: (end_pos, states, start, constraint)->
    # start from states[0]
    res = []
    cur = state: start.state, pos: start: start.pos, val: start.val
    while cur.pos < end_pos
      nexts = states[cur.state].choices.map (func)->
        val = func(cur.pos, cur.val)
        weight = constraint(cur.pos, cur.val, val)
        return [val, weight]

      merge = _.unzip(nexts)
      picker = @rndPicker(merge[0], merge[1])
      val = picker.gen()
      if cur.pos + val.dur >= end_pos
        val.dur = end_pos - cur.pos
      # transition
      cur.state = states.transition(cur.pos,val)
      cur.pos += val.dur
      cur.val = val
      res.push(val)
    return res

  sample_start:
    state: 'start',
    pos: 0,
    val:
      dur: 2
      val: 60 # 'number' or 'object array' for terminal, otherwise subtree
      weight: [] # optional

  sample_states:
    transition: (pos, val)->

    'start':
      choices: (pos, val)->


    'middle':
      choices: (pos, val)->

    'other':
      choices: (pos, val)->

  sample_constraint: (pos, preval, val)->
    weights = [4,2,4,6,6,8, 1,8,6,6,2,2]
    return weights[(val.val-preval.val)%%12]





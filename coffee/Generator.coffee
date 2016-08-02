MG = @MG ? {}

class @Generator
  constructor: (@settings, @schema) ->
    @settings.key_sig ?= 'C'
    @settings.scale ?= 'maj'
    @settings.instrs ?= [1,1]
    @keyref = MG.keyToPitch[@settings.key_sig+'4'];
    @scale = MG.scale_class[@settings.scale]
    @seeds = @schema.seeds
    @res = {}

    @toPitch = MG.scaleToPitch(@settings.scale, @settings.key_sig)
    @toScale = MG.pitchToScale(@settings.scale, @settings.key_sig)




  # reproducable random number generator
  _seed = 6
  seededRandom = (max, min) ->
    max = max || 1
    min = min || 0
    _seed = (_seed * 9301 + 49297) % 233280;
    rnd = _seed / 233280
    return min + rnd * (max - min)
  MG.seededRandom = seededRandom

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
        when 'reverse'
          @res[i] = @gen_reverse(mode.options)
    console.log @res, 'res'
    return @res

  newChoices = (pre, choices, weights)->
    ret = {}
    choices.forEach (e,i)->
      ret[pre+e] = weights[i]
      return
    return ret


  gen_transpose: (dur, options) ->
    res =
      dur: []
      pitch: []
    transpose = MG.transposer(options.scale, @settings.key_sig)
    src = @res[options.src]
    interval = options.interval
    if typeof interval == 'number'
      interval = [interval]
    # TODO: handle offset
    refd = 0
    cur_i = 0
    while dur > 0
      if refd >= src.dur.length
        refd -= src.dur.length
        cur_i = (cur_i+1)%interval.length
        console.log 'shift to next interval'
      tmp = []
      tmp2 = []
      # pitch
      src.dur[refd].forEach (e, i) ->
        if dur - e >= 0
          tmp.push e
          tmp2.push transpose(src.pitch[refd][i], interval[cur_i])
          dur -= e
        else if dur > 0
          tmp.push dur
          tmp2.push transpose(src.pitch[refd][i], interval[cur_i])
          dur = 0
        return
      refd++
      res.dur.push tmp
      res.pitch.push tmp2
    res
  gen_reverse: (options) ->
    res =
      dur: []
      pitch: []
    src = @res[options.src]
    # shallow version options.deep = false
    if options.deep? && options.deep == true
      res.dur = src.dur.slice().reverse().map (arr)->
        return arr.slice().reverse()
      res.pitch = src.pitch.slice().reverse().map (arr)->
        return arr.slice().reverse()
    else
      res.dur = src.dur.slice().reverse()
      res.pitch = src.pitch.slice().reverse()
    console.log res, 'reverse ' + options.src
    return res



  gen_exact: (options)->
    res =
      dur: options.dur
      pitch: options.pitch

  gen_random:  (dur, options) ->
    toPitch = @toPitch
    scale_len =@scale.length
    toScale = @toScale
    res =
      dur: []
      pitch: []

    seed = {}
    if options.rhythm.seed? && @seeds?
      seed = @seeds[options.rhythm.seed]
    else
      seed.dur = options.rhythm[0]
      seed.choices = options.rhythm[1]
      seed.weights = options.rhythm[2]

    seed2 = {}
    if options.interval.seed? && @seeds?
      seed2 = @seeds[options.interval.seed]
    else
      seed2 = options.interval

    n = dur / seed.dur >>> 0
    rc1 = rndPicker(seed.choices, seed.weights)
    pre = scale_len * 4

    i = 0
    while i < n
      res.dur.push rc1.gen()
      tmp = []
      j = 0
      while j < res.dur[i].length
        raw_choices = newChoices(pre, seed2.choices, seed2.weights)
        choices = {}
        for k,v of raw_choices
          if k >= 0 && k <= scale_len * 8
            k = toPitch(k)
            if k < 48 || k > 84
              v /= 2
              console.log 'less'
            choices[k] = v
        rc2 = rndPicker(_.keys(choices), _.values(choices))
        pre = parseInt(rc2.gen())
        tmp.push pre
        pre = toScale(pre)
        pre = pre[0] + pre[1] * scale_len
        ++j
      console.log tmp
      res.pitch.push tmp
      ++i
    res


  gen_chord: (dur, options) ->
    toPitch = @toPitch
    toScale = @toScale
    chords = _.flatten(ScoreObj::parseHarmony(options.chords), true)
    scale_len = @scale.length
    refc = 0
    refdur = chords[refc][0]
    # obtain chords pitch
    # not chromatic
    res =
      dur: []
      pitch: []
    seed = {}
    if options.rhythm.seed? && @seeds?
      seed = @seeds[options.rhythm.seed]
    else
      seed.dur = options.rhythm[0]
      seed.choices = options.rhythm[1]
      seed.weights = options.rhythm[2]
    seed2 = {}
    if options.interval.seed? && @seeds?
      seed2 = @seeds[options.interval.seed]
    else
      seed2 = options.interval

    n = dur / seed.dur >>> 0
    rc1 = rndPicker(seed.choices, seed.weights)

    pre = scale_len * 4
    pre2 = pre
    i = 0
    while i < n
      res.dur.push rc1.gen()
      tmp = []
      j = 0
      while j < res.dur[i].length
        if refc + 1 < chords.length and refdur < 0
          refdur += chords[++refc][0]
        cur_chord = chords[refc]
        raw_choices = newChoices(pre, seed2.choices, seed2.weights)
        choices = {}
        for k,v of raw_choices
          if k >= 0 && k <= scale_len * 8
            k = toPitch(k)
            if k < 48 || k > 84
              v /= 4
              console.log 'less'
            cur_chord[2].forEach (ee,ii)->
              if (k - cur_chord[1]) %% 12 == ee
                console.log 'chord tone'
                v *= 2
            choices[k] = v
        rc2 = rndPicker(_.keys(choices), _.values(choices))
        pre = parseInt(rc2.gen())
        tmp.push pre

        pre = toScale(pre)

        pre = pre[0] + pre[1] * scale_len


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
    sec = @settings.ctrl_per_beat * @settings.time_sig[0] # separate bar
    res = {}
    for e0, b of @res
      res[e0] = @b2score(b, sec)
    res = @schema.structure.map (e)-> res[e]


    obj = new ScoreObj(@settings)

    obj.setMelody  _.flatten(res, true), true
    return obj

  rndPicker = (choices, weights) ->
    s = weights.reduce ((a,b)-> a+b), 0
    p = weights.map (e)-> e/s
    s = 0
    for i in [0...p.length] by 1
      s = (p[i] += s)

    # TODO: add random seed
    # seed = Date.now();
    return gen:  ->
      r = seededRandom() #Math.random()
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
      picker = rndPicker(merge[0], merge[1])
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





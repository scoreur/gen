MG = @MG ? {}

MG.ref_midi_info = null

parser = MG.schema_parser

###
  generating music from schema
###
class @Generator
  constructor: (@settings, @schema) ->
    @settings.key_sig ?= 'C'
    @settings.scale ?= 'maj'
    @settings.instrs ?= [1,1]
    @keyref = MG.keyToPitch[@settings.key_sig+'4'];
    @scale = MG.scale_class[@settings.scale]

    @seeds = {}
    for k,v of @schema
      if v.mode? && v.mode == 'distribution'
        @seeds[k] = v
    @res = {}

    @toPitch = MG.scaleToPitch(@settings.scale, @settings.key_sig)
    @toScale = MG.pitchToScale(@settings.scale, @settings.key_sig)

  seededRandom = MG.seededRandom

  # traverse the parsed tree
  produce: (variable, global)->
    if variable.mode? # terminal
      switch variable.mode
        when 'chord'
          return @gen_chord(variable)
        when 'random'
          return @gen_random(variable)
        when 'distribution'
          return variable
    variable.node ?= {}
    variable.action ?= {}
    #console.log 'action', variable.action
    global ?= {}
    local = _.keys(variable.node) # sort to top order
    dependency = {}
    for k,v of variable.node
      dependency[k] = []
      if v.mode?
        continue
      v.node ?= {}
      for i in v.structure
        if i not of v.node && i in local
          dependency[k].push i # k depends on i
    # console.log 'dependency', dependency
    # top sort
    local = MG.top_sort(dependency)
    next_global = Object.assign({}, global)

    for k in local
      next_global[k] = @produce(variable.node[k], next_global)

    ret = new Snippet()

    variable.structure.forEach (v,i) =>
      if v of next_global
        tmp = next_global[v]
        if "_#{i}_#{v}" of variable.action
          options = variable.action["_#{i}_#{v}"]
          console.log 'ACT', options.mode

          switch options.mode
            when 'transpose'
              tmp = @act_transpose(options, tmp)
            when 'reverse'
              tmp = @act_reverse(options, tmp)
        ret = ret.join(tmp, {smooth:'true'})
        console.log 'concat', v, ret.data.length
      else
        console.log 'miss', v
    return ret


  # low_level / high_level
  generate: ->

    sec = @settings.ctrl_per_beat * @settings.time_sig[0] # separate bar
    res_eval = []

    @snippet =  @produce(@schema.S)
    @snippet.cadence(@settings.key_sig)
    console.log @snippet
    @res2 = @snippet.toScore()

    # evaluation

    console.log 'produce',@res2

    res = @res2

    # between-block modification
    for i in [1...res.length] by 1
      #smooth
      last_measure = res[i-1][res[i-1].length-1]
      first_measure = res[i][0]

      last_note = last_measure[last_measure.length-1][1]
      first_note = first_measure[0][1]

    ### cadence
    last_block = res[res.length-1]
    last_measure = last_block[last_block.length-1].slice()

    last_measure.sort (a,b)->
      a[0] - b[0]
    tonic = MG.key_class[@settings.key_sig]
    last_note = last_measure[last_measure.length-1][1]
    if typeof last_note == 'object'
      last_note = last_note[0]
    adjust = (tonic - (last_note % 12)) %% 12
    last_note += adjust
    console.log adjust, 'adjust', last_note, 'last_note'

    if last_measure.length > 1
      pre_note = last_measure[last_measure.length - 2][1]
      if typeof pre_note == 'object'
        pre_note = pre_note[0]
      #console.log 'pre_note', pre_note
      if last_note - pre_note >= 12
        last_note -= 12;
      if last_note == pre_note
        #console.log 'may merge last two notes', last_note
        return

    last_measure[last_measure.length - 1][1] = last_note

    last_block[last_block.length - 1] = last_measure
    ###
    # ornamentation
    return res

  evaluate: (data)->
    info = MG.midi_statistics(data)
    console.log 'eval', data, info

    report = {}

    if(info.rhythm.length == 0)
      return
    r_all = 0
    info.rhythm.forEach (e)->
      r_all += e[1]
    report.simp = (info.rhythm[0][1]/r_all )
    report.range = _.max(info.range)
    console.log 'report', report.simp, report.range


    if MG.ref_midi_info != null
      ref_beat_dur = math.sum(MG.ref_midi_info.rhythm[0][0].split(','))
      info_dur =  math.sum(info.rhythm[0][0].split(','))
      console.log 'compare',info_dur, ref_beat_dur

    # compare with existing midi


    # optimize

    return info

  newChoices = (pre, choices, weights)->
    ret = {}
    choices.forEach (e,i)->
      ret[pre+e] = weights[i]
      return
    return ret




  act_transpose: (options, acted) ->

    dur = options.dur
    res = new Snippet()
    src = acted.data

    console.log src

    transpose = MG.transposer(options.scale, @settings.key_sig)
    interval = options.interval
    if typeof interval == 'number'
      interval = [interval]
    # TODO: handle offset
    refd = 0
    cur_i = 0
    while dur > 0
      if refd >= src.length
        refd -= src.length
        cur_i = (cur_i+1)%interval.length
        console.log 'shift to next interval'
      tmp = new Measure(src[0].time_sig, src[0].tatum)
      # pitch
      src[refd].dur.forEach (e, i) ->
        if dur - e >= 0
          tmp.dur.push e
          tmp.pitch.push transpose(src[refd].pitch[i], interval[cur_i])
          dur -= e
        else if dur > 0
          tmp.dur.push dur
          tmp.pitch.push transpose(src[refd].pitch[i], interval[cur_i])
          dur = 0
        return
      refd++
      res.data.push tmp
    console.log acted, 'transpose-> ', res
    res
  act_reverse: (options, acted) ->
    res = acted.copy();
    # shallow version options.deep = false
    if options.deep? && options.deep == true
      res.data.reverse().forEach (arr)->
        arr.pitch.reverse()
        arr.dur.reverse()
    else
      res.data.reverse()
    console.log acted, 'reverse-> ', res
    res

  act_aug: (options, acted)->


  act_dim: (options, acted)->



  gen_exact: (options)->
    res =
      dur: options.dur
      pitch: options.pitch

  gen_random:  (options) ->
    console.log 'deprecated!!'
    dur = options.dur
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
    swarp = options.rhythm.swarp
    swarp ?= 1

    seed2 = {}
    if options.interval.seed? && @seeds?
      seed2 = @seeds[options.interval.seed]
    else
      seed2 = options.interval

    n = dur // (seed.dur/swarp)


    rc1 = rndPicker(seed.choices, seed.weights)
    pre = scale_len * 4

    i = 0
    while i < n
      new_dur = rc1.gen().map (d)-> d//swarp
      res.dur.push new_dur

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


  gen_chord: (options) ->
    dur = options.dur
    toPitch = @toPitch
    toScale = @toScale
    harmony = MG.parseHarmony(options.chords, @settings.key_sig)
    chorder = MG.harmony_progresser(harmony)

    scale_len = @scale.length
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

    range = options.range
    range ?= [48, 90]


    # quadratic distribution
    range_dist = (k)->
      if k < range[0] || k > range[1]
        return 0
      else
        return 0.25 + 3 * (k-range[0]) * (range[1]-k) / (range[1]-range[0])**2
    if options.dist? && options.dist == 'linear'
      range_dist = (k)->
        if k < range[0] || k > range[1]
          return 0
        else # quadratic distribution
          return 1 - 2 * Math.abs(k-(range[0]+range[1])/2) / (range[1]-range[0])



    swarp = options.rhythm.swarp
    swarp ?= 1

    n = dur // (seed.dur/swarp)
    rc1 = rndPicker(seed.choices, seed.weights)

    pre = scale_len * 4
    pre2 = pre
    i = 0
    while i < n
      new_dur = rc1.gen().map (d)-> d//swarp
      res.dur.push new_dur
      tmp = []
      j = 0
      while j < res.dur[i].length
        chorder.process()
        cur_chord = chorder.chord()
        bass = chorder.bass()
        raw_choices = newChoices(pre, seed2.choices, seed2.weights)
        choices = {}
        # TODO: add chord tone within one octave
        for k,v of raw_choices
          if k >= 0 && k <= scale_len * 8
            k = toPitch(k)
            v *= range_dist(k)
            cur_chord.forEach (ee,ii)->
              if (k - bass) %% 12 == ee
                console.log 'chord tone'
                v *= 4
            choices[k] = v
        rc2 = rndPicker(_.keys(choices), _.values(choices))
        pre = parseInt(rc2.gen())
        tmp.push pre

        pre = toScale(pre)

        pre = pre[0] + pre[1] * scale_len

        chorder.forward(res.dur[i][j])
        ++j
      res.pitch.push tmp
      ++i
    # evaluation , optimization
    op = {time_sig:@settings.time_sig, tatum:@settings.ctrl_per_beat}
    if options.incomplete_start?
      op.incomplete_start = options.incomplete_start
    res = new Snippet(res.pitch, res.dur, op)
    #res.data

  # separate into measures
  b2score: (b, sec) ->
    dur = b.dur
    pitch = b.pitch
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
    if _.keys(@res2).length == 0
      @generate()

    res = @res2

    obj = new ScoreObj(@settings)
    melody = res
    melody.info = {
      time_sigs:{0:@settings.time_sig},
      key_sigs: {0: @settings.key_sig},
      tempi: {0: @settings.tempo}
    }

    obj.setMelody  melody, true
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





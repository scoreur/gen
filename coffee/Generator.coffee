MG = @MG ? {}

MG.ref_midi_info = null

parser = @schema_parser ? require('./js/schema_parser')


# produce text for parsed obj
parser.produce = (obj)->
  produceVar = (o, indent)->
    indent ?= ''
    ret = ''
    tmp = []
    if Array.isArray(o)
      ret += '[\n'
      indent += '  '
      for k in o
        tmp.push indent + produceVar(k, indent)
      ret += tmp.join(',\n')
      indent = indent.substr(2)
      ret += '\n' + indent + ']'
    else if typeof o == 'object'
      ret = '{\n'
      indent += '  '
      for k,v of o
        if k == 'mode'
          tmp.push indent + v.toString()
        else
          tmp.push indent + k + ' : ' + produceVar(v, indent)
      ret += tmp.join(',\n')
      indent = indent.substr(2)
      ret += '\n' + indent + '}'
    else if typeof o == 'string'
      ret += '"' + o + '"'
    else
      ret += o.toString()
    ret


  produce = (nodes, indent)->
    indent ?= ''
    ret = ''
    indent += '  ' # indent two spaces
    for k,v of nodes
      #console.log k
      if v.structure?
        ret += indent + k + ' -> '
        if v.node? && Object.keys(v.node).length > 0
          ret += '{\n'
          ret += produce(v.node, indent)
          ret += indent + '}'
        ret += '\n'
        #console.log v.structure
        v.structure.forEach (e)->
          ret += indent + e + ' '
          if v.action? && e of v.action
            ret += produceVar(v.action[e], indent) #nodes.action[k].toString()
          ret += '\n'
        ret += indent + ';\n'
      else
        ret += indent + k + ' = '
        ret += produceVar(v, indent) + ';\n'
    indent = indent.substr(2) # unindent
    return ret


  indent = ''
  produce(obj, indent)


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

  parseSchema: (o)->
    parser.parse(o)
  produceSchema: (o)->
    parser.produce(o)




  # reproducable random number generator
  _seed = 6
  seededRandom = (max, min) ->
    max = max || 1
    min = min || 0
    _seed = (_seed * 9301 + 49297) % 233280;
    rnd = _seed / 233280
    return min + rnd * (max - min)
  MG.seededRandom = seededRandom


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
      ref_beat_dur = MG.ref_midi_info.rhythm[0][0].split(',').map (ee)->
        parseInt(ee)
      ref_beat_dur = _.reduce(ref_beat_dur, (a,b)->
        a+b
      ,0)
      info_dur =  info.rhythm[0][0].split(',').map (ee)->
        parseInt(ee)
      info_dur =  _.reduce(info_dur, (a,b)->
        a+b
      ,0)
      console.log 'compare',info_dur, ref_beat_dur


      # compare with existing midi


    # optimize

    return info

  top_sort = (dependency)->
    n = Object.keys(dependency).length

    remove_one = (o)->
      for k,v of dependency
        if o in v
          v.splice(v.indexOf(o),1)
      delete dependency[o]
    get_one = ->
      for k,v of dependency
        if v.length <= 0
          return k
      return null
    ret = []
    while ret.length < n
      tmp = get_one()
      if tmp == null
        console.log 'circular dependency', dependency
        break
      else
        ret.push tmp
        remove_one(tmp)
    #console.log 'top sort', ret
    return ret

  obj_merge = (v)->
    ret = {pitch:[], dur:[]}
    if Array.isArray(v)
      for i in v
        ret.pitch = ret.pitch.concat (MG.circularClone(i.pitch))
        ret.dur = ret.dur.concat (MG.circularClone(i.dur))
    else
        ret.pitch = MG.circularClone(v.pitch)
        ret.dur = MG.circularClone(v.dur)
    ret

  # testing using dur
  produce: (variable, global)->
    if variable.mode? # terminal
      return @gen_chord(variable)
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
    local = top_sort(dependency)
    next_global = Object.assign({}, global)

    for k in local
      next_global[k] = @produce(variable.node[k], next_global)
    for k,v of variable.action
      switch v.mode
        when 'transpose'
          next_global[k] = @gen_transpose(v,obj_merge(next_global[k]))
        when 'reverse'
          next_global[k] = @gen_reverse(v,obj_merge(next_global[k]))
        when 'distribution'
          next_global[k] = v



    ret = []
    for v in variable.structure
      if v of next_global
        ret.push obj_merge(next_global[v])
      else
        console.log 'miss', v
    return ret


  # low_level / high_level
  generate: ->

    sec = @settings.ctrl_per_beat * @settings.time_sig[0] # separate bar
    res_eval = []

    @res2 =  @produce(@schema.S).map (b)=>
      # res_eval.push @evaluate(@b2score(b, @settings.ctrl_per_beat))
      @b2score(b, sec)


    # evaluation

    console.log 'produce',@res2

    res = @res2

    # between-block modification
    for i in [1...res.length] by 1
      last_measure = res[i-1][res[i-1].length-1]
      first_measure = res[i][0]

      last_note = last_measure[last_measure.length-1][1]
      first_note = first_measure[0][1]


      if last_measure.length > 1
        pre_note = last_measure[last_measure.length - 2][1]
        if (last_note > pre_note && last_note > first_note) || (last_note < pre_note && last_note < first_note)
          # swap, make smooth
          last_measure[last_measure.length - 2][1] = last_note
          last_note = pre_note
          pre_note = last_measure[last_measure.length - 2][1]
          #console.log 'smooth', i, pre_note, last_note, first_note
      if last_note - first_note <= -12
        last_note += 12
      else if last_note - first_note >= 12
        last_note -= 12
      #console.log i, last_note, first_note
      last_measure[last_measure.length - 1][1] = last_note
      res[i-1][res[i-1].length - 1] = last_measure

    # cadence
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
        #last_note = last_measure.pop()
        #last_measure[last_measure.length - 1][0] += last_note[0]
        #last_note = last_note[1]

    last_measure[last_measure.length - 1][1] = last_note

    last_block[last_block.length - 1] = last_measure

    # ornamentation
    return res

  newChoices = (pre, choices, weights)->
    ret = {}
    choices.forEach (e,i)->
      ret[pre+e] = weights[i]
      return
    return ret




  gen_transpose: (options, src) ->

    dur = options.dur
    res =
      dur: []
      pitch: []
    transpose = MG.transposer(options.scale, @settings.key_sig)
    src ?= @res[options.src]
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
    console.log src, 'transpose-> ', res
    res
  gen_reverse: (options, src) ->
    res =
      dur: []
      pitch: []
    src ?= @res[options.src]
    # shallow version options.deep = false
    if options.deep? && options.deep == true
      res.dur = src.dur.slice().reverse().map (arr)->
        return arr.slice().reverse()
      res.pitch = src.pitch.slice().reverse().map (arr)->
        return arr.slice().reverse()
    else
      res.dur = src.dur.slice().reverse()
      res.pitch = src.pitch.slice().reverse()
    console.log res, 'reverse-> ', src
    res



  gen_exact: (options)->
    res =
      dur: options.dur
      pitch: options.pitch

  gen_random:  (options) ->
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
        if refc + 1 < chords.length and refdur < 0
          refdur += chords[++refc][0]
        cur_chord = chords[refc]
        raw_choices = newChoices(pre, seed2.choices, seed2.weights)
        choices = {}
        for k,v of raw_choices
          if k >= 0 && k <= scale_len * 8
            k = toPitch(k)
            v *= range_dist(k)
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
    # evaluation , optimization

    res

  # sperate into measures
  b2score: (b, sec, flat) ->
    dur = if flat then b.dur else _.flatten(b.dur, true);
    pitch = if flat then b.pitch else _.flatten(b.pitch, true);
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
    melody = _.flatten(res, true)
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





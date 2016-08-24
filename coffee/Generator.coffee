MG = @MG || (module? && require? && require('./musical').MG) || {}

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
    @map_gen = {
      'random': @gen_random,
      'exact': @gen_exact,
      'skeleton': @gen_skeleton,
      'distribution': (v)-> v
    }
    @map_act = {
      'transpose': @act_transpose,
      'reverse': @act_reverse,
      'diminution': @act_dim,
      'augmentation': @act_aug,
      'double': @act_double,
      'acciaccatura': @act_acciaccatura
    }

  seededRandom = MG.seededRandom
  rndPicker = MG.rndPicker

  # traverse the parsed tree
  produce: (variable, global)->

    if variable.mode? # terminal
      if @map_gen[variable.mode]?
        return @map_gen[variable.mode].call(@,variable)
      else
        console.log 'unrecognized generating mode'

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
    modify = {}

    variable.structure.forEach (v,i) =>
      if v of next_global
        tmp = next_global[v]
        next_modify = null
        if "_#{i}_#{v}" of variable.action
          options = variable.action["_#{i}_#{v}"]
          if options.modify?
            next_modify = options.modify
          if @map_act[options.mode]?
            tmp = @map_act[options.mode].call(@, options, tmp)
          else
            console.log 'unsupported action', options.mode
        ret = ret.join(tmp, modify)
        if next_modify != null
          modify = MG.clone(next_modify)
        else
          modify = {}
      else
        console.log 'miss', v
    # last modify, maybe cadence
    if modify.cadence?
      ret.cadence(modify.cadence)

    return ret


  # low_level / high_level
  generate: ->
    @snippet =  @produce(@schema.S)
    console.log @snippet
    @res2 = @snippet.toScore(@settings.key_sig)
    console.log 'score', @res2

    # evaluation

    # ornamentation

    return @res2

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

    key_sig = options.key_sig ? @settings.key_sig
    options.scale ?= 'chromatic'

    transpose = MG.transposer(options.scale, key_sig)
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
      tmp.harmony = MG.clone(src[refd].harmony)
      tmp.harmony.forEach (e)->
        e[1] = transpose(e[1], interval[cur_i])
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

      res.data.push tmp
      refd++

    console.log acted, 'transpose-> ', res
    res
  act_reverse: (options, acted) ->
    res = acted.copy()
    # shallow version options.deep = false
    if options.deep? && options.deep == true
      res.data.reverse().forEach (arr)->
        arr.pitch.reverse()
        arr.dur.reverse()
        if arr.harmony?
          arr.harmony.reverse()
    else
      res.data.reverse()
    console.log acted, 'reverse-> ', res
    res

  act_double: (options, acted) ->

    res = new Snippet()
    data = []
    div = options.div ? 3

    # options up/down

    acted.data.forEach (m)->
      ret = m.copy()
      ret.pitch = []
      ret.dur = []
      gcd = MG.gcd.apply(null, m.dur)
      m.dur.forEach (e, i)->
        if options.force?
          if e > options.force
            dur = e // options.force
            ret.add(m.pitch[i], e - dur)
            if dur > 0
              ret.add(m.pitch[i], dur)
          else
            ret.add m.pitch[i], e
        else if not (options.num? && i > options.num)
          dur = Math.ceil(e / div)
          ret.add(m.pitch[i], e - dur)
          ret.add(m.pitch[i], dur)
        else
          ret.add(m.pitch[i], e)
      data.push ret
      return
    res.data = data
    console.log acted, 'double->', res

    res

  act_acciaccatura: (options, acted)->
    res = new Snippet()
    data = []
    ctrl_per_beat = options.ctrl_per_beat ? @settings.ctrl_per_beat
    delay = options.delay ? Math.ceil(ctrl_per_beat / 3)
    key_sig = options.key_sig ? @settings.key_sig
    scale = options.scale ? 'maj'
    num = options.num ? 3 # add three acciaccatura
    transpose = MG.transposer(scale, key_sig)

    acted.data.forEach (m, j)->
      ret = m.copy()
      ret.pitch = []
      ret.dur = []
      for i in [0...m.dur.length - 1] by 1
        if m.dur[i] > delay && i < num
          ret.add m.pitch[i], m.dur[i] - delay
          # TODO: check balance
          if MG.seededRandom() > 0.4

            ret.add m.pitch[i+1] - 1, delay
          else
            new_pitch = transpose(m.pitch[i+1], 1)
            #if new_pitch == m.pitch[i]
            ret.add new_pitch, delay
        else
          ret.add m.pitch[i], m.dur[i]
      if j < acted.data.length - 1 && options.tailbite?
        pre_delay = Math.ceil(m.dur[m.dur.length - 1] / 3)
        ret.add m.pitch[m.pitch.length - 1], m.dur[m.dur.length - 1] - pre_delay
        if pre_delay > 0
          ret.add acted.data[j+1].pitch[0], pre_delay
      else
        ret.add m.pitch[m.pitch.length - 1], m.dur[m.dur.length - 1]
      data.push ret
      return
    res.data = data
    console.log acted, 'acciaccatura->', res
    res








  act_aug: (options, acted)->


  act_dim: (options, acted)->

  # one chord tone for one beat or one chord
  # balance
  gen_skeleton: (options)->

    ctrl_per_beat = options.ctrl_per_beat ? @settings.ctrl_per_beat
    info = {
      ctrl_per_beat: ctrl_per_beat
    }
    key_sig = options.key_sig ? @settings.key_sig
    time_sig = options.time_sig ? @settings.time_sig
    info.key_sigs = {0:key_sig}
    info.time_sigs = {0:time_sig}
    harmony = MG.parseHarmony(options.chords, info)

    pre = MG.keyToPitch(key_sig + '4') # within half octave
    durs = []
    pitch = []
    if options.eachbeat? && options.eachbeat == true
      harmony.forEach (m)->
        m.forEach (h)->
          dur = h[0]
          while dur >= ctrl_per_beat
            durs.push ctrl_per_beat
            # TODO: consider pre
            pitch.push h[1] + h[2][ Math.floor(MG.seededRandom()*h[2].length) ]
            dur -= ctrl_per_beat
          if dur > 0
            durs.push dur
            pitch.push h[1] + h[2][ Math.floor(MG.seededRandom()*h[2].length) ]
          h[2] = MG.chord_finder[h[2].toString()] || 'maj'
    else
      harmony.forEach (m)->
        m.forEach (h)->
          durs.push h[0]
          pitch.push h[1] + h[2][ Math.floor(MG.seededRandom()*h[2].length) ]
          h[2] = MG.chord_finder[h[2].toString()] || 'maj'
    ret = new Snippet(pitch, durs, harmony, {time_sig: time_sig, tatum:ctrl_per_beat})
    console.log 'gen skeleton', info, ret
    return ret

  gen_exact: (options)->
    # parse direct
    options = MG.clone(options)
    options.ctrl_per_beat ?= @settings.ctrl_per_beat
    options.tempo ?= @settings.tempo
    options.time_sig ?= @settings.time_sig
    options.key_sig ?= @settings.key_sig
    console.log 'gen exact', res = MG.parseMelody(options.score, options)
    info = {
      ctrl_per_beat: @settings.ctrl_per_beat,
    }
    info.key_sigs = {0:@settings.key_sig}
    info.time_sigs = {0:@settings.time_sig}
    harmony = MG.parseHarmony(options.chords, info)

    data = res.map (m, i)->
      ret = new Measure(options.time_sig, options.ctrl_per_beat)
      m.forEach (e)->
        ret.add(e[1][0], e[0]) # hard coding TODO:
      harmony[i].forEach (e)->
        e[2] = MG.chord_finder[e[2].toString()] || 'maj'
      ret.harmony = harmony[i]
      ret
    res = new Snippet()
    res.data = data
    res

  gen_random: (options) ->
    dur = options.dur
    toPitch = @toPitch
    toScale = @toScale
    ctrl_per_beat = options.ctrl_per_beat ? @settings.ctrl_per_beat
    info = {
      ctrl_per_beat: ctrl_per_beat
    }
    key_sig = options.key_sig ? @settings.key_sig
    time_sig = options.time_sig ? @settings.time_sig
    info.key_sigs = {0:key_sig}
    info.time_sigs = {0:time_sig}
    harmony = MG.parseHarmony(options.chords, info)
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

    n = dur // (seed.dur//swarp)
    #console.log 'gen rhythm num', n
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
            if options.chord_tone?
              cur_chord.forEach (ee,ii)->
                if (k - bass) %% 12 == ee
                  #console.log 'chord tone'
                  v *= options.chord_tone
            if options.scale_tone?
              # scale tone dist

              console.log 'scale tone'
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

    # TODO: convert later
    harmony.forEach (e1)->
      e1.forEach (e)->
        e[2] = MG.chord_finder[e[2].toString()] || 'maj'

    res = new Snippet(res.pitch, res.dur, harmony, op)
    #res.data

  # separate into measures
  b2score: (b, sec) ->
    dur = _.flatten(b.dur, true)
    pitch = _.flatten(b.pitch, true)
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

    harmony = @res2.map (e)->
      e.harmony

    obj = new ScoreObj(@settings)
    melody = res
    melody.info = {
      time_sigs:{0:@settings.time_sig},
      key_sigs: {0: @settings.key_sig},
      tempi: {0: @settings.tempo}
    }

    obj.setMelody  melody, true
    obj.harmony_text = harmony
    #console.log harmony.join('\n')
    return obj





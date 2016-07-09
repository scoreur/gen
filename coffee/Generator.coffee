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
      @res[i] = @melody(mode.mode, mode.options, dur)

    return

  toScoreObj: ->
    if res == {}
      @generate()
    sec = @schema.ctrl_per_beat * @schema.time_sig[0] # separate bar
    res = {}
    console.log 'to Score obj'
    for e0, b of @res
      dur = _.flatten(b.dur);
      pitch = _.flatten(b.pitch);
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
      res[e0] = ret

    res = @schema.structure.map (e)-> res[e]



    obj = new ScoreObj({ctrl_per_beat:@schema.ctrl_per_beat});

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

  gen_random: (end_pos, states, start, constraint)->
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





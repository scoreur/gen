class @ScoreRenderer
  constructor: (c, p)->
    @c = document.getElementById c
    @real_ctx = @c.getContext('2d')
    @hidden_canvas = document.createElement('canvas')
    @r = new Vex.Flow.Renderer @hidden_canvas, Vex.Flow.Renderer.Backends.CANVAS
    @ctx = @r.getContext()
    @geo =
      system_width: 900, system_height: 80, system_interval: 30,
      left_padding: 25, top_padding: 20, reserved_width: 55
    @layout =
      measure_per_system: 4,
      system_per_page: 6
    @numPage = 1
    @currentPage = 1
    @measures = []
    @pages = []
    pager = $('#midi_pager')
    @UI =
      prev: pager.find('.prev'),
      next: pager.find('.next'),
      page_num: pager.find('.page_num'),
      page_count: pager.find('.page_count')

    @UI.prev.on 'click', ()=>
      if @currentPage <= 1
        return
      @currentPage--
      @renderPage(@currentPage-1)


    @UI.next.on 'click', ()=>
      if @currentPage >= @numPage
        return
      @currentPage++
      @renderPage(@currentPage-1)


    if p?
      @p = new fabric.StaticCanvas(p, {
        width: $('.canvas-wrapper').width(),
        height: $('.canvas-wrapper').height(),
        backgroundColor: 'rgba(240,250,240, 5)'
      })

  # m-th measure
  newStave: (m,k)->
    i = m % @layout.measure_per_system;
    j = (m // @layout.measure_per_system) % @layout.system_per_page
    w = (@geo.system_width - @geo.reserved_width) // @layout.measure_per_system
    x = @geo.left_padding + i * w
    y = @geo.top_padding + j * (@geo.system_height + @geo.system_interval)
    #console.log(x,y,w);
    if i == 0
      return new Vex.Flow.Stave(x, y, w + @geo.reserved_width).addClef('treble').addKeySignature(k)
    else
      x += @geo.reserved_width
      return new Vex.Flow.Stave(x, y, w)

  # TODO: fix tie

  toBit = (i)->
    res = [];
    j = 1
    while i>0
      #console.log i,j
      if (j & i) > 0
        res.unshift(j)
        i -= j
      j <<= 1
    # console.log res
    return res

  toBit: toBit
  dur_obj: (sum, dur)->
    if sum == 0
      return{
        sum: dur,
        dur: toBit(dur)
      }

    r = toBit(sum + dur)

    p = 0
    r1 = r.map (e)-> p+= e
    i = 0
    while sum > r1[i]
      i++
    ret = r.slice(i+1)
    remain = r1[i] - sum # >0
    if remain == 0
      return {
        sum: sum + dur,
        dur: ret
      }

    #pre = sum - (r1[i-1] || 0)
    # pre + remain == r[i]
    rs = toBit(sum)
    rs = rs.slice(i)
    ret2 = []
    while remain > 0
      ret2.push(rs[rs.length-1])
      remain -= ret2[ret2.length - 1]
      rs[rs.length-1] *= 2
      while rs.length > 1 && rs[rs.length - 1] == rs[rs.length - 2]
        rs.pop()
        rs[rs.length - 1] *= 2
    ret = ret2.concat(ret)
    #console.log 'final remain', remain
    return {
      sum: dur + sum,
      dur: ret
    }

  renderPage: (num)->

    if num < 0 || num >= @numPage
      return
    if @pages[num]?
      @real_ctx.clearRect 0,0, @c.width,@c.height
      @real_ctx.drawImage @pages[num], 0, 0
      @UI.page_num.html(num+1)
      return
    console.log 'render page', num+1
    @r.resize(1000,800)
    @c.width = 1000
    @c.height = 800
    start = @layout.measure_per_system * @layout.system_per_page
    last = (num+1) * start
    start = last - start
    if last >= @measures.length
      last = @measures.length
    ctx = @ctx
    for i in [start...last] by 1

      e = @measures[i]
      e.stave.setContext(ctx).draw()
      e.voices.forEach (v) -> v.draw(ctx, e.stave)
      e.beams.forEach (v)-> v.setContext(ctx).draw()
      e.ties.forEach (v)-> v.setContext(ctx).draw()
    c = document.createElement('canvas')
    c.width = 1000
    c.height = 800
    c.getContext('2d').drawImage @hidden_canvas, 0, 0
    @pages[num] = c

    @real_ctx.clearRect 0,0, @c.width,@c.height
    @real_ctx.drawImage @pages[num], 0, 0
    @UI.page_num.html(num+1)


  render: (score,contents)->
    raw_w = (@geo.system_width - @geo.reserved_width) // @layout.measure_per_system
    s = @s = new ScoreObj(score,contents)
    sharp = MG.key_sig[score.key_sig] >= 0
    toScale = MG.pitchToScale(score.scale, s.key_sig)
    #console.log(s)
    @measures = []
    melody = s.tracks[0]
    #console.log melody
    for  i in [0...melody.length] by 1
      stave = this.newStave(i, s.key_sig)
      if i==0
        stave.addTimeSignature(s.time_sig.join('/'))
      notes = []
      ties = []
      later_tie = []
      sum = 0

      melody[i].forEach (e)=>
        {sum, dur} = @dur_obj(sum, 8 * e[0] / s.ctrl_per_beat)
        durs = []
        pd = 0
        dur.forEach (d)->
          if d == pd
            durs[durs.length - 1] += 'd'
          else
            durs.push(''+(32/d))
          pd = d/2

        keys = []
        if typeof e[1] == 'number'
          e[1] = [e[1]]

        e[1].forEach (e1)->
          if e1<21 || e1>108
            return
          tmp = toScale(e1)
          key = MG.scale_keys[s.key_sig][tmp[0]]
          # adjust
          key += '/' + ( (e1//12) - 1 + ({'Cb':1, 'B#':-1}[key] || 0))
          if tmp[2] != 0
            key = MG.pitchToKey(e1, sharp).join('/')
          if key?
            keys.push key

        rest = false
        if keys.length <= 0
          rest = true
          keys.push 'Bb/4' # rest
          durs = durs.map (d)-> d+'r'


        durs.forEach (d)->
          res = new Vex.Flow.StaveNote {keys:keys, duration: d, auto_stem: true}
          r = /d+/.exec(d)
          if r?
            for iii in [0...r[0].length] by 1
              res.addDotToAll()
          notes.push(res)
        if !rest && durs.length > 1
          #console.log 'tie'
          start = notes.length - durs.length
          indices = Array(keys.length).fill(0).map (ee,index)->
            return index
          for ii in [1...durs.length] by 1

            tie = new Vex.Flow.StaveTie({
              first_note: notes[start + ii - 1]
              last_note: notes[start + ii]
              first_indices: indices
              last_indices: indices
            })
            ties.push(tie)
        if e[2] == true
          later_tie.push notes.length - 1




      later_tie.forEach (ii)->
        indices = Array(notes[ii].keys.length).fill(0).map (ee,index)->
          return index
        tie = new Vex.Flow.StaveTie({
          first_note: notes[ii]
          last_note: notes[ii + 1]
          first_indices: indices
          last_indices: indices
        })
        ties.push(tie)
        return


      num_beats = sum // 8
      voice = new Vex.Flow.Voice {
        num_beats: num_beats,
        beat_value: s.time_sig[1],
        resolution: Vex.Flow.RESOLUTION
      }


      # Add notes to voice
      voice.addTickables(notes)
      # Add accidental
      Vex.Flow.Accidental.applyAccidentals([voice], s.key_sig)
      # Add beams
      beams = Vex.Flow.Beam.applyAndGetBeams(voice)

      #Format and justify the notes
      w = raw_w
      if i % @layout.measure_per_system == 0
        w -= @geo.reserved_width
      if i == 0
        w -= 10

      formatter = new Vex.Flow.Formatter().
        joinVoices([voice]).
        format([voice], w - 10)
      @measures.push {voices:[voice],stave:stave, beams:beams, ties:ties}

    @numPage = Math.ceil(@measures.length / @layout.measure_per_system / @layout.system_per_page)
    @UI.page_count.html(@numPage)
    @currentPage = 1
    @pages.forEach (c,i)=>
      delete @pages[i]
    @pages = []
    @renderPage(@currentPage-1);

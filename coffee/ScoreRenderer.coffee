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
  dur_mapper = ["16","8","8d","4","4","4d","4dd","2","2","2","2","2d","2d","2dd","2ddd","1"];
  dur_map: (dur)->
    dur = (dur * 4) >>> 0
    return dur_mapper[dur-1]

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
    c = document.createElement('canvas')
    c.width = 1000
    c.height = 800
    c.getContext('2d').drawImage @hidden_canvas, 0, 0
    @pages[num] = c

    @real_ctx.clearRect 0,0, @c.width,@c.height
    @real_ctx.drawImage @pages[num], 0, 0
    @UI.page_num.html(num+1)


  render: (score)->
    raw_w = (@geo.system_width - @geo.reserved_width) // @layout.measure_per_system
    s = @s = new ScoreObj(score)
    sharp = MG.key_sig[score.key_sig] >= 0
    toScale = MG.pitchToScale(score.scale, s.key_sig)
    #console.log(s)
    @measures = []
    for  i in [0...s.melody.length] by 1
      stave = this.newStave(i, score.key_sig)
      if i==0
        stave.addTimeSignature(score.time_sig.join('/'))
      dur_tot = 0
      notes = s.melody[i].map (e)=>

        dur_tot += e[0]
        duration =  @dur_map(e[0]/score.ctrl_per_beat)
        keys = []
        if typeof e[1] == 'number'
          e[1] = [e[1]]

        e[1].forEach (e1)->
          if e1<21 || e1>108
            return
          tmp = toScale(e1)
          key = MG.scale_keys[score.key_sig][tmp[0]]
          # adjust
          key += '/' + ( (e1//12) - 1 + ({'Cb':1, 'B#':-1}[key] || 0))
          if tmp[2] != 0
            key = MG.pitchToKey(e1, sharp).join('/')
          if key?
            keys.push key

        if keys.length <= 0
          keys.push 'Bb/4' # rest
          duration += 'r'

        #console.log(duration, keys, e);
        res = new Vex.Flow.StaveNote {keys:keys, duration: duration, auto_stem: true}
        if duration.substr(-1)=='d'
          res.addDotToAll()
          if duration.substr(-2,1)=='d'
            res.addDotToAll()
        return res


      num_beats = dur_tot // s.ctrl_per_beat
      voice = new Vex.Flow.Voice {
        num_beats: num_beats,
        beat_value: s.time_sig[1],
        resolution: Vex.Flow.RESOLUTION
      }


      # Add notes to voice
      voice.addTickables(notes)
      # Add accidental
      Vex.Flow.Accidental.applyAccidentals([voice], @s.key_sig)
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
      @measures.push {voices:[voice],stave:stave, beams:beams}

    @numPage = Math.ceil(@measures.length / @layout.measure_per_system / @layout.system_per_page)
    @UI.page_count.html(@numPage)
    @currentPage = 1
    @pages.forEach (c,i)=>
      delete @pages[i]
    @pages = []
    @renderPage(@currentPage-1);

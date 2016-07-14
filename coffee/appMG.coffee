MG = (module? && require? && require('./musical')) || @MG

class @AppMG
  constructor: (ui, options) ->
    if options?
      {@schema, @settings, @contents}  = options
    else
      @schema = Object.assign({}, MG.schema_summer)
      @settings = Object.assign({}, MG.score_summer.settings)
      @contents = Object.assign({}, MG.score_summer.contents)
    if ui?
      {@editor, @renderer, @player, @playbtns} = ui
    return

  export: ->
      settings: @settings
      schema: @schema
      contents: @contents

  updateEditor: ->
    ['melody', 'harmony', 'texture'].forEach (e) =>
      @editor[e].setValue @contents[e].join('\n'), -1
      return
    @editor.score.setValue JSON.stringify(@settings, null, 2), -1
    @editor.schema.setValue JSON.stringify(@schema, null, 2), -1
    return

  play: (n)->
    if !@player.playing[n]
      @player.play(n)
    else
      @player.pause(n)
    @playbtns[n].toggleClass('glyphicon-play glyphicon-pause')

  parse: ->
    try
      @settings = JSON.parse(@editor.score.getValue())
    catch e
      $.notify('Bad score format!', 'warning')
    ['melody','harmony','texture'].forEach (e)=>
      @contents[e] = @editor[e].getValue().split(/[/\n]+/)
    @player.fromScore(@settings, @contents);


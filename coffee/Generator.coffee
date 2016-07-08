
class @Generator
  constructor: (@schema) ->
    @keyref = MIDI.keyToNote[@schema.key_sig+'4'];
    @res = {}

  pitchSimple: (pitch) ->
    return {
    0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7
    }[(pitch-@keyref) %% 12] ? 0;

  generate: ->
    for i in @schema.blocks
      dur = @schema.blocks[i]
      mode = @schema.melody[i]
      @res[i] = @melody(mode.mode, mode.options, dur)
    return
  }

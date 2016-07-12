MG = @MG ? {}

class Analyzer
  constructor: (@key_sig, @scale_name)->
    @scale = MG.scale_class[@scale_name]
    @key_ref = MG.key_class[@key_sig]
    @toScale = MG.pitchToScale(@scale_name, @key_sig)
    @key_sig_acc = MG.key_sig[@key_sig]
  pitch_info: (pitch, chord)->
    info = {}
    if chord?
      if typeof chord == 'string'
        chord = MG.getChords(chord,3)
      info.isChordTone = false
      for i,p of chord[1]
        if (chord[0]+p-pitch)%12 == 0
          info.isChordTone = true
          break

    tmp = @toScale(pitch)
    info.inScale = tmp[2] == 0

    key = MG.scale_keys[s.key_sig][tmp[0]]
    # adjust
    sharp = MG.key_sig[@key_sig] >= 0
    info.keyName = if info.inScale then [key, pitch//12 - ({'Cb':0, 'B#':2}[key] || 1)] else MG.pitchToKey(pitch, sharp)
    return info



MG.Analyzer = Analyzer
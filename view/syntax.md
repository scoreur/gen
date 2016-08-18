## Melody Syntax

One line per measure or use `|` to separate, each measure contains several notes or control change separated by space.
Each note has the format `(pitch[flag])*,duration[tie]`. The pitch is represented in scale degree (major, minor, pentatonic, blues, ...) 1-7, with reference to the key of the score.
The duration is in unit of the shortest note in the score. The optional flag can be:
 - #, one half step up;
 - b, one half step down;
 - +, one octave up;
 - -, one octave down.

Use `:flag` format to shift the reference pitch for all the following notes. Use `:` to reset the reference pitch. To tie the note, just add the symbol `^` to its duration.

## Harmony Syntax

One line per measure. Use `chord_name,duration` format.

## Texture Syntax

Support inversion, doubling of the chords, both vertical and horizontal arrangements.
Use `@(pitch[flag])*` format to specify the chord template (the chord class is obtained from the harmony), then the arrangement is in the same syntax as the melody.

## Schema Syntax

JSON format, specify the structures and how the melody/harmony/texture for each block is generated.
You need to specify the following entry:
*  `block`: a dict of `block_id: block_duration`;
* `structure`: an array of `block_id` (can be repeatable)
* `seeds`: a dict of `seed_id: seed_option`, serve as the random source of the generator. The `seed_option` should contain `dur`, `choices` and `weights`;
* `melody`: a dict of `block_id: generating_options`. The `generating_options` should contain `mode` (random with/without chord, transpose, reverse, etc). The other options depends on which mode it is for.

For variables (non-terminals), `structure` (and `node`) should be specified. For example,
```
    {
        "structure": ["A", "A2", "B", "A"],
        "node": {
            "A": {...},
            "B": {...}
        },
        "action": {
            "A": {...},
            "B": {...}
        }
    }
```

Here is some samples for currently supported terminals:
```
    {
        "mode": "chord",
        "options": {
          "chords": [
            "Gb,4 Db,4",
            "Ebm,4 Bbm,4"
          ],
          "rhythm": {
            "seed": "s1",
            "swarp": 4
          },
          "interval": {
            "chromatic": false,
            "seed": "s2"
          }
        }
    }

    {
      "mode": "transpose",
      "options": {
        "src": "A",
        "scale": "maj",
        "offset": 0,
        "interval": 3
      }
    }

```




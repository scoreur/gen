## Melody Syntax

One line per measure, each line contains several notes separated by space.                  
Each note has the format `(pitch[flag])*,duration`. The pitch is represented in scale number (major, minor, pentatonic, blues, ...) 1-7, with reference to the key of the score.
The duration is in unit of the shortest note in the score. The optional flag can be:
 - #, one half step up;
 - b, one half step down;
 - +, one octave up;
 - -, one octave down;
 - ^, tied to the next note.                 
Use `:flag` format to shift the reference pitch for all the following notes. Use `:` to reset the reference pitch.

## Harmony Syntax

One line per measure. Use `chord_name,duration` format.

## Texture Syntax

Support inversion, doubling of the chords, both vertical and horizontal arrangements.
Use `:(pitch[flag])*` format to specify the chord template (the chord class is obtained from the harmony), then the arrangement is in the same syntax as the melody.

## Schema Syntax

JSON format, specify the structures and how the melody/harmony/texture for each block is generated.

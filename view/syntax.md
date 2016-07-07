## Melody

One line per measure, each line contains several notes separated by space.                  
Each note has the format `pitch,duration[,flag]`. The pitch is represented by 1-7 with reference to the key of the score. The duration is in unit of the shortest note in the score. The optional flag can be:
 - #, one half step up;
 - b, one half step down;
 - +, one octave up;
 - -, one octave down;
 - ^, tied to the next note.                 
Use `:flag` format to shift the reference pitch for all the following notes. Use `:` to reset the reference pitch.

## Harmony                 

One line per measure. Use `chord_name,duration` format.

## Texture                 

Support inversion, doubling of the chords, both vertical and horizontal arrangements. Detailed information to be added.

## Schema                 

JSON format, specify the structures and how the melody/harmony/texture for each block is generated.

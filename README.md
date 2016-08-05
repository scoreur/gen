[Music Generator](https://scoreur.github.io/gen) 
============

Introduction
------------

The app is targeted at both web and desktop.
### Goal
* Provide basic score input (melody/harmony/texture) and operations on MIDI file.
* Provide a general way to incorporate structural information into music composition, generating good melody and harmony.

### User Interface
* Score Viewer (support pdf, image or rendered from score input).
* Editors for melody, harmony, texture, score settings and schema
* Buttons (generate, parse, play, etc)
* Top Menu: File, Edit
* Bottom Menu: Keyboard, Console, Tutorial, Instrument List

### Illustrative Workflow
1. Using default score is summertime, just click `parse`, then the score will be parsed and rendered and you can play melody, harmony or all the MIDI tracks generated from that score.
2. In Example menu, click `load sample json` to load one excerpt from Chopin's *butterfly etude* . Then play the MIDI or generate new melody based on the associated schema.

Music Generation
------------

The generation procedure includes four phases:

1. low-level structural optimization (within one block)
the current evaluation is based on harmony (chord abstraction), simplicity (material reuse), associability (piecewise similarity, auditory streaming).
2. high-level structural enforcement (upon defined blocks)
include crafted repetitions, transpositions, inversions, etc;
3. between-block modification
make coherent transitions, cadences, etc, also adjust notes not fit the harmony due to block operations;
4. ornamentation
add grace notes or other small variations to enhance musicality without affecting the structure



Score Representation
------------

The score input is based on the scale (e.g., major/pentatonic/blues scales, etc)
The score parser is generated from lex file by [jison](https://github.com/zaach/jison). And can be extended to support more MIDI event like tempo changes.
The score renderer uses [vexflow](https://github.com/0xfe/vexflow) as underlying library.

Utilities
---------

* MIDI: open MIDI file, quantize, analyze, render as score, save as wav/mp3
* keyboard: `a, s, d, f, j, k, l, ;` correponds to `C, D, E, F, G, A, B` as the white keys, and the black keys are `w, e, u, i, o` which have similar positions as on the piano keyboard.


Development Guide
------------

### Build

* Run `grunt web` to generate `index.html` and `js/gen-build.js` for the website.
* Run `grunt app` to generate `app.html`, and the generated js file is in `coffee/`.

### Launch

Run `npm start` to launch the app or setup a http server.

Try the examples in the menu `Example`. Click Parse, Render, Play MIDI one by one. Edit the melody or harmony, or generate from the schema. Then parse again.


var fs = require('fs');
var pre = './mid/';
var m = require('./js/jasmid/midifile');
for(var i in m){
    this[i] = m[i];
}

var analysis = function(filename){
    var buffer = fs.readFileSync(filename);
    var raw_midi = '';
    buffer.forEach(function(e){
        raw_midi += String.fromCharCode(e);
    });
    var midi = MidiFile(raw_midi);
    var res = midi.quantize(8);


}

var TEST = TEST || {};
TEST.testAnalyzer = function(){
    analysis('./score/sample.mid');


    return true;
}

if(typeof module!='undefined'){
    module.exports = function(t){
        if(t){
            t.testAnalyzer = TEST.testAnalyzer;
        }
        return {
            analysis: analysis

        }
    }
}
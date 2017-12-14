function Stream(a){function b(a){var b=q.substr(p,a);return p+=a,b}function c(a){return q+=a,p+=a.length}function d(){var a=(q.charCodeAt(p)<<24)+(q.charCodeAt(p+1)<<16)+(q.charCodeAt(p+2)<<8)+q.charCodeAt(p+3);return p+=4,a}function e(a){return q+=String.fromCharCode(a>>24&255,a>>16&255,a>>8&255,255&a),p+=4}function f(){var a=(q.charCodeAt(p)<<8)+q.charCodeAt(p+1);return p+=2,a}function g(a){return q+=String.fromCharCode(a>>8&255,255&a),p+=2}function h(a){var b=q.charCodeAt(p);return a&&b>127&&(b-=256),p+=1,b}function i(a){return q+=String.fromCharCode(255&a),p+=1}function j(){return p>=q.length}function k(){for(var a=0;;){var b=h();if(!(128&b))return a+b;a+=127&b,a<<=7}}function l(a){for(var b=String.fromCharCode(127&a);a>127;)a>>=7,b=String.fromCharCode(128|127&a)+b;return q+=b,p+=b.length}function m(){p=0,q=""}function n(){return q}function o(){return p}var p=0,q=void 0==a?"":a;return"string"==typeof a?{eof:j,read:b,readInt32:d,readInt16:f,readInt8:h,readVarInt:k,readAll:n,reset:m,pos:o}:{write:c,writeInt32:e,writeInt16:g,writeInt8:i,writeVarInt:l,readAll:n,reset:m,pos:o}}function MidiFile(a){function b(a){var b=a.read(4),c=a.readInt32();return{id:b,length:c,data:a.read(c)}}function c(a){var b={};b.deltaTime=a.readVarInt();var c=a.readInt8();if(240==(240&c)){if(255==c){b.type="meta";var e=a.readInt8(),f=a.readVarInt();switch(e){case 0:if(b.subtype="sequenceNumber",2!=f)throw"Expected length for sequenceNumber event is 2, got "+f;return b.number=a.readInt16(),b;case 1:return b.subtype="text",b.text=a.read(f),b;case 2:return b.subtype="copyrightNotice",b.text=a.read(f),b;case 3:return b.subtype="trackName",b.text=a.read(f),b;case 4:return b.subtype="instrumentName",b.text=a.read(f),b;case 5:return b.subtype="lyrics",b.text=a.read(f),b;case 6:return b.subtype="marker",b.text=a.read(f),b;case 7:return b.subtype="cuePoint",b.text=a.read(f),b;case 32:if(b.subtype="midiChannelPrefix",1!=f)throw"Expected length for midiChannelPrefix event is 1, got "+f;return b.channel=a.readInt8(),b;case 47:if(b.subtype="endOfTrack",0!=f)throw"Expected length for endOfTrack event is 0, got "+f;return b;case 81:if(b.subtype="setTempo",3!=f)throw"Expected length for setTempo event is 3, got "+f;return b.microsecondsPerBeat=(a.readInt8()<<16)+(a.readInt8()<<8)+a.readInt8(),b;case 84:if(b.subtype="smpteOffset",5!=f)throw"Expected length for smpteOffset event is 5, got "+f;var g=a.readInt8();return b.frameRate={0:24,32:25,64:29,96:30}[96&g],b.hour=31&g,b.min=a.readInt8(),b.sec=a.readInt8(),b.frame=a.readInt8(),b.subframe=a.readInt8(),b;case 88:if(b.subtype="timeSignature",4!=f)throw"Expected length for timeSignature event is 4, got "+f;return b.numerator=a.readInt8(),b.denominator=Math.pow(2,a.readInt8()),b.metronome=a.readInt8(),b.thirtyseconds=a.readInt8(),b;case 89:if(b.subtype="keySignature",2!=f)throw"Expected length for keySignature event is 2, got "+f;return b.key=a.readInt8(!0),b.scale=a.readInt8(),b;case 127:return b.subtype="sequencerSpecific",b.data=a.read(f),b;default:return b.subtype="unknown",b.data=a.read(f),b}return b.data=a.read(f),b}if(240==c){b.type="sysEx";var f=a.readVarInt();return b.data=a.read(f),b}if(247==c){b.type="dividedSysEx";var f=a.readVarInt();return b.data=a.read(f),b}throw"Unrecognised MIDI event type byte: "+c}var h;0==(128&c)?(h=c,c=d):(h=a.readInt8(),d=c);var i=c>>4;switch(b.channel=15&c,b.type="channel",i){case 8:return b.subtype="noteOff",b.noteNumber=h,b.velocity=a.readInt8(),b;case 9:return b.noteNumber=h,b.velocity=a.readInt8(),0==b.velocity?b.subtype="noteOff":b.subtype="noteOn",b;case 10:return b.subtype="noteAftertouch",b.noteNumber=h,b.amount=a.readInt8(),b;case 11:return b.subtype="controller",b.controllerType=h,b.value=a.readInt8(),b;case 12:return b.subtype="programChange",b.programNumber=h,b;case 13:return b.subtype="channelAftertouch",b.amount=h,b;case 14:return b.subtype="pitchBend",b.value=h+(a.readInt8()<<7),b;default:throw"Unrecognised MIDI event type: "+i}}var d,e=Stream(a),f=b(e);if("MThd"!=f.id||6!=f.length)throw"Bad .mid file - header not found";var g=Stream(f.data),h=g.readInt16(),i=g.readInt16(),j=g.readInt16();if(32768&j)throw"Expressing time division in SMTPE frames is not supported yet";ticksPerBeat=j;for(var k={formatType:h,trackCount:i,ticksPerBeat:ticksPerBeat},l=[],m=0;m<k.trackCount;m++){l[m]=[];var n=b(e);if("MTrk"!=n.id)throw"Unexpected chunk - expected MTrk, got "+n.id;for(var o=Stream(n.data);!o.eof();){var p={};try{p=c(o),l[m].push(p)}catch(q){console.log(q,m)}finally{}}}return new simpMidi(k,l)}function MidiWriter(a){function b(a,b){if(b.writeVarInt(a.deltaTime),"meta"==a.type){b.writeInt8(f[a.type]),b.writeInt8(f[a.subtype]);var c=g[a.subtype]|(a.data&&a.data.length)|(a.text&&a.text.length),d=Stream();switch(a.subtype){case"sequenceNumber":d.writeInt16(a.number);break;case"midiChannelPrefix":d.writeInt8(a.channel);break;case"endOfTrack":break;case"setTempo":d.writeInt8(a.microsecondsPerBeat>>16&255),d.writeInt8(a.microsecondsPerBeat>>8&255),d.writeInt8(255&a.microsecondsPerBeat);break;case"smpteOffset":var h=96&{24:0,25:32,29:64,30:96}[a.frameRate];d.writeInt8(h|31&a.hour),d.writeInt8(a.min),d.writeInt8(a.sec),d.writeInt8(a.frame),d.writeInt8(a.subframe);break;case"timeSignature":d.writeInt8(a.numerator),d.writeInt8(Math.log2(a.denominator)>>0),d.writeInt8(a.metronome),d.writeInt8(a.thirtyseconds);break;case"keySignature":d.writeInt8(a.key),d.writeInt8(a.scale)}b.writeVarInt(c),b.write(a.data||a.text||d.readAll())}else if("sysEx"==a.type||"dividedSysEx"==a.type)b.writeInt8(f[a.type]),b.writeVarInt(a.data.length),b.write(a.data);else if("channel"==a.type){var i=f[a.subtype]<<4|15&a.channel;switch(e!=i&&(b.writeInt8(i),e=i),a.subtype){case"noteOff":case"noteOn":b.writeInt8(a.noteNumber),b.writeInt8(a.velocity);break;case"noteAftertouch":b.writeInt8(a.noteNumber),b.writeInt8(a.amount);break;case"controller":b.writeInt8(a.controllerType),b.writeInt8(a.value);break;case"programChange":b.writeInt8(a.programNumber);break;case"channelAftertouch":b.writeInt8(a.amount);break;case"pitchBend":b.writeInt8(127&a.value),b.writeInt8(a.value>>7)}}}function c(a){for(var c=Stream(),d=0;d<a.length;++d)b(a[d],c);return c.readAll()}function d(a){var b=Stream();b.write("MThd"),b.writeInt32(6);var d=a.header,e=a.tracks;b.writeInt16(d.formatType),b.writeInt16(d.trackCount),b.writeInt16(d.ticksPerBeat);for(var f=0;f<e.length;++f){var g=c(e[f]);b.write("MTrk"),b.writeInt32(g.length),b.write(g)}return b.readAll()}var e="nothing",f=MIDI_eventCode,g={sequenceNumber:2,midiChannelPrefix:1,endOfTrack:0,setTempo:3,smpteOffset:5,timeSignature:4,keySignature:2};return d(a)}function simpEvent(a,b,c,d){var e={};switch(e.deltaTime=a,e.subtype=b,b){case"timeSignature":e.type="meta",e.numerator=c,e.denominator=d,e.metronome=24,e.thirtyseconds=8;break;case"keySignature":e.type="meta",e.key=c,e.scale={maj:0,min:1}[d];break;case"setTempo":e.type="meta",e.microsecondsPerBeat=6e7/c>>0;break;case"endOfTrack":e.type="meta";break;case"noteOff":case"noteOn":e.type="channel",e.channel=c,e.noteNumber=d[0],e.velocity=d[1];break;case"programChange":e.type="channel",e.channel=c,e.programNumber=d}return e}function simpMidi(a,b){this.header=a||{formatType:1,trackCount:2,ticksPerBeat:500},this.tracks=b,this.getTimeSignature(),this.getKeySignature(),this.getTempo(),this.tracks=this.tracks||[[this.tsig,this.ksig,this.tempo],[]]}function Replayer(a,b,c,d){function e(){for(var b=null,c=null,d=null,e=0;e<h.length;e++)null!=h[e].ticksToNextEvent&&(null==b||h[e].ticksToNextEvent<b)&&(b=h[e].ticksToNextEvent,c=e,d=h[e].nextEventIndex);if(null!=c){var f=a.tracks[c][d];a.tracks[c][d+1]?h[c].ticksToNextEvent+=a.tracks[c][d+1].deltaTime:h[c].ticksToNextEvent=null,h[c].nextEventIndex+=1;for(var e=0;e<h.length;e++)null!=h[e].ticksToNextEvent&&(h[e].ticksToNextEvent-=b);return{ticksToEvent:b,event:f,track:c}}return null}function f(){function a(){k||"meta"!=m.event.type||"setTempo"!=m.event.subtype||(j=6e7/m.event.microsecondsPerBeat);var a=0,c=0;m.ticksToEvent>0&&(a=m.ticksToEvent/i,c=a/(j/60));var d=1e3*c*b||0;n.push([m,d]),m=e()}if(m=e())for(;m;)a(!0)}function g(a){if("object"!=typeof a)return a;if(null==a)return a;var b="number"==typeof a.length?[]:{};for(var c in a)b[c]=g(a[c]);return b}for(var h=[],i=a.header.ticksPerBeat,j=d||Math.floor(6e4/i),k=!!d,l=0;l<a.tracks.length;l++)h[l]={nextEventIndex:0,ticksToNextEvent:a.tracks[l].length?a.tracks[l][0].deltaTime:null};var m,n=[];return f(),{getData:function(){return g(n)}}}"undefined"!=typeof module&&(module.exports.Stream=Stream);var Stream=Stream||module&&require&&require("./stream").Stream,MIDI_eventCode={sequenceNumber:0,text:1,copyrightNotice:2,trackName:3,instrumentName:4,lyrics:5,marker:6,cuePoint:7,midiChannelPrefix:32,endOfTrack:47,setTempo:81,smpteOffset:84,timeSignature:88,keySignature:89,sequencerSpecific:127,unknown:255,meta:255,sysEx:240,dividedSysEx:247,noteOff:8,noteOn:9,noteAftertouch:10,controller:11,programChange:12,channelAftertouch:13,pitchBend:14};simpMidi.prototype.setDefaultTempo=function(a){a=a||120,this.header.ticksPerBeat=Math.floor(6e4/a)},simpMidi.prototype.getDefaultTempo=function(){return Math.floor(6e4/this.header.ticksPerBeat)},simpMidi.prototype.getMeta=function(a){if(null==this.tracks)return null;for(var b=null,c=this.tracks[0],d=0;d<c.length;++d)if("meta"==c[d].type&&c[d].subtype==a){b=c[d];break}return b},simpMidi.prototype.getTimeSignature=function(){return this.tsig=this.tsig||simpMidi.prototype.getMeta.call(this,"timeSignature")||simpEvent(0,"timeSignature",4,4),[this.tsig.numerator,this.tsig.denominator]},simpMidi.prototype.getTempo=function(){return this.tempo=this.tempo||simpMidi.prototype.getMeta.call(this,"setTempo")||simpEvent(0,"setTempo",120),6e7/this.tempo.microsecondsPerBeat>>>0},simpMidi.prototype.getKeySignature=function(){return this.ksig=this.ksig||simpMidi.prototype.getMeta.call(this,"keySignature")||simpEvent(0,"keySignature",0,"maj"),[this.ksig.key,this.ksig.scale]},simpMidi.prototype.write=function(a){return this.raw_midi=a?this.raw_midi||MidiWriter(this):MidiWriter(this)},simpMidi.prototype.setTimeSignature=function(a,b){this.tsig.numerator=a,this.tsig.denominator=b},simpMidi.prototype.setKeySignature=function(a,b){this.ksig.key=a,this.ksig.scale={maj:0,min:1}[b]},simpMidi.prototype.setTempo=function(a){this.tempo.microsecondsPerBeat=6e7/a>>>0},simpMidi.prototype.addEvent=function(){var a=Array.prototype.slice.call(arguments);this.tracks[a.shift()].push(simpEvent.apply(null,a))},simpMidi.prototype.finish=function(){for(var a=0;a<this.tracks.length;++a)this.tracks[a].push(simpEvent(0,"endOfTrack"))},simpMidi.prototype.addTrack=function(){return this.tracks.push([]),this.header.trackCount=this.tracks.length},simpMidi.prototype.addNotes=function(a,b,c,d,e,f){var f=f||0,e=e||0,d=d||[110];"number"==typeof d&&(d=[d]),"number"==typeof c&&(c=[c]),a<1&&(a=1),a>=this.tracks.length&&(a=this.tracks.length-1);var g=this.tracks[a];g.push(simpEvent(f,"noteOn",a-1,[c[0],d[0]])),c.slice(1).forEach(function(b,c){g.push(simpEvent(e,"noteOn",a-1,[b,d[c]||d[0]]))}),g.push(simpEvent(b-(c.length-1)*e,"noteOn",a-1,[c[0],0])),c.slice(1).forEach(function(b){g.push(simpEvent(0,"noteOn",a-1,[b,0]))})},simpMidi.prototype.quantize=function(a){for(var a=a||8,b=this.header.ticksPerBeat,c=[],d=1;d<this.tracks.length;++d){var e=[],f=0;this.tracks[d].forEach(function(c,d){if("channel"==c.type){c.deltaTime>0&&(f+=c.deltaTime);var g=[Math.round(f/b*a)];switch(c.subtype){case"noteOn":case"noteOff":g.push(c.subtype,c.noteNumber,c.velocity);break;case"programChange":g.push(c.subtype,c.programNumber);break;default:return void console.log(c.subtype)}e.push(g)}}),c.push(e)}return c},"undefined"!=typeof module&&!function(a){a.MidiFile=MidiFile,a.MidiWriter=MidiWriter,a.simpEvent=simpEvent,a.simpMidi=simpMidi}(module.exports),"undefined"!=typeof module&&(module.exports.Replayer=Replayer),"undefined"==typeof MIDI&&(MIDI={}),function(a){"use strict";function b(a){d++;var b=document.body,e=new Audio,f=a.split(";")[0];e.id="audio",e.setAttribute("preload","auto"),e.setAttribute("audiobuffer",!0),e.addEventListener("error",function(){b.removeChild(e),c[f]=!1,d--},!1),e.addEventListener("canplaythrough",function(){b.removeChild(e),c[f]=!0,d--},!1),e.src="data:"+a,b.appendChild(e)}var c={},d=0;a.audioDetect=function(a){if(navigator.requestMIDIAccess){var e=Function.prototype.toString,f=e.call(navigator.requestMIDIAccess).indexOf("[native code]")!==-1;if(f)c.webmidi=!0;else for(var g=0;navigator.plugins.length>g;g++){var h=navigator.plugins[g];h.name.indexOf("Jazz-Plugin")>=0&&(c.webmidi=!0)}}if("undefined"==typeof Audio)return void a(c);c.audiotag=!0,(window.AudioContext||window.webkitAudioContext)&&(c.webaudio=!0);var i=new Audio;if(!i.canPlayType)return void a(c);var j=i.canPlayType('audio/ogg; codecs="vorbis"');j="probably"===j||"maybe"===j;var k=i.canPlayType("audio/mpeg");if(k="probably"===k||"maybe"===k,!j&&!k)return void a(c);j&&b("audio/ogg;base64,T2dnUwACAAAAAAAAAADqnjMlAAAAAOyyzPIBHgF2b3JiaXMAAAAAAUAfAABAHwAAQB8AAEAfAACZAU9nZ1MAAAAAAAAAAAAA6p4zJQEAAAANJGeqCj3//////////5ADdm9yYmlzLQAAAFhpcGguT3JnIGxpYlZvcmJpcyBJIDIwMTAxMTAxIChTY2hhdWZlbnVnZ2V0KQAAAAABBXZvcmJpcw9CQ1YBAAABAAxSFCElGVNKYwiVUlIpBR1jUFtHHWPUOUYhZBBTiEkZpXtPKpVYSsgRUlgpRR1TTFNJlVKWKUUdYxRTSCFT1jFloXMUS4ZJCSVsTa50FkvomWOWMUYdY85aSp1j1jFFHWNSUkmhcxg6ZiVkFDpGxehifDA6laJCKL7H3lLpLYWKW4q91xpT6y2EGEtpwQhhc+211dxKasUYY4wxxsXiUyiC0JBVAAABAABABAFCQ1YBAAoAAMJQDEVRgNCQVQBABgCAABRFcRTHcRxHkiTLAkJDVgEAQAAAAgAAKI7hKJIjSZJkWZZlWZameZaouaov+64u667t6roOhIasBACAAAAYRqF1TCqDEEPKQ4QUY9AzoxBDDEzGHGNONKQMMogzxZAyiFssLqgQBKEhKwKAKAAAwBjEGGIMOeekZFIi55iUTkoDnaPUUcoolRRLjBmlEluJMYLOUeooZZRCjKXFjFKJscRUAABAgAMAQICFUGjIigAgCgCAMAYphZRCjCnmFHOIMeUcgwwxxiBkzinoGJNOSuWck85JiRhjzjEHlXNOSuekctBJyaQTAAAQ4AAAEGAhFBqyIgCIEwAwSJKmWZomipamiaJniqrqiaKqWp5nmp5pqqpnmqpqqqrrmqrqypbnmaZnmqrqmaaqiqbquqaquq6nqrZsuqoum65q267s+rZru77uqapsm6or66bqyrrqyrbuurbtS56nqqKquq5nqq6ruq5uq65r25pqyq6purJtuq4tu7Js664s67pmqq5suqotm64s667s2rYqy7ovuq5uq7Ks+6os+75s67ru2rrwi65r66os674qy74x27bwy7ouHJMnqqqnqq7rmarrqq5r26rr2rqmmq5suq4tm6or26os67Yry7aumaosm64r26bryrIqy77vyrJui67r66Ys67oqy8Lu6roxzLat+6Lr6roqy7qvyrKuu7ru+7JuC7umqrpuyrKvm7Ks+7auC8us27oxuq7vq7It/KosC7+u+8Iy6z5jdF1fV21ZGFbZ9n3d95Vj1nVhWW1b+V1bZ7y+bgy7bvzKrQvLstq2scy6rSyvrxvDLux8W/iVmqratum6um7Ksq/Lui60dd1XRtf1fdW2fV+VZd+3hV9pG8OwjK6r+6os68Jry8ov67qw7MIvLKttK7+r68ow27qw3L6wLL/uC8uq277v6rrStXVluX2fsSu38QsAABhwAAAIMKEMFBqyIgCIEwBAEHIOKQahYgpCCKGkEEIqFWNSMuakZM5JKaWUFEpJrWJMSuaclMwxKaGUlkopqYRSWiqlxBRKaS2l1mJKqcVQSmulpNZKSa2llGJMrcUYMSYlc05K5pyUklJrJZXWMucoZQ5K6iCklEoqraTUYuacpA46Kx2E1EoqMZWUYgupxFZKaq2kFGMrMdXUWo4hpRhLSrGVlFptMdXWWqs1YkxK5pyUzDkqJaXWSiqtZc5J6iC01DkoqaTUYiopxco5SR2ElDLIqJSUWiupxBJSia20FGMpqcXUYq4pxRZDSS2WlFosqcTWYoy1tVRTJ6XFklKMJZUYW6y5ttZqDKXEVkqLsaSUW2sx1xZjjqGkFksrsZWUWmy15dhayzW1VGNKrdYWY40x5ZRrrT2n1mJNMdXaWqy51ZZbzLXnTkprpZQWS0oxttZijTHmHEppraQUWykpxtZara3FXEMpsZXSWiypxNhirLXFVmNqrcYWW62ltVprrb3GVlsurdXcYqw9tZRrrLXmWFNtBQAADDgAAASYUAYKDVkJAEQBAADGMMYYhEYpx5yT0ijlnHNSKucghJBS5hyEEFLKnINQSkuZcxBKSSmUklJqrYVSUmqttQIAAAocAAACbNCUWByg0JCVAEAqAIDBcTRNFFXVdX1fsSxRVFXXlW3jVyxNFFVVdm1b+DVRVFXXtW3bFn5NFFVVdmXZtoWiqrqybduybgvDqKqua9uybeuorqvbuq3bui9UXVmWbVu3dR3XtnXd9nVd+Bmzbeu2buu+8CMMR9/4IeTj+3RCCAAAT3AAACqwYXWEk6KxwEJDVgIAGQAAgDFKGYUYM0gxphhjTDHGmAAAgAEHAIAAE8pAoSErAoAoAADAOeecc84555xzzjnnnHPOOeecc44xxhhjjDHGGGOMMcYYY4wxxhhjjDHGGGOMMcYYY0wAwE6EA8BOhIVQaMhKACAcAABACCEpKaWUUkoRU85BSSmllFKqFIOMSkoppZRSpBR1lFJKKaWUIqWgpJJSSimllElJKaWUUkoppYw6SimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaVUSimllFJKKaWUUkoppRQAYPLgAACVYOMMK0lnhaPBhYasBAByAwAAhRiDEEJpraRUUkolVc5BKCWUlEpKKZWUUqqYgxBKKqmlklJKKbXSQSihlFBKKSWUUkooJYQQSgmhlFRCK6mEUkoHoYQSQimhhFRKKSWUzkEoIYUOQkmllNRCSB10VFIpIZVSSiklpZQ6CKGUklJLLZVSWkqpdBJSKamV1FJqqbWSUgmhpFZKSSWl0lpJJbUSSkklpZRSSymFVFJJJYSSUioltZZaSqm11lJIqZWUUkqppdRSSiWlkEpKqZSSUmollZRSaiGVlEpJKaTUSimlpFRCSamlUlpKLbWUSkmptFRSSaWUlEpJKaVSSksppRJKSqmllFpJKYWSUkoplZJSSyW1VEoKJaWUUkmptJRSSymVklIBAEAHDgAAAUZUWoidZlx5BI4oZJiAAgAAQABAgAkgMEBQMApBgDACAQAAAADAAAAfAABHARAR0ZzBAUKCwgJDg8MDAAAAAAAAAAAAAACAT2dnUwAEAAAAAAAAAADqnjMlAgAAADzQPmcBAQA="),k&&b("audio/mpeg;base64,/+MYxAAAAANIAUAAAASEEB/jwOFM/0MM/90b/+RhST//w4NFwOjf///PZu////9lns5GFDv//l9GlUIEEIAAAgIg8Ir/JGq3/+MYxDsLIj5QMYcoAP0dv9HIjUcH//yYSg+CIbkGP//8w0bLVjUP///3Z0x5QCAv/yLjwtGKTEFNRTMuOTeqqqqqqqqqqqqq/+MYxEkNmdJkUYc4AKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");var l=Date.now(),m=setInterval(function(){var b=Date.now()-l>5e3;d&&!b||(clearInterval(m),a(c))},1)}}(MIDI),function(a){"use strict";function b(a){return a.replace(/[^a-z0-9_ ]/gi,"").replace(/[ ]/g,"_").toLowerCase()}function c(a,b){var c=f[b];if(c)return c[a]}function d(b,c,d,e){var h=f[c];if(h){e?setTimeout(function(){h[b]=d},e):h[b]=d;var i=a.messageHandler[b]||g[b];i&&i(c,d,e)}}var e=function(a){var c={},d=c.byCategory={},e=c.byId={},f=c.byName={};for(var g in a)for(var h=a[g],i=0,j=h.length;i<j;i++){var k=h[i];if(k){var l=parseInt(k.substr(0,k.indexOf(" ")),10),m=k.replace(l+" ",""),n=b(m),o=b(g),p={id:n,name:m,program:--l,category:g};e[l]=p,f[n]=p,d[o]=d[o]||[],d[o].push(p)}}return c}({Piano:["1 Acoustic Grand Piano","2 Bright Acoustic Piano","3 Electric Grand Piano","4 Honky-tonk Piano","5 Electric Piano 1","6 Electric Piano 2","7 Harpsichord","8 Clavinet"],"Chromatic Percussion":["9 Celesta","10 Glockenspiel","11 Music Box","12 Vibraphone","13 Marimba","14 Xylophone","15 Tubular Bells","16 Dulcimer"],Organ:["17 Drawbar Organ","18 Percussive Organ","19 Rock Organ","20 Church Organ","21 Reed Organ","22 Accordion","23 Harmonica","24 Tango Accordion"],Guitar:["25 Acoustic Guitar (nylon)","26 Acoustic Guitar (steel)","27 Electric Guitar (jazz)","28 Electric Guitar (clean)","29 Electric Guitar (muted)","30 Overdriven Guitar","31 Distortion Guitar","32 Guitar Harmonics"],Bass:["33 Acoustic Bass","34 Electric Bass (finger)","35 Electric Bass (pick)","36 Fretless Bass","37 Slap Bass 1","38 Slap Bass 2","39 Synth Bass 1","40 Synth Bass 2"],Strings:["41 Violin","42 Viola","43 Cello","44 Contrabass","45 Tremolo Strings","46 Pizzicato Strings","47 Orchestral Harp","48 Timpani"],Ensemble:["49 String Ensemble 1","50 String Ensemble 2","51 Synth Strings 1","52 Synth Strings 2","53 Choir Aahs","54 Voice Oohs","55 Synth Choir","56 Orchestra Hit"],Brass:["57 Trumpet","58 Trombone","59 Tuba","60 Muted Trumpet","61 French Horn","62 Brass Section","63 Synth Brass 1","64 Synth Brass 2"],Reed:["65 Soprano Sax","66 Alto Sax","67 Tenor Sax","68 Baritone Sax","69 Oboe","70 English Horn","71 Bassoon","72 Clarinet"],Pipe:["73 Piccolo","74 Flute","75 Recorder","76 Pan Flute","77 Blown Bottle","78 Shakuhachi","79 Whistle","80 Ocarina"],"Synth Lead":["81 Lead 1 (square)","82 Lead 2 (sawtooth)","83 Lead 3 (calliope)","84 Lead 4 (chiff)","85 Lead 5 (charang)","86 Lead 6 (voice)","87 Lead 7 (fifths)","88 Lead 8 (bass + lead)"],"Synth Pad":["89 Pad 1 (new age)","90 Pad 2 (warm)","91 Pad 3 (polysynth)","92 Pad 4 (choir)","93 Pad 5 (bowed)","94 Pad 6 (metallic)","95 Pad 7 (halo)","96 Pad 8 (sweep)"],"Synth Effects":["97 FX 1 (rain)","98 FX 2 (soundtrack)","99 FX 3 (crystal)","100 FX 4 (atmosphere)","101 FX 5 (brightness)","102 FX 6 (goblins)","103 FX 7 (echoes)","104 FX 8 (sci-fi)"],Ethnic:["105 Sitar","106 Banjo","107 Shamisen","108 Koto","109 Kalimba","110 Bagpipe","111 Fiddle","112 Shanai"],Percussive:["113 Tinkle Bell","114 Agogo","115 Steel Drums","116 Woodblock","117 Taiko Drum","118 Melodic Tom","119 Synth Drum"],"Sound effects":["120 Reverse Cymbal","121 Guitar Fret Noise","122 Breath Noise","123 Seashore","124 Bird Tweet","125 Telephone Ring","126 Helicopter","127 Applause","128 Gunshot"],"Reserved Channel":["129 Percussion"]});e.getProgramSpec=function(c){var d;return(d="string"==typeof c?e.byName[b(c)]:e.byId[c])?d:void a.handleError("invalid program",arguments)},a.getProgram=function(a){return c("program",a)},a.programChange=function(a,b,c){var f=e.getProgramSpec(b);f&&isFinite(b=f.program)&&d("program",a,b,c)},a.getMono=function(a){return c("mono",a)},a.setMono=function(a,b,c){isFinite(b)&&d("mono",a,b,c)},a.getOmni=function(a){return c("omni",a)},a.setOmni=function(a,b,c){isFinite(b)&&d("omni",a,b,c)},a.getSolo=function(a){return c("solo",a)},a.setSolo=function(a,b,c){isFinite(b)&&d("solo",a,b,c)};var f=function(){for(var a={},b=0;b<=15;b++)a[b]={number:b,program:b,pitchBend:0,mute:!1,mono:!1,omni:!1,solo:!1};return a}();a.keyToNote={},a.noteToKey={},function(){for(var b=21,c=108,d=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"],e=["B#","C#","D","D#","Fb","E#","F#","G","G#","A","A#","Cb"],f=b;f<=c;f++){var g=(f-12)/12>>0,h=d[f%12]+g,i=e[f%12]+g;a.keyToNote[h]=f,a.keyToNote[i]=f,a.noteToKey[f]=h}}(),a.channels=f,a.GM=e,a.messageHandler={};var g={program:function(b,c,d){a.__api&&(a.player.isPlaying?(a.player.pause(),a.loadProgram(c,a.player.play)):a.loadProgram(c))}};a.handleError=function(a,b){console&&console.error&&console.error(a,b)}}(MIDI),function(a){"use strict";window.Audio&&function(){function b(b,c){if(a.channels[b]){var d=a.channels[b].program;9==channelId&&(d=128);var e=a.GM.byId[d].id,c=j[c];if(c){var k=e+""+c.id,l=(g+1)%h.length,m=h[l];if(i[l]=k,!a.Soundfont[e])return void(a.DEBUG&&console.log("404",e));m.src=a.Soundfont[e][c.id],m.volume=f[b]/127,m.play(),g=l}}}function c(b,c){if(a.channels[b]){var d=a.channels[b].program;9==channelId&&(d=128);var e=a.GM.byId[d].id,c=j[c];if(c)for(var f=e+""+c.id,k=0,l=h.length;k<l;k++){var m=(k+g+1)%l,n=i[m];if(n&&n==f)return h[m].pause(),void(i[m]=null)}}}for(var d=a.AudioTag={api:"audiotag"},e={},f=Array(16).fill(127),g=-1,h=[],i=[],j={},k=0;k<12;k++)h[k]=new Audio;d.audioBuffers=h,d.messageHandler={},d.send=function(a,b){},d.setController=function(a,b,c,d){},d.setVolume=function(a,b){f[a]=b},d.pitchBend=function(a,b,c){},d.noteOn=function(a,c,d,f){var g=e[c];if(j[g]){if(f)return setTimeout(function(){b(a,g)},1e3*f);b(a,g)}},d.noteOff=function(a,b,c){},d.chordOn=function(a,c,d,f){for(var g=0;g<c.length;g++){var h=c[g],i=e[h];if(j[i]){if(f)return setTimeout(function(){b(a,i)},1e3*f);b(a,i)}}},d.chordOff=function(a,b,d){for(var f=0;f<b.length;f++){var g=b[f],h=e[g];if(j[h]){if(d)return setTimeout(function(){c(a,h)},1e3*d);c(a,h)}}},d.stopAllNotes=function(){for(var a=0,b=h.length;a<b;a++)h[a].pause()},d.connect=function(b){a.setDefaultPlugin(d);for(var c in a.keyToNote)e[a.keyToNote[c]]=c,j[c]={id:c};b.onsuccess&&b.onsuccess()}}()}(MIDI),function(a){"use strict";window.AudioContext&&function(){function b(a,b,c){if(e){var f=new Audio;f.src=a,f.controls=!1,f.autoplay=!1,f.preload=!1,f.addEventListener("canplay",function(){b&&b(f)}),f.addEventListener("error",function(a){c&&c(a)}),document.body.appendChild(f)}else if(0===a.indexOf("data:audio")){var g=a.split(",")[1],h=Base64Binary.decodeArrayBuffer(g);d.decodeAudioData(h,b,c)}else{var i=new XMLHttpRequest;i.open("GET",a,!0),i.responseType="arraybuffer",i.onload=function(){d.decodeAudioData(i.response,b,c)},i.send()}}function c(){return new(window.AudioContext||window.webkitAudioContext)}var d,e=!1,f=a.WebAudio={api:"webaudio"},g={},h={},i=Array(16).fill(127),j={};f.audioBuffers=j,f.messageHandler={},f.send=function(a,b){},f.setController=function(a,b,c,d){},f.setVolume=function(a,b,c){c?setTimeout(function(){i[a]=b},1e3*c):i[a]=b},f.pitchBend=function(b,c,d){var e=a.channels[b];e&&(d?setTimeout(function(){e.pitchBend=c},d):e.pitchBend=c)},f.noteOn=function(b,c,f,k){k=k||0;var l=a.channels[b],m=l.program;9==b&&(m=128,f*=.75);var n=m+"x"+c,o=j[n];if(o){if(k<d.currentTime&&(k+=d.currentTime),e)var p=d.createMediaElementSource(o);else{var p=d.createBufferSource();p.buffer=o}if(h){var q=p;for(var r in h)q.connect(h[r].input),q=h[r]}var s=f/127*(i[b]/127)*2-1;if(p.connect(d.destination),p.playbackRate.value=1,p.gainNode=d.createGain(),p.gainNode.connect(d.destination),p.gainNode.gain.value=Math.min(1,Math.max(-1,s)),p.connect(p.gainNode),e){if(k)return setTimeout(function(){o.currentTime=0,o.play()},1e3*k);o.currentTime=0,o.play()}else p.start(k||0);return g[b+"x"+c]=p,p}a.handleError("no buffer",arguments)},f.noteOff=function(b,c,f){f=f||0;var h=a.channels[b],i=h.program;9==b&&(i=128);var k=i+"x"+c,l=j[k];if(l){f<d.currentTime&&(f+=d.currentTime);var m=g[b+"x"+c];if(m){if(m.gainNode){var n=m.gainNode.gain;n.linearRampToValueAtTime(n.value,f),n.linearRampToValueAtTime(-1,f+.3)}return e?f?setTimeout(function(){l.pause()},1e3*f):l.pause():m.noteOff?m.noteOff(f+.5):m.stop(f+.5),delete g[b+"x"+c],m}}},f.chordOn=function(a,b,c,d){for(var e,g={},h=0,i=b.length;h<i;h++)g[e=b[h]]=f.noteOn(a,e,c,d);return g},f.chordOff=function(a,b,c){for(var d,e={},g=0,h=b.length;g<h;g++)e[d=b[g]]=f.noteOff(a,d,c);return e},f.stopAllNotes=function(){for(var a in g){var b=0;b<d.currentTime&&(b+=d.currentTime);var c=g[a];c.gain.linearRampToValueAtTime(1,b),c.gain.linearRampToValueAtTime(0,b+.3),c.noteOff?c.noteOff(b+.3):c.stop(b+.3),delete g[a]}},f.setEffects=function(b){if(!d.tunajs)return void a.handleError("effects not installed.",arguments);for(var c=0;c<b.length;c++){var e=b[c],f=new d.tunajs[e.type](e);f.connect(d.destination),h[e.type]=f}},f.connect=function(b){a.setDefaultPlugin(f),f.setContext(d||c(),b.onsuccess)},f.getContext=function(){return d},f.setContext=function(c,e,f,g){function h(a){for(var b in n)if(n[b])return;e&&(e(),e=null)}function i(c,d,e,f){var g=c[f];g&&(n[d]++,b(g,function(b){b.id=f;var e=a.keyToNote[f];if(j[d+"x"+e]=b,0===--n[d]){c.isLoaded=!0,a.DEBUG&&console.log("loaded: ",p),h(p)}},function(){a.handleError("audio could not load",arguments)}))}d=c,"undefined"!=typeof Tuna&&(d.tunajs instanceof Tuna||(d.tunajs=new Tuna(d)));var k=[],l=a.keyToNote;for(var m in l)k.push(m);var n={},o=a.Soundfont;for(var p in o){var q=o[p];if(!q.isLoaded){var r=a.GM.byName[p];if(r){var s=r.program;n[s]=0;for(var t=0;t<k.length;t++){var m=k[t];i(q,s,t,m)}}}}setTimeout(h,1)}}()}(MIDI),function(a){"use strict";var b=null,c=a.WebMIDI={api:"webmidi"};c.messageHandler={},c.messageHandler.program=function(a,c,d){b.send([192+a,c],1e3*d)},c.send=function(a,c){b.send(a,1e3*c)},c.setController=function(a,c,d,e){b.send([a,c,d],1e3*e)},c.setVolume=function(a,c,d){b.send([176+a,7,c],1e3*d)},c.pitchBend=function(a,c,d){b.send([224+a,c],1e3*d)},c.noteOn=function(a,c,d,e){b.send([144+a,c,d],1e3*e)},c.noteOff=function(a,c,d){b.send([128+a,c,0],1e3*d)},c.chordOn=function(a,c,d,e){for(var f=0;f<c.length;f++){var g=c[f];b.send([144+a,g,d],1e3*e)}},c.chordOff=function(a,c,d){for(var e=0;e<c.length;e++){var f=c[e];b.send([128+a,f,0],1e3*d)}},c.stopAllNotes=function(){b.cancel();for(var a=0;a<16;a++)b.send([176+a,123,0])},c.connect=function(d){function e(b){if(g&&g(b),window.AudioContext)d.api="webaudio";else{if(!window.Audio)return;d.api="audiotag"}a.loadPlugin(d)}var f=d.onsuccess,g=d.onerror;a.setDefaultPlugin(c),navigator.requestMIDIAccess().then(function(a){var c=a.outputs;b="function"==typeof c?c()[0]:c[0],void 0===b?e():f&&f()},g)}}(MIDI),"undefined"==typeof MIDI&&(MIDI={}),MIDI.Soundfont=MIDI.Soundfont||{},MIDI.player=MIDI.player||{},function(a){"use strict";function b(b,d){function e(){h&&h("load",1),a[d].connect(b)}var f=b.format,g=b.instruments,h=b.onprogress,i=b.onerror,j=g.length,k=j;if(j)for(var l=0;l<j;l++){var m=g[l];a.Soundfont[m]?!--k&&e():c(g[l],f,function(a,b){var c=b/j,d=(j-k)/j;h&&h("load",c+d,m)},function(){!--k&&e()},i)}else e()}function c(b,c,d,e,f){var g=a.soundfontUrl+b+"-"+c+".js";a.USE_XHR?galactic.util.request({url:g,format:"text",onerror:f,onprogress:d,onsuccess:function(a,b){var c=document.createElement("script");c.language="javascript",c.type="text/javascript",c.text=b,document.body.appendChild(c),e()}}):dom.loadScript.add({url:g,verify:'MIDI.Soundfont["'+b+'"]',onerror:f,onsuccess:function(){e()}})}"undefined"!=typeof console&&console.log&&console.log("MIDI.js 0.4.2"),a.DEBUG=!0,a.USE_XHR=!0,a.soundfontUrl="./soundfont/",a.loadPlugin=function(b,c,e,f){function g(c){var e=location.hash,f="";if(c[b.api]?f=b.api:c[e.substr(1)]?f=e.substr(1):c.webmidi?f="webmidi":window.AudioContext?f="webaudio":window.Audio&&(f="audiotag"),d[f]){if(b.audioFormat)var g=b.audioFormat;else var g=c["audio/ogg"]?"ogg":"mp3";a.__api=f,a.__audioFormat=g,a.supports=c,a.loadProgram(b)}}"function"==typeof b&&(b={onsuccess:b}),b=b||{},b.api=b.api||a.__api,b.soundfontUrl&&(a.soundfontUrl=b.soundfontUrl),a.supports?g(a.supports):a.audioDetect(g)},a.loadProgram=function(){function b(b){var c=b.instruments||b.instrument||a.channels[0].program;"object"!=typeof c&&(c=void 0===c?[]:[c]);for(var d=0;d<c.length;d++){var e=c[d];e===+e&&a.GM.byId[e]&&(c[d]=a.GM.byId[e].id)}return c}return function(c,e,f,g){c=c||{},"object"!=typeof c&&(c={instrument:c}),f&&(c.onerror=f),g&&(c.onprogress=g),e&&(c.onsuccess=e),c.format=a.__audioFormat,c.instruments=b(c),d[a.__api](c)}}();var d={webmidi:function(b){a.WebMIDI.connect(b)},audiotag:function(a){b(a,"AudioTag")},webaudio:function(a){b(a,"WebAudio")}};a.setDefaultPlugin=function(b){for(var c in b)a[c]=b[c]}}(MIDI),"undefined"==typeof MIDI&&(MIDI={}),"undefined"==typeof MIDI.Player&&(MIDI.Player={}),function(){"use strict";var a=MIDI.Player;a.currentTime=0,a.endTime=0,a.restart=0,a.playing=!1,a.timeWarp=1,a.startDelay=0,a.BPM=120,a.start=a.resume=function(b){a.currentTime<-1&&(a.currentTime=-1),l(a.currentTime,null,b)},a.pause=function(){var b=a.restart;m(),a.restart=b},a.stop=function(){m(),a.restart=0,a.currentTime=0},a.addListener=function(a){g=a},a.removeListener=function(){g=void 0},a.clearAnimation=function(){a.animationFrameId&&cancelAnimationFrame(a.animationFrameId)},a.setAnimation=function(b){var c=0,d=0,e=0;a.clearAnimation();var g=function(){if(a.animationFrameId=requestAnimationFrame(g),0!==a.endTime){a.playing?(c=e===a.currentTime?d-Date.now():0,c=0===a.currentTime?0:a.currentTime-c,e!==a.currentTime&&(d=Date.now(),e=a.currentTime)):c=a.currentTime;var h=a.endTime,i=c/h,j=c/1e3,k=j/60>>>0,l=j-60*k>>>0,m=60*k+l,n=h/1e3;n-m<-1||b({now:m,end:n,percent:i,events:f})}};requestAnimationFrame(g)},a.loadMidiFile=function(b,c,d){try{a.replayer=new Replayer(MidiFile(a.currentData),a.timeWarp,null),a.data=a.replayer.getData(),a.endTime=j(),MIDI.loadPlugin({instruments:a.getFileInstruments(),onsuccess:b,onprogress:c,onerror:d})}catch(e){d&&d(e)}},a.loadFile=function(b,c,d,e){if(a.stop(),b.indexOf("base64,")!==-1){var f=window.atob(b.split(",")[1]);a.currentData=f,a.loadMidiFile(c,d,e)}else{var g=new XMLHttpRequest;g.open("GET",b),g.overrideMimeType("text/plain; charset=x-user-defined"),g.onreadystatechange=function(){if(4===this.readyState)if(200===this.status){for(var b=this.responseText||"",f=[],g=b.length,h=String.fromCharCode,i=0;i<g;i++)f[i]=h(255&b.charCodeAt(i));var j=f.join("");a.currentData=j,a.loadMidiFile(c,d,e)}else e&&e("Unable to load MIDI file")},g.send()}},a.getFileInstruments=function(b){b=b||a.data;for(var c={},d={},e=0;e<b.length;e++){var f=b[e][0].event;if("channel"===f.type){var g=f.channel;switch(f.subtype){case"controller":break;case"programChange":d[g]=f.programNumber;break;case"noteOn":var h=d[g],i=MIDI.GM.byId[isFinite(h)?h:g];9==g&&(c.percussion=!0),c[i.id]=!0}}}var j=[];for(var k in c)j.push(k);return console.log("get Instruments"),j};var b,c,d=[],e=0,f={},g=void 0,h=function(c,e,h,i,j,k,m){return setTimeout(function(){var i={channel:c,note:e,now:h,end:a.endTime,message:j,velocity:k};128===j?delete f[e]:f[e]=i,g&&g(i),a.currentTime=h,d.shift(),d.length<1e3?l(b,!0):a.currentTime===b&&b<a.endTime&&l(b,!0)},h-i)},i=function(){return"webaudio"===MIDI.api?MIDI.WebAudio.getContext():(a.ctx={currentTime:0},a.ctx)},j=function(){for(var b=a.data,c=b.length,d=.5,e=0;e<c;e++)d+=b[e][1];return d},k=function(){return window.performance&&window.performance.now?window.performance.now():Date.now()},l=function(f,g,l){if(!a.replayer)return void console.log("no replayer!");g||("undefined"==typeof f&&(f=a.restart),a.playing&&m(),a.playing=!0,a.data=a.replayer.getData(),a.endTime=j());var n,o=0,p=0,q=a.data,r=i(),s=q.length;b=.5;var t=(d[0]&&d[0].interval||0,f-a.currentTime);if("webaudio"!==MIDI.api){var u=k();
c=c||u,r.currentTime=(u-c)/1e3}e=r.currentTime;for(var v=0;v<s&&p<100;++v){var w=q[v];if((b+=w[1])<=f)o=b;else{f=b-o;var x=w[0].event;if("channel"===x.type){var y=x.channel,z=MIDI.channels[y],A=r.currentTime+(f+t+a.startDelay)/1e3,B=b-o+a.startDelay;switch(x.subtype){case"controller":MIDI.setController(y,x.controllerType,x.value,A);break;case"programChange":MIDI.programChange(y,x.programNumber,A),console.log("replayer programChange");break;case"pitchBend":MIDI.pitchBend(y,x.value,A);break;case"noteOn":if(z.mute)break;n=x.noteNumber-(a.MIDIOffset||0),d.push({event:x,time:B,source:MIDI.noteOn(y,x.noteNumber,x.velocity,A),interval:h(y,n,b+a.startDelay,o-t,144,x.velocity)}),p++;break;case"noteOff":if(z.mute)break;n=x.noteNumber-(a.MIDIOffset||0),d.push({event:x,time:B,source:MIDI.noteOff(y,x.noteNumber,A),interval:h(y,n,b,o-t,128,0)})}}}}l&&l(d)},m=function(){var b=i();for(a.playing=!1,a.restart+=1e3*(b.currentTime-e);d.length;){var c=d.pop();window.clearInterval(c.interval),c.source&&("number"==typeof c.source?window.clearTimeout(c.source):c.source.disconnect(0))}for(var h in f){var c=f[h];144===f[h].message&&g&&g({channel:c.channel,note:c.note,now:c.now,end:c.end,message:128,velocity:c.velocity})}f={}}}();var TEST=TEST||{};MIDI.setMidi=function(a,b){var c="object"==typeof a?MidiWriter(a):a;MIDI.Player.loadFile("base64,"+btoa(c),function(){b&&MIDI.Player.start(),c==MIDI.Player.currentData&&console.log("PASS: loadFile")})},TEST.testMidiPlayer=function(){for(var a=new simpMidi,b=0;b<10;++b)a.addEvent(0,"noteOn",0,[60+2*b,100]),a.addEvent(500,"noteOff",0,[60+2*b,0]);return a.finish(),MIDI.Player.loadFile("./mid/test.mid",function(){TEST.testMidi(MIDI.Player.currentData),MIDI.setMidi(a,!0)}),TEST.testMidi(a)};
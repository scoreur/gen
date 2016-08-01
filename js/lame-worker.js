onmessage = function(e){
    switch(e.data.type){
        case 'wav':
            if(typeof lamejs == 'undefined' || lamejs == null){
                importScripts('lib/lame.min.js');
            }
            var blob = wavToMp3(e.data.floatData, e.data.boot, e.data.blockSize, e.data.onprocess);
            postMessage({type:'mp3', blob:blob});
            break;
        case 'raw':
            // to wav
            var blob = wavFile(e.data.data);
            postMessage({type:'wav', blob:blob});
            break;
        default:
            // not recognize
    }

}

function wavFile(data){
    var header = new Int8Array([
        82, 73, 70, 70, // RIFF
        255, 255, 255, 255, // 36 +
        87, 65, 86, 69, // WAVE
        102, 109, 116, 32, // "fmt "
        16, 0, 0, 0, // fmt chunk size
        1, 0, 2, 0, // pcm, 2 channel
        128, 187, 0, 0, // sampleps
        0, 119, 1, 0, // bytes per sec
        4, 0, 16, 0, // blockAlign, bits per sample
        100, 97, 116, 97, // data
        255, 255, 255, 255 // datasize
    ]);

    var bL = data[0], bR = data[1];
    var len = bL.length, max = 0x7fff-1;
    var buffer = new Int16Array(len*2);
    for(var i=0;i<len;++i){
        buffer[i*2] = Math.floor(max * bL[i]);
        buffer[i*2+1] = Math.floor(max * bR[i]);
    }


    function setHeader(datasize, sampleps){
        var dv = new DataView(header.buffer);
        dv.setInt32(40,datasize, true);
        dv.setInt32(4,datasize+36, true);
        dv.setInt32(24,sampleps, true);
    }
    function toBlob(){
        setHeader(4 * len, 44100);// datasize = blockAlign * length
        return new Blob([header, buffer], {type:'audio/wav'});
    }
    return toBlob();

}

function wavToMp3(floatData,boot,blockSize,onprocess){

    var blockSize = blockSize || 1152;
    var len = floatData[0].length;
    if(blockSize<0){
        blockSize = len/-blockSize;
    }
    if(blockSize > 11520){
        blockSize = 11520; //upper limit
    }
    blockSize = 576 * Math.floor(blockSize/576); // ensure multiple of 576
    console.log('blockSize ', blockSize);
    var encoder = new lamejs.Mp3Encoder(2, 44100, 128); //
    var i = 0;
    var chL = new Int16Array(blockSize);
    var chR = new Int16Array(blockSize);
    var bL = floatData[0], bR = floatData[1];
    var mp3Data = [];
    var buf;
    var max = 0x7fff - 1;
    if(boot){
        boot = max / Math.max(Math.max(bL), Math.max(bR));
    }else{
        boot = max;
    }
    function adjust(val){
        if(val>1.0){
            val = 1.0;
        }else if(val<-1.0){
            val = -1.0;
        }
        return Math.floor(val*boot);
    }
    if(len>floatData[1].length){
        len = floatData[1].length;
    }
    var block_left = Math.ceil(len/blockSize);
    while(i<len){
        if(onprocess)postMessage({type:'percent', percent:block_left--});
        var realLen = blockSize;
        if(i+realLen > len){
            realLen = len - i;
        }
        for(var j=0;j<realLen;++j,++i){
            // check max, min
            chL[j] = adjust(bL[i]);
            chR[j] = adjust(bR[i]);
        }
        buf = encoder.encodeBuffer(chL.subarray(0,realLen), chR.subarray(0,realLen));
        if(buf.length > 0){
            mp3Data.push(buf);
        }
    }
    buf = encoder.flush();
    if(buf.length > 0){
        mp3Data.push(new Int8Array(buf));
    }
    return new Blob(mp3Data, {type:'audio/mp3'});


}
importScripts('lib/lame.min.js');
onmessage = function(e){
    if(e.data.type == 'wav'){
        var blob = wavToMp3(e.data.floatData, e.data.boot, e.data.blockSize, e.data.onprocess);
        postMessage({type:'mp3', blob:blob});
    }

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
/* Wrapper for accessing strings through sequential reads */
// TODO: use typed array
function Stream(str) {
	var position = 0;
	var instr = "";
	
	function read(length) {
		var result = str.substr(position, length);
		position += length;
		return result;
	}
	function write(s){
		instr += s;
		return position += s.length;
	}
	
	/* read a big-endian 32-bit integer */
	function readInt32() {
		var result = (
			(str.charCodeAt(position) << 24)
			+ (str.charCodeAt(position + 1) << 16)
			+ (str.charCodeAt(position + 2) << 8)
			+ str.charCodeAt(position + 3));
		position += 4;
		return result;
	}
	function writeInt32(i){
		instr += String.fromCharCode((i>>24)&0xFF,(i>>16)&0xFF,(i>>8)&0xFF,i&0xFF);
		return position += 4;
	}

	/* read a big-endian 16-bit integer */
	function readInt16() {
		var result = (
			(str.charCodeAt(position) << 8)
			+ str.charCodeAt(position + 1));
		position += 2;
		return result;
	}
	function writeInt16(i){
        instr += String.fromCharCode((i>>8)&0xFF,i&0xFF);
		return position += 2;
	}
	
	/* read an 8-bit integer */
	function readInt8(signed) {
		var result = str.charCodeAt(position);
		if (signed && result > 127) result -= 256;
		position += 1;
		return result;
	}
	function writeInt8(i){
        instr += String.fromCharCode(i&0xFF);
        return position += 1;
	}
	
	function eof() {
		return position >= str.length;
	}
	
	/* read a MIDI-style variable-length integer
		(big-endian value in groups of 7 bits,
		with top bit set to signify that another byte follows)
	*/
	function readVarInt() {
		var result = 0;
		while (true) {
			var b = readInt8();
			if (b & 0x80) {
				result += (b & 0x7f);
				result <<= 7;
			} else {
				/* b is the last byte */
				return result + b;
			}
		}
	}
	function writeVarInt(i){
		var ret = String.fromCharCode(i&0x7F);
		while(i>0x7F){
			i >>= 7;
            ret = String.fromCharCode(0x80|(i&0x7F)) + ret;
		}
		instr += ret;
		return position += ret.length;
	}
    function reset(){
    	position = 0;
    	instr = "";
    }
	function return_str(){
		return str;
	}
	function return_instr(){
		return instr;
	}

	if(typeof str == "string"){
		return {
			'eof': eof,
			'read': read,
			'readInt32': readInt32,
			'readInt16': readInt16,
			'readInt8': readInt8,
			'readVarInt': readVarInt,
			'readAll': return_str,
			'reset': reset
	    }

	}else{
		return {
			'write': write,
			'writeInt32': writeInt32,
			'writeInt16': writeInt16,
			'writeInt8': writeInt8,
			'writeVarInt': writeVarInt,
			'readAll': return_instr,
			'reset': reset
		}

	}
}

// test case
var TEST = TEST || {};
TEST.testStream = function (){
	var w = Stream();
	w.writeVarInt(0x8FFF);
	w.writeInt8(0x1F);
	w.writeVarInt(0x76FF32);
	var r = Stream(w.readAll());
	if(r.readVarInt() == 0x8FFF  && r.readInt8(true) == 0x1F && r.readVarInt() == 0x76FF32){
		console.log('PASS: writeVarInt');
	}else{
		console.log('Fail: writeVarInt', w.readAll(), r.readAll());
	}

	r = Stream('abcdefghijklmn12');
	w = Stream();
	while(!r.eof()){
		w.writeInt32(r.readInt32());
	}
	if(r.readAll() == w.readAll()){
		console.log('PASS: writeInt32');
	}else{
		console.log('Fail: writeInt32', w.readAll());
	}

	r.reset();
	w = Stream();
	while(!r.eof()){
		w.writeInt16(r.readInt16());
	}
	if(r.readAll() == w.readAll()){
		console.log('PASS: writeInt16');
	}else{
		console.log('Fail: writeInt16', w.readAll());
	}
}
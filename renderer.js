// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const BrowserWindow = require('electron').remote.BrowserWindow;
console.log('renderer loaded');
const path = require('path')
const newWinBtn = document.getElementById('win_btn');
newWinBtn.addEventListener('click', function(e){
	let win = new BrowserWindow({width: 400, height: 300});
	win.on('close', function(){win=null;});
	win.loadURL(path.join('file://',__dirname,'./index.html'));
	win.show();
});


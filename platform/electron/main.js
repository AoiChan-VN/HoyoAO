const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
function createWindow(){
  const win = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true },
  });
  win.loadFile('../../index.html');
}
app.whenReady().then(createWindow); 

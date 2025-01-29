const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const win = new BrowserWindow({
    width: Math.floor(width / 3),  // 设置窗口宽度为屏幕宽度的 1/3
    height: Math.floor(height / 3), // 设置窗口高度为屏幕高度的 1/3
    resizable: false, // 禁止调整大小
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

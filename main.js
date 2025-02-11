const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Store = require('electron-store')
const store = new Store()

function createWindow() {
  // Get saved window bounds, or use defaults
  const savedBounds = store.get('windowBounds', {
    width: 900,
    height: 500,
    isLocked: false
  })

  const win = new BrowserWindow({
    ...savedBounds,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    resizable: !savedBounds.isLocked
  })

  win.loadFile('index.html')

  // Send initial lock state to renderer
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('update-lock-state', savedBounds.isLocked)
  })

  // Save window bounds when window is moved or resized
  win.on('resize', () => {
    if (!savedBounds.isLocked) {
      store.set('windowBounds', {
        ...win.getBounds(),
        isLocked: savedBounds.isLocked
      })
    }
  })

  win.on('move', () => {
    if (!savedBounds.isLocked) {
      store.set('windowBounds', {
        ...win.getBounds(),
        isLocked: savedBounds.isLocked
      })
    }
  })

  // Handle window lock toggle
  ipcMain.on('toggle-window-lock', (event, isLocked) => {
    win.setResizable(!isLocked)
    store.set('windowBounds', {
      ...win.getBounds(),
      isLocked
    })
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  toggleWindowLock: (isLocked) => {
    ipcRenderer.send('toggle-window-lock', isLocked)
  },
  onUpdateLockState: (callback) => {
    ipcRenderer.on('update-lock-state', (event, isLocked) => callback(isLocked))
  }
})
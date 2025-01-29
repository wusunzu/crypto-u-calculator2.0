const { contextBridge } = require('electron')

// Expose protected methods that allow the renderer process to use
// specific electron APIs without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Add any functions you want to expose here
  }
)
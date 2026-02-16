// electron/preload.js
// Preload script to expose secure APIs to the renderer process.
// Key Internal Depends On: (none)
// Key Internal Exported To: Frontend/src/lib/api.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  log: (level, message, meta) => ipcRenderer.send('log', { level, message, meta }),
  getApiConfig: () => ipcRenderer.invoke('get-api-config')
});

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
    clear: () => ipcRenderer.invoke('store:clear'),
  },

  // Profile operations
  profile: {
    launch: (profile) => ipcRenderer.invoke('profile:launch', profile),
    close: (profileId) => ipcRenderer.invoke('profile:close', profileId),
    export: (profile) => ipcRenderer.invoke('profile:export', profile),
    import: () => ipcRenderer.invoke('profile:import'),
  },

  // Cookies operations
  cookies: {
    export: (profileId) => ipcRenderer.invoke('cookies:export', profileId),
    import: (profileId) => ipcRenderer.invoke('cookies:import', profileId),
  },

  // File system operations
  fs: {
    selectDirectory: () => ipcRenderer.invoke('fs:selectDirectory'),
    selectFile: (options) => ipcRenderer.invoke('fs:selectFile', options),
  },

  // Application info
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
    getPath: (name) => ipcRenderer.invoke('app:getPath', name),
  },

  // Logging
  log: {
    info: (message) => ipcRenderer.send('log:info', message),
    error: (message) => ipcRenderer.send('log:error', message),
    warn: (message) => ipcRenderer.send('log:warn', message),
  },
});

console.log('Preload script loaded successfully');

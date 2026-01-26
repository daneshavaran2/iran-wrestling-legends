const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Platform info
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
  
  // Online/Offline events
  onOnlineStatus: (callback) => {
    ipcRenderer.on('online-status', (event, status) => callback(status));
  },
  
  // App info
  getAppVersion: () => {
    return ipcRenderer.invoke('get-app-version');
  },
  
  // Window controls (if needed in future)
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Kiosk utilities
  isKioskMode: () => {
    return process.env.NODE_ENV !== 'development' && !process.argv.includes('--dev');
  },
});

// Handle online/offline events from browser
window.addEventListener('online', () => {
  ipcRenderer.send('online-status-change', true);
});

window.addEventListener('offline', () => {
  ipcRenderer.send('online-status-change', false);
});

// Log when preload is loaded
console.log('Electron preload script loaded');

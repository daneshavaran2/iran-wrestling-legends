const { app, BrowserWindow, globalShortcut, Menu, shell } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow;

// Check if running in development
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !isDev,
    kiosk: !isDev,
    frame: isDev,
    autoHideMenuBar: !isDev,
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, '../public/favicon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    // Kiosk settings
    resizable: isDev,
    minimizable: isDev,
    maximizable: isDev,
    closable: isDev,
    skipTaskbar: !isDev,
  });

  // Remove menu in production
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  // Load the app
  if (isDev) {
    // Development: load from Vite dev server
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from dist folder
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Disable navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    if (parsedUrl.origin !== 'http://localhost:8080' && !url.startsWith('file://')) {
      event.preventDefault();
      // Open external links in default browser
      shell.openExternal(url);
    }
  });

  // Block new windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Disable keyboard shortcuts in kiosk mode
  if (!isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Block dangerous shortcuts
      const blockedKeys = ['F12', 'F11', 'F5'];
      const blockedCombos = [
        { ctrl: true, shift: true, key: 'I' }, // DevTools
        { ctrl: true, shift: true, key: 'J' }, // DevTools Console
        { ctrl: true, key: 'R' }, // Reload
        { ctrl: true, shift: true, key: 'R' }, // Hard Reload
        { alt: true, key: 'F4' }, // Close
        { ctrl: true, key: 'W' }, // Close tab
        { ctrl: true, key: 'Q' }, // Quit (but not with shift)
      ];

      // Block F-keys
      if (blockedKeys.includes(input.key)) {
        event.preventDefault();
        return;
      }

      // Block Escape (unless in fullscreen)
      if (input.key === 'Escape') {
        event.preventDefault();
        return;
      }

      // Block key combinations
      for (const combo of blockedCombos) {
        const ctrlMatch = combo.ctrl ? input.control : !input.control;
        const shiftMatch = combo.shift ? input.shift : !input.shift;
        const altMatch = combo.alt ? input.alt : !input.alt;
        const keyMatch = input.key.toUpperCase() === combo.key.toUpperCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          // Allow Ctrl+Shift+Q for secret exit
          if (input.control && input.shift && input.key.toUpperCase() === 'Q') {
            continue;
          }
          event.preventDefault();
          return;
        }
      }
    });
  }

  // Secret exit shortcut: Ctrl+Shift+Q
  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    console.log('Secret exit triggered');
    app.quit();
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent closing with Alt+F4 in kiosk mode
  if (!isDev) {
    mainWindow.on('close', (event) => {
      // Only allow close via secret shortcut
      event.preventDefault();
    });
  }

  // Send online/offline status to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('online-status', navigator.onLine);
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up shortcuts on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Handle certificate errors (for local development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Disable hardware acceleration if needed (for some kiosk systems)
// app.disableHardwareAcceleration();

// Single instance lock - prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

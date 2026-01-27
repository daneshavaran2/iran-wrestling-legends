const { app, BrowserWindow, globalShortcut, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');

// Auto-updater (only in production builds)
let autoUpdater;
let log;

try {
  autoUpdater = require('electron-updater').autoUpdater;
  log = require('electron-log');
  
  // Configure logging
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';
  
  // Disable auto download - ask user first
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
} catch (e) {
  // electron-updater not available (development mode)
  console.log('Auto-updater not available:', e.message);
}

// Keep a global reference of the window object
let mainWindow;
let splashWindow;

// Check if running in development
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function createWindow() {
  // Show splash first
  createSplashWindow();

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !isDev,
    kiosk: !isDev,
    frame: isDev,
    autoHideMenuBar: !isDev,
    backgroundColor: '#0a0a0a',
    show: false, // Start hidden, show after loaded
    icon: path.join(__dirname, '../public/app-icon.png'),
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

  // When main window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    // Wait for splash to show at least 2.5 seconds
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      mainWindow.show();
      
      if (!isDev) {
        mainWindow.setFullScreen(true);
      }
      
      mainWindow.webContents.send('online-status', navigator.onLine);
    }, 2500);
  });

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
    dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['خروج', 'انصراف'],
      defaultId: 1,
      title: 'خروج از برنامه',
      message: 'آیا می‌خواهید از برنامه خارج شوید؟',
    }).then((result) => {
      if (result.response === 0) {
        app.quit();
      }
    });
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
}

// Auto-updater event handlers
function setupAutoUpdater() {
  if (!autoUpdater) return;

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
    sendStatusToWindow('در حال بررسی آپدیت...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'آپدیت جدید',
      message: `نسخه جدید ${info.version} موجود است.\nآیا می‌خواهید دانلود کنید؟`,
      detail: `نسخه فعلی: ${app.getVersion()}`,
      buttons: ['بله، دانلود شود', 'بعداً'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
        sendStatusToWindow('در حال دانلود آپدیت...');
      }
    });
  });

  autoUpdater.on('update-not-available', () => {
    log.info('No update available');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    log.info(`Download progress: ${percent}%`);
    sendStatusToWindow(`دانلود آپدیت: ${percent}%`);
    
    if (mainWindow) {
      mainWindow.setProgressBar(progressObj.percent / 100);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    
    if (mainWindow) {
      mainWindow.setProgressBar(-1); // Remove progress bar
    }
    
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'آپدیت آماده نصب',
      message: `نسخه ${info.version} دانلود شد.\nبرنامه باید ریستارت شود.`,
      buttons: ['ریستارت و نصب'],
    }).then(() => {
      autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (err) => {
    log.error('Auto-updater error:', err);
    sendStatusToWindow('خطا در بررسی آپدیت');
  });
}

function sendStatusToWindow(text) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', text);
  }
}

function checkForUpdates() {
  if (!autoUpdater || isDev) return;
  
  try {
    autoUpdater.checkForUpdates();
  } catch (e) {
    log?.error('Check for updates failed:', e);
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  // Check for updates after 5 seconds
  setTimeout(checkForUpdates, 5000);
  
  // Check every 4 hours
  setInterval(checkForUpdates, 4 * 60 * 60 * 1000);

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

// IPC handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('check-for-updates', () => checkForUpdates());

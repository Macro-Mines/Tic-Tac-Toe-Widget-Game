const { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 720,
    height: 520,
    minWidth: 540,
    minHeight: 440,
    frame: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f1f5f9',
      symbolColor: '#475569',
      height: 38
    },
    transparent: false,
    backgroundColor: '#f8fafc',
    title: 'Tic Tac Toe AI Desktop Widget',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('close', (event) => {
    // If tray exists, minimize to tray instead of quitting
    if (tray && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function registerShortcuts() {
  // Calculator dedicated button / launch shortcut
  try {
    globalShortcut.register('LaunchApp2', () => {
      toggleWindow();
    });
  } catch (e) {
    // Media key might not exist on all keyboards
  }

  // Universal Quick Trigger hotkeys
  try {
    globalShortcut.register('CommandOrControl+Alt+T', () => {
      toggleWindow();
    });
  } catch (e) {}
}

function toggleWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    if (mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      mainWindow.focus();
    }
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function createTray() {
  try {
    // Simple 16x16 icon data uri or fallback
    const icon = nativeImage.createFromBuffer(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAExJREFUOE9jZKAQMFKon2H4f+p/hkVG/v//Z8LwGRlYGBm/MDKSGIDUYFIMwzD1ZDEGBpA15GvEZzC9jSImkU2UGEh080hiZCMwDMgDAK2rE8n782e4AAAAAElFTkSuQmCC',
        'base64'
      )
    );
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Launch Tic Tac Toe AI', click: () => toggleWindow() },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setToolTip('Tic Tac Toe AI Desktop Widget');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => toggleWindow());
  } catch (e) {
    console.warn('Tray creation skipped', e);
  }
}

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

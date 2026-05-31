const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { setupStateWatcher } = require('./state-watcher');

const STATE_FILE = path.join(os.homedir(), '.claude', 'agent-state.json');
const RESPONSE_FILE = path.join(os.homedir(), '.claude', 'agent-response.json');

let mainWindow = null;
let isQuitting = false;

function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch {}
  return null;
}

function writeResponse(requestId, decision) {
  const dir = path.dirname(RESPONSE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(RESPONSE_FILE, JSON.stringify({ requestId, decision }));
}

function createWindow() {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 150,
    height: 30,
    x: Math.round((screenWidth - 150) / 2),
    y: 8,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  ipcMain.on('resize-island', (_event, { width, height }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
      const x = Math.round((screenWidth - width) / 2);
      mainWindow.setBounds({ x, y: 8, width, height }, true);
    }
  });

  ipcMain.on('set-ignore-mouse', (_event, ignore) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
      mainWindow.setFocusable(!ignore);
    }
  });

  ipcMain.on('set-focusable', (_event, focusable) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setFocusable(focusable);
      if (focusable) {
        mainWindow.setIgnoreMouseEvents(false);
      }
    }
  });

  // 用户点击 Yes 确认
  ipcMain.on('confirm-action', () => {
    const state = readState();
    const requestId = (state && state.requestId) || '';

    // 写入回复文件，hook 读到后会自动 allow
    writeResponse(requestId, 'allow');

    // 回到 delivering 状态
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent-state-changed', {
        status: 'delivering',
        task: 'Agent 正在工作中...',
        command: '',
        details: '',
        requestId: '',
        timestamp: Date.now(),
        elapsed: '00:00',
      });
    }
  });

  // 用户点击 No 忽略
  ipcMain.on('ignore-action', () => {
    const state = readState();
    const requestId = (state && state.requestId) || '';

    writeResponse(requestId, 'deny');

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent-state-changed', {
        status: 'idle',
        task: '',
        command: '',
        details: '',
        requestId: '',
        timestamp: Date.now(),
        elapsed: '00:00',
      });
    }
  });

  setupStateWatcher(mainWindow);

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

app.on('ready', createWindow);

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

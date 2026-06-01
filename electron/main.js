const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { setupStateWatcher } = require('./state-watcher');

const STATE_FILE = path.join(os.homedir(), '.claude', 'agent-state.json');
const RESPONSE_FILE = path.join(os.homedir(), '.claude', 'agent-response.json');

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createTrayIcon() {
  // 生成 16x16 蓝色圆点图标作为托盘图标
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  const cx = 7.5, cy = 7.5, r = 6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) {
        buf[i] = 59;     // R
        buf[i + 1] = 130; // G
        buf[i + 2] = 246; // B (blue-500)
        buf[i + 3] = 255; // A
      } else {
        buf[i + 3] = 0;   // transparent
      }
    }
  }
  return nativeImage.createFromBuffer(buf, { width: size, height: size });
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Agent Delivery Island');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏灵动岛',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
          }
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // 点击托盘图标切换显示/隐藏
  tray.on('click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

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

function writeState(data) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(data));
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

  // 用户点击 Yes 确认 → 写入回复，hook 读到后返回 allow
  ipcMain.on('confirm-action', () => {
    const state = readState();
    const requestId = (state && state.requestId) || '';

    writeResponse(requestId, 'allow');

    const newState = {
      status: 'delivering',
      task: 'Agent 正在工作中...',
      command: '',
      details: '',
      requestId: '',
      timestamp: Date.now(),
      elapsed: '00:00',
    };
    writeState(newState);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent-state-changed', newState);

      // 短暂降低置顶，确保 Claude Code 可能有弹窗时用户也能看到
      mainWindow.setAlwaysOnTop(false);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setAlwaysOnTop(true, 'screen-saver');
        }
      }, 1500);
    }
  });

  // 用户点击 No 拒绝
  ipcMain.on('ignore-action', () => {
    const state = readState();
    const requestId = (state && state.requestId) || '';

    writeResponse(requestId, 'deny');

    const newState = {
      status: 'idle',
      task: '',
      command: '',
      details: '',
      requestId: '',
      timestamp: Date.now(),
      elapsed: '00:00',
    };
    writeState(newState);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent-state-changed', newState);
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

app.on('ready', () => {
  createWindow();
  createTray();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

const fs = require('fs');
const path = require('path');
const os = require('os');

const STATE_FILE = path.join(os.homedir(), '.claude', 'agent-state.json');
const WATCH_INTERVAL = 300;

function setupStateWatcher(mainWindow) {
  let lastState = null;

  function readState() {
    try {
      if (!fs.existsSync(STATE_FILE)) return null;
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function poll() {
    const state = readState();
    if (state && JSON.stringify(state) !== JSON.stringify(lastState)) {
      lastState = state;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('agent-state-changed', state);
      }
    }
  }

  poll();
  setInterval(poll, WATCH_INTERVAL);
}

module.exports = { setupStateWatcher };

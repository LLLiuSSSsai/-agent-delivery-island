const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('agentState', {
  onStateChange: (callback) => {
    ipcRenderer.on('agent-state-changed', (_event, state) => callback(state));
  },
  removeListener: () => {
    ipcRenderer.removeAllListeners('agent-state-changed');
  },
  resize: (width, height) => {
    ipcRenderer.send('resize-island', { width, height });
  },
  setIgnoreMouse: (ignore) => {
    ipcRenderer.send('set-ignore-mouse', ignore);
  },
  confirmAction: () => {
    ipcRenderer.send('confirm-action');
  },
  ignoreAction: () => {
    ipcRenderer.send('ignore-action');
  },
  setFocusable: (focusable) => {
    ipcRenderer.send('set-focusable', focusable);
  },
});

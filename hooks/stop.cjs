// Claude Code Stop hook — agent 完成回复
// 数据通过 stdin JSON 传入
const fs = require('fs');
const path = require('path');
const os = require('os');

const stateFile = path.join(os.homedir(), '.claude', 'agent-state.json');

let stdin = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => { stdin += chunk; });
process.stdin.on('end', () => {
  // 防止递归调用
  try {
    const input = JSON.parse(stdin || '{}');
    if (input.stop_hook_active) process.exit(0);
  } catch {}

  let current = {};
  try {
    if (fs.existsSync(stateFile)) {
      current = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    }
  } catch {}

  // 只在非 confirm（等待确认）和非 idle 时写 complete
  if (current.status === 'confirm' || current.status === 'idle' || current.status === 'complete') {
    process.exit(0);
  }

  const state = {
    status: 'complete',
    task: '',
    command: '',
    timestamp: Date.now(),
    elapsed: '00:00',
  };

  const dir = path.dirname(stateFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state));
});

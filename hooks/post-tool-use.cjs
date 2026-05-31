// Claude Code PostToolUse hook — agent 持续工作中
// 数据通过 stdin JSON 传入
const fs = require('fs');
const path = require('path');
const os = require('os');

const stateFile = path.join(os.homedir(), '.claude', 'agent-state.json');

let stdin = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => { stdin += chunk; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(stdin); } catch {}

  // 先检查当前状态，如果正在等待用户确认，不要覆盖
  let current = {};
  try {
    if (fs.existsSync(stateFile)) {
      current = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    }
  } catch {}

  if (current.status === 'confirm') {
    // 用户还没确认，保持 confirm 状态不变
    process.exit(0);
  }

  const state = {
    status: 'delivering',
    task: 'Agent 正在工作中...',
    command: '',
    timestamp: Date.now(),
    elapsed: '00:00',
  };

  const dir = path.dirname(stateFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state));
});

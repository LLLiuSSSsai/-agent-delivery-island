// Claude Code PreToolUse hook — 需要用户确认的操作弹窗，并通过文件轮询等待回复
const fs = require('fs');
const path = require('path');
const os = require('os');

const STATE_FILE = path.join(os.homedir(), '.claude', 'agent-state.json');
const RESPONSE_FILE = path.join(os.homedir(), '.claude', 'agent-response.json');
const POLL_INTERVAL = 300;   // 轮询间隔 ms
const TIMEOUT = 120000;       // 超时 2 分钟自动拒绝

const CONFIRM_TOOLS = ['Write', 'Edit', 'Bash', 'AskUserQuestion'];

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data));
}

function readJSON(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch {}
  return null;
}

function makeRequestId() {
  return 'req-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

// ====== 格式化函数 ======

function getToolLabel(toolName) {
  const map = {
    'Write': '写入文件',
    'Edit': '编辑文件',
    'Bash':  '执行系统命令',
    'AskUserQuestion': '征求您的意见',
  };
  return map[toolName] || toolName;
}

function getToolType(toolName) {
  const map = {
    'Write': '文件写入',
    'Edit': '文件编辑',
    'Bash':  '命令执行',
    'AskUserQuestion': '意见征求',
  };
  return map[toolName] || '操作确认';
}

function formatAskUserQuestion(input) {
  const questions = (input && input.questions) || [];
  if (questions.length === 0) {
    return { summary: 'Claude 向您提问', detail: JSON.stringify(input, null, 2) };
  }

  const summaryParts = questions.map(q => q.header || q.question || '').filter(Boolean);
  const summary = summaryParts.join(' / ');

  const detail = questions.map((q, i) => {
    let text = '';
    if (q.header) text += '▌' + q.header + '\n\n';
    text += (q.question || '');
    if (q.options && q.options.length > 0) {
      text += '\n\n请选择：';
      q.options.forEach((opt) => {
        text += '\n  ◉ ' + opt.label + (opt.description ? ' — ' + opt.description : '');
      });
    }
    if (questions.length > 1 && i < questions.length - 1) {
      text += '\n\n' + '─'.repeat(48) + '\n';
    }
    return text;
  }).join('\n');

  return { summary, detail };
}

function formatWriteEdit(toolName, input) {
  if (!input) return { summary: '(无参数)', detail: '(无参数)' };

  const filePath = input.file_path || '';

  if (toolName === 'Write') {
    const content = input.content || '';
    const preview = content.length > 300 ? content.slice(0, 300) + '\n... (内容已截断)' : content;
    return {
      summary: filePath ? '写入: ' + path.basename(filePath) : '写入文件',
      detail: '━━━ 文件路径 ━━━\n' + (filePath || '(未指定)') + '\n\n━━━ 写入内容 ━━━\n' + preview,
    };
  }

  if (toolName === 'Edit') {
    const oldStr = input.old_string || '';
    const newStr = input.new_string || '';
    const previewOld = oldStr.length > 200 ? oldStr.slice(0, 200) + '\n...' : oldStr;
    const previewNew = newStr.length > 200 ? newStr.slice(0, 200) + '\n...' : newStr;
    return {
      summary: filePath ? '编辑: ' + path.basename(filePath) : '编辑文件',
      detail: '━━━ 文件路径 ━━━\n' + (filePath || '(未指定)') +
              '\n\n━━━ 查找内容 ━━━\n' + (previewOld || '(空)') +
              '\n\n━━━ 替换为 ━━━\n' + (previewNew || '(空)'),
    };
  }

  const detail = JSON.stringify(input, null, 2);
  return { summary: detail.slice(0, 80), detail };
}

function formatBash(input) {
  const cmd = (input && input.command) || JSON.stringify(input || {});
  return {
    summary: cmd.length > 60 ? cmd.slice(0, 57) + '...' : cmd,
    detail: '━━━ 将执行以下命令 ━━━\n\n' + cmd,
  };
}

// ====== 主流程 ======

let stdin = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => { stdin += chunk; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(stdin); } catch {}

  const toolName = input.tool_name || '';

  // 不需要确认的工具 → 直接放行（但不覆盖正在等待 confirm 的状态）
  if (!CONFIRM_TOOLS.includes(toolName)) {
    const current = readJSON(STATE_FILE);
    if (!current || current.status !== 'confirm') {
      writeJSON(STATE_FILE, {
        status: 'delivering',
        task: 'Agent 正在工作中...',
        command: '',
        details: '',
        requestId: '',
        timestamp: Date.now(),
        elapsed: '00:00',
      });
    }
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }

  // 需要确认的工具
  const requestId = makeRequestId();
  let summary = '', detail = '';

  if (toolName === 'AskUserQuestion') {
    const fmt = formatAskUserQuestion(input.tool_input);
    summary = fmt.summary;
    detail = fmt.detail;
  } else if (toolName === 'Bash') {
    const fmt = formatBash(input.tool_input);
    summary = fmt.summary;
    detail = fmt.detail;
  } else {
    const fmt = formatWriteEdit(toolName, input.tool_input);
    summary = fmt.summary;
    detail = fmt.detail;
  }

  // 写入确认状态
  writeJSON(STATE_FILE, {
    status: 'confirm',
    task: summary,
    command: detail,
    toolName,
    toolType: getToolType(toolName),
    toolLabel: getToolLabel(toolName),
    requestId,
    timestamp: Date.now(),
    elapsed: '00:00',
  });

  // 清除旧的回复文件
  try { if (fs.existsSync(RESPONSE_FILE)) fs.unlinkSync(RESPONSE_FILE); } catch {}

  // 轮询等待用户回复
  const startTime = Date.now();
  const poll = () => {
    const elapsed = Date.now() - startTime;

    // 超时 → 自动拒绝，并清理状态文件避免灵动岛卡在 confirm
    if (elapsed >= TIMEOUT) {
      try { if (fs.existsSync(RESPONSE_FILE)) fs.unlinkSync(RESPONSE_FILE); } catch {}
      writeJSON(STATE_FILE, {
        status: 'idle',
        task: '',
        command: '',
        details: '',
        requestId: '',
        timestamp: Date.now(),
        elapsed: '00:00',
      });
      process.stdout.write(JSON.stringify({ decision: 'deny' }));
      process.exit(0);
    }

    const resp = readJSON(RESPONSE_FILE);
    if (resp && resp.requestId === requestId) {
      // 收到回复 → 清理并返回
      try { fs.unlinkSync(RESPONSE_FILE); } catch {}
      const decision = resp.decision === 'allow' ? 'allow' : 'deny';
      process.stdout.write(JSON.stringify({ decision }));
      process.exit(0);
    }

    setTimeout(poll, POLL_INTERVAL);
  };

  poll();
});

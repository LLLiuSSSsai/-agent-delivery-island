// install-hooks.cjs — 安装 hooks 到 Claude Code 配置
const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(os.homedir(), '.claude', 'settings.json');
const hookDir = path.resolve(__dirname, '..', 'hooks').replace(/\\/g, '/');

if (!fs.existsSync(configPath)) {
  console.error('Claude Code config not found:', configPath);
  process.exit(1);
}

// 备份
fs.copyFileSync(configPath, configPath + '.bak.' + Date.now());
console.log('Backup saved');

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

config.hooks = config.hooks || {};
config.hooks.PostToolUse = [{ matcher: '', command: 'node ' + hookDir + '/post-tool-use.cjs' }];
config.hooks.PreToolUse = [{ matcher: '', command: 'node ' + hookDir + '/pre-tool-use.cjs' }];
config.hooks.Stop = [{ matcher: '', command: 'node ' + hookDir + '/stop.cjs' }];

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('Hooks installed!');
console.log(JSON.stringify(config.hooks, null, 2));

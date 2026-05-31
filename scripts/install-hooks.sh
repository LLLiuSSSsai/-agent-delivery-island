#!/bin/bash
# install-hooks.sh — 一键安装 Claude Code hooks

HOOK_DIR="$(cd "$(dirname "$0")/../hooks" && pwd)"
CLAUDE_CONFIG="$HOME/.claude/settings.json"

echo "Installing Agent Delivery Island hooks..."
echo "Hook dir: $HOOK_DIR"
echo "Claude config: $CLAUDE_CONFIG"

# 备份原配置
if [ -f "$CLAUDE_CONFIG" ]; then
  cp "$CLAUDE_CONFIG" "$CLAUDE_CONFIG.bak.$(date +%s)"
  echo "Backup saved."
fi

# 读取或创建配置
if [ ! -f "$CLAUDE_CONFIG" ]; then
  echo '{}' > "$CLAUDE_CONFIG"
fi

# 使用 node 合并 JSON
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CLAUDE_CONFIG', 'utf-8'));
config.hooks = config.hooks || {};

config.hooks.PostToolUse = config.hooks.PostToolUse || [];
config.hooks.PostToolUse.push({
  matcher: '*',
  command: 'node $HOOK_DIR/post-tool-use.cjs'
});

config.hooks.PreToolUse = config.hooks.PreToolUse || [];
config.hooks.PreToolUse.push({
  matcher: '*',
  command: 'node $HOOK_DIR/pre-tool-use.cjs'
});

config.hooks.Stop = config.hooks.Stop || [];
config.hooks.Stop.push({
  matcher: '',
  command: 'node $HOOK_DIR/stop.cjs'
});

fs.writeFileSync('$CLAUDE_CONFIG', JSON.stringify(config, null, 2));
console.log('Hooks installed successfully!');
console.log('Config:', '$CLAUDE_CONFIG');
"

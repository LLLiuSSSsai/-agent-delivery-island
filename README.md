# Agent Delivery Island (灵动岛)

桌面灵动岛 — 用**外卖配送风格**实时可视化你的 Claude Code Agent 工作状态。悬浮于桌面顶部的透明小组件，随着 Agent 状态自动切换界面，让每一次 AI 编码都充满配送仪式感。

## 效果展示

组件在四种状态间自动流转：

| 状态 | 说明 | 视觉 |
|------|------|------|
| **待命中** (Idle) | Claude Code 空闲，等待指令 | 紧凑药丸形，"Claude Code" + 蓝点 |
| **配送中** (Delivering) | Agent 正在执行任务 | 呼吸蓝点 + 当前任务文字 + 进度条 |
| **确认请求** (Confirm) | 需要用户授权工具调用 | 橙红脉冲光晕，展开面板显示命令详情，提供 同意/取消 按钮 |
| **订单完成** (Complete) | 任务完成 | 绿色对勾，3 秒后自动回到待命 |

**亮点：**

- 鼠标穿透：空闲状态下点击直接穿透到下层窗口，不干扰工作
- 语音播报：状态切换时使用中文 TTS 语音播报（优先微软晓晓声源）
- Hook 守门：通过 Claude Code PreToolUse hook 拦截工具调用，灵动岛确认面板代替终端交互

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面壳 | Electron 28 |
| UI 框架 | React 18 + ReactDOM |
| 构建工具 | Vite 5 |
| 打包 | electron-builder (NSIS / Windows) |
| 开发编排 | concurrently + wait-on |
| 交互协议 | 文件轮询 (~/.claude/agent-state.json) |
| 语音 | Web Speech API |

## 快速启动

### 环境要求

- Node.js >= 18
- 已安装 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI

### 1. 克隆并安装依赖

```bash
git clone https://github.com/your-username/agent-delivery-island.git
cd agent-delivery-island
npm install
```

### 2. 安装 Claude Code Hooks

这一步将灵动岛的三个 hook 注册到 Claude Code 配置中（会自��备份原配置）。

```bash
node scripts/install-hooks.cjs
```

Hook 说明：
- **PreToolUse** — 拦截 Write / Edit / Bash / AskUserQuestion 请求，交由灵动岛确认
- **PostToolUse** — 工具执行完毕后恢复到 "配送中" 状态
- **Stop** — Claude Code 停止时切换到 "订单完成"

### 3. 启动灵动岛

```bash
npm run electron:dev
```

灵动岛会在屏幕顶部中央出现。之后你在任意终端正常使用 Claude Code，灵动岛就会自动跟随状态变化。

> **如何退出？** 灵动岛隐藏了任务栏图标（避免干扰），退出方式为：点击系统托盘（右下角通知区域）的蓝色圆点图标 → 右键 → **退出**。左键点击托盘图标可以显示/隐藏灵动岛。

### 4. 可选：打包为一键运行的 .exe

将灵动岛打包为独立的 Windows 安装包，双击即可运行，无需安装 Node.js 或任何依赖。

#### 前置条件

- Node.js >= 18（仅打包时需要，运行 .exe 不需要）
- Windows 系统（NSIS 安装包格式）

#### 打包步骤

```bash
# 1. 安装项目依赖（首次）
npm install

# 2. 一键打包
npm run electron:build
```

#### 产物说明

打包完成后在 `release/` 目录生成：

```
release/
└── AgentDeliveryIsland.exe    ← NSIS 一键安装包
```

双击 `AgentDeliveryIsland.exe` 即可安装并运行：

1. 安装程序自动完成，无需任何配置（One-click 模式）
2. 安装后灵动岛自动启动，屏幕顶部中央出现状态条
3. 之后直接在任意终端使用 Claude Code，灵动岛会自动跟随状态变化

#### 打包发生了什么

`npm run electron:build` 实际执行两步：

1. **`vite build`** — 将 React 前端构建为静态文件，输出到 `dist/`
2. **`electron-builder`** — 将 Electron 壳 + `dist/` + `electron/` 核心脚本 + Node.js 运行时一起打入 NSIS 安装包

最终 .exe 是**完全自包含**的：内置了精简版 Chromium 和 Node.js，不需要用户安装任何运行时。

#### 分发给他人

直接将 `release/AgentDeliveryIsland.exe` 发给对方即可。对方需要：

- Windows 10 及以上
- 已安装 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- 安装灵动岛后运行一次 Hook 安装脚本（见第 2 步）

> **提示：** 如果给对方用，建议把 Hook 安装脚本也一并打包进去。可以将 `scripts/install-hooks.cjs` 放到安装目录下，对方只需 `node install-hooks.cjs` 即可完成配置。

## 架构

```
Claude Code hooks (Node 进程)
    │
    │  写入状态到 ~/.claude/agent-state.json
    │  读取响应从 ~/.claude/agent-response.json
    │
    ▼
Electron 主进程 (state-watcher.js)
    │  每 300ms 轮询状态文件
    │  通过 IPC 将状态推送到渲染进程
    │
    ▼
React 应用 (渲染进程)
    │  useAgentState hook 监听状态更新
    │  根据 status 字段切换显示对应组件
    │
    │  用户点击 同意/取消 → ipcRenderer 通知主进程
    │
    ▼
Electron 主进程
    │  写入响应到 ~/.claude/agent-response.json
    │
    ▼
PreToolUse hook 轮询到响应，返回 allow / deny
```

## 项目结构

```
agent-delivery-island/
├── electron/
│   ├── main.js            # Electron 入口，窗口创建、IPC、权限管理
│   ├── preload.js         # contextBridge 暴露 window.agentState API
│   └── state-watcher.js   # 轮询状态文件，推送 IPC
├── src/
│   ├── main.jsx           # React 入口
│   ├── App.jsx            # 根组件，状态机调度
│   ├── hooks/
│   │   ├── useAgentState.js   # 监听 Electron IPC 状态更新
│   │   └── useSpeech.js       # 中文 TTS 语音播报
│   ├── components/
│   │   ├── IslandBar.jsx      # 窗口容器，动态尺寸和鼠标穿透
│   │   ├── IdleState.jsx      # 待命状态
│   │   ├── DeliveringState.jsx # 配送中状态
│   │   ├── ConfirmState.jsx   # 确认请求状态（含展开面板）
│   │   └── CompleteState.jsx  # 完成状态（带自动消失）
│   └── styles/
│       └── globals.css        # 全局样式、动画关键帧
├── hooks/
│   ├── pre-tool-use.cjs   # PreToolUse hook
│   ├── post-tool-use.cjs  # PostToolUse hook
│   └── stop.cjs           # Stop hook
├── scripts/
│   ├── install-hooks.cjs   # Hook 安装脚本 (Windows / Node)
│   └── install-hooks.sh    # Hook 安装脚本 (Linux / macOS)
├── index.html
├── vite.config.js
└── package.json
```

## 卸载

如需卸载 hooks 恢复原始配置：

```bash
rm ~/.claude/settings.json
cp ~/.claude/settings.json.bak.* ~/.claude/settings.json
```

或者手动编辑 `~/.claude/settings.json` 删除 `hooks` 字段。

## License

MIT

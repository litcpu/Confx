# Confx

Confx 是一个用于统一管理本机 AI Agent 配置的桌面端 MVP。项目目标是把 Claude Code、Codex 等工具隐藏在用户目录中的 MCP、Skills 和配置文件可视化，降低手动编辑 JSON、TOML、Markdown 配置的风险。

当前版本优先实现只读扫描和基础备份能力，适合作为后续 MCP 启用/禁用、Skills 同步、配置恢复等功能的初始框架。

## 功能概览

- 扫描 Claude Code 配置：
  - `~/.claude`
  - `~/.claude.json`
  - `~/.claude/skills`
- 扫描 Codex 配置：
  - `~/.codex`
  - `~/.codex/config.toml`
  - `~/.agents/skills`
- 读取 MCP Server 配置并转换为统一模型
- 扫描 Skills 目录并读取 `SKILL.md`
- 根据 MCP 名称、命令或 URL 生成基础用途说明
- 根据 MCP 能力范围标记低/中/高风险等级
- 提供基础手动备份能力
- 提供桌面端基础页面：
  - 配置总览
  - MCP 管理
  - Skills 管理
  - 备份恢复
  - 设置

## 技术栈

- Electron
- React
- TypeScript
- Vite
- fs-extra
- @iarna/toml
- zod
- lucide-react

## 环境要求

推荐使用 Node.js 18 或更高版本。

推荐使用 npm 安装依赖。

```bash
node --version
npm --version
```

如果需要切换 Node 版本，可以使用：

```bash
nvm list
nvm use 22.22.3
```

## 安装依赖

```bash
npm install
```

如果网络较慢，可以使用本机已配置的镜像源，或临时指定镜像：

```bash
npm install --registry=https://registry.npmmirror.com
```

## 开发启动

```bash
npm run dev
```

该命令会同时启动 Vite 开发服务和 Electron 桌面端。

## 构建

```bash
npm run build
```

构建产物会输出到：

```text
dist/
```

构建后可以直接启动 Electron：

```bash
npm run start
```

## 项目结构

```text
.
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ tsconfig.electron.json
├─ electron-builder.yml
├─ index.html
├─ src
│  ├─ main
│  │  ├─ main.ts
│  │  ├─ ipc
│  │  │  ├─ agent.ipc.ts
│  │  │  ├─ mcp.ipc.ts
│  │  │  ├─ skill.ipc.ts
│  │  │  └─ backup.ipc.ts
│  │  ├─ adapters
│  │  │  ├─ app-adapter.ts
│  │  │  ├─ claude.adapter.ts
│  │  │  └─ codex.adapter.ts
│  │  ├─ services
│  │  │  ├─ agent-scan.service.ts
│  │  │  ├─ mcp.service.ts
│  │  │  ├─ skill.service.ts
│  │  │  ├─ backup.service.ts
│  │  │  └─ config-explain.service.ts
│  │  └─ utils
│  ├─ preload
│  │  └─ index.ts
│  ├─ renderer
│  │  ├─ App.tsx
│  │  ├─ main.tsx
│  │  └─ styles.css
│  └─ shared
│     ├─ schemas
│     └─ types
└─ docs/Agent配置管理桌面端_初步框架方案.md
```

## 核心设计

项目采用三层结构：

```text
Electron Main Process
  负责本地文件扫描、配置读取、备份、IPC 注册

Electron Preload
  通过 contextBridge 暴露有限 API 给前端

React Renderer
  负责页面展示和用户交互
```

前端不会直接访问文件系统，只能通过 preload 暴露的 `window.agentManager` 调用主进程能力。

## 当前 IPC API

```ts
window.agentManager.scanAgents()
window.agentManager.listMcp()
window.agentManager.listSkills()
window.agentManager.listBackups()
window.agentManager.createBackup(sourcePath, reason)
```

当前 `syncMcp` 和 `syncSkills` 只保留接口占位，后续阶段再实现写入和同步。

## 当前版本边界

当前版本默认偏只读和安全：

- 可以扫描 Claude / Codex
- 可以展示 MCP / Skills
- 可以创建手动备份
- 不会自动改写 Claude 或 Codex 配置
- 不会自动启用、禁用或同步 MCP / Skills

写入能力建议在后续阶段配合自动备份、diff 预览和原子写入一起实现。

## 后续计划

建议按以下顺序继续开发：

1. MCP 启用 / 禁用
2. MCP 同步到 Claude / Codex
3. Skills copy / symlink 同步
4. 配置写入前自动备份
5. 备份恢复
6. MCP 健康检查
7. Skill 安装和导入
8. Gemini / OpenCode Adapter
9. SQLite 持久化
10. MCP / Skill 模板库

## 安全注意事项

后续实现写入功能时需要遵守：

- 写入前必须创建备份
- 写入前生成 diff 供用户确认
- 使用原子写入避免配置文件损坏
- 不直接覆盖不同 Agent 的原始配置
- MCP 环境变量和 Token 不应明文展示完整值
- 高风险 MCP 需要明确提示权限范围

## 项目状态

当前状态：MVP 初步框架已完成。

适合继续开发：

- 真实配置解析增强
- 数据库存储
- 配置编辑
- 备份恢复
- 打包发布

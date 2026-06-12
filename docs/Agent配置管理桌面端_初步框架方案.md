# Agent 配置管理桌面端初步框架方案

## 1. 问题分析

当前 Claude Code、Codex、Gemini、OpenCode 等 Agent 工具都会在用户系统中生成各自的配置目录或配置文件，例如：

- Claude Code：`~/.claude`、`~/.claude.json`
- Codex：`~/.codex`、`~/.codex/config.toml`、`~/.agents/skills`
- Gemini：`~/.gemini`
- OpenCode：`~/.opencode`

这些配置中通常包含：

- MCP Server 配置
- Skills 配置
- Prompt / 规则文件
- Provider / API 配置
- 权限、工具、模型等高级设置

对于普通用户来说，主要痛点是：

1. 不知道这些配置文件分别是做什么的。
2. 不知道哪些 MCP / Skills 正在生效。
3. 不敢手动修改配置，担心把工具改坏。
4. 不同 Agent 工具配置格式不同，管理成本高。
5. Skills 和 MCP 的安装、启用、禁用、同步缺少统一入口。

因此，本项目的目标是做一个类似 CC Switch 的桌面端应用，用图形化方式统一管理多种 Agent 工具的 MCP、Skills、Prompt 和配置备份。

## 2. 产品定位

产品定位：

> 面向普通用户和开发者的 AI Agent 配置管理桌面端，帮助用户看懂、管理、同步和备份 Claude Code、Codex、Gemini、OpenCode 等工具的配置。

核心价值：

- 把隐藏在 `.claude`、`.codex`、`.gemini` 等目录中的配置可视化。
- 用中文解释 MCP 和 Skills 的用途。
- 提供安全的启用、禁用、同步、备份和恢复能力。
- 让用户无需手动编辑 JSON、TOML、Markdown 等配置文件。

第一阶段建议聚焦：

- Claude Code
- Codex
- MCP 管理
- Skills 管理
- 配置扫描
- 备份恢复

后续再扩展：

- Gemini
- OpenCode
- Provider 切换
- Prompt 管理
- MCP 市场
- Skill 市场

## 3. 技术选型

### 3.1 推荐技术栈

```text
桌面框架：Electron
前端框架：React
开发语言：TypeScript
构建工具：Vite
UI 方案：shadcn/ui + Tailwind CSS
本地数据库：SQLite
SQLite 库：better-sqlite3
配置解析：
  JSON：原生 JSON.parse / JSON.stringify
  TOML：@iarna/toml
  YAML：yaml
  Markdown frontmatter：gray-matter
文件操作：fs-extra
数据校验：zod
打包工具：electron-builder
```

### 3.2 选择 Electron 的原因

由于本项目后端也希望使用 TypeScript，因此 Electron 比 Tauri 更适合第一版快速落地。

Electron 主进程可以直接处理：

- 本地文件读取
- 配置文件写入
- 目录扫描
- 文件复制
- 软链接创建
- 子进程调用
- SQLite 访问
- 配置备份和恢复

这样可以实现前端、后端、共享类型全部使用 TypeScript，降低开发成本。

## 4. 总体架构

```text
Confx
├─ Electron Main Process
│  ├─ IPC API
│  ├─ Agent Adapters
│  ├─ MCP Service
│  ├─ Skill Service
│  ├─ Backup Service
│  ├─ Config Parser
│  └─ SQLite Store
│
├─ Electron Preload
│  └─ 安全暴露有限 API 给前端
│
└─ React Renderer
   ├─ Dashboard
   ├─ MCP 管理
   ├─ Skills 管理
   ├─ 配置解释
   ├─ 备份恢复
   └─ 设置页面
```

核心思想：

```text
各 Agent 原始配置
        ↓
Agent Adapter 读取并转换
        ↓
统一数据模型
        ↓
UI 展示和编辑
        ↓
Agent Adapter 写回对应配置
```

不要让 Claude 配置直接覆盖 Codex 配置，也不要让 Codex 配置直接覆盖 Claude 配置。正确方式是通过统一模型做中间层转换。

## 5. 推荐目录结构

```text
confx
├─ package.json
├─ vite.config.ts
├─ electron-builder.yml
├─ tsconfig.json
├─ src
│  ├─ main
│  │  ├─ main.ts
│  │  ├─ ipc
│  │  │  ├─ agent.ipc.ts
│  │  │  ├─ mcp.ipc.ts
│  │  │  ├─ skill.ipc.ts
│  │  │  └─ backup.ipc.ts
│  │  │
│  │  ├─ adapters
│  │  │  ├─ app-adapter.ts
│  │  │  ├─ claude.adapter.ts
│  │  │  ├─ codex.adapter.ts
│  │  │  ├─ gemini.adapter.ts
│  │  │  └─ opencode.adapter.ts
│  │  │
│  │  ├─ services
│  │  │  ├─ agent-scan.service.ts
│  │  │  ├─ mcp.service.ts
│  │  │  ├─ skill.service.ts
│  │  │  ├─ backup.service.ts
│  │  │  ├─ diff.service.ts
│  │  │  └─ health-check.service.ts
│  │  │
│  │  ├─ parsers
│  │  │  ├─ json.parser.ts
│  │  │  ├─ toml.parser.ts
│  │  │  ├─ markdown.parser.ts
│  │  │  └─ frontmatter.parser.ts
│  │  │
│  │  ├─ db
│  │  │  ├─ database.ts
│  │  │  ├─ migrations.ts
│  │  │  └─ repositories
│  │  │     ├─ mcp.repository.ts
│  │  │     ├─ skill.repository.ts
│  │  │     └─ backup.repository.ts
│  │  │
│  │  └─ utils
│  │     ├─ path.util.ts
│  │     ├─ file.util.ts
│  │     └─ atomic-write.util.ts
│  │
│  ├─ preload
│  │  └─ index.ts
│  │
│  ├─ renderer
│  │  ├─ App.tsx
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ DashboardPage.tsx
│  │  │  ├─ McpPage.tsx
│  │  │  ├─ SkillsPage.tsx
│  │  │  ├─ BackupPage.tsx
│  │  │  └─ SettingsPage.tsx
│  │  │
│  │  ├─ components
│  │  │  ├─ layout
│  │  │  ├─ mcp
│  │  │  ├─ skills
│  │  │  └─ common
│  │  │
│  │  └─ stores
│  │     ├─ agent.store.ts
│  │     ├─ mcp.store.ts
│  │     └─ skill.store.ts
│  │
│  └─ shared
│     ├─ types
│     │  ├─ agent.ts
│     │  ├─ mcp.ts
│     │  ├─ skill.ts
│     │  └─ backup.ts
│     │
│     └─ schemas
│        ├─ mcp.schema.ts
│        └─ skill.schema.ts
│
└─ docs
   ├─ architecture.md
   ├─ mcp-format.md
   └─ skill-format.md
```

## 6. 核心模块设计

### 6.1 Agent 扫描模块

负责扫描用户电脑中已安装或已配置的 Agent 工具。

扫描目标：

```text
Claude Code:
  ~/.claude
  ~/.claude.json

Codex:
  ~/.codex
  ~/.codex/config.toml
  ~/.agents/skills

Gemini:
  ~/.gemini
  ~/.gemini/settings.json

OpenCode:
  ~/.opencode
  ~/.opencode/mcp.json
```

输出示例：

```ts
export interface AgentInstallStatus {
  appId: AgentApp;
  name: string;
  installed: boolean;
  configPath?: string;
  skillDirs: string[];
  warnings: string[];
}
```

### 6.2 MCP 管理模块

功能：

- 扫描 MCP 配置
- 统一展示 MCP Server
- 添加 MCP
- 编辑 MCP
- 删除 MCP
- 启用 / 禁用 MCP
- 同步到指定 Agent
- 检查 MCP 是否可用

统一 MCP 数据模型：

```ts
export type AgentApp = "claude" | "codex" | "gemini" | "opencode";

export type McpTransport = "stdio" | "http" | "sse";

export interface McpServer {
  id: string;
  name: string;
  transport: McpTransport;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
  enabledApps: AgentApp[];
  enabled: boolean;
  description?: string;
  riskLevel: "low" | "medium" | "high";
  source: "imported" | "manual" | "template";
  createdAt: string;
  updatedAt: string;
}
```

### 6.3 Skills 管理模块

功能：

- 扫描本机 Skills
- 读取 `SKILL.md`
- 解析 frontmatter
- 展示 Skill 名称、描述、路径和来源
- 安装 GitHub Skill
- 安装 ZIP Skill
- 从本地目录导入 Skill
- 启用 / 禁用 Skill
- 同步到 Claude / Codex
- 支持 copy / symlink 两种同步方式

统一 Skill 数据模型：

```ts
export interface Skill {
  id: string;
  name: string;
  description: string;
  localPath: string;
  source: "local" | "github" | "zip" | "system";
  sourceUrl?: string;
  enabledApps: AgentApp[];
  syncMethod: "copy" | "symlink";
  enabled: boolean;
  hasSkillMd: boolean;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 6.4 配置解释模块

该模块是产品差异化重点。

目标不是只展示原始配置，而是帮助小白看懂：

- 这个 MCP 是什么？
- 它会访问什么？
- 它有什么风险？
- 这个 Skill 什么时候会触发？
- 是否可以安全关闭？

示例：

```text
名称：context7
类型：MCP Server
启动方式：npx -y @upstash/context7-mcp
用途：让 Agent 查询第三方技术库的最新文档。
风险等级：低
建议：适合开发场景保留启用。
```

解释来源可以分三层：

1. 内置常见 MCP / Skill 说明库。
2. 从 `description`、`SKILL.md`、命令名自动提取。
3. 后续可接入 AI 自动解释。

### 6.5 备份恢复模块

任何写入操作前必须自动备份。

备份范围：

- `~/.claude.json`
- `~/.claude`
- `~/.codex/config.toml`
- `~/.codex`
- `~/.agents/skills`
- 其他已支持 Agent 的配置文件

备份数据模型：

```ts
export interface BackupRecord {
  id: string;
  appId: AgentApp;
  sourcePath: string;
  backupPath: string;
  reason: string;
  createdAt: string;
}
```

写入流程：

```text
读取原配置
  ↓
生成目标配置
  ↓
生成 diff
  ↓
创建备份
  ↓
原子写入
  ↓
记录操作日志
```

## 7. Agent Adapter 设计

每个 Agent 使用独立 Adapter，负责处理各自配置格式。

```ts
export interface AppAdapter {
  appId: AgentApp;
  displayName: string;

  detect(): Promise<AgentInstallStatus>;

  readMcp(): Promise<McpServer[]>;
  writeMcp(servers: McpServer[]): Promise<void>;

  scanSkills(): Promise<Skill[]>;
  syncSkill(skill: Skill): Promise<void>;

  backup(): Promise<BackupRecord[]>;
}
```

### 7.1 Claude Adapter

读取目标：

```text
~/.claude.json
~/.claude/skills
```

主要处理：

- JSON 配置
- `mcpServers`
- Claude Skills 目录

### 7.2 Codex Adapter

读取目标：

```text
~/.codex/config.toml
~/.agents/skills
```

主要处理：

- TOML 配置
- `[mcp_servers.xxx]`
- Codex Skills 目录

## 8. SQLite 表设计草案

### 8.1 mcp_servers

```sql
CREATE TABLE mcp_servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  transport TEXT NOT NULL,
  command TEXT,
  args_json TEXT,
  url TEXT,
  env_json TEXT,
  headers_json TEXT,
  enabled_apps_json TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  risk_level TEXT NOT NULL DEFAULT 'low',
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 8.2 skills

```sql
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  local_path TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  enabled_apps_json TEXT NOT NULL,
  sync_method TEXT NOT NULL DEFAULT 'copy',
  enabled INTEGER NOT NULL DEFAULT 1,
  has_skill_md INTEGER NOT NULL DEFAULT 0,
  warnings_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 8.3 backups

```sql
CREATE TABLE backups (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  source_path TEXT NOT NULL,
  backup_path TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### 8.4 operation_logs

```sql
CREATE TABLE operation_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  target TEXT NOT NULL,
  detail_json TEXT,
  created_at TEXT NOT NULL
);
```

## 9. IPC API 设计

前端不直接访问文件系统，只通过 preload 暴露 API。

```ts
export interface AgentManagerApi {
  scanAgents(): Promise<AgentInstallStatus[]>;

  listMcp(): Promise<McpServer[]>;
  addMcp(input: McpServerInput): Promise<McpServer>;
  updateMcp(id: string, input: McpServerInput): Promise<McpServer>;
  deleteMcp(id: string): Promise<void>;
  syncMcp(apps?: AgentApp[]): Promise<void>;

  listSkills(): Promise<Skill[]>;
  importSkill(path: string): Promise<Skill>;
  installSkillFromGit(url: string): Promise<Skill>;
  updateSkill(id: string, input: SkillUpdateInput): Promise<Skill>;
  deleteSkill(id: string): Promise<void>;
  syncSkills(apps?: AgentApp[]): Promise<void>;

  listBackups(): Promise<BackupRecord[]>;
  restoreBackup(id: string): Promise<void>;
}
```

preload 示例：

```ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("agentManager", {
  scanAgents: () => ipcRenderer.invoke("agents:scan"),
  listMcp: () => ipcRenderer.invoke("mcp:list"),
  syncMcp: (apps?: string[]) => ipcRenderer.invoke("mcp:sync", apps),
  listSkills: () => ipcRenderer.invoke("skills:list"),
  syncSkills: (apps?: string[]) => ipcRenderer.invoke("skills:sync", apps),
  listBackups: () => ipcRenderer.invoke("backups:list"),
  restoreBackup: (id: string) => ipcRenderer.invoke("backups:restore", id),
});
```

## 10. 页面设计

### 10.1 Dashboard

展示：

- 已检测到的 Agent 工具
- 每个 Agent 的配置路径
- MCP 数量
- Skill 数量
- 异常数量
- 最近备份时间

### 10.2 MCP 管理页

展示字段：

- 名称
- 类型
- 用途说明
- 启用状态
- 启用在哪些 Agent
- 风险等级
- 健康状态
- 操作按钮

操作：

- 添加
- 编辑
- 删除
- 启用
- 禁用
- 同步
- 健康检查

### 10.3 Skills 管理页

展示字段：

- 名称
- 描述
- 来源
- 路径
- 启用在哪些 Agent
- 同步方式
- 状态

操作：

- 本地导入
- GitHub 安装
- ZIP 安装
- 启用
- 禁用
- 同步
- 删除

### 10.4 备份恢复页

展示：

- 备份时间
- 所属 Agent
- 原始路径
- 备份原因
- 恢复按钮

### 10.5 设置页

配置项：

- 默认同步方式：copy / symlink
- 自动备份开关
- 是否显示高级配置
- 默认扫描路径
- 数据库路径

## 11. MVP 开发计划

### 第 1 阶段：项目初始化

目标：

- 初始化 Electron + React + TypeScript + Vite 项目
- 接入 Tailwind CSS
- 接入 shadcn/ui
- 建立 main / preload / renderer 基础结构

验收标准：

- 应用可启动
- 前端可调用 Electron IPC
- 页面基础布局完成

### 第 2 阶段：Agent 扫描

目标：

- 扫描 Claude Code 配置
- 扫描 Codex 配置
- 展示配置路径和安装状态

验收标准：

- 首页能显示 Claude / Codex 是否存在
- 能显示配置文件路径

### 第 3 阶段：MCP 读取和展示

目标：

- 读取 Claude MCP 配置
- 读取 Codex MCP 配置
- 转换成统一 MCP 模型
- 在 UI 表格中展示

验收标准：

- 能看到 Claude / Codex 当前 MCP
- 能区分 stdio / http
- 能显示启用状态

### 第 4 阶段：Skills 扫描和展示

目标：

- 扫描 Skills 目录
- 读取 `SKILL.md`
- 解析 name 和 description
- 在 UI 中展示

验收标准：

- 能显示本机 Skills 列表
- 能显示 Skill 描述和路径

### 第 5 阶段：备份和安全写入

目标：

- 修改前自动备份
- 支持手动备份
- 支持恢复备份

验收标准：

- 写入配置前生成备份文件
- 用户可以从 UI 恢复备份

### 第 6 阶段：MCP / Skills 同步

目标：

- 支持启用 / 禁用 MCP
- 支持同步 MCP 到 Claude / Codex
- 支持 Skill copy / symlink 同步

验收标准：

- 用户可以通过 UI 控制 MCP 和 Skill 生效范围
- 同步后对应 Agent 能读取配置

## 12. 后续优化方向

### 12.1 MCP 模板库

内置常用 MCP：

- Context7
- Playwright
- GitHub
- Figma
- Sentry
- Filesystem
- Browser

### 12.2 Skill 市场

支持：

- GitHub 仓库安装
- ZIP 安装
- 本地导入
- Skill 更新检查
- Skill 版本管理

### 12.3 健康检查

检查内容：

- MCP command 是否存在
- npm / npx 是否存在
- HTTP MCP 是否可访问
- Token 环境变量是否缺失
- Skill 是否缺少 `SKILL.md`
- Skill 中引用的脚本是否存在

### 12.4 风险提示

风险等级示例：

```text
低风险：只读文档查询 MCP
中风险：GitHub、浏览器、Figma 等外部服务 MCP
高风险：文件系统、数据库、Shell 执行类 MCP
```

### 12.5 AI 配置解释

后续可以加入 AI 解释能力：

- 解释某个 MCP 的用途
- 解释某个 Skill 的触发场景
- 判断配置是否异常
- 给出安全建议

## 13. 第一版建议边界

第一版不要做太多 Provider 切换功能。

建议第一版只做：

- Claude / Codex 扫描
- MCP 展示
- Skills 展示
- MCP 启用 / 禁用
- Skills 同步
- 自动备份
- 一键恢复

暂缓功能：

- Provider 切换
- 多账号管理
- 代理服务
- 云同步
- 团队协作
- 插件市场

这样可以更快做出稳定 MVP，并且产品定位更清晰。

## 14. 总结

本项目建议采用：

```text
Electron + React + TypeScript + SQLite
```

核心架构采用：

```text
统一数据模型 + 多 Agent Adapter + 安全写入 + 可视化管理
```

第一版目标不是完全复刻 CC Switch，而是先解决最真实的用户痛点：

> 让用户看懂自己电脑里的 Claude / Codex 配置，并能安全管理 MCP 和 Skills。

当 MCP、Skills、备份恢复能力稳定后，再逐步扩展 Provider 切换、Prompt 管理、市场安装和云同步能力。

import { useEffect, useMemo, useState } from "react";
import {
  ArchiveRestore,
  Bot,
  Boxes,
  DatabaseBackup,
  LayoutDashboard,
  RefreshCcw,
  Settings,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import type { AgentInstallStatus } from "../shared/types/agent";
import type { AgentApp } from "../shared/types/agent";
import type { BackupRecord } from "../shared/types/backup";
import type { ConfigFileItem } from "../shared/types/config-file";
import type { McpServer } from "../shared/types/mcp";
import type { Skill } from "../shared/types/skill";
import claudeIcon from "./assets/icons/claude.svg";
import geminiIcon from "./assets/icons/gemini.svg";
import openAiIcon from "./assets/icons/openai.svg";
import openCodeIcon from "./assets/icons/opencode.svg";

type Page = "dashboard" | "mcp" | "skills" | "backup" | "settings";

const pages: Array<{ id: Page; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "总览", icon: LayoutDashboard },
  { id: "mcp", label: "MCP", icon: Boxes },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "backup", label: "备份", icon: DatabaseBackup },
  { id: "settings", label: "设置", icon: Settings }
];

export default function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [agents, setAgents] = useState<AgentInstallStatus[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [configFiles, setConfigFiles] = useState<ConfigFileItem[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const listAiConfigFiles = window.agentManager.listAiConfigFiles ?? (() => Promise.resolve([]));
      const [agentResult, mcpResult, skillResult, configFileResult, backupResult] = await Promise.all([
        window.agentManager.scanAgents(),
        window.agentManager.listMcp(),
        window.agentManager.listSkills(),
        listAiConfigFiles(),
        window.agentManager.listBackups()
      ]);

      setAgents(agentResult);
      setMcpServers(mcpResult);
      setSkills(skillResult);
      setConfigFiles(configFileResult);
      setBackups(backupResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "扫描失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const stats = useMemo(
    () => ({
      installedAgents: agents.filter((agent) => agent.installed).length,
      warnings: agents.reduce((total, agent) => total + agent.warnings.length, 0) + skills.reduce((total, skill) => total + skill.warnings.length, 0),
      riskyMcp: mcpServers.filter((server) => server.riskLevel !== "low").length
    }),
    [agents, skills, mcpServers]
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <div className="brand-name">Agent Manager</div>
        </div>

        <nav className="nav">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <button key={page.id} className={activePage === page.id ? "active" : ""} onClick={() => setActivePage(page.id)} title={page.label}>
                <Icon size={18} />
                <span>{page.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="workspace">
        {activePage !== "mcp" && activePage !== "skills" ? (
          <header className="topbar">
            <div>
              <h1>{pageTitle(activePage)}</h1>
            </div>
            <button className="primary-action" onClick={() => void refresh()} disabled={loading}>
              <RefreshCcw size={17} />
              {loading ? "扫描中" : "重新扫描"}
            </button>
          </header>
        ) : null}

        {error ? <div className="error-banner">{error}</div> : null}

        {activePage === "dashboard" && <Dashboard agents={agents} mcpServers={mcpServers} skills={skills} configFiles={configFiles} backups={backups} stats={stats} />}
        {activePage === "mcp" && <McpPage servers={mcpServers} loading={loading} onRefresh={refresh} />}
        {activePage === "skills" && <SkillsPage skills={skills} loading={loading} onRefresh={refresh} />}
        {activePage === "backup" && <BackupPage backups={backups} agents={agents} onBackup={refresh} />}
        {activePage === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}

function Dashboard({
  agents,
  mcpServers,
  skills,
  configFiles,
  backups,
  stats
}: {
  agents: AgentInstallStatus[];
  mcpServers: McpServer[];
  skills: Skill[];
  configFiles: ConfigFileItem[];
  backups: BackupRecord[];
  stats: { installedAgents: number; warnings: number; riskyMcp: number };
}) {
  return (
    <section className="content-stack">
      <div className="metric-grid">
        <Metric label="已检测 Agent" value={`${stats.installedAgents}/${agents.length}`} />
        <Metric label="MCP Server" value={mcpServers.length} />
        <Metric label="Skills" value={skills.length} />
        <Metric label="AI 配置文件" value={configFiles.length} />
        <Metric label="备份文件" value={backups.length} />
      </div>

      <div className="split-grid">
        <Panel title="Agent 状态" icon={<Bot size={18} />}>
          <div className="agent-list">
            {agents.map((agent) => (
              <article key={agent.appId} className="agent-card">
                <div>
                  <strong>{agent.name}</strong>
                  <span>{agent.configPath || "未发现配置路径"}</span>
                </div>
                <StatusPill good={agent.installed}>{agent.installed ? "已发现" : "未安装"}</StatusPill>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="安全提示" icon={<ShieldAlert size={18} />}>
          <div className="risk-board">
            <p>发现 {stats.riskyMcp} 个中高风险 MCP，{stats.warnings} 条配置提示。</p>
            <p>当前版本默认只读扫描，不会改写 Claude 或 Codex 配置。</p>
          </div>
        </Panel>
      </div>

      <Panel title="AI 配置文件" icon={<DatabaseBackup size={18} />}>
        <DataTable
          empty="暂未发现 AI 配置文件"
          columns={["名称", "关联工具", "类型", "更新时间", "路径"]}
          rows={configFiles.map((item) => [
            <strong>{item.name}</strong>,
            item.appHint,
            item.type === "directory" ? "目录" : "文件",
            item.updatedAt ? formatTime(item.updatedAt) : "未知",
            <span className="path-text">{item.path}</span>
          ])}
        />
      </Panel>
    </section>
  );
}

function McpPage({ servers, loading, onRefresh }: { servers: McpServer[]; loading: boolean; onRefresh: () => Promise<void> }) {
  return (
    <section className="list-section">
      <div className="panel-header">
        <div className="panel-title">
          <Boxes size={18} />
          <h2>MCP Server</h2>
        </div>
        <div className="panel-action">
          <button className="primary-action" onClick={() => void onRefresh()} disabled={loading}>
            <RefreshCcw size={17} />
            {loading ? "扫描中" : "重新扫描"}
          </button>
        </div>
      </div>
      <DataTable
        className="hidden-scrollbar"
        empty="暂未发现 MCP Server"
        columns={["名称", "类型", "用途说明", "配置文件位置", "启用 Agent", "风险", "状态"]}
        rows={servers.map((server) => [
          <strong>{server.name}</strong>,
          <code>{server.transport}</code>,
          server.description || "未生成说明",
          <span className="path-text">{server.configPath || "未知"}</span>,
          <AgentBadges apps={server.enabledApps} />,
          <RiskPill risk={server.riskLevel} />,
          <StatusPill good={server.enabled}>{server.enabled ? "启用" : "禁用"}</StatusPill>
        ])}
      />
    </section>
  );
}

function SkillsPage({ skills, loading, onRefresh }: { skills: Skill[]; loading: boolean; onRefresh: () => Promise<void> }) {
  return (
    <section className="list-section">
      <div className="panel-header">
        <div className="panel-title">
          <Sparkles size={18} />
          <h2>Skills</h2>
        </div>
        <div className="panel-action">
          <button className="primary-action" onClick={() => void onRefresh()} disabled={loading}>
            <RefreshCcw size={17} />
            {loading ? "扫描中" : "重新扫描"}
          </button>
        </div>
      </div>
      <DataTable
        className="hidden-scrollbar"
        empty="暂未发现 Skill"
        columns={["名称", "描述", "来源", "启用 Agent", "同步", "路径"]}
        rows={skills.map((skill) => [
          <strong>{skill.name}</strong>,
          skill.description,
          skill.source,
          <AgentBadges apps={skill.enabledApps} />,
          skill.syncMethod,
          <span className="path-text">{skill.localPath}</span>
        ])}
      />
    </section>
  );
}

function BackupPage({ backups, agents, onBackup }: { backups: BackupRecord[]; agents: AgentInstallStatus[]; onBackup: () => Promise<void> }) {
  async function createBackup(sourcePath?: string) {
    if (!sourcePath) {
      return;
    }

    await window.agentManager.createBackup(sourcePath, "manual");
    await onBackup();
  }

  return (
    <section className="content-stack">
      <Panel title="可备份配置" icon={<ArchiveRestore size={18} />}>
        <div className="backup-actions">
          {agents
            .filter((agent) => agent.configPath)
            .map((agent) => (
              <button key={agent.appId} className="secondary-action" onClick={() => void createBackup(agent.configPath)}>
                备份 {agent.name}
              </button>
            ))}
        </div>
      </Panel>

      <Panel title="备份记录" icon={<DatabaseBackup size={18} />}>
        <DataTable
          empty="暂无备份记录"
          columns={["时间", "Agent", "原因", "备份路径"]}
          rows={backups.map((backup) => [formatTime(backup.createdAt), backup.appId, backup.reason, <span className="path-text">{backup.backupPath}</span>])}
        />
      </Panel>
    </section>
  );
}

function SettingsPage() {
  return (
    <Panel title="第一版边界" icon={<Settings size={18} />}>
      <div className="settings-grid">
        <SettingItem label="默认同步方式" value="copy" />
        <SettingItem label="自动备份" value="下一阶段启用" />
        <SettingItem label="高级配置展示" value="开启" />
        <SettingItem label="当前写入模式" value="只读扫描" />
      </div>
    </Panel>
  );
}

function Panel({ title, icon, children, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-title">
          {icon}
          <h2>{title}</h2>
        </div>
        {action ? <div className="panel-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DataTable({ columns, rows, empty, className = "" }: { columns: string[]; rows: React.ReactNode[][]; empty: string; className?: string }) {
  if (rows.length === 0) {
    return <div className="empty-state">{empty}</div>;
  }

  return (
    <div className={`table-wrap ${className}`}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ good, children }: { good: boolean; children: React.ReactNode }) {
  return <span className={`pill ${good ? "good" : "muted"}`}>{children}</span>;
}

function RiskPill({ risk }: { risk: McpServer["riskLevel"] }) {
  return <span className={`pill risk-${risk}`}>{risk === "low" ? "低" : risk === "medium" ? "中" : "高"}</span>;
}

function AgentBadges({ apps }: { apps: AgentApp[] }) {
  if (apps.length === 0) {
    return <span className="path-text">未启用</span>;
  }

  return (
    <div className="agent-badges">
      {apps.map((app) => {
        const meta = agentMeta[app];
        return (
          <span key={app} className={`agent-badge ${app}`} title={meta.label}>
            <img className="agent-badge-icon" src={meta.icon} alt={meta.label} />
          </span>
        );
      })}
    </div>
  );
}

const agentMeta: Record<AgentApp, { label: string; icon: string }> = {
  claude: { label: "Claude", icon: claudeIcon },
  codex: { label: "Codex", icon: openAiIcon },
  gemini: { label: "Gemini", icon: geminiIcon },
  opencode: { label: "OpenCode", icon: openCodeIcon }
};

function SettingItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="setting-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function pageTitle(page: Page): string {
  return {
    dashboard: "配置总览",
    mcp: "MCP 管理",
    skills: "Skills 管理",
    backup: "备份恢复",
    settings: "设置"
  }[page];
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

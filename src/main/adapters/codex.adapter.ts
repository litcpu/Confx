import path from "path";
import fs from "fs-extra";
import toml from "@iarna/toml";
import type { AgentInstallStatus } from "../../shared/types/agent";
import type { BackupRecord } from "../../shared/types/backup";
import type { McpServer } from "../../shared/types/mcp";
import type { Skill } from "../../shared/types/skill";
import { explainMcp, detectRisk } from "../services/config-explain.service";
import { explainSkill } from "../services/skill-explain.service";
import { listDirectories, pathExists } from "../utils/file.util";
import { homePath, normalizeId } from "../utils/path.util";
import type { AppAdapter } from "./app-adapter";

interface CodexConfig {
  mcp_servers?: Record<string, Record<string, unknown>>;
}

export class CodexAdapter implements AppAdapter {
  appId = "codex" as const;
  displayName = "Codex";

  private readonly configFile = homePath(".codex", "config.toml");
  private readonly configDir = homePath(".codex");
  private readonly skillsDir = homePath(".agents", "skills");

  async detect(): Promise<AgentInstallStatus> {
    const hasFile = await pathExists(this.configFile);
    const hasDir = await pathExists(this.configDir);

    return {
      appId: this.appId,
      name: this.displayName,
      installed: hasFile || hasDir,
      configPath: hasFile ? this.configFile : hasDir ? this.configDir : undefined,
      skillDirs: (await pathExists(this.skillsDir)) ? [this.skillsDir] : [],
      warnings: hasFile || hasDir ? [] : ["未发现 ~/.codex 或 ~/.codex/config.toml"]
    };
  }

  async readMcp(): Promise<McpServer[]> {
    if (!(await pathExists(this.configFile))) {
      return [];
    }

    const parsed = toml.parse(await fs.readFile(this.configFile, "utf8")) as CodexConfig;
    const servers = parsed.mcp_servers ?? {};
    const now = new Date().toISOString();

    return Object.entries(servers).map(([name, raw]) => {
      const command = typeof raw.command === "string" ? raw.command : undefined;
      const args = Array.isArray(raw.args) ? raw.args.filter((item): item is string => typeof item === "string") : undefined;
      const url = typeof raw.url === "string" ? raw.url : undefined;
      const transport = url ? (url.includes("/sse") ? "sse" : "http") : "stdio";
      const base = { name, command, url };

      return {
        id: `codex-${normalizeId(name)}`,
        name,
        transport,
        command,
        args,
        url,
        env: isStringRecord(raw.env) ? raw.env : undefined,
        headers: isStringRecord(raw.headers) ? raw.headers : undefined,
        configPath: this.configFile,
        enabledApps: [this.appId],
        enabled: raw.disabled !== true,
        description: explainMcp(base),
        riskLevel: detectRisk(base),
        source: "imported",
        createdAt: now,
        updatedAt: now
      };
    });
  }

  async writeMcp(): Promise<void> {
    throw new Error("Codex MCP 写入将在下一阶段实现。");
  }

  async scanSkills(): Promise<Skill[]> {
    const dirs = await listDirectories(this.skillsDir);
    return Promise.all(dirs.map((dir) => toSkill(dir, [this.appId])));
  }

  async syncSkill(): Promise<void> {
    throw new Error("Codex Skill 同步将在下一阶段实现。");
  }

  async backup(reason = "manual"): Promise<BackupRecord[]> {
    const records: BackupRecord[] = [];
    const backupRoot = homePath(".agent-manager", "backups", this.appId, new Date().toISOString().replace(/[:.]/g, "-"));

    for (const sourcePath of [this.configFile, this.skillsDir]) {
      if (!(await pathExists(sourcePath))) {
        continue;
      }

      const backupPath = path.join(backupRoot, path.basename(sourcePath));
      await fs.copy(sourcePath, backupPath);
      records.push({
        id: `${this.appId}-${Date.now()}-${records.length}`,
        appId: this.appId,
        sourcePath,
        backupPath,
        reason,
        createdAt: new Date().toISOString()
      });
    }

    return records;
  }
}

async function toSkill(localPath: string, enabledApps: Skill["enabledApps"]): Promise<Skill> {
  const skillMd = path.join(localPath, "SKILL.md");
  const hasSkillMd = await pathExists(skillMd);
  const content = hasSkillMd ? await fs.readFile(skillMd, "utf8") : "";
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const frontmatterName = content.match(/^name:\s*(.+)$/m);
  const frontmatterDescription = content.match(/^description:\s*(.+)$/m);
  const name = frontmatterName?.[1]?.trim() || titleMatch?.[1]?.trim() || path.basename(localPath);
  const rawDescription = frontmatterDescription?.[1]?.trim() || "未读取到描述";
  const now = new Date().toISOString();

  return {
    id: `skill-${normalizeId(localPath)}`,
    name,
    description: explainSkill(name, rawDescription),
    localPath,
    source: localPath.includes(`${path.sep}.codex${path.sep}`) ? "system" : "local",
    enabledApps,
    syncMethod: "copy",
    enabled: true,
    hasSkillMd,
    warnings: hasSkillMd ? [] : ["缺少 SKILL.md"],
    createdAt: now,
    updatedAt: now
  };
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.values(value).every((item) => typeof item === "string");
}

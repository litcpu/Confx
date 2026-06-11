import path from "path";
import fs from "fs-extra";
import type { AgentInstallStatus } from "../../shared/types/agent";
import type { BackupRecord } from "../../shared/types/backup";
import type { McpServer } from "../../shared/types/mcp";
import type { Skill } from "../../shared/types/skill";
import { explainMcp, detectRisk } from "../services/config-explain.service";
import { explainSkill } from "../services/skill-explain.service";
import { listDirectories, pathExists, readJsonFile } from "../utils/file.util";
import { homePath, normalizeId } from "../utils/path.util";
import type { AppAdapter } from "./app-adapter";

interface ClaudeConfig {
  mcpServers?: Record<string, Record<string, unknown>>;
}

export class ClaudeAdapter implements AppAdapter {
  appId = "claude" as const;
  displayName = "Claude Code";

  private readonly configFile = homePath(".claude.json");
  private readonly configDir = homePath(".claude");
  private readonly skillsDir = homePath(".claude", "skills");

  async detect(): Promise<AgentInstallStatus> {
    const hasFile = await pathExists(this.configFile);
    const hasDir = await pathExists(this.configDir);

    return {
      appId: this.appId,
      name: this.displayName,
      installed: hasFile || hasDir,
      configPath: hasFile ? this.configFile : hasDir ? this.configDir : undefined,
      skillDirs: (await pathExists(this.skillsDir)) ? [this.skillsDir] : [],
      warnings: hasFile || hasDir ? [] : ["未发现 ~/.claude 或 ~/.claude.json"]
    };
  }

  async readMcp(): Promise<McpServer[]> {
    const config = await readJsonFile<ClaudeConfig>(this.configFile);
    const servers = config?.mcpServers ?? {};
    const now = new Date().toISOString();

    return Object.entries(servers).map(([name, raw]) => {
      const command = typeof raw.command === "string" ? raw.command : undefined;
      const args = Array.isArray(raw.args) ? raw.args.filter((item): item is string => typeof item === "string") : undefined;
      const url = typeof raw.url === "string" ? raw.url : undefined;
      const transport = url ? (url.includes("/sse") ? "sse" : "http") : "stdio";
      const base = { name, command, url };

      return {
        id: `claude-${normalizeId(name)}`,
        name,
        transport,
        command,
        args,
        url,
        env: isStringRecord(raw.env) ? raw.env : undefined,
        headers: isStringRecord(raw.headers) ? raw.headers : undefined,
        configPath: this.configFile,
        enabledApps: [this.appId],
        enabled: true,
        description: explainMcp(base),
        riskLevel: detectRisk(base),
        source: "imported",
        createdAt: now,
        updatedAt: now
      };
    });
  }

  async writeMcp(): Promise<void> {
    throw new Error("Claude MCP 写入将在下一阶段实现。");
  }

  async scanSkills(): Promise<Skill[]> {
    const dirs = await listDirectories(this.skillsDir);
    return Promise.all(dirs.map((dir) => toSkill(dir, [this.appId])));
  }

  async syncSkill(): Promise<void> {
    throw new Error("Claude Skill 同步将在下一阶段实现。");
  }

  async backup(reason = "manual"): Promise<BackupRecord[]> {
    const records: BackupRecord[] = [];
    const backupRoot = homePath(".agent-manager", "backups", this.appId, new Date().toISOString().replace(/[:.]/g, "-"));

    for (const sourcePath of [this.configFile, this.configDir]) {
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
  const nameMatch = content.match(/^#\s+(.+)$/m);
  const descriptionMatch = content.match(/^description:\s*(.+)$/m);
  const name = nameMatch?.[1]?.trim() || path.basename(localPath);
  const rawDescription = descriptionMatch?.[1]?.trim() || "未读取到描述";
  const now = new Date().toISOString();

  return {
    id: `skill-${normalizeId(localPath)}`,
    name,
    description: explainSkill(name, rawDescription),
    localPath,
    source: "local",
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

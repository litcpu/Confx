import type { AgentInstallStatus } from "./agent";
import type { BackupRecord } from "./backup";
import type { ConfigFileItem } from "./config-file";
import type { McpServer } from "./mcp";
import type { Skill } from "./skill";

export interface AgentManagerApi {
  scanAgents(): Promise<AgentInstallStatus[]>;
  listMcp(): Promise<McpServer[]>;
  listSkills(): Promise<Skill[]>;
  listAiConfigFiles(): Promise<ConfigFileItem[]>;
  listDirectory(path: string): Promise<ConfigFileItem[]>;
  listBackups(): Promise<BackupRecord[]>;
  createBackup(sourcePath: string, reason?: string): Promise<BackupRecord>;
}

declare global {
  interface Window {
    agentManager: AgentManagerApi;
  }
}

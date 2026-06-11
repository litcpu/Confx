import type { AgentInstallStatus } from "../../shared/types/agent";
import type { BackupRecord } from "../../shared/types/backup";
import type { McpServer } from "../../shared/types/mcp";
import type { Skill } from "../../shared/types/skill";

export interface AppAdapter {
  appId: AgentInstallStatus["appId"];
  displayName: string;
  detect(): Promise<AgentInstallStatus>;
  readMcp(): Promise<McpServer[]>;
  writeMcp(servers: McpServer[]): Promise<void>;
  scanSkills(): Promise<Skill[]>;
  syncSkill(skill: Skill): Promise<void>;
  backup(reason?: string): Promise<BackupRecord[]>;
}

import type { AgentApp } from "./agent";

export interface BackupRecord {
  id: string;
  appId: AgentApp;
  sourcePath: string;
  backupPath: string;
  reason: string;
  createdAt: string;
}

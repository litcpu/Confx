export type AgentApp = "claude" | "codex" | "gemini" | "opencode";

export interface AgentInstallStatus {
  appId: AgentApp;
  name: string;
  installed: boolean;
  configPath?: string;
  skillDirs: string[];
  warnings: string[];
}

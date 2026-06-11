import type { AgentApp } from "./agent";

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

import type { AgentApp } from "./agent";

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
  configPath?: string;
  enabledApps: AgentApp[];
  enabled: boolean;
  description?: string;
  riskLevel: "low" | "medium" | "high";
  source: "imported" | "manual" | "template";
  createdAt: string;
  updatedAt: string;
}

import { z } from "zod";

export const mcpServerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  transport: z.enum(["stdio", "http", "sse"]),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.string().optional(),
  env: z.record(z.string()).optional(),
  headers: z.record(z.string()).optional(),
  configPath: z.string().optional(),
  enabledApps: z.array(z.enum(["claude", "codex", "gemini", "opencode"])),
  enabled: z.boolean(),
  description: z.string().optional(),
  riskLevel: z.enum(["low", "medium", "high"]),
  source: z.enum(["imported", "manual", "template"]),
  createdAt: z.string(),
  updatedAt: z.string()
});

import { z } from "zod";

export const skillSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  localPath: z.string(),
  source: z.enum(["local", "github", "zip", "system"]),
  sourceUrl: z.string().optional(),
  enabledApps: z.array(z.enum(["claude", "codex", "gemini", "opencode"])),
  syncMethod: z.enum(["copy", "symlink"]),
  enabled: z.boolean(),
  hasSkillMd: z.boolean(),
  warnings: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string()
});

import type { Skill } from "../../shared/types/skill";
import type { AppAdapter } from "../adapters/app-adapter";

export class SkillService {
  constructor(private readonly adapters: AppAdapter[]) {}

  async list(): Promise<Skill[]> {
    const nested = await Promise.all(this.adapters.map((adapter) => adapter.scanSkills()));
    return mergeSkills(nested.flat());
  }
}

function mergeSkills(skills: Skill[]): Skill[] {
  const map = new Map<string, Skill>();

  for (const skill of skills) {
    const existing = map.get(skill.localPath);

    if (!existing) {
      map.set(skill.localPath, skill);
      continue;
    }

    map.set(skill.localPath, {
      ...existing,
      enabledApps: Array.from(new Set([...existing.enabledApps, ...skill.enabledApps])),
      warnings: Array.from(new Set([...existing.warnings, ...skill.warnings])),
      updatedAt: new Date().toISOString()
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

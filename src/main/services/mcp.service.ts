import type { McpServer } from "../../shared/types/mcp";
import type { AppAdapter } from "../adapters/app-adapter";

export class McpService {
  constructor(private readonly adapters: AppAdapter[]) {}

  async list(): Promise<McpServer[]> {
    const nested = await Promise.all(this.adapters.map((adapter) => adapter.readMcp()));
    return mergeServers(nested.flat());
  }
}

function mergeServers(servers: McpServer[]): McpServer[] {
  const map = new Map<string, McpServer>();

  for (const server of servers) {
    const key = [server.name, server.command, server.url].filter(Boolean).join("|");
    const existing = map.get(key);

    if (!existing) {
      map.set(key, server);
      continue;
    }

    map.set(key, {
      ...existing,
      configPath: mergeConfigPath(existing.configPath, server.configPath),
      enabledApps: Array.from(new Set([...existing.enabledApps, ...server.enabledApps])),
      enabled: existing.enabled || server.enabled,
      riskLevel: rankRisk(existing.riskLevel) >= rankRisk(server.riskLevel) ? existing.riskLevel : server.riskLevel,
      updatedAt: new Date().toISOString()
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function mergeConfigPath(left?: string, right?: string): string | undefined {
  return Array.from(new Set([left, right].filter(Boolean))).join("\n") || undefined;
}

function rankRisk(risk: McpServer["riskLevel"]): number {
  return { low: 1, medium: 2, high: 3 }[risk];
}

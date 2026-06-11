import type { AgentInstallStatus } from "../../shared/types/agent";
import { ClaudeAdapter } from "../adapters/claude.adapter";
import { CodexAdapter } from "../adapters/codex.adapter";
import type { AppAdapter } from "../adapters/app-adapter";

export class AgentScanService {
  constructor(private readonly adapters: AppAdapter[] = [new ClaudeAdapter(), new CodexAdapter()]) {}

  async scan(): Promise<AgentInstallStatus[]> {
    return Promise.all(this.adapters.map((adapter) => adapter.detect()));
  }

  getAdapters(): AppAdapter[] {
    return this.adapters;
  }
}

import { ipcMain } from "electron";
import type { AgentScanService } from "../services/agent-scan.service";

export function registerAgentIpc(agentScanService: AgentScanService): void {
  ipcMain.handle("agents:scan", () => agentScanService.scan());
}

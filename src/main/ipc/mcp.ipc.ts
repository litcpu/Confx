import { ipcMain } from "electron";
import type { McpService } from "../services/mcp.service";

export function registerMcpIpc(mcpService: McpService): void {
  ipcMain.handle("mcp:list", () => mcpService.list());
}

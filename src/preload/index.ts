import { contextBridge, ipcRenderer } from "electron";
import type { AgentApp } from "../shared/types/agent";

contextBridge.exposeInMainWorld("agentManager", {
  scanAgents: () => ipcRenderer.invoke("agents:scan"),
  listMcp: () => ipcRenderer.invoke("mcp:list"),
  listSkills: () => ipcRenderer.invoke("skills:list"),
  listAiConfigFiles: () => ipcRenderer.invoke("config-files:list-ai"),
  listBackups: () => ipcRenderer.invoke("backups:list"),
  createBackup: (sourcePath: string, reason?: string) => ipcRenderer.invoke("backups:create", sourcePath, reason),
  syncMcp: (_apps?: AgentApp[]) => Promise.reject(new Error("MCP 同步将在下一阶段实现。")),
  syncSkills: (_apps?: AgentApp[]) => Promise.reject(new Error("Skill 同步将在下一阶段实现。"))
});

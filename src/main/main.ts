import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import { registerAgentIpc } from "./ipc/agent.ipc";
import { registerBackupIpc } from "./ipc/backup.ipc";
import { registerConfigFileIpc } from "./ipc/config-file.ipc";
import { registerMcpIpc } from "./ipc/mcp.ipc";
import { registerSkillIpc } from "./ipc/skill.ipc";
import { AgentScanService } from "./services/agent-scan.service";
import { BackupService } from "./services/backup.service";
import { ConfigFileScanService } from "./services/config-file-scan.service";
import { McpService } from "./services/mcp.service";
import { SkillService } from "./services/skill.service";

const agentScanService = new AgentScanService();
const adapters = agentScanService.getAdapters();

registerAgentIpc(agentScanService);
registerMcpIpc(new McpService(adapters));
registerSkillIpc(new SkillService(adapters));
registerBackupIpc(new BackupService());
registerConfigFileIpc(new ConfigFileScanService());

async function createWindow(): Promise<void> {
  Menu.setApplicationMenu(null);
  const appIconPath = path.join(__dirname, "assets/app-icon.png");

  const window = new BrowserWindow({
    width: 1220,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: "#101418",
    title: "Agent Manager",
    icon: appIconPath,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    await window.loadURL(devServerUrl);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    await window.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});

import { ipcMain } from "electron";
import type { ConfigFileScanService } from "../services/config-file-scan.service";

export function registerConfigFileIpc(configFileScanService: ConfigFileScanService): void {
  ipcMain.handle("config-files:list-ai", () => configFileScanService.listAiConfigFiles());
  ipcMain.handle("config-files:list-directory", (_event, targetPath: string) => configFileScanService.listDirectory(targetPath));
}

import { ipcMain } from "electron";
import type { BackupService } from "../services/backup.service";

export function registerBackupIpc(backupService: BackupService): void {
  ipcMain.handle("backups:list", () => backupService.list());
  ipcMain.handle("backups:create", (_event, sourcePath: string, reason?: string) => backupService.createManualBackup(sourcePath, reason));
}

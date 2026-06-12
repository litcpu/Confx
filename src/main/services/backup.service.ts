import fs from "fs-extra";
import path from "path";
import type { BackupRecord } from "../../shared/types/backup";
import { homePath } from "../utils/path.util";

export class BackupService {
  async createManualBackup(sourcePath: string, reason = "manual"): Promise<BackupRecord> {
    if (!(await fs.pathExists(sourcePath))) {
      throw new Error(`路径不存在：${sourcePath}`);
    }

    const backupRoot = homePath(".confx", "backups", "manual", new Date().toISOString().replace(/[:.]/g, "-"));
    const backupPath = path.join(backupRoot, path.basename(sourcePath));
    await fs.copy(sourcePath, backupPath);

    return {
      id: `manual-${Date.now()}`,
      appId: "codex",
      sourcePath,
      backupPath,
      reason,
      createdAt: new Date().toISOString()
    };
  }

  async list(): Promise<BackupRecord[]> {
    const root = homePath(".confx", "backups");

    if (!(await fs.pathExists(root))) {
      return [];
    }

    const records: BackupRecord[] = [];
    await walk(root, async (filePath) => {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        return;
      }

      const segments = path.relative(root, filePath).split(path.sep);
      const appId = segments[0] === "claude" ? "claude" : segments[0] === "manual" ? "codex" : "codex";

      records.push({
        id: filePath,
        appId,
        sourcePath: path.basename(filePath),
        backupPath: filePath,
        reason: "manual",
        createdAt: stat.birthtime.toISOString()
      });
    });

    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

async function walk(dir: string, visitor: (filePath: string) => Promise<void>): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, visitor);
    } else {
      await visitor(fullPath);
    }
  }
}

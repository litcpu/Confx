import fs from "fs-extra";
import os from "os";
import path from "path";
import type { ConfigFileItem } from "../../shared/types/config-file";

const targetNames = new Map<string, string>([
  [".claude", "Claude Code"],
  [".claude.json", "Claude Code"],
  [".codex", "Codex"],
  [".agents", "Codex / Agents"],
  [".gemini", "Gemini"],
  [".opencode", "OpenCode"],
  [".cursor", "Cursor"],
  [".continue", "Continue"],
  [".aider", "Aider"],
  [".aider.conf.yml", "Aider"],
  [".windsurf", "Windsurf"],
  [".roo", "Roo Code"],
  [".cline", "Cline"]
]);

const ignoredDirectoryNames = new Set([
  "$Recycle.Bin",
  "$WinREAgent",
  "Windows",
  "Program Files",
  "Program Files (x86)",
  "ProgramData",
  "System Volume Information",
  "node_modules",
  ".git",
  "AppData"
]);

export class ConfigFileScanService {
  async listAiConfigFiles(): Promise<ConfigFileItem[]> {
    const roots = Array.from(new Set([path.parse(os.homedir()).root, path.join(path.parse(os.homedir()).root, "Users")]));
    const results: ConfigFileItem[] = [];

    for (const root of roots) {
      await this.scanDirectory(root, results, 0);
    }

    return dedupe(results).sort((a, b) => a.path.localeCompare(b.path));
  }

  async listDirectory(targetPath: string): Promise<ConfigFileItem[]> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.readdir(targetPath, { withFileTypes: true });
    } catch {
      return [];
    }

    const items = await Promise.all(
      entries.map((entry) => {
        const fullPath = path.join(targetPath, entry.name);
        return toConfigFileItem(fullPath, entry, targetNames.get(entry.name.toLowerCase()) ?? inferAppHint(fullPath));
      })
    );

    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
  }

  private async scanDirectory(currentPath: string, results: ConfigFileItem[], depth: number): Promise<void> {
    if (depth > 4 || results.length >= 500) {
      return;
    }

    let entries: fs.Dirent[];
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const appHint = targetNames.get(entry.name.toLowerCase());

      if (appHint) {
        results.push(await toConfigFileItem(fullPath, entry, appHint));
      }

      if (!entry.isDirectory() || ignoredDirectoryNames.has(entry.name)) {
        continue;
      }

      await this.scanDirectory(fullPath, results, depth + 1);
    }
  }
}

async function toConfigFileItem(fullPath: string, entry: fs.Dirent, appHint: string): Promise<ConfigFileItem> {
  let size: number | undefined;
  let updatedAt: string | undefined;

  try {
    const stat = await fs.stat(fullPath);
    size = stat.isFile() ? stat.size : undefined;
    updatedAt = stat.mtime.toISOString();
  } catch {
    // Ignore inaccessible metadata. The path itself is still useful.
  }

  return {
    id: fullPath,
    name: entry.name,
    path: fullPath,
    type: entry.isDirectory() ? "directory" : "file",
    appHint,
    size,
    updatedAt
  };
}

function dedupe(items: ConfigFileItem[]): ConfigFileItem[] {
  return Array.from(new Map(items.map((item) => [item.path.toLowerCase(), item])).values());
}

function inferAppHint(fullPath: string): string {
  const normalized = fullPath.toLowerCase();

  for (const [name, appHint] of targetNames.entries()) {
    if (normalized.includes(`${path.sep}${name}${path.sep}`) || normalized.endsWith(`${path.sep}${name}`)) {
      return appHint;
    }
  }

  return "配置内容";
}

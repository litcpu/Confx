import fs from "fs-extra";
import path from "path";

export async function pathExists(targetPath: string): Promise<boolean> {
  return fs.pathExists(targetPath);
}

export async function readJsonFile<T>(targetPath: string): Promise<T | null> {
  if (!(await fs.pathExists(targetPath))) {
    return null;
  }

  return fs.readJson(targetPath) as Promise<T>;
}

export async function listDirectories(targetPath: string): Promise<string[]> {
  if (!(await fs.pathExists(targetPath))) {
    return [];
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(targetPath, entry.name));
}

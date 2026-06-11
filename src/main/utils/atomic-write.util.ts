import fs from "fs-extra";

export async function atomicWriteFile(targetPath: string, content: string): Promise<void> {
  const tempPath = `${targetPath}.tmp-${Date.now()}`;
  await fs.outputFile(tempPath, content, "utf8");
  await fs.move(tempPath, targetPath, { overwrite: true });
}

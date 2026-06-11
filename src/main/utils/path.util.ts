import os from "os";
import path from "path";

export function homePath(...segments: string[]): string {
  return path.join(os.homedir(), ...segments);
}

export function normalizeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

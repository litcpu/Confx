export interface ConfigFileItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  appHint: string;
  size?: number;
  updatedAt?: string;
}

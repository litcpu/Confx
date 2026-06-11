import type { McpServer } from "../../shared/types/mcp";

const knownDescriptions: Record<string, string> = {
  context7: "查询第三方技术库最新文档，适合开发场景保留启用。",
  playwright: "控制浏览器执行页面自动化、截图和交互测试。",
  github: "访问 GitHub 仓库、PR、Issue 或 Actions 信息。",
  filesystem: "访问本地文件系统，能力强但需要谨慎限定目录。",
  browser: "让 Agent 操作浏览器或读取网页内容。"
};

export function explainMcp(server: Pick<McpServer, "name" | "command" | "url">): string {
  const haystack = [server.name, server.command, server.url].filter(Boolean).join(" ").toLowerCase();
  const matched = Object.entries(knownDescriptions).find(([key]) => haystack.includes(key));

  if (matched) {
    return matched[1];
  }

  if (server.url) {
    return "通过网络地址连接的 MCP Server，请确认服务来源可信。";
  }

  return "本地命令启动的 MCP Server，请检查命令来源和权限范围。";
}

export function detectRisk(server: Pick<McpServer, "name" | "command" | "url">): McpServer["riskLevel"] {
  const haystack = [server.name, server.command, server.url].filter(Boolean).join(" ").toLowerCase();

  if (["filesystem", "shell", "terminal", "mysql", "postgres", "database"].some((keyword) => haystack.includes(keyword))) {
    return "high";
  }

  if (["github", "browser", "playwright", "figma", "sentry"].some((keyword) => haystack.includes(keyword))) {
    return "medium";
  }

  return "low";
}

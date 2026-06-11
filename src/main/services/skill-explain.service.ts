const knownSkillDescriptions: Record<string, string> = {
  imagegen: "生成或编辑图片素材，适合制作插图、贴图、视觉变体和位图资源。",
  "openai-docs": "查询 OpenAI 官方文档，用于回答 API、模型和产品使用问题。",
  "plugin-creator": "创建和维护 Codex 插件目录、清单文件和本地插件结构。",
  "skill-creator": "创建或更新 Codex Skill，用于扩展 Agent 的专业能力。",
  "skill-installer": "安装 Codex Skill，支持从精选列表或 GitHub 仓库安装。",
  "frontend-design": "设计和实现高质量前端页面、组件、仪表盘或交互界面。",
  playwright: "使用浏览器自动化能力进行页面测试、截图、表单填写和流程验证。",
  documents: "创建、编辑和校验 Word 文档或文档类产物。",
  presentations: "创建、编辑和导出 PowerPoint 演示文稿。",
  spreadsheets: "创建、编辑、分析和可视化电子表格文件。",
  github: "处理 GitHub 仓库、Issue、PR、CI 和发布相关工作。",
  gmail: "管理 Gmail 邮件，包括搜索、摘要、回复草稿和收件箱整理。",
  "java-springboot": "辅助开发 Spring Boot 应用，提供分层架构和最佳实践建议。"
};

const keywordDescriptions: Array<[RegExp, string]> = [
  [/image|photo|picture|bitmap|raster/i, "处理图片生成、编辑或视觉资源相关任务。"],
  [/openai|api|model|codex|chatgpt/i, "查询和解释 OpenAI 产品、模型或 API 的使用方式。"],
  [/plugin/i, "创建、安装或维护 Codex 插件。"],
  [/skill/i, "创建、安装或维护 Agent Skill 能力包。"],
  [/frontend|react|ui|ux|web|component|dashboard/i, "设计和实现前端页面、组件或用户界面。"],
  [/browser|playwright|screenshot|automation/i, "控制浏览器完成自动化测试、截图或页面操作。"],
  [/document|docx|word/i, "创建、编辑或校验文档文件。"],
  [/presentation|ppt|slide/i, "创建、编辑或导出演示文稿。"],
  [/spreadsheet|excel|csv|xlsx/i, "处理电子表格、CSV 数据、公式或图表。"],
  [/github|pull request|issue|actions|ci/i, "处理 GitHub 仓库、PR、Issue 或 CI 工作流。"],
  [/gmail|email|inbox|mail/i, "处理邮件搜索、摘要、回复草稿或收件箱整理。"],
  [/spring|java/i, "辅助 Java 或 Spring Boot 项目开发。"]
];

export function explainSkill(name: string, description: string): string {
  const trimmedDescription = description.trim();

  if (containsChinese(trimmedDescription)) {
    return trimmedDescription;
  }

  const normalizedName = name.trim().toLowerCase();
  const knownDescription = knownSkillDescriptions[normalizedName];

  if (knownDescription) {
    return knownDescription;
  }

  const haystack = `${name} ${description}`;
  const matched = keywordDescriptions.find(([pattern]) => pattern.test(haystack));

  if (matched) {
    return matched[1];
  }

  if (!trimmedDescription || trimmedDescription === "未读取到描述") {
    return "该 Skill 暂未提供中文说明，请查看 SKILL.md 了解触发场景和使用方式。";
  }

  return "该 Skill 用于扩展 Agent 的专项能力，建议查看 SKILL.md 了解具体触发场景。";
}

function containsChinese(value: string): boolean {
  return /[\u4e00-\u9fff]/.test(value);
}

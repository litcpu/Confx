import { ipcMain } from "electron";
import type { SkillService } from "../services/skill.service";

export function registerSkillIpc(skillService: SkillService): void {
  ipcMain.handle("skills:list", () => skillService.list());
}

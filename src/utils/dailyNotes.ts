import { Vault } from "obsidian";
import { ConfigService } from "../services/ConfigService";

export function getDailyNotesPath(vault: Vault): string {
  return ConfigService.getInstance().getSettings().dailyNotesFolder;
}

export function getOutputPath(vault: Vault): string {
  return ConfigService.getInstance().getSettings().outputFolder;
}

export async function ensureFolderExists(
  vault: Vault,
  path: string
): Promise<void> {
  if (!(await vault.adapter.exists(path))) {
    await vault.createFolder(path);
  }
}

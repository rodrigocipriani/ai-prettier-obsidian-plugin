import { TFile, Vault } from "obsidian";
import {
  getDailyNotesPath,
  getOutputPath,
  ensureFolderExists,
} from "../utils/dailyNotes";

export class SummaryService {
  constructor(private vault: Vault) {}

  getDailyNoteFiles(): TFile[] {
    const dailyNotesPath = getDailyNotesPath(this.vault);
    return this.vault
      .getFiles()
      .filter(
        (file) =>
          file.path.startsWith(dailyNotesPath) && file.path.endsWith(".md")
      );
  }

  async aggregateMonthContent(files: TFile[]): Promise<string> {
    let content = "";
    for (const file of files) {
      content += `## ${file.basename}\n\n`;
      content += (await this.vault.read(file)) + "\n\n";
    }
    return content;
  }

  groupFilesByMonth(files: TFile[]): { [key: string]: TFile[] } {
    const filesByMonth: { [key: string]: TFile[] } = {};

    files.forEach((file) => {
      // Assuming file names are in format YYYY-MM-DD
      const match = file.basename.match(/^(\d{4})-(\d{2})/);
      if (match) {
        const monthKey = `${match[1]}-${match[2]}`;
        if (!filesByMonth[monthKey]) {
          filesByMonth[monthKey] = [];
        }
        filesByMonth[monthKey].push(file);
      }
    });

    return filesByMonth;
  }

  async saveMonthlySummary(
    monthKey: string,
    summary: string,
    originalContent: string
  ): Promise<void> {
    const outputPath = getOutputPath(this.vault);
    await ensureFolderExists(this.vault, outputPath);

    const fileName = `${monthKey} Summary.md`;
    const filePath = `${outputPath}/${fileName}`;

    const fileContent = `# Monthly Summary - ${monthKey}\n\n${summary}\n\n## Original Content\n\n${originalContent}`;

    await this.createFile(filePath, fileContent);
  }

  async createFileInDailyNotesFolder(
    fileName: string,
    content: string
  ): Promise<void> {
    const outputPath = getOutputPath(this.vault);
    await ensureFolderExists(this.vault, outputPath);

    const filePath = `${outputPath}/${fileName}`;
    await this.createFile(filePath, content);
  }

  private async createFile(filePath: string, content: string): Promise<void> {
    try {
      const file = this.vault.getAbstractFileByPath(filePath);
      if (file) {
        await this.vault.modify(file as TFile, content);
      } else {
        await this.vault.create(filePath, content);
      }
    } catch (error) {
      throw new Error(`Failed to create file: ${error.message}`);
    }
  }
}

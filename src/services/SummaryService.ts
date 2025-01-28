import { TFile, Vault } from "obsidian";

export class SummaryService {
  constructor(private vault: Vault) {}

  getDailyNoteFiles(): TFile[] {
    const dailyNotesFolder = "Daily Notes";
    return this.vault
      .getFiles()
      .filter(
        (file) =>
          file.path.startsWith(dailyNotesFolder) && file.extension === "md"
      );
  }

  groupFilesByMonth(files: TFile[]): { [key: string]: TFile[] } {
    const filesByMonth: { [key: string]: TFile[] } = {};
    for (const file of files) {
      const match = file.name.match(/(\d{4}-\d{2})/);
      if (match) {
        const monthKey = match[1];
        if (!filesByMonth[monthKey]) {
          filesByMonth[monthKey] = [];
        }
        filesByMonth[monthKey].push(file);
      }
    }
    return filesByMonth;
  }

  async aggregateMonthContent(files: TFile[]): Promise<string> {
    let allContent = "";
    for (const file of files) {
      const content = await this.vault.read(file);
      allContent += `## ${file.name}\n${content}\n\n`;
    }
    return allContent;
  }

  async saveMonthlySummary(
    monthKey: string,
    summary: string,
    originalContent: string
  ): Promise<void> {
    const folderPath = "Monthly Summary";
    const summaryFileName = `${folderPath}/${monthKey}-Summary.md`;
    const summaryContent = `# Monthly Summary for ${monthKey}\n\n${summary}\n\n\n\`\`\`\n${originalContent}\n\`\`\``;

    if (!(await this.vault.adapter.exists(folderPath))) {
      await this.vault.createFolder(folderPath);
    }

    const existingFile = this.vault.getAbstractFileByPath(summaryFileName);
    if (existingFile instanceof TFile) {
      await this.vault.modify(existingFile, summaryContent);
    } else {
      await this.vault.create(summaryFileName, summaryContent);
    }
  }
}

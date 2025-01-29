import { TFile, Vault } from "obsidian";
import {
  getDailyNotesPath,
  getOutputPath,
  ensureFolderExists,
} from "../utils/dailyNotes";
import { TickTickService } from "./TickTickService";

export class SummaryService {
  private tickTickService = new TickTickService();

  constructor(private vault: Vault) {}

  async createMonthlySummary(
    files: TFile[],
    month: string,
    aiSummary: string,
    tasks: {
      dueSoon: any[];
      overdue: any[];
      inProgress: any[];
      completed: any[];
      formattedContent: string;
    }
  ): Promise<string> {
    const dailyNotes = files.filter((file) => this.isDailyNote(file.basename));

    return `# 📊 Monthly Summary - ${month}

## 🤖 AI Analysis
${aiSummary}

## 📈 Monthly Overview

### 🎯 Key Metrics
- Total Daily Notes: ${dailyNotes.length}
- Overdue Tasks: ${tasks.overdue.length}
- Completed Tasks: ${tasks.completed.length}
- In Progress: ${tasks.inProgress.length}
- Due Soon: ${tasks.dueSoon.length}

### 🔄 Task Progress
${this.generateTaskProgressSection(tasks)}

---

# 📚 Source Data

## 📋 Current Tasks
${tasks.formattedContent}

## 📝 Daily Notes Content
${await this.aggregateMonthContent(dailyNotes)}`;
  }

  private generateTaskProgressSection(tasks: {
    dueSoon: any[];
    overdue: any[];
    inProgress: any[];
    completed: any[];
  }): string {
    const total =
      tasks.completed.length +
      tasks.inProgress.length +
      tasks.overdue.length +
      tasks.dueSoon.length;
    if (total === 0) return "No tasks tracked this month.";

    const completionRate = ((tasks.completed.length / total) * 100).toFixed(1);
    const overdueRate = ((tasks.overdue.length / total) * 100).toFixed(1);

    return `- Completion Rate: ${completionRate}%
- Tasks Needing Attention: ${overdueRate}% overdue
- Active Tasks: ${tasks.inProgress.length + tasks.dueSoon.length}`;
  }

  async aggregateMonthContent(files: TFile[]): Promise<string> {
    let content = "";
    for (const file of files) {
      if (this.isDailyNote(file.basename)) {
        content += `## 📅 ${file.basename}\n\n`;
        const fileContent = await this.vault.read(file);
        const contentWithoutTitle = fileContent.replace(/^#.*$/m, "").trim();
        content += contentWithoutTitle + "\n\n";
      }
    }
    return content;
  }

  getDailyNoteFiles(): TFile[] {
    const dailyNotesPath = getDailyNotesPath(this.vault);
    return this.vault
      .getFiles()
      .filter(
        (file) =>
          file.path.startsWith(dailyNotesPath) &&
          file.path.endsWith(".md") &&
          this.isDailyNote(file.basename)
      );
  }

  private isDailyNote(basename: string): boolean {
    return /^\d{4}-\d{2}-\d{2}/.test(basename);
  }

  async createFileInDailyNotesFolder(
    fileName: string,
    content: string | ArrayBuffer
  ): Promise<void> {
    const outputPath = getOutputPath(this.vault);
    await ensureFolderExists(this.vault, outputPath);

    const filePath = `${outputPath}/${fileName}`;
    await this.createFile(filePath, content);
  }

  private async createFile(
    filePath: string,
    content: string | ArrayBuffer
  ): Promise<void> {
    try {
      const file = this.vault.getAbstractFileByPath(filePath);
      if (file instanceof TFile) {
        if (typeof content === "string") {
          await this.vault.modify(file, content);
        } else {
          await this.vault.modifyBinary(file, content);
        }
      } else {
        if (typeof content === "string") {
          await this.vault.create(filePath, content);
        } else {
          await this.vault.createBinary(filePath, content);
        }
      }
    } catch (error) {
      throw new Error(`Failed to create file: ${error.message}`);
    }
  }

  groupFilesByMonth(files: TFile[]): { [key: string]: TFile[] } {
    const filesByMonth: { [key: string]: TFile[] } = {};

    files.forEach((file) => {
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

  async saveMonthlySummary(monthKey: string, summary: string): Promise<void> {
    const fileName = `${monthKey} Summary.md`;
    await this.createFileInDailyNotesFolder(fileName, summary);
  }

  async getTasksForMonth(monthKey: string) {
    const tasks = await this.tickTickService.getRelevantTasks();
    const formattedContent = this.tickTickService.formatTasksForBriefing(tasks);
    return { ...tasks, formattedContent };
  }
}

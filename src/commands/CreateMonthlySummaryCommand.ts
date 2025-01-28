import { TFile } from "obsidian";
import { OllamaService } from "../services/OllamaService";
import { SummaryService } from "../services/SummaryService";
import { NoticeService } from "../services/NoticeService";
import { LoadingNotice } from "../types";

const MONTHLY_SUMMARY = (content: string) =>
  `Create a comprehensive monthly summary of these daily notes. 
    Keep the summary concise and to the point.
    Keep the summary in the same language as the daily notes.
    You can use emojis to make the summary more engaging.
    You can capture things like, next steps, important patterns, tasks to be done, etc.
    IMPORTANT: Do not include your thoughts in the summary.
    Focus on key events, achievements, and important patterns. Format the output in markdown:\n${content}`;

export class CreateMonthlySummaryCommand {
  constructor(
    private ollamaService: OllamaService,
    private summaryService: SummaryService
  ) {}

  async execute() {
    const loading = NoticeService.showLoading("Connecting to Ollama...");

    try {
      if (!(await this.ollamaService.checkConnection())) {
        throw new Error(
          "Cannot connect to Ollama. Please make sure Ollama is installed and running."
        );
      }

      loading.setMessage("Getting daily notes...");
      const files = this.summaryService.getDailyNoteFiles();
      if (files.length === 0) {
        throw new Error("No daily notes found in the Daily Notes folder");
      }

      const filesByMonth = this.summaryService.groupFilesByMonth(files);
      await this.processMonthlyFiles(filesByMonth, loading);

      loading.hide();
    } catch (error) {
      loading.hide();
      throw error;
    }
  }

  private async processMonthlyFiles(
    filesByMonth: { [key: string]: TFile[] },
    loading: LoadingNotice
  ) {
    const totalMonths = Object.keys(filesByMonth).length;
    let currentMonth = 0;

    for (const [monthKey, monthFiles] of Object.entries(filesByMonth)) {
      currentMonth++;
      loading.setMessage(
        `Processing month ${currentMonth}/${totalMonths}: ${monthKey}...`
      );

      const allContent = await this.summaryService.aggregateMonthContent(
        monthFiles
      );
      await this.generateAndSaveMonthlySummary(monthKey, allContent);
    }
  }

  private async generateAndSaveMonthlySummary(
    monthKey: string,
    content: string
  ) {
    const summary = await this.ollamaService.generateResponse(
      MONTHLY_SUMMARY(content)
    );
    await this.summaryService.saveMonthlySummary(monthKey, summary, content);
  }
}

import { TFile } from "obsidian";
import { AIService, LoadingNotice } from "../types";
import { SummaryService } from "../services/SummaryService";
import { NoticeService } from "../services/NoticeService";

const DAILY_BRIEFING_PROMPT = (content: string) =>
  `Create a morning briefing based on my recent notes. Include:
   1. Important pending tasks or follow-ups
   2. Upcoming events or deadlines
   3. Recent patterns or habits to maintain
   4. Key projects status
   5. Suggested focus areas for today
   
   IMPORTANT RULES:
   - Use emojis for better readability
   - Keep it concise and actionable
   - Use the same language as my notes
   - Format the output in markdown
   - Maintain the writing style and tone from my notes
   
   Here are my recent notes:\n${content}`;

export class CreateDailyBriefingCommand {
  constructor(
    private aiService: AIService,
    private summaryService: SummaryService,
    private daysToAnalyze: number = 30
  ) {}

  async execute() {
    const loading = NoticeService.showLoading("Getting recent notes...");

    try {
      const files = await this.getRecentDailyNotes();
      if (files.length === 0) {
        throw new Error("No daily notes found for analysis");
      }

      loading.setMessage("Analyzing your notes...");
      const content = await this.summaryService.aggregateMonthContent(files);

      loading.setMessage("Creating your daily briefing...");
      const briefing = await this.aiService.generateResponse(
        DAILY_BRIEFING_PROMPT(content)
      );

      await this.saveDailyBriefing(briefing);
      loading.hide();
    } catch (error) {
      loading.hide();
      throw error;
    }
  }

  private async getRecentDailyNotes(): Promise<TFile[]> {
    const allDailyNotes = this.summaryService.getDailyNoteFiles();
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - this.daysToAnalyze);

    return allDailyNotes.filter((file) => {
      const fileDate = this.getDateFromFileName(file.basename);
      return fileDate && fileDate >= cutoffDate;
    });
  }

  private getDateFromFileName(basename: string): Date | null {
    // Assuming daily note format is YYYY-MM-DD
    const match = basename.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  private async saveDailyBriefing(content: string) {
    const today = new Date();
    const fileName = `Daily Briefing ${today.toISOString().split("T")[0]}.md`;

    await this.summaryService.createFileInDailyNotesFolder(
      fileName,
      `# 🌅 Daily Briefing - ${today.toLocaleDateString()}\n\n${content}`
    );
  }
}

import { Notice, TFile } from "obsidian";
import { NoticeService } from "../services/NoticeService";
import { SummaryService } from "../services/SummaryService";
import { AIService, LoadingNotice } from "../types";

const MONTHLY_SUMMARY = (content: string, tasksContent: string) =>
  `Create a comprehensive monthly summary of these daily notes and tasks. 
   Keep the summary concise and to the point.
   Keep the summary in the same language as the daily notes.
   You can use emojis to make the summary more engaging.
   You can capture things like:
   - Next steps and priorities
   - Important patterns and trends
   - Key achievements and milestones
   - Task completion patterns
   - Areas needing attention
   
   IMPORTANT RULES:
   - Do not include your thoughts in the summary
   - Focus on key events, achievements, and important patterns
   - Consider both the notes content and task status
   - Format the output in markdown
   - Prioritize overdue and upcoming tasks in recommendations
   
   Daily Notes Content:
   ${content}
   
   Tasks Status:
   ${tasksContent}`;

export class CreateMonthlySummaryCommand {
  constructor(
    private aiService: AIService,
    private summaryService: SummaryService
  ) {}

  async execute(): Promise<void> {
    const loading = NoticeService.showLoading("Connecting to AI service...");

    try {
      if (!(await this.aiService.checkConnection())) {
        throw new Error(
          "Cannot connect to AI service. Please check your settings."
        );
      }

      loading.setMessage("Getting daily notes and tasks...");
      const files = this.summaryService.getDailyNoteFiles();
      if (files.length === 0) {
        throw new Error("No daily notes found");
      }

      const filesByMonth = this.summaryService.groupFilesByMonth(files);
      await this.processMonthlyFiles(filesByMonth, loading);

      loading.hide();
    } catch (error) {
      loading.hide();
      console.error("Failed to create monthly summary:", error);
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

      // Get content and tasks
      const [content, tasks] = await Promise.all([
        this.summaryService.aggregateMonthContent(monthFiles),
        this.summaryService.getTasksForMonth(monthKey),
      ]);

      // Generate AI summary
      const aiSummary = await this.aiService.generateResponse(
        MONTHLY_SUMMARY(content, tasks.formattedContent)
      );

      // Create final summary combining AI insights and data
      const finalSummary = await this.summaryService.createMonthlySummary(
        monthFiles,
        monthKey,
        aiSummary,
        tasks
      );

      // Save the summary
      await this.summaryService.saveMonthlySummary(monthKey, finalSummary);

      new Notice(`Created summary for ${monthKey}`);
    }
  }
}

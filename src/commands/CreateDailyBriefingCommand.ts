import { TFile } from "obsidian";
import { AIService, LoadingNotice } from "../types";
import { SummaryService } from "../services/SummaryService";
import { NoticeService } from "../services/NoticeService";
import { TickTickService } from "../services/TickTickService";
import { VoiceService } from "../services/VoiceService";
import { ConfigService } from "../services/ConfigService";

const DAILY_BRIEFING_PROMPT = (content: string, tasks: string) =>
  `Create a focused morning briefing based on my recent notes and tasks. 
   Prioritize what's truly important and time-sensitive for TODAY.
   
   IMPORTANT: Do not include a title or header - it will be added automatically.
   
   Start with a brief executive summary that captures today's essence and priorities.
   
   Then cover these key areas:
   - Critical tasks and deadlines for today
   - Important meetings or events
   - Quick status of active projects
   - Main focus areas
   - A key insight if relevant
   
   End with a brief motivational message.
   
   IMPORTANT RULES:
   - If notes are in Portuguese, write in Portuguese
   - Be selective - include only what matters for today
   - Use emojis to highlight importance
   - Keep it brief and clear
   - Format in markdown
   - Include specific times for time-sensitive items
   
   Notes Content:
   ${content}
   
   Task Context:
   ${tasks}`;

export class CreateDailyBriefingCommand {
  private tickTickService = new TickTickService();
  private voiceService = new VoiceService();
  private config = ConfigService.getInstance().getSettings();

  constructor(
    private aiService: AIService,
    private summaryService: SummaryService,
    private daysToAnalyze: number = 30
  ) {}

  async execute() {
    const loading = NoticeService.showLoading("Getting recent notes...");

    try {
      // Get notes and tasks in parallel
      const [files, tasks] = await Promise.all([
        this.getRecentDailyNotes(),
        this.tickTickService.getRelevantTasks(),
      ]);

      if (files.length === 0) {
        throw new Error("No daily notes found for analysis");
      }

      loading.setMessage("Analyzing your notes and tasks...");
      const notesContent = await this.summaryService.aggregateMonthContent(
        files
      );
      const tasksContent = this.tickTickService.formatTasksForBriefing(tasks);

      loading.setMessage("Creating your daily briefing...");
      const briefing = await this.aiService.generateResponse(
        DAILY_BRIEFING_PROMPT(notesContent, tasksContent)
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
    const dateStr = today.toISOString().split("T")[0];

    let audioContent = "";
    if (this.config.generateAudio) {
      try {
        // Generate audio version
        const audioBuffer = await this.voiceService.createAudio(content);

        // Add audio player to content if generation was successful
        audioContent = `
![[Daily Briefing ${dateStr}.mp3]]

> 🎧 Audio version available above
`;

        // Save audio file
        await this.summaryService.createFileInDailyNotesFolder(
          `Daily Briefing ${dateStr}.mp3`,
          audioBuffer
        );
      } catch (error) {
        console.error("Failed to generate audio:", error);
        audioContent = "\n> Failed to generate audio version\n";
      }
    }

    // Save markdown file with audio player (if generated)
    await this.summaryService.createFileInDailyNotesFolder(
      `Daily Briefing ${dateStr}.md`,
      `# ☀️ Morning Briefing - ${today.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}
${audioContent}
${content}`
    );
  }
}

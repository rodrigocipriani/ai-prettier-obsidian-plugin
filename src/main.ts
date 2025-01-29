import { Plugin, MarkdownView, Notice } from "obsidian";
import { AIServiceFactory } from "./services/AIServiceFactory";
import { SummaryService } from "./services/SummaryService";
import { OrganizeTextCommand } from "./commands/OrganizeTextCommand";
import { CreateMonthlySummaryCommand } from "./commands/CreateMonthlySummaryCommand";
import { SettingsTab } from "./services/SettingsTab";
import { PluginSettings, DEFAULT_SETTINGS, AIService } from "./types";
import { ConfigService } from "./services/ConfigService";
import { CreateDailyBriefingCommand } from "./commands/CreateDailyBriefingCommand";
import { TickTickAuthService } from "./services/TickTickAuthService";

export default class MyPlugin extends Plugin {
  settings: PluginSettings;
  private aiService: AIService;
  private summaryService: SummaryService;

  async onload() {
    await this.loadSettings();

    // Initialize ConfigService with settings
    ConfigService.initialize(this.settings);

    this.addSettingTab(new SettingsTab(this.app, this));

    this.aiService = AIServiceFactory.getService();
    this.summaryService = new SummaryService(this.app.vault);

    console.log("Loading the plugin");

    const provider = ConfigService.getInstance().getActiveProvider();

    this.addCommand({
      id: "organize-text-with-ai",
      name: `Organize Text with AI (${provider.toUpperCase()})`,
      callback: async () => {
        try {
          const command = new OrganizeTextCommand(this.aiService, () =>
            this.app.workspace.getActiveViewOfType(MarkdownView)
          );
          await command.execute();
        } catch (error) {
          new Notice(`Error: ${error.message}`);
          console.error(error);
        }
      },
    });

    this.addCommand({
      id: "create-monthly-summary",
      name: `Create Monthly Summary (${provider.toUpperCase()})`,
      callback: async () => {
        try {
          const command = new CreateMonthlySummaryCommand(
            this.aiService,
            this.summaryService
          );
          await command.execute();
          new Notice("Monthly summaries created successfully");
        } catch (error) {
          new Notice(`Error: ${error.message}`);
          console.error(error);
        }
      },
    });

    this.addCommand({
      id: "create-daily-briefing",
      name: `Create Daily Briefing (${provider.toUpperCase()})`,
      callback: async () => {
        try {
          const command = new CreateDailyBriefingCommand(
            this.aiService,
            this.summaryService,
            30 // days to analyze, could be made configurable in settings
          );
          await command.execute();
          new Notice("Daily briefing created successfully");
        } catch (error) {
          new Notice(`Error: ${error.message}`);
          console.error(error);
        }
      },
    });

    // Register the URI handler for TickTick OAuth callback
    this.registerObsidianProtocolHandler(
      "ticktick-callback",
      async (params) => {
        if (params.code) {
          const authService = new TickTickAuthService();
          await authService.handleCallback(params.code);
          await this.saveSettings();
          new Notice("TickTick authentication completed");
        }
      }
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Re-initialize ConfigService with new settings
    ConfigService.initialize(this.settings);
    this.aiService = AIServiceFactory.getService();
  }

  onunload() {
    console.log("Unloading plugin");
  }
}

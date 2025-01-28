import { Plugin, MarkdownView, Notice } from "obsidian";
import { OllamaService } from "./services/OllamaService";
import { SummaryService } from "./services/SummaryService";
import { OrganizeTextCommand } from "./commands/OrganizeTextCommand";
import { CreateMonthlySummaryCommand } from "./commands/CreateMonthlySummaryCommand";

export default class MyPlugin extends Plugin {
  private ollamaService: OllamaService;
  private summaryService: SummaryService;

  async onload() {
    console.log("Loading the plugin");

    this.ollamaService = new OllamaService();
    this.summaryService = new SummaryService(this.app.vault);

    this.addCommand({
      id: "organize-text-with-ai",
      name: "Organize Text with AI",
      callback: async () => {
        try {
          const command = new OrganizeTextCommand(this.ollamaService, () =>
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
      name: "Create Monthly Summary from Daily Notes",
      callback: async () => {
        try {
          const command = new CreateMonthlySummaryCommand(
            this.ollamaService,
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
  }

  onunload() {
    console.log("Unloading plugin");
  }
}

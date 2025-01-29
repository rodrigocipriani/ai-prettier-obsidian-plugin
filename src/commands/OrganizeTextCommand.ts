import { MarkdownView } from "obsidian";
import { AIService } from "../types";
import { NoticeService } from "../services/NoticeService";

const ORGANIZE_TEXT = (content: string) => `Organize this text:\n${content}`;

export class OrganizeTextCommand {
  constructor(
    private aiService: AIService,
    private getActiveView: () => MarkdownView | null
  ) {}

  async execute() {
    const loading = NoticeService.showLoading("Connecting to Ollama...");

    try {
      if (!(await this.aiService.checkConnection())) {
        throw new Error(
          "Cannot connect to Ollama. Please make sure Ollama is installed and running."
        );
      }

      const activeView = this.getActiveView();
      if (!activeView) {
        throw new Error("No active markdown view");
      }

      const content = activeView.editor.getValue();
      loading.setMessage("Organizing text with AI...");

      const organizedContent = await this.aiService.generateResponse(
        ORGANIZE_TEXT(content)
      );
      activeView.editor.setValue(organizedContent);

      loading.hide();
    } catch (error) {
      loading.hide();
      throw error;
    }
  }
}

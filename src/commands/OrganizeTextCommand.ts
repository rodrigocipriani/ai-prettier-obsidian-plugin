import { MarkdownView } from "obsidian";
import { OllamaService } from "../services/OllamaService";
import { NoticeService } from "../services/NoticeService";

const ORGANIZE_TEXT = (content: string) => `Organize this text:\n${content}`;

export class OrganizeTextCommand {
  constructor(
    private ollamaService: OllamaService,
    private getActiveView: () => MarkdownView | null
  ) {}

  async execute() {
    const loading = NoticeService.showLoading("Connecting to Ollama...");

    try {
      if (!(await this.ollamaService.checkConnection())) {
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

      const organizedContent = await this.ollamaService.generateResponse(
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

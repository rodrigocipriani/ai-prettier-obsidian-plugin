import { requestUrl } from "obsidian";
import { ConfigService } from "./ConfigService";

export class VoiceService {
  private config = ConfigService.getInstance().getSettings();

  formatForVoice(briefing: string): string {
    return briefing
      .replace(/[#*`]/g, "") // Remove markdown symbols
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Convert links to text
      .replace(/\n+/g, ". ") // Convert line breaks to periods for better speech flow
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Remove emojis
      .trim();
  }

  async createAudio(text: string): Promise<ArrayBuffer> {
    const response = await requestUrl({
      url: "https://api.openai.com/v1/audio/speech",
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: this.formatForVoice(text),
        voice: this.config.voiceModel,
      }),
    });

    return response.arrayBuffer;
  }
}

import { AIService } from "../types";
import { ConfigService } from "./ConfigService";

export class OpenAIService implements AIService {
  private config = ConfigService.getInstance().getOpenAIConfig();

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.API_HOST}/v1/models`, {
        headers: {
          Authorization: `Bearer ${this.config.API_KEY}`,
          "Content-Type": "application/json",
        },
        mode: "cors",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    const response = await fetch(
      `${this.config.API_HOST}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.API_KEY}`,
        },
        mode: "cors",
        body: JSON.stringify({
          model: this.config.MODEL,
          messages: [{ role: "user", content: prompt }],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `OpenAI API request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

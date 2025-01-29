import { AIService } from "../types";
import { OllamaService } from "./OllamaService";
import { OpenAIService } from "./OpenAIService";
import { ConfigService } from "./ConfigService";

export class AIServiceFactory {
  static getService(): AIService {
    const provider = ConfigService.getInstance().getActiveProvider();
    console.log("provider", provider);
    switch (provider) {
      case "openai":
        return new OpenAIService();
      case "ollama":
        return new OllamaService();
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }
}

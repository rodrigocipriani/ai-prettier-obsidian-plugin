export interface OllamaResponse {
  response?: string;
}

export interface LoadingNotice {
  setMessage(message: string): void;
  hide(): void;
}

export interface AIService {
  checkConnection(): Promise<boolean>;
  generateResponse(prompt: string): Promise<string>;
}

export type AIProvider = "ollama" | "openai";

export interface PluginSettings {
  aiProvider: AIProvider;
  openAIKey: string;
  ollamaModel: string;
  ollamaHost: string;
  openAIModel: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  aiProvider: "ollama",
  openAIKey: "",
  ollamaModel: "llama3:latest",
  ollamaHost: "http://localhost:11434",
  openAIModel: "gpt-3.5-turbo",
};

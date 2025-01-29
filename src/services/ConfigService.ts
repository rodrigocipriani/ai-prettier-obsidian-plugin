import { AIProvider, PluginSettings } from "../types";

export class ConfigService {
  private static instance: ConfigService;
  private settings: PluginSettings;

  private constructor(settings: PluginSettings) {
    this.settings = settings;
  }

  static initialize(settings: PluginSettings) {
    ConfigService.instance = new ConfigService(settings);
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      throw new Error("ConfigService must be initialized with settings first");
    }
    return ConfigService.instance;
  }

  getSettings(): PluginSettings {
    return this.settings;
  }

  getOpenAIConfig() {
    return {
      API_KEY: this.settings.openAIKey,
      MODEL: this.settings.openAIModel,
      API_HOST: "https://api.openai.com",
    };
  }

  getOllamaConfig() {
    return {
      MODEL: this.settings.ollamaModel,
      API_HOST: this.settings.ollamaHost,
    };
  }

  getActiveProvider(): AIProvider {
    return this.settings.aiProvider;
  }
}

import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "../main";
import { PluginSettings } from "../types";

export class SettingsTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "AI Provider Settings" });

    new Setting(containerEl)
      .setName("AI Provider")
      .setDesc("Choose which AI service to use for text generation")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("ollama", "Ollama (Local AI)")
          .addOption("openai", "OpenAI (Cloud API)")
          .setValue(this.plugin.settings.aiProvider)
          .onChange(async (value) => {
            this.plugin.settings.aiProvider = value as "ollama" | "openai";
            await this.plugin.saveSettings();
          })
      );

    // OpenAI Settings Section
    containerEl.createEl("h3", { text: "OpenAI Settings" });
    containerEl.createEl("p", {
      text: "Settings for OpenAI integration. Required when using OpenAI as provider.",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("Your OpenAI API key (starts with 'sk-')")
      .addText((text) =>
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.openAIKey)
          .onChange(async (value) => {
            this.plugin.settings.openAIKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Model")
      .setDesc("The OpenAI model to use (e.g., gpt-3.5-turbo, gpt-4)")
      .addText((text) =>
        text
          .setPlaceholder("gpt-3.5-turbo")
          .setValue(this.plugin.settings.openAIModel)
          .onChange(async (value) => {
            this.plugin.settings.openAIModel = value;
            await this.plugin.saveSettings();
          })
      );

    // Ollama Settings Section
    containerEl.createEl("h3", { text: "Ollama Settings" });
    containerEl.createEl("p", {
      text: "Settings for Ollama integration. Required when using Ollama as provider.",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("Model")
      .setDesc("The Ollama model to use (e.g., llama3:latest)")
      .addText((text) =>
        text
          .setPlaceholder("llama3:latest")
          .setValue(this.plugin.settings.ollamaModel)
          .onChange(async (value) => {
            this.plugin.settings.ollamaModel = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Host")
      .setDesc("The Ollama API host (usually http://localhost:11434)")
      .addText((text) =>
        text
          .setPlaceholder("http://localhost:11434")
          .setValue(this.plugin.settings.ollamaHost)
          .onChange(async (value) => {
            this.plugin.settings.ollamaHost = value;
            await this.plugin.saveSettings();
          })
      );

    // Add help text at the bottom
    containerEl.createEl("p", {
      text: "Note: After changing the AI provider, you'll need to ensure the corresponding service is properly configured.",
      cls: "setting-item-description",
    });
  }
}

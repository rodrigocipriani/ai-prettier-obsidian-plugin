import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import MyPlugin from "../main";
import { PluginSettings } from "../types";
import { TickTickAuthService } from "./TickTickAuthService";

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

    // Daily Briefing Settings Section
    containerEl.createEl("h3", { text: "Daily Briefing Settings" });
    containerEl.createEl("p", {
      text: "Settings for the daily briefing generation",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("Days to Analyze")
      .setDesc("Number of past days to analyze for the daily briefing")
      .addText((text) =>
        text
          .setPlaceholder("30")
          .setValue(String(this.plugin.settings.briefingDaysToAnalyze))
          .onChange(async (value) => {
            const days = Number(value);
            if (!isNaN(days) && days > 0) {
              this.plugin.settings.briefingDaysToAnalyze = days;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Generate Audio")
      .setDesc("Generate audio version of daily briefings")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.generateAudio)
          .onChange(async (value) => {
            this.plugin.settings.generateAudio = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Voice Model")
      .setDesc("Choose the voice for audio generation")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("alloy", "Alloy")
          .addOption("echo", "Echo")
          .addOption("fable", "Fable")
          .addOption("nova", "Nova")
          .addOption("onyx", "Onyx")
          .addOption("shimmer", "Shimmer")
          .setValue(this.plugin.settings.voiceModel)
          .onChange(async (value) => {
            this.plugin.settings.voiceModel = value as any;
            await this.plugin.saveSettings();
          })
      );

    // Folder Settings Section
    containerEl.createEl("h3", { text: "Folder Settings" });
    containerEl.createEl("p", {
      text: "Configure where to find your notes and save generated content",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("Daily Notes Folder")
      .setDesc("The folder containing your daily notes")
      .addText((text) =>
        text
          .setPlaceholder("Daily Notes")
          .setValue(this.plugin.settings.dailyNotesFolder)
          .onChange(async (value) => {
            this.plugin.settings.dailyNotesFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Output Folder")
      .setDesc("Where to save generated briefings and summaries")
      .addText((text) =>
        text
          .setPlaceholder("AI Generated")
          .setValue(this.plugin.settings.outputFolder)
          .onChange(async (value) => {
            this.plugin.settings.outputFolder = value;
            await this.plugin.saveSettings();
          })
      );

    // TickTick Integration Section
    containerEl.createEl("h3", { text: "TickTick Integration" });
    containerEl.createEl("p", {
      text: "Connect with TickTick to include tasks in your daily briefing",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("Enable TickTick")
      .setDesc("Enable TickTick integration")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.ticktickEnabled)
          .onChange(async (value) => {
            this.plugin.settings.ticktickEnabled = value;
            await this.plugin.saveSettings();
            // Force refresh the display to show/hide the fields
            this.display();
          })
      );

    if (this.plugin.settings.ticktickEnabled) {
      new Setting(containerEl)
        .setName("Client ID")
        .setDesc("Your TickTick API Client ID")
        .addText((text) =>
          text
            .setPlaceholder("Enter your Client ID")
            .setValue(this.plugin.settings.ticktickClientId)
            .onChange(async (value) => {
              this.plugin.settings.ticktickClientId = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Client Secret")
        .setDesc("Your TickTick API Client Secret")
        .addText((text) =>
          text
            .setPlaceholder("Enter your Client Secret")
            .setValue(this.plugin.settings.ticktickClientSecret)
            .onChange(async (value) => {
              this.plugin.settings.ticktickClientSecret = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Connect")
        .setDesc("Connect to your TickTick account")
        .addButton((button) =>
          button
            .setButtonText(
              this.plugin.settings.ticktickAccessToken
                ? "Reconnect"
                : "Connect to TickTick"
            )
            .onClick(async () => {
              if (
                !this.plugin.settings.ticktickClientId ||
                !this.plugin.settings.ticktickClientSecret
              ) {
                new Notice(
                  "Please enter both Client ID and Client Secret first"
                );
                return;
              }
              const authService = new TickTickAuthService();
              const authUrl = authService.getAuthUrl();
              if (authUrl) {
                window.open(authUrl);
              }
            })
        );
    }

    // Add help text at the bottom
    containerEl.createEl("p", {
      text: "Note: After changing the AI provider, you'll need to ensure the corresponding service is properly configured.",
      cls: "setting-item-description",
    });
  }
}

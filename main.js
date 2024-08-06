var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MyPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
console.log("Hello from the plugin!");
var MyPlugin = class extends import_obsidian.Plugin {
  async onload() {
    console.log("Loading the plugin");
    this.addCommand({
      id: "organize-text",
      name: "Organize Text with AI",
      callback: async () => {
        var _a;
        console.log("Organizing text with AI");
        const activeView = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
        if (activeView) {
          const content = activeView.editor.getValue();
          try {
            const response = await fetch(
              "http://localhost:11434/api/generate",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: "gemma2:latest",
                  prompt: `Organize this text:
${content}`
                })
              }
            );
            if (!response.ok) {
              throw new Error(
                `Ollama API request failed with status ${response.status}`
              );
            }
            const reader = (_a = response.body) == null ? void 0 : _a.getReader();
            if (!reader) {
              throw new Error("Unable to read response body.");
            }
            let incompleteChunk = "";
            let organizedContent = "";
            const decoder = new TextDecoder();
            while (true) {
              const { value, done } = await reader.read();
              if (done)
                break;
              const chunkString = decoder.decode(value);
              const potentialJsonStrings = chunkString.split("\n");
              for (const potentialJson of potentialJsonStrings) {
                if (potentialJson) {
                  try {
                    const parsedChunk = JSON.parse(
                      incompleteChunk + potentialJson
                    );
                    if (parsedChunk.response) {
                      organizedContent += parsedChunk.response;
                    }
                    incompleteChunk = "";
                  } catch (error) {
                    incompleteChunk += potentialJson;
                  }
                }
              }
            }
            console.log("Organized content:", organizedContent);
            activeView.editor.setValue(organizedContent);
          } catch (error) {
            console.error("Error communicating with Ollama API:", error);
            new import_obsidian.Notice(
              "Error organizing text. Please check the console for details."
            );
          }
        } else {
          new import_obsidian.Notice("No active Markdown file found.");
        }
      }
    });
  }
};

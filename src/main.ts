import { Plugin, MarkdownView, Notice } from "obsidian";

console.log("Hello from the plugin!");

export default class MyPlugin extends Plugin {
  async onload() {
    console.log("Loading the plugin");
    this.addCommand({
      id: "organize-text",
      name: "Organize Text with AI",
      callback: async () => {
        console.log("Organizing text with AI");

        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (activeView) {
          const content = activeView.editor.getValue();

          try {
            const response = await fetch(
              "http://localhost:11434/api/generate",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "gemma2:latest",
                  prompt: `Organize this text:\n${content}`,
                }),
              }
            );

            if (!response.ok) {
              throw new Error(
                `Ollama API request failed with status ${response.status}`
              );
            }

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error("Unable to read response body.");
            }

            let incompleteChunk = "";
            let organizedContent = "";
            const decoder = new TextDecoder();

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

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
            new Notice(
              "Error organizing text. Please check the console for details."
            );
          }
        } else {
          new Notice("No active Markdown file found.");
        }
      },
    });
  }
}

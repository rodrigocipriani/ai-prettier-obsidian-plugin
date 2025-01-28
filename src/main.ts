import { Plugin, MarkdownView, Notice, TFile } from "obsidian";

console.log("Hello from the plugin!");

const MODEL = "llama3:latest";
// const MODEL = "deepseek-r1:latest";
const API_HOST = "http://localhost:11434";

export default class MyPlugin extends Plugin {
  async onload() {
    console.log("Loading the plugin");
    this.addCommand({
      id: "organize-text-with-ai",
      name: "Organize Text with AI",
      callback: async () => {
        console.log("Organizing text with AI");

        // Check if Ollama is running first
        try {
          const healthCheck = await fetch(`${API_HOST}/api/version`);
          if (!healthCheck.ok) {
            new Notice(
              "Ollama server is not running. Please start Ollama first."
            );
            console.error(
              "Ollama server is not running. Please start Ollama first."
            );
            return;
          }
        } catch (error) {
          new Notice(
            "Cannot connect to Ollama. Please make sure Ollama is installed and running."
          );
          console.error("Cannot connect to Ollama:", error);
          return;
        }

        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (activeView) {
          const content = activeView.editor.getValue();

          try {
            const response = await fetch(`${API_HOST}/api/generate`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: MODEL,
                prompt: `Organize this text:\n${content}`,
              }),
            });

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
            new Notice(
              `Error: Please check the console for details. ${error.message}`
            );
            console.error("Error communicating with Ollama API:", error);
          }
        } else {
          new Notice("No active markdown view");
        }
      },
    });

    this.addCommand({
      id: "create-monthly-summary",
      name: "Create Monthly Summary from Daily Notes",
      callback: async () => {
        try {
          // Get all files from Daily Notes folder
          const dailyNotesFolder = "Daily Notes"; // You might want to make this configurable
          const files = this.app.vault
            .getFiles()
            .filter(
              (file) =>
                file.path.startsWith(dailyNotesFolder) &&
                file.extension === "md"
            );

          if (files.length === 0) {
            new Notice("No daily notes found in the Daily Notes folder");
            return;
          }

          // Group files by month
          const filesByMonth: { [key: string]: TFile[] } = {};
          for (const file of files) {
            const match = file.name.match(/(\d{4}-\d{2})/); // Assumes format YYYY-MM-DD
            if (match) {
              const monthKey = match[1];
              if (!filesByMonth[monthKey]) {
                filesByMonth[monthKey] = [];
              }
              filesByMonth[monthKey].push(file);
            }
          }

          // Process each month
          for (const [monthKey, monthFiles] of Object.entries(filesByMonth)) {
            let allContent = "";

            // Read content from all files in the month
            for (const file of monthFiles) {
              const content = await this.app.vault.read(file);
              allContent += `## ${file.name}\n${content}\n\n`;
            }

            // Generate summary using AI
            try {
              const response = await fetch(`${API_HOST}/api/generate`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: MODEL,
                  prompt: `
                    Create a comprehensive monthly summary of these daily notes. 
                    Keep the summary concise and to the point.
                    Keep the summary in the same language as the daily notes.
                    You can use emojis to make the summary more engaging.
                    You an capture things like, next steps, important patterns, tasks to be done, etc.
                    IMPORTANT: Do not include your thoughts in the summary.
                    Focus on key events, achievements, and important patterns. Format the output in markdown:\n${allContent}
                  `,
                }),
              });

              if (!response.ok) {
                throw new Error(
                  `Ollama API request failed with status ${response.status}`
                );
              }

              let summary = "";
              const reader = response.body?.getReader();
              if (!reader) {
                throw new Error("Unable to read response body.");
              }

              let incompleteChunk = "";
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
                        summary += parsedChunk.response;
                      }
                      incompleteChunk = "";
                    } catch (error) {
                      incompleteChunk += potentialJson;
                    }
                  }
                }
              }

              // Create or update monthly summary file
              const summaryFileName = `Monthly Summary/${monthKey}-Summary.md`;
              const summaryContent = `# Monthly Summary for ${monthKey}\n\n${summary}\n\n\n \`\`\`\n${allContent}\n\`\`\`
              `;

              // Create Monthly Summary folder if it doesn't exist
              const folderPath = "Monthly Summary";
              if (!(await this.app.vault.adapter.exists(folderPath))) {
                await this.app.vault.createFolder(folderPath);
              }

              // Create or update the summary file
              const existingFile =
                this.app.vault.getAbstractFileByPath(summaryFileName);
              if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, summaryContent);
              } else {
                await this.app.vault.create(summaryFileName, summaryContent);
              }

              new Notice(`Created monthly summary for ${monthKey}`);
            } catch (error) {
              new Notice(
                `Error generating summary for ${monthKey}: ${error.message}`
              );
              console.error("Error generating monthly summary:", error);
            }
          }
        } catch (error) {
          new Notice("Error processing daily notes: " + error.message);
          console.error("Error processing daily notes:", error);
        }
      },
    });
  }

  onunload() {
    // ... existing code ...
  }
}

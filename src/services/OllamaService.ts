import { MODEL, API_HOST } from "../constants/config";
import { OllamaResponse } from "../types";

export class OllamaService {
  async checkConnection(): Promise<boolean> {
    const healthCheck = await fetch(`${API_HOST}/api/version`);
    return healthCheck.ok;
  }

  async generateResponse(prompt: string): Promise<string> {
    const response = await fetch(`${API_HOST}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API request failed with status ${response.status}`
      );
    }

    return this.streamResponse(response);
  }

  private async streamResponse(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Unable to read response body.");
    }

    let result = "";
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
            const parsedChunk: OllamaResponse = JSON.parse(
              incompleteChunk + potentialJson
            );
            if (parsedChunk.response) {
              result += parsedChunk.response;
            }
            incompleteChunk = "";
          } catch (error) {
            incompleteChunk += potentialJson;
          }
        }
      }
    }

    return result;
  }
}

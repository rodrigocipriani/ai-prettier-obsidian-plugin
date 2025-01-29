import { AIProvider } from "src/types";

export const OLLAMA = {
  MODEL: "llama3:latest",
  API_HOST: "http://localhost:11434",
};

export const OPENAI = {
  API_KEY: process.env.OPENAI_API_KEY || "",
  MODEL: "gpt-3.5-turbo",
  API_HOST: "https://api.openai.com/v1",
};

export const ACTIVE_AI_PROVIDER: AIProvider = "openai";

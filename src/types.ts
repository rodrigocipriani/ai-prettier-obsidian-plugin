export interface OllamaResponse {
  response?: string;
}

export interface LoadingNotice {
  setMessage(message: string): void;
  hide(): void;
}

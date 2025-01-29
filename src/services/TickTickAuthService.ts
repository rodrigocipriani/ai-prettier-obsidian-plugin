import { Notice, requestUrl } from "obsidian";
import { ConfigService } from "./ConfigService";

export class TickTickAuthService {
  private static readonly AUTH_URL = "https://ticktick.com/oauth/authorize";
  private static readonly TOKEN_URL = "https://ticktick.com/oauth/token";
  private static readonly REDIRECT_URI =
    "https://rodrigocipriani.github.io/ai-prettier-obsidian-plugin/ticktick-callback.html";

  constructor(private config = ConfigService.getInstance().getSettings()) {}

  getAuthUrl(): string {
    if (!this.config.ticktickClientId) {
      new Notice("Please enter your TickTick Client ID first");
      return "";
    }

    const params = new URLSearchParams({
      client_id: this.config.ticktickClientId.trim(),
      redirect_uri: TickTickAuthService.REDIRECT_URI,
      response_type: "code",
      scope: "tasks:read",
      state: this.generateState(),
    });

    return `${TickTickAuthService.AUTH_URL}?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<void> {
    try {
      // Create Basic Auth header
      const basicAuth = btoa(
        `${this.config.ticktickClientId.trim()}:${this.config.ticktickClientSecret.trim()}`
      );

      const response = await requestUrl({
        url: TickTickAuthService.TOKEN_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code.trim(),
          redirect_uri: TickTickAuthService.REDIRECT_URI,
        }).toString(),
      });

      if (response.status !== 200) {
        console.error("TickTick response:", response);
        throw new Error(`Failed to get access token: ${response.text}`);
      }

      const data = response.json;
      this.config.ticktickAccessToken = data.access_token;
      this.config.ticktickRefreshToken = data.refresh_token;

      new Notice("Successfully connected to TickTick!");
    } catch (error) {
      console.error("TickTick auth error:", error);
      new Notice(`Failed to connect to TickTick: ${error.message}`);
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(7);
  }
}

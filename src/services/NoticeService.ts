import { Notice } from "obsidian";
import { LoadingNotice } from "../types";
import { ConfigService } from "./ConfigService";

export class NoticeService {
  static showLoading(message: string): LoadingNotice {
    const provider = ConfigService.getInstance().getActiveProvider();
    const notice = new Notice(`[${provider.toUpperCase()}] ${message}`, 0);
    return {
      setMessage: (newMessage: string) => {
        notice.setMessage(`[${provider.toUpperCase()}] ${newMessage}`);
      },
      hide: () => {
        notice.hide();
      },
    };
  }
}

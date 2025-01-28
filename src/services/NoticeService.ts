import { Notice } from "obsidian";
import { LoadingNotice } from "../types";

export class NoticeService {
  static showLoading(message: string): LoadingNotice {
    const notice = new Notice(message, 0); // 0 duration means it won't auto-hide
    return {
      setMessage: (newMessage: string) => {
        notice.setMessage(newMessage);
      },
      hide: () => {
        notice.hide();
      },
    };
  }
}

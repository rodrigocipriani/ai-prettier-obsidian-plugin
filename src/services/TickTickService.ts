import { Notice } from "obsidian";
import { ConfigService } from "./ConfigService";

interface TickTickTask {
  id: string;
  title: string;
  content: string;
  dueDate: string | null;
  priority: number;
  status: number;
  tags: string[];
  projectId: string;
  isAllDay: boolean;
  items?: { title: string; status: number }[]; // For checklist items
}

interface TickTickProject {
  id: string;
  name: string;
  color: string;
  closed: boolean;
  viewMode: string;
  kind: string;
}

export class TickTickService {
  private baseUrl = "https://api.ticktick.com/open/v1";
  private config = ConfigService.getInstance().getSettings();

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 3
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);

        if (response.status === 401 && i < retries - 1) {
          await this.refreshToken();
          // Update the authorization header with new token
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${this.config.ticktickAccessToken}`,
          };
          continue;
        }

        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error("Max retries reached");
  }

  private async getProjects(): Promise<TickTickProject[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/project`, {
      headers: {
        Authorization: `Bearer ${this.config.ticktickAccessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch projects (${response.status}): ${errorText}`
      );
    }

    return await response.json();
  }

  private async getTasks(): Promise<TickTickTask[]> {
    try {
      // First get all projects
      const projects = await this.getProjects();
      const tasks: TickTickTask[] = [];

      // Then get tasks for each project
      for (const project of projects) {
        const response = await this.fetchWithRetry(
          `${this.baseUrl}/project/${project.id}/data`,
          {
            headers: {
              Authorization: `Bearer ${this.config.ticktickAccessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.warn(
            `Failed to fetch tasks for project ${project.id}: ${response.statusText}`
          );
          continue;
        }

        const data = await response.json();
        if (data.tasks) {
          tasks.push(...data.tasks);
        }
      }

      return tasks;
    } catch (error) {
      console.error("Failed to fetch TickTick tasks:", error);
      new Notice(`Failed to fetch TickTick tasks: ${error.message}`);
      throw error;
    }
  }

  async getRelevantTasks(): Promise<{
    dueSoon: TickTickTask[];
    overdue: TickTickTask[];
    inProgress: TickTickTask[];
    completed: TickTickTask[];
  }> {
    if (!this.config.ticktickEnabled || !this.config.ticktickAccessToken) {
      return { dueSoon: [], overdue: [], inProgress: [], completed: [] };
    }

    try {
      const tasks = await this.getTasks();
      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      return {
        dueSoon: tasks.filter(
          (task) =>
            task.status !== 2 && // Not completed
            task.dueDate &&
            new Date(task.dueDate) <= threeDaysFromNow &&
            new Date(task.dueDate) >= now
        ),
        overdue: tasks.filter(
          (task) =>
            task.status !== 2 && task.dueDate && new Date(task.dueDate) < now
        ),
        inProgress: tasks.filter((task) => task.status !== 2 && !task.dueDate),
        completed: tasks.filter(
          (task) =>
            task.status === 2 &&
            task.dueDate &&
            new Date(task.dueDate) >= new Date(now.setDate(now.getDate() - 1))
        ),
      };
    } catch (error) {
      console.error("Failed to fetch TickTick tasks:", error);
      return { dueSoon: [], overdue: [], inProgress: [], completed: [] };
    }
  }

  formatTasksForBriefing(tasks: {
    dueSoon: TickTickTask[];
    overdue: TickTickTask[];
    inProgress: TickTickTask[];
    completed: TickTickTask[];
  }): string {
    let content = "";

    if (tasks.overdue.length > 0) {
      content += "\n\n### ⚠️ Overdue Tasks\n";
      tasks.overdue
        .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
        .forEach((task) => {
          content += `- [ ] 🔴 ${task.title} (due: ${new Date(
            task.dueDate!
          ).toLocaleDateString()})\n`;
          if (task.content) content += `  - ${task.content}\n`;
        });
    }

    if (tasks.dueSoon.length > 0) {
      content += "\n\n### 📅 Due Soon\n";
      tasks.dueSoon
        .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
        .forEach((task) => {
          content += `- [ ] ${this.getPriorityEmoji(task.priority)} ${
            task.title
          } (due: ${new Date(task.dueDate!).toLocaleDateString()})\n`;
          if (task.content) content += `  - ${task.content}\n`;
        });
    }

    if (tasks.inProgress.length > 0) {
      content += "\n\n### 🎯 In Progress\n";
      tasks.inProgress
        .sort((a, b) => b.priority - a.priority)
        .forEach((task) => {
          content += `- [ ] ${this.getPriorityEmoji(task.priority)} ${
            task.title
          }\n`;
          if (task.content) content += `  - ${task.content}\n`;
        });
    }

    if (tasks.completed.length > 0) {
      content += "\n\n### ✅ Recently Completed\n";
      tasks.completed.forEach((task) => {
        content += `- [x] ${task.title}\n`;
      });
    }

    return content;
  }

  private getPriorityEmoji(priority: number): string {
    switch (priority) {
      case 5:
        return "🔥"; // Highest
      case 4:
        return "⚡"; // High
      case 3:
        return "⭐"; // Medium
      case 2:
        return "🔹"; // Low
      default:
        return "⚪"; // None
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.config.ticktickRefreshToken,
          client_id: this.config.ticktickClientId,
          client_secret: this.config.ticktickClientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh token: ${errorText}`);
      }

      const data = await response.json();
      this.config.ticktickAccessToken = data.access_token;
      this.config.ticktickRefreshToken = data.refresh_token;

      // Save the new tokens
      await this.saveSettings();
    } catch (error) {
      console.error("Failed to refresh TickTick token:", error);
      new Notice("Failed to refresh TickTick token. Please reconnect.");
      throw error;
    }
  }

  private async saveSettings(): Promise<void> {
    // Get the plugin instance to save settings
    const plugin = (window as any).app.plugins.plugins["notes-copilot"];
    if (plugin) {
      await plugin.saveSettings();
    }
  }
}

import axios, { AxiosInstance } from "axios";
import fs from "fs";
import path from "path";

const JIRA_CONFIG_PATH = path.join(process.cwd(), "jira-config.json");

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

interface JiraIssue {
  key?: string;
  fields: {
    project: { key: string };
    summary: string;
    description?: any;
    issuetype: { name: string };
    priority?: { name: string };
    assignee?: { accountId: string };
    labels?: string[];
  };
}

class JiraService {
  private client: AxiosInstance | null = null;
  private config: JiraConfig | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      if (!fs.existsSync(JIRA_CONFIG_PATH)) {
        console.log("[Jira] Config file not found. Jira integration disabled.");
        return;
      }

      this.config = JSON.parse(fs.readFileSync(JIRA_CONFIG_PATH, "utf-8"));
      
      if (!this.config?.baseUrl || !this.config?.email || !this.config?.apiToken) {
        console.log("[Jira] Invalid config. Jira integration disabled.");
        return;
      }

      this.client = axios.create({
        baseURL: `${this.config.baseUrl}/rest/api/3`,
        auth: {
          username: this.config.email,
          password: this.config.apiToken,
        },
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      console.log("[Jira] Initialized successfully");
    } catch (error) {
      console.error("[Jira] Initialization error:", error);
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  getConfig(): JiraConfig | null {
    return this.config;
  }

  async saveConfig(config: JiraConfig): Promise<boolean> {
    try {
      // Test the connection first
      const testClient = axios.create({
        baseURL: `${config.baseUrl}/rest/api/3`,
        auth: {
          username: config.email,
          password: config.apiToken,
        },
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      await testClient.get("/myself");

      // Save config
      fs.writeFileSync(JIRA_CONFIG_PATH, JSON.stringify(config, null, 2));
      
      // Reinitialize
      this.config = config;
      this.client = testClient;
      
      console.log("[Jira] Configuration saved successfully");
      return true;
    } catch (error: any) {
      console.error("[Jira] Config save error:", error.response?.data || error.message);
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!this.client) {
      return { success: false, error: "Jira not configured" };
    }

    try {
      const response = await this.client.get("/myself");
      return { success: true, user: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.errorMessages?.[0] || error.message 
      };
    }
  }

  async getProjects(): Promise<any[]> {
    if (!this.client) {
      throw new Error("Jira not configured");
    }

    try {
      const response = await this.client.get("/project/search");
      return response.data.values || [];
    } catch (error: any) {
      console.error("[Jira] Get projects error:", error.response?.data || error.message);
      throw new Error(`Failed to get Jira projects: ${error.message}`);
    }
  }

  async getIssueTypes(projectKey: string): Promise<any[]> {
    if (!this.client) {
      throw new Error("Jira not configured");
    }

    try {
      const response = await this.client.get(`/project/${projectKey}`);
      return response.data.issueTypes || [];
    } catch (error: any) {
      console.error("[Jira] Get issue types error:", error.response?.data || error.message);
      throw new Error(`Failed to get issue types: ${error.message}`);
    }
  }

  async createIssue(issue: JiraIssue): Promise<any> {
    if (!this.client) {
      throw new Error("Jira not configured");
    }

    try {
      const response = await this.client.post("/issue", issue);
      console.log("[Jira] Issue created:", response.data.key);
      return response.data;
    } catch (error: any) {
      console.error("[Jira] Create issue error:", error.response?.data || error.message);
      throw new Error(`Failed to create Jira issue: ${error.response?.data?.errorMessages?.[0] || error.message}`);
    }
  }

  async updateIssue(issueKey: string, fields: any): Promise<any> {
    if (!this.client) {
      throw new Error("Jira not configured");
    }

    try {
      await this.client.put(`/issue/${issueKey}`, { fields });
      console.log("[Jira] Issue updated:", issueKey);
      return { success: true };
    } catch (error: any) {
      console.error("[Jira] Update issue error:", error.response?.data || error.message);
      throw new Error(`Failed to update Jira issue: ${error.message}`);
    }
  }

  async getIssue(issueKey: string): Promise<any> {
    if (!this.client) {
      throw new Error("Jira not configured");
    }

    try {
      const response = await this.client.get(`/issue/${issueKey}`);
      return response.data;
    } catch (error: any) {
      console.error("[Jira] Get issue error:", error.response?.data || error.message);
      throw new Error(`Failed to get Jira issue: ${error.message}`);
    }
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<any> {
    if (!this.client) {
      throw new Error("Jira not configured");
    }

    try {
      await this.client.post(`/issue/${issueKey}/transitions`, {
        transition: { id: transitionId },
      });
      console.log("[Jira] Issue transitioned:", issueKey);
      return { success: true };
    } catch (error: any) {
      console.error("[Jira] Transition issue error:", error.response?.data || error.message);
      throw new Error(`Failed to transition Jira issue: ${error.message}`);
    }
  }

  async searchIssues(jql: string, maxResults: number = 50): Promise<any[]> {
    if (!this.client) {
      throw new Error("Jira not configured");
    }

    try {
      const response = await this.client.post("/search", {
        jql,
        maxResults,
        fields: ["summary", "status", "assignee", "priority", "created", "updated"],
      });
      return response.data.issues || [];
    } catch (error: any) {
      console.error("[Jira] Search issues error:", error.response?.data || error.message);
      throw new Error(`Failed to search Jira issues: ${error.message}`);
    }
  }

  // Convert ActionLayer action item to Jira issue format
  convertToJiraIssue(actionItem: any, projectKey: string): JiraIssue {
    const issue: JiraIssue = {
      fields: {
        project: { key: projectKey },
        summary: actionItem.title || actionItem.action,
        issuetype: { name: "Task" }, // Default to Task
      },
    };

    if (actionItem.description) {
      // Convert to Jira ADF (Atlassian Document Format)
      issue.fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: actionItem.description,
              },
            ],
          },
        ],
      };
    }

    // Map priority
    if (actionItem.priority) {
      const priorityMap: Record<string, string> = {
        high: "High",
        medium: "Medium",
        low: "Low",
      };
      issue.fields.priority = { name: priorityMap[actionItem.priority] || "Medium" };
    }

    return issue;
  }
}

export const jiraService = new JiraService();

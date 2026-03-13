import axios, { AxiosInstance } from "axios";

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
  // Create a Jira client for a specific user's config
  private createClient(config: JiraConfig): AxiosInstance {
    return axios.create({
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
  }

  async testConnection(config: JiraConfig): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const client = this.createClient(config);
      const response = await client.get("/myself");
      return { success: true, user: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.errorMessages?.[0] || error.message 
      };
    }
  }

  async getProjects(config: JiraConfig): Promise<any[]> {
    try {
      const client = this.createClient(config);
      const response = await client.get("/project/search");
      return response.data.values || [];
    } catch (error: any) {
      console.error("[Jira] Get projects error:", error.response?.data || error.message);
      throw new Error(`Failed to get Jira projects: ${error.message}`);
    }
  }

  async getIssueTypes(config: JiraConfig, projectKey: string): Promise<any[]> {
    try {
      const client = this.createClient(config);
      const response = await client.get(`/project/${projectKey}`);
      return response.data.issueTypes || [];
    } catch (error: any) {
      console.error("[Jira] Get issue types error:", error.response?.data || error.message);
      throw new Error(`Failed to get issue types: ${error.message}`);
    }
  }

  async createIssue(config: JiraConfig, issue: JiraIssue): Promise<any> {
    try {
      const client = this.createClient(config);
      const response = await client.post("/issue", issue);
      console.log("[Jira] Issue created:", response.data.key);
      return response.data;
    } catch (error: any) {
      console.error("[Jira] Create issue error:", error.response?.data || error.message);
      throw new Error(`Failed to create Jira issue: ${error.response?.data?.errorMessages?.[0] || error.message}`);
    }
  }

  async updateIssue(config: JiraConfig, issueKey: string, fields: any): Promise<any> {
    try {
      const client = this.createClient(config);
      await client.put(`/issue/${issueKey}`, { fields });
      console.log("[Jira] Issue updated:", issueKey);
      return { success: true };
    } catch (error: any) {
      console.error("[Jira] Update issue error:", error.response?.data || error.message);
      throw new Error(`Failed to update Jira issue: ${error.message}`);
    }
  }

  async getIssue(config: JiraConfig, issueKey: string): Promise<any> {
    try {
      const client = this.createClient(config);
      const response = await client.get(`/issue/${issueKey}`);
      return response.data;
    } catch (error: any) {
      console.error("[Jira] Get issue error:", error.response?.data || error.message);
      throw new Error(`Failed to get Jira issue: ${error.message}`);
    }
  }

  async transitionIssue(config: JiraConfig, issueKey: string, transitionId: string): Promise<any> {
    try {
      const client = this.createClient(config);
      await client.post(`/issue/${issueKey}/transitions`, {
        transition: { id: transitionId },
      });
      console.log("[Jira] Issue transitioned:", issueKey);
      return { success: true };
    } catch (error: any) {
      console.error("[Jira] Transition issue error:", error.response?.data || error.message);
      throw new Error(`Failed to transition Jira issue: ${error.message}`);
    }
  }

  async searchIssues(config: JiraConfig, jql: string, maxResults: number = 50): Promise<any[]> {
    try {
      const client = this.createClient(config);
      const response = await client.post("/search", {
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

import { Router } from "express";
import { jiraService } from "../services/jira";
import { storage } from "../storage";

export const jiraRouter = Router();

// Get Jira configuration status for current user
jiraRouter.get("/status", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.json({ configured: false });
    }

    const config = await storage.getUserJiraConfig(userId);
    res.json({
      configured: !!config,
      baseUrl: config?.baseUrl || null,
      email: config?.email || null,
    });
  } catch (error: any) {
    console.error("Error getting Jira status:", error);
    res.status(500).json({ error: error.message });
  }
});

// Save Jira configuration for current user
jiraRouter.post("/config", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { baseUrl, email, apiToken } = req.body;

    if (!baseUrl || !email || !apiToken) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Test the connection first
    const testResult = await jiraService.testConnection({ baseUrl, email, apiToken });
    if (!testResult.success) {
      return res.status(400).json({ error: testResult.error || "Failed to connect to Jira" });
    }

    // Save config to user
    await storage.updateUserJiraConfig(userId, { baseUrl, email, apiToken });

    res.json({ success: true, message: "Jira configured successfully", user: testResult.user });
  } catch (error: any) {
    console.error("Error configuring Jira:", error);
    res.status(500).json({ error: error.message || "Failed to configure Jira" });
  }
});

// Disconnect Jira for current user
jiraRouter.post("/disconnect", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await storage.updateUserJiraConfig(userId, null);
    res.json({ success: true, message: "Jira disconnected successfully" });
  } catch (error: any) {
    console.error("Error disconnecting Jira:", error);
    res.status(500).json({ error: error.message });
  }
});

// Test Jira connection for current user
jiraRouter.get("/test", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const config = await storage.getUserJiraConfig(userId);
    if (!config) {
      return res.status(400).json({ success: false, error: "Jira not configured" });
    }

    const result = await jiraService.testConnection(config);
    res.json(result);
  } catch (error: any) {
    console.error("Error testing Jira connection:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Jira projects for current user
jiraRouter.get("/projects", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const config = await storage.getUserJiraConfig(userId);
    if (!config) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    const projects = await jiraService.getProjects(config);
    res.json(projects);
  } catch (error: any) {
    console.error("Error fetching Jira projects:", error);
    res.status(500).json({ error: error.message || "Failed to fetch projects" });
  }
});

// Get issue types for a project
jiraRouter.get("/projects/:projectKey/issue-types", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const config = await storage.getUserJiraConfig(userId);
    if (!config) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    const issueTypes = await jiraService.getIssueTypes(config, req.params.projectKey);
    res.json(issueTypes);
  } catch (error: any) {
    console.error("Error fetching issue types:", error);
    res.status(500).json({ error: error.message || "Failed to fetch issue types" });
  }
});

// Create Jira issue
jiraRouter.post("/issues", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const config = await storage.getUserJiraConfig(userId);
    if (!config) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    const issue = await jiraService.createIssue(config, req.body);
    res.json(issue);
  } catch (error: any) {
    console.error("Error creating Jira issue:", error);
    res.status(500).json({ error: error.message || "Failed to create issue" });
  }
});

// Get Jira issue
jiraRouter.get("/issues/:issueKey", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const config = await storage.getUserJiraConfig(userId);
    if (!config) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    const issue = await jiraService.getIssue(config, req.params.issueKey);
    res.json(issue);
  } catch (error: any) {
    console.error("Error fetching Jira issue:", error);
    res.status(500).json({ error: error.message || "Failed to fetch issue" });
  }
});

// Update Jira issue
jiraRouter.put("/issues/:issueKey", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const config = await storage.getUserJiraConfig(userId);
    if (!config) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    const result = await jiraService.updateIssue(config, req.params.issueKey, req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Error updating Jira issue:", error);
    res.status(500).json({ error: error.message || "Failed to update issue" });
  }
});

// Search Jira issues
jiraRouter.post("/search", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const config = await storage.getUserJiraConfig(userId);
    if (!config) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    const { jql, maxResults } = req.body;
    const issues = await jiraService.searchIssues(config, jql, maxResults);
    res.json(issues);
  } catch (error: any) {
    console.error("Error searching Jira issues:", error);
    res.status(500).json({ error: error.message || "Failed to search issues" });
  }
});

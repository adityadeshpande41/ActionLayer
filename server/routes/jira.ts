import { Router } from "express";
import { jiraService } from "../services/jira";

export const jiraRouter = Router();

// Get Jira configuration status
jiraRouter.get("/status", (req, res) => {
  const config = jiraService.getConfig();
  res.json({
    configured: jiraService.isConfigured(),
    baseUrl: config?.baseUrl || null,
    email: config?.email || null,
  });
});

// Save Jira configuration
jiraRouter.post("/config", async (req, res) => {
  try {
    const { baseUrl, email, apiToken } = req.body;

    if (!baseUrl || !email || !apiToken) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const success = await jiraService.saveConfig({ baseUrl, email, apiToken });

    if (success) {
      res.json({ success: true, message: "Jira configured successfully" });
    } else {
      res.status(500).json({ error: "Failed to configure Jira. Check credentials." });
    }
  } catch (error: any) {
    console.error("Error configuring Jira:", error);
    res.status(500).json({ error: error.message || "Failed to configure Jira" });
  }
});

// Test Jira connection
jiraRouter.get("/test", async (req, res) => {
  try {
    const result = await jiraService.testConnection();
    res.json(result);
  } catch (error: any) {
    console.error("Error testing Jira connection:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Jira projects
jiraRouter.get("/projects", async (req, res) => {
  try {
    if (!jiraService.isConfigured()) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    const projects = await jiraService.getProjects();
    res.json(projects);
  } catch (error: any) {
    console.error("Error fetching Jira projects:", error);
    res.status(500).json({ error: error.message || "Failed to fetch projects" });
  }
});

// Get issue types for a project
jiraRouter.get("/projects/:projectKey/issue-types", async (req, res) => {
  try {
    if (!jiraService.isConfigured()) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    const issueTypes = await jiraService.getIssueTypes(req.params.projectKey);
    res.json(issueTypes);
  } catch (error: any) {
    console.error("Error fetching issue types:", error);
    res.status(500).json({ error: error.message || "Failed to fetch issue types" });
  }
});

// Create Jira issue
jiraRouter.post("/issues", async (req, res) => {
  try {
    if (!jiraService.isConfigured()) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    const issue = await jiraService.createIssue(req.body);
    res.status(201).json(issue);
  } catch (error: any) {
    console.error("Error creating Jira issue:", error);
    res.status(500).json({ error: error.message || "Failed to create issue" });
  }
});

// Get Jira issue
jiraRouter.get("/issues/:issueKey", async (req, res) => {
  try {
    if (!jiraService.isConfigured()) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    const issue = await jiraService.getIssue(req.params.issueKey);
    res.json(issue);
  } catch (error: any) {
    console.error("Error fetching Jira issue:", error);
    res.status(500).json({ error: error.message || "Failed to fetch issue" });
  }
});

// Update Jira issue
jiraRouter.put("/issues/:issueKey", async (req, res) => {
  try {
    if (!jiraService.isConfigured()) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    await jiraService.updateIssue(req.params.issueKey, req.body.fields);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error updating Jira issue:", error);
    res.status(500).json({ error: error.message || "Failed to update issue" });
  }
});

// Search Jira issues
jiraRouter.post("/search", async (req, res) => {
  try {
    if (!jiraService.isConfigured()) {
      return res.status(400).json({ error: "Jira not configured" });
    }

    const { jql, maxResults } = req.body;
    const issues = await jiraService.searchIssues(jql, maxResults);
    res.json(issues);
  } catch (error: any) {
    console.error("Error searching Jira issues:", error);
    res.status(500).json({ error: error.message || "Failed to search issues" });
  }
});

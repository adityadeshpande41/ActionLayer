import { Router } from "express";
import { storage } from "../storage";

export const dashboardRouter = Router();

// Get dashboard metrics
dashboardRouter.get("/metrics", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const projects = await storage.getProjectsByUserId(userId);
    const projectIds = projects.map((p) => p.id);

    // Get all risks and action items for user's projects
    const allRisks = await Promise.all(
      projectIds.map((id) => storage.getRisksByProjectId(id))
    );
    const allActionItems = await Promise.all(
      projectIds.map((id) => storage.getActionItemsByProjectId(id))
    );

    const risks = allRisks.flat();
    const actionItems = allActionItems.flat();

    // Calculate metrics
    const highRiskItems = risks.filter((r) => r.severity === "High").length;
    const overdueActions = actionItems.filter(
      (a) => a.dueDate && new Date(a.dueDate) < new Date() && a.status !== "completed"
    ).length;
    const decisionsAwaiting = 0; // Would need a decisions status field
    const blockedItems = actionItems.filter((a) => a.status === "blocked").length;

    res.json({
      highRiskItems,
      overdueActions,
      decisionsAwaiting,
      blockedItems,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// Get risk drift data
dashboardRouter.get("/risk-drift", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log('[Dashboard] Fetching risk drift for user:', userId);
    
    // Get user's projects first
    const projects = await storage.getProjectsByUserId(userId);
    const projectIds = projects.map((p) => p.id);
    
    if (projectIds.length === 0) {
      return res.json([]);
    }
    
    // Get risks from user's projects
    const allRisks = await Promise.all(
      projectIds.map((id) => storage.getRisksByProjectId(id))
    );
    const risks = allRisks.flat();
    
    console.log('[Dashboard] Found risks:', risks.length);
    
    // Sort by mentions and take top 5
    const topRisks = risks
      .sort((a, b) => (b.mentions || 1) - (a.mentions || 1))
      .slice(0, 5);
    
    // Format for frontend
    const riskDrift = topRisks.map((risk) => ({
      id: risk.id,
      risk: risk.risk,
      severity: risk.severity,
      mentions: risk.mentions || 1,
      lastSeen: new Date(risk.lastSeen).toISOString().split("T")[0],
      trend: Array(7).fill(0).map((_, i) => Math.max(1, (risk.mentions || 1) - (6 - i))),
    }));

    res.json(riskDrift);
  } catch (error) {
    console.error("Error fetching risk drift:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    res.status(500).json({ error: "Failed to fetch risk drift" });
  }
});

// Get recent runs
dashboardRouter.get("/recent-runs", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log('[Dashboard] Fetching recent runs for user:', userId);
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get user's projects first
    const projects = await storage.getProjectsByUserId(userId);
    const projectIds = projects.map((p) => p.id);
    
    if (projectIds.length === 0) {
      return res.json([]);
    }
    
    // Get analyses from user's projects
    const allAnalyses = await Promise.all(
      projectIds.map((id) => storage.getAnalysesByProjectId(id))
    );
    const analyses = allAnalyses.flat()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    console.log('[Dashboard] Found analyses:', analyses.length);

    // Create project name map
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));

    const recentRuns = analyses.map((analysis) => ({
      id: analysis.id,
      date: new Date(analysis.createdAt).toISOString().replace("T", " ").substring(0, 16),
      project: projectMap.get(analysis.projectId) || "Unknown",
      inputType: analysis.inputType,
      outcome: analysis.risksCount && analysis.risksCount > 2 ? "Escalate" : 
               analysis.decisionsCount && analysis.decisionsCount > 0 ? "Jira" : "Follow-up",
      status: analysis.status,
    }));

    console.log('[Dashboard] Returning recent runs:', recentRuns.length);
    res.json(recentRuns);
  } catch (error) {
    console.error("Error fetching recent runs:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    res.status(500).json({ error: "Failed to fetch recent runs" });
  }
});

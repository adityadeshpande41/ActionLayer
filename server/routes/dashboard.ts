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

    const topRisks = await storage.getTopRisks(5);
    
    // Format for frontend
    const riskDrift = topRisks.map((risk) => ({
      id: risk.id,
      risk: risk.risk,
      severity: risk.severity,
      mentions: risk.mentions || 1,
      lastSeen: risk.lastSeen.toISOString().split("T")[0],
      trend: Array(7).fill(0).map((_, i) => Math.max(1, (risk.mentions || 1) - (6 - i))),
    }));

    res.json(riskDrift);
  } catch (error) {
    console.error("Error fetching risk drift:", error);
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

    const limit = parseInt(req.query.limit as string) || 10;
    const analyses = await storage.getRecentAnalyses(limit);

    // Get project names
    const projectIds = Array.from(new Set(analyses.map((a) => a.projectId)));
    const projects = await Promise.all(
      projectIds.map((id) => storage.getProject(id))
    );
    const projectMap = new Map(projects.filter(Boolean).map((p) => [p!.id, p!.name]));

    const recentRuns = analyses.map((analysis) => ({
      id: analysis.id,
      date: analysis.createdAt.toISOString().replace("T", " ").substring(0, 16),
      project: projectMap.get(analysis.projectId) || "Unknown",
      inputType: analysis.inputType,
      outcome: analysis.risksCount && analysis.risksCount > 2 ? "Escalate" : 
               analysis.decisionsCount && analysis.decisionsCount > 0 ? "Jira" : "Follow-up",
      status: analysis.status,
    }));

    res.json(recentRuns);
  } catch (error) {
    console.error("Error fetching recent runs:", error);
    res.status(500).json({ error: "Failed to fetch recent runs" });
  }
});

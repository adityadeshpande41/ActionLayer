import { Router } from "express";
import { storage } from "../storage";
import { generateJiraDrafts, generateFollowUpEmail } from "../services/openai";

export const approvalsRouter = Router();

// Get pending approvals for an analysis
approvalsRouter.get("/analysis/:analysisId", async (req, res) => {
  try {
    const analysis = await storage.getAnalysis(req.params.analysisId);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    const [decisions, risks, actionItems] = await Promise.all([
      storage.getDecisionsByAnalysisId(req.params.analysisId),
      storage.getRisksByAnalysisId(req.params.analysisId),
      storage.getActionItemsByAnalysisId(req.params.analysisId),
    ]);

    // Identify items needing review
    const needsReview = {
      lowConfidenceDecisions: decisions.filter((d) => (d.confidence || 0) < 70),
      missingOwners: [
        ...decisions.filter((d) => !d.owner).map((d) => ({ type: "decision", item: d })),
        ...actionItems.filter((a) => !a.owner).map((a) => ({ type: "action", item: a })),
      ],
      highRisks: risks.filter((r) => r.severity === "High"),
    };

    res.json({
      analysis,
      decisions,
      risks,
      actionItems,
      needsReview,
      requiresApproval: 
        needsReview.lowConfidenceDecisions.length > 0 ||
        needsReview.missingOwners.length > 0 ||
        needsReview.highRisks.length > 0,
    });
  } catch (error) {
    console.error("Error fetching approvals:", error);
    res.status(500).json({ error: "Failed to fetch approvals" });
  }
});

// Approve and execute actions
approvalsRouter.post("/analysis/:analysisId/approve", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { actions, edits } = req.body;
    // actions: ["create-jira", "send-email", "escalate"]
    // edits: { decisions: [...], risks: [...], actionItems: [...] }

    const analysis = await storage.getAnalysis(req.params.analysisId);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    // Apply edits if provided
    if (edits) {
      // Update decisions, risks, action items with user edits
      // This would involve updating the storage records
    }

    const results: any = {
      approved: true,
      executedActions: [],
    };

    // Execute approved actions
    if (actions.includes("create-jira")) {
      const [decisions, actionItems] = await Promise.all([
        storage.getDecisionsByAnalysisId(req.params.analysisId),
        storage.getActionItemsByAnalysisId(req.params.analysisId),
      ]);

      const jiraDrafts = await generateJiraDrafts(decisions, actionItems, []);
      results.executedActions.push({
        type: "jira",
        count: jiraDrafts.length,
        drafts: jiraDrafts,
      });
    }

    if (actions.includes("send-email")) {
      const [decisions, actionItems, risks] = await Promise.all([
        storage.getDecisionsByAnalysisId(req.params.analysisId),
        storage.getActionItemsByAnalysisId(req.params.analysisId),
        storage.getRisksByAnalysisId(req.params.analysisId),
      ]);

      const email = await generateFollowUpEmail(
        (analysis.summary as any) || [],
        decisions,
        actionItems,
        risks
      );
      results.executedActions.push({
        type: "email",
        draft: email,
      });
    }

    if (actions.includes("escalate")) {
      const risks = await storage.getRisksByAnalysisId(req.params.analysisId);
      const highRisks = risks.filter((r) => r.severity === "High");
      
      results.executedActions.push({
        type: "escalation",
        risks: highRisks,
        message: `${highRisks.length} high-severity risks require immediate attention`,
      });
    }

    res.json(results);
  } catch (error) {
    console.error("Error approving actions:", error);
    res.status(500).json({ error: "Failed to approve actions" });
  }
});

// Reject/discard analysis
approvalsRouter.post("/analysis/:analysisId/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    
    await storage.updateAnalysis(req.params.analysisId, {
      status: "failed",
    });

    res.json({
      rejected: true,
      reason,
    });
  } catch (error) {
    console.error("Error rejecting analysis:", error);
    res.status(500).json({ error: "Failed to reject analysis" });
  }
});

import { Router } from "express";
import { handleCommand } from "../services/openai";
import { storage } from "../storage";
import { getContextForCommand, getWeeklyChanges, detectRiskDrift } from "../services/memory";

export const commandRouter = Router();

// Handle command mode requests
commandRouter.post("/", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { command, projectId } = req.body;
    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }

    // Get rich context with memory
    const context = await getContextForCommand(command, projectId);

    const result = await handleCommand(command, context);

    // Create analysis record for command (only if projectId is valid)
    if (projectId && projectId !== "default-project") {
      try {
        // Verify project exists before creating analysis
        const project = await storage.getProject(projectId);
        if (project) {
          await storage.createAnalysis({
            projectId,
            userId,
            inputType: "command",
            summary: [result.response],
            status: "completed",
          });
        }
      } catch (err) {
        // Log but don't fail the command if analysis creation fails
        console.error("Failed to create analysis record:", err);
      }
    }

    res.json(result);
  } catch (error) {
    console.error("Error handling command:", error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    res.status(500).json({ 
      error: "Failed to process command",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// PM Command Center queries
commandRouter.get("/insights/:projectId", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId } = req.params;
    const context = await getContextForCommand("", projectId);
    const weeklyChanges = await getWeeklyChanges(projectId);
    const riskDrift = await detectRiskDrift(projectId, 30);

    res.json({
      worryAboutToday: {
        highRisks: context.insights.highRisks,
        overdueActions: context.insights.overdueActions,
        blockedItems: context.actionItems.filter((a: any) => a.status === "blocked"),
      },
      weeklyChanges,
      riskDrift: riskDrift.slice(0, 5),
      waitingOn: context.actionItems.filter((a: any) => 
        a.status === "pending" && a.owner !== userId
      ),
      waitingOnMe: context.actionItems.filter((a: any) => 
        a.status === "pending" && a.owner === userId
      ),
    });
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

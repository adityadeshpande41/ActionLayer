import { Router } from "express";
import { storage } from "../storage";
import { analyzeTranscript, generateJiraDrafts, generateFollowUpEmail, generateWeeklyStatusUpdate, generateWhatChangedSummary } from "../services/openai";
import { routeWorkflow } from "../services/workflow-router";
import { detectRiskDrift, detectDecisionConflicts } from "../services/memory";
import { intakeQuestions, synthesizeIntakeToContext, generateFollowUpQuestion } from "../services/intake";
import multer from "multer";
import pdfParse from "pdf-parse";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760") },
});

export const analysesRouter = Router();

// Get intake questions
analysesRouter.get("/intake/questions", (req, res) => {
  res.json({ questions: intakeQuestions });
});

// Process intake answers
analysesRouter.post("/intake/process", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId, answers, skipFollowUp } = req.body;
    if (!projectId || !answers) {
      return res.status(400).json({ error: "Project ID and answers are required" });
    }

    // Synthesize intake into context
    const synthesizedContext = await synthesizeIntakeToContext(answers);

    // Check if follow-up needed (only if not explicitly skipped and we have fewer than 10 answers)
    const answerCount = Object.keys(answers).length;
    if (!skipFollowUp && answerCount < 10) {
      const followUpQuestion = await generateFollowUpQuestion(answers, synthesizedContext);

      if (followUpQuestion) {
        return res.json({
          needsFollowUp: true,
          question: followUpQuestion,
          context: synthesizedContext,
        });
      }
    }

    // Create analysis record
    const analysis = await storage.createAnalysis({
      projectId,
      userId,
      inputType: "intake",
      status: "in-progress",
    });

    // Analyze the synthesized context
    try {
      const result = await analyzeTranscript(synthesizedContext, answers.meeting_type);

      // Store results (same as transcript analysis)
      const decisionPromises = result.decisions.map((d) =>
        storage.createDecision({
          analysisId: analysis.id,
          projectId,
          decision: d.decision,
          owner: d.owner,
          rationale: d.rationale,
          confidence: d.confidence,
          evidence: d.evidence,
        })
      );

      const riskPromises = result.risks.map((r) =>
        storage.createRisk({
          analysisId: analysis.id,
          projectId,
          risk: r.risk,
          likelihood: r.likelihood,
          impact: r.impact,
          severity: r.severity,
          owner: r.owner,
          mitigation: r.mitigation,
          confidence: r.confidence,
          evidence: r.evidence,
        })
      );

      const actionPromises = result.actionItems.map((a) =>
        storage.createActionItem({
          analysisId: analysis.id,
          projectId,
          action: a.action,
          owner: a.owner,
          priority: a.priority,
          status: "pending",
        })
      );

      await Promise.all([...decisionPromises, ...riskPromises, ...actionPromises]);

      // Run workflow router
      const workflowDecision = routeWorkflow({
        decisions: result.decisions,
        risks: result.risks,
        actionItems: result.actionItems,
        dependencies: result.dependencies,
      });

      const updatedAnalysis = await storage.updateAnalysis(analysis.id, {
        summary: result.summary,
        decisionsCount: result.decisions.length,
        risksCount: result.risks.length,
        blockersCount: result.dependencies.length,
        status: "completed",
      });

      res.json({
        needsFollowUp: false,
        analysis: updatedAnalysis,
        summary: result.summary,
        decisions: result.decisions,
        risks: result.risks,
        actionItems: result.actionItems,
        dependencies: result.dependencies,
        workflow: workflowDecision,
      });
    } catch (aiError) {
      console.error("AI analysis error:", aiError);
      await storage.updateAnalysis(analysis.id, { status: "failed" });
      res.status(500).json({ error: "Failed to analyze intake" });
    }
  } catch (error) {
    console.error("Error in intake process:", error);
    res.status(500).json({ error: "Failed to process intake" });
  }
});


// Get analyses for a project
analysesRouter.get("/project/:projectId", async (req, res) => {
  try {
    const analyses = await storage.getAnalysesByProjectId(req.params.projectId);
    res.json(analyses);
  } catch (error) {
    console.error("Error fetching analyses:", error);
    res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

// Get recent analyses
analysesRouter.get("/recent", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const analyses = await storage.getRecentAnalyses(limit);
    // Debug: log raw createdAt values
    console.log("[Debug] Recent analyses createdAt values:", analyses.map((a: any) => ({ id: a.id.slice(0,8), createdAt: a.createdAt, type: typeof a.createdAt })));
    res.json(analyses);
  } catch (error) {
    console.error("Error fetching recent analyses:", error);
    res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

// Get single analysis with all related data
analysesRouter.get("/:id", async (req, res) => {
  try {
    const analysis = await storage.getAnalysis(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    const [decisions, risks, actionItems] = await Promise.all([
      storage.getDecisionsByAnalysisId(req.params.id),
      storage.getRisksByAnalysisId(req.params.id),
      storage.getActionItemsByAnalysisId(req.params.id),
    ]);

    res.json({
      ...analysis,
      decisions,
      risks,
      actionItems,
    });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
});

// Analyze transcript
analysesRouter.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId, meetingType, content } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    let transcriptContent = content;
    let fileName: string | undefined;

    // Handle file upload
    if (req.file) {
      fileName = req.file.originalname;
      
      if (req.file.mimetype === "application/pdf") {
        const pdfData = await pdfParse(req.file.buffer);
        transcriptContent = pdfData.text;
      } else {
        transcriptContent = req.file.buffer.toString("utf-8");
      }
    }

    if (!transcriptContent) {
      return res.status(400).json({ error: "Transcript content is required" });
    }

    // Create transcript record
    const transcript = await storage.createTranscript({
      projectId,
      userId,
      content: transcriptContent,
      meetingType,
      fileName,
    });

    // Create analysis record (in-progress)
    const analysis = await storage.createAnalysis({
      transcriptId: transcript.id,
      projectId,
      userId,
      inputType: "transcript",
      status: "in-progress",
    });

    // Analyze with OpenAI
    try {
      const result = await analyzeTranscript(transcriptContent, meetingType);

      // Store decisions
      const decisionPromises = result.decisions.map((d) =>
        storage.createDecision({
          analysisId: analysis.id,
          projectId,
          decision: d.decision,
          owner: d.owner,
          rationale: d.rationale,
          confidence: d.confidence,
          evidence: d.evidence,
        })
      );

      // Store risks
      const riskPromises = result.risks.map((r) =>
        storage.createRisk({
          analysisId: analysis.id,
          projectId,
          risk: r.risk,
          likelihood: r.likelihood,
          impact: r.impact,
          severity: r.severity,
          owner: r.owner,
          mitigation: r.mitigation,
          confidence: r.confidence,
          evidence: r.evidence,
        })
      );

      // Store action items
      const actionPromises = result.actionItems.map((a) =>
        storage.createActionItem({
          analysisId: analysis.id,
          projectId,
          action: a.action,
          owner: a.owner,
          priority: a.priority,
          status: "pending",
        })
      );

      await Promise.all([...decisionPromises, ...riskPromises, ...actionPromises]);

      // Run workflow router
      const workflowDecision = routeWorkflow({
        decisions: result.decisions,
        risks: result.risks,
        actionItems: result.actionItems,
        dependencies: result.dependencies,
      });

      // Detect risk drift
      const riskDrift = await detectRiskDrift(projectId, 30);

      // Check for decision conflicts
      const conflicts = await detectDecisionConflicts(
        projectId,
        result.decisions.map((d) => ({ decision: d.decision, date: new Date() }))
      );

      // Update analysis with results
      const updatedAnalysis = await storage.updateAnalysis(analysis.id, {
        summary: result.summary,
        decisionsCount: result.decisions.length,
        risksCount: result.risks.length,
        blockersCount: result.dependencies.length,
        status: "completed",
      });

      res.json({
        analysis: updatedAnalysis,
        summary: result.summary,
        decisions: result.decisions,
        risks: result.risks,
        actionItems: result.actionItems,
        dependencies: result.dependencies,
        workflow: workflowDecision,
        insights: {
          riskDrift: riskDrift.slice(0, 3),
          conflicts,
        },
      });
    } catch (aiError) {
      console.error("AI analysis error:", aiError);
      await storage.updateAnalysis(analysis.id, { status: "failed" });
      res.status(500).json({ error: "Failed to analyze transcript" });
    }
  } catch (error) {
    console.error("Error in analyze endpoint:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// Generate Jira drafts
analysesRouter.post("/:id/jira", async (req, res) => {
  try {
    const analysis = await storage.getAnalysis(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    const [decisions, actionItems] = await Promise.all([
      storage.getDecisionsByAnalysisId(req.params.id),
      storage.getActionItemsByAnalysisId(req.params.id),
    ]);

    const jiraDrafts = await generateJiraDrafts(
      decisions,
      actionItems,
      [] // dependencies from analysis
    );

    res.json({ jiraDrafts });
  } catch (error) {
    console.error("Error generating Jira drafts:", error);
    res.status(500).json({ error: "Failed to generate Jira drafts" });
  }
});

// Generate follow-up email
analysesRouter.post("/:id/followup", async (req, res) => {
  try {
    const analysis = await storage.getAnalysis(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    const [decisions, actionItems, risks] = await Promise.all([
      storage.getDecisionsByAnalysisId(req.params.id),
      storage.getActionItemsByAnalysisId(req.params.id),
      storage.getRisksByAnalysisId(req.params.id),
    ]);

    const emails = await generateFollowUpEmail(
      (analysis.summary as any) || [],
      decisions,
      actionItems,
      risks
    );

    res.json({ emails });
  } catch (error) {
    console.error("Error generating follow-up email:", error);
    res.status(500).json({ error: "Failed to generate follow-up email" });
  }
});

// Generate weekly status update
analysesRouter.post("/weekly-status/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`[Weekly Status] Starting for project: ${projectId}`);
    
    // Get all analyses for this project
    const allAnalyses = await storage.getAnalysesByProjectId(projectId);
    
    console.log(`[Weekly Status] Found ${allAnalyses.length} analyses`);
    
    if (allAnalyses.length === 0) {
      return res.status(404).json({ error: "No analyses found for this project" });
    }

    // Use the most recent analyses (up to 10)
    const recentAnalyses = allAnalyses.slice(0, 10);

    // Aggregate data
    const allDecisions: any[] = [];
    const allRisks: any[] = [];
    const allActionItems: any[] = [];

    for (const analysis of recentAnalyses) {
      const [decisions, risks, actions] = await Promise.all([
        storage.getDecisionsByAnalysisId(analysis.id),
        storage.getRisksByAnalysisId(analysis.id),
        storage.getActionItemsByAnalysisId(analysis.id),
      ]);
      allDecisions.push(...decisions);
      allRisks.push(...risks);
      allActionItems.push(...actions);
    }

    console.log(`[Weekly Status] Aggregated: ${allDecisions.length} decisions, ${allRisks.length} risks, ${allActionItems.length} actions`);

    const completedItems = allActionItems.filter((a: any) => a.status === "completed");

    console.log(`[Weekly Status] Calling OpenAI...`);
    const statusUpdate = await generateWeeklyStatusUpdate(
      projectId,
      allDecisions,
      allRisks,
      allActionItems,
      completedItems
    );

    console.log(`[Weekly Status] Success!`);
    res.json({ statusUpdate });
  } catch (error: any) {
    console.error("[Weekly Status] Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate weekly status" });
  }
});

// Generate "what changed" summary
analysesRouter.post("/:id/what-changed", async (req, res) => {
  try {
    console.log(`[What Changed] Starting for analysis: ${req.params.id}`);
    
    const analysis = await storage.getAnalysis(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    console.log(`[What Changed] Found analysis for project: ${analysis.projectId}`);

    // Get previous analyses for comparison
    const allAnalyses = await storage.getAnalysesByProjectId(analysis.projectId);
    const previousAnalyses = allAnalyses
      .filter((a: any) => new Date(a.createdAt) < new Date(analysis.createdAt))
      .slice(-5); // Last 5 analyses

    console.log(`[What Changed] Found ${previousAnalyses.length} previous analyses`);

    if (previousAnalyses.length === 0) {
      return res.json({
        changes: {
          newDecisions: [],
          changedRisks: [],
          resolvedItems: [],
          summary: "This is the first analysis for this project."
        }
      });
    }

    // Get current analysis data
    const [currentDecisions, currentRisks, currentActions] = await Promise.all([
      storage.getDecisionsByAnalysisId(req.params.id),
      storage.getRisksByAnalysisId(req.params.id),
      storage.getActionItemsByAnalysisId(req.params.id),
    ]);

    console.log(`[What Changed] Current data: ${currentDecisions.length} decisions, ${currentRisks.length} risks, ${currentActions.length} actions`);

    const currentData = {
      decisions: currentDecisions,
      risks: currentRisks,
      actionItems: currentActions,
    };

    console.log(`[What Changed] Calling OpenAI...`);
    const changes = await generateWhatChangedSummary(previousAnalyses, currentData);

    console.log(`[What Changed] Success!`);
    res.json({ changes });
  } catch (error: any) {
    console.error("[What Changed] Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate what changed summary" });
  }
});

// Delete analysis
analysesRouter.delete("/:id", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const analysis = await storage.getAnalysis(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    // Check if user owns this analysis
    if (analysis.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Delete the analysis (this should cascade delete related data in a real DB)
    const deleted = await storage.deleteAnalysis(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    res.json({ success: true, message: "Analysis deleted successfully" });
  } catch (error) {
    console.error("Error deleting analysis:", error);
    res.status(500).json({ error: "Failed to delete analysis" });
  }
});

// Rename analysis
analysesRouter.patch("/:id/rename", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const analysis = await storage.getAnalysis(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    if (analysis.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await storage.updateAnalysis(req.params.id, { name: name.trim() });
    res.json(updated);
  } catch (error) {
    console.error("Error renaming analysis:", error);
    res.status(500).json({ error: "Failed to rename analysis" });
  }
});

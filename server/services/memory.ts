// Memory & Context - Cross-call intelligence

import { storage } from "../storage";

export interface RiskDrift {
  risk: string;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  projects: string[];
  trend: "increasing" | "stable" | "decreasing";
}

export interface DecisionConflict {
  currentDecision: string;
  conflictingDecision: string;
  currentDate: Date;
  conflictDate: Date;
  projectId: string;
}

export interface RecurringBlocker {
  blocker: string;
  count: number;
  affectedTasks: string[];
  projects: string[];
}

export async function detectRiskDrift(
  projectId: string,
  timeWindowDays: number = 30
): Promise<RiskDrift[]> {
  const risks = await storage.getRisksByProjectId(projectId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);

  // Group similar risks
  const riskGroups = new Map<string, typeof risks>();
  
  for (const risk of risks) {
    if (risk.createdAt < cutoffDate) continue;
    
    // Simple similarity check (in production, use embeddings)
    const key = risk.risk.toLowerCase().substring(0, 50);
    const existing = riskGroups.get(key) || [];
    existing.push(risk);
    riskGroups.set(key, existing);
  }

  // Calculate drift
  const drifts: RiskDrift[] = [];
  
  for (const [, group] of Array.from(riskGroups.entries())) {
    if (group.length < 2) continue; // Only recurring risks
    
    const sorted = group.sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime());
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    
    let trend: "increasing" | "stable" | "decreasing" = "stable";
    if (secondHalf.length > firstHalf.length * 1.5) {
      trend = "increasing";
    } else if (secondHalf.length < firstHalf.length * 0.5) {
      trend = "decreasing";
    }
    
    drifts.push({
      risk: group[0].risk,
      occurrences: group.length,
      firstSeen: sorted[0].createdAt,
      lastSeen: sorted[sorted.length - 1].createdAt,
      projects: [projectId],
      trend,
    });
  }

  return drifts.sort((a, b) => b.occurrences - a.occurrences);
}

export async function detectDecisionConflicts(
  projectId: string,
  newDecisions: Array<{ decision: string; date: Date }>
): Promise<DecisionConflict[]> {
  const existingDecisions = await storage.getDecisionsByProjectId(projectId);
  const conflicts: DecisionConflict[] = [];

  for (const newDec of newDecisions) {
    for (const existing of existingDecisions) {
      // Simple conflict detection (in production, use semantic similarity)
      const newWords = new Set(newDec.decision.toLowerCase().split(/\s+/));
      const existingWords = new Set(existing.decision.toLowerCase().split(/\s+/));
      
      // Check for contradictory keywords
      const contradictions = [
        ["adopt", "reject"],
        ["use", "avoid"],
        ["implement", "remove"],
        ["add", "delete"],
      ];
      
      for (const [word1, word2] of contradictions) {
        if (
          (newWords.has(word1) && existingWords.has(word2)) ||
          (newWords.has(word2) && existingWords.has(word1))
        ) {
          conflicts.push({
            currentDecision: newDec.decision,
            conflictingDecision: existing.decision,
            currentDate: newDec.date,
            conflictDate: existing.createdAt,
            projectId,
          });
        }
      }
    }
  }

  return conflicts;
}

export async function getRecurringBlockers(
  projectId: string,
  timeWindowDays: number = 60
): Promise<RecurringBlocker[]> {
  // This would analyze action items and dependencies
  // For now, return mock structure
  return [];
}

export async function getContextForCommand(
  command: string,
  projectId?: string
): Promise<any> {
  const context: any = {
    timestamp: new Date(),
    command,
  };

  if (projectId) {
    const [project, risks, actionItems, decisions] = await Promise.all([
      storage.getProject(projectId),
      storage.getRisksByProjectId(projectId),
      storage.getActionItemsByProjectId(projectId),
      storage.getDecisionsByProjectId(projectId),
    ]);

    context.project = project;
    context.risks = risks;
    context.actionItems = actionItems;
    context.decisions = decisions;

    // Add derived insights
    context.insights = {
      highRisks: risks.filter((r) => r.severity === "High"),
      overdueActions: actionItems.filter(
        (a) => a.dueDate && new Date(a.dueDate) < new Date() && a.status !== "completed"
      ),
      pendingActions: actionItems.filter((a) => a.status === "pending"),
      recentDecisions: decisions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
    };
  }

  return context;
}

export async function getWeeklyChanges(projectId: string): Promise<{
  newRisks: any[];
  resolvedRisks: any[];
  newDecisions: any[];
  completedActions: any[];
  newBlockers: any[];
}> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [risks, decisions, actionItems] = await Promise.all([
    storage.getRisksByProjectId(projectId),
    storage.getDecisionsByProjectId(projectId),
    storage.getActionItemsByProjectId(projectId),
  ]);

  return {
    newRisks: risks.filter((r) => r.createdAt > oneWeekAgo),
    resolvedRisks: [], // Would need a resolved status
    newDecisions: decisions.filter((d) => d.createdAt > oneWeekAgo),
    completedActions: actionItems.filter(
      (a) => a.status === "completed" && a.createdAt > oneWeekAgo
    ),
    newBlockers: [], // Would need blocker tracking
  };
}

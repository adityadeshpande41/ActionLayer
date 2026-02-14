// Workflow Router - Decides what actions to take based on analysis

export type WorkflowOutcome = 
  | "no-action"
  | "follow-up"
  | "jira-needed"
  | "escalation"
  | "waiting";

export interface WorkflowDecision {
  outcome: WorkflowOutcome;
  reasoning: string;
  confidence: number;
  proposedActions: Array<{
    type: "jira" | "email" | "escalate" | "notify";
    description: string;
    priority: "high" | "medium" | "low";
    autoApprove: boolean;
  }>;
  needsReview: string[];
}

export function routeWorkflow(analysis: {
  decisions: any[];
  risks: any[];
  actionItems: any[];
  dependencies?: any[];
}): WorkflowDecision {
  const needsReview: string[] = [];
  const proposedActions: WorkflowDecision["proposedActions"] = [];

  // Check for high-confidence issues
  const highRisks = analysis.risks.filter((r) => r.severity === "High");
  const lowConfidenceDecisions = analysis.decisions.filter((d) => d.confidence < 70);
  const missingOwners = [
    ...analysis.decisions.filter((d) => !d.owner),
    ...analysis.actionItems.filter((a) => !a.owner),
  ];

  // Determine primary outcome
  let outcome: WorkflowOutcome = "no-action";
  let reasoning = "Analysis complete with no critical actions needed.";
  let confidence = 100;

  // Escalation needed?
  if (highRisks.length >= 2) {
    outcome = "escalation";
    reasoning = `${highRisks.length} high-severity risks detected requiring immediate attention.`;
    confidence = 90;
    
    proposedActions.push({
      type: "escalate",
      description: `Escalate ${highRisks.length} high-severity risks to stakeholders`,
      priority: "high",
      autoApprove: false,
    });
  }

  // Jira work needed?
  if (analysis.actionItems.length > 0 || analysis.decisions.length > 2) {
    if (outcome === "no-action") {
      outcome = "jira-needed";
      reasoning = "Multiple action items and decisions require tracking in Jira.";
      confidence = 85;
    }
    
    proposedActions.push({
      type: "jira",
      description: `Create ${analysis.actionItems.length} Jira tickets from action items`,
      priority: analysis.actionItems.some((a) => a.priority === "High") ? "high" : "medium",
      autoApprove: false,
    });
  }

  // Follow-up communication needed?
  if (analysis.decisions.length > 0 || analysis.actionItems.length > 0) {
    proposedActions.push({
      type: "email",
      description: "Send follow-up email with decisions and action items",
      priority: "medium",
      autoApprove: false,
    });
  }

  // Check for items needing review
  if (lowConfidenceDecisions.length > 0) {
    needsReview.push(
      `${lowConfidenceDecisions.length} decision(s) extracted with low confidence (<70%)`
    );
  }

  if (missingOwners.length > 0) {
    needsReview.push(
      `${missingOwners.length} item(s) missing owner assignment`
    );
  }

  if (analysis.dependencies && analysis.dependencies.length > 0) {
    needsReview.push(
      `${analysis.dependencies.length} dependency chain(s) detected - verify blockers`
    );
  }

  // Waiting state?
  const blockedItems = analysis.dependencies?.filter((d) => d.blockedBy) || [];
  if (blockedItems.length > 0 && outcome === "no-action") {
    outcome = "waiting";
    reasoning = `${blockedItems.length} item(s) blocked by external dependencies.`;
    confidence = 80;
  }

  // Adjust confidence based on review needs
  if (needsReview.length > 0) {
    confidence = Math.max(50, confidence - needsReview.length * 10);
  }

  return {
    outcome,
    reasoning,
    confidence,
    proposedActions,
    needsReview,
  };
}

export function shouldAutoApprove(
  workflowDecision: WorkflowDecision,
  userPreferences?: {
    autoApproveThreshold?: number;
    autoApproveTypes?: string[];
  }
): boolean {
  const threshold = userPreferences?.autoApproveThreshold || 90;
  const allowedTypes = userPreferences?.autoApproveTypes || [];

  // Never auto-approve if there are review items
  if (workflowDecision.needsReview.length > 0) {
    return false;
  }

  // Check confidence threshold
  if (workflowDecision.confidence < threshold) {
    return false;
  }

  // Check if all actions are in allowed types
  const allActionsAllowed = workflowDecision.proposedActions.every(
    (action) => allowedTypes.includes(action.type)
  );

  return allActionsAllowed;
}

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptAnalysisResult {
  summary: string[];
  decisions: Array<{
    decision: string;
    owner: string;
    rationale: string;
    confidence: number;
    evidence: string;
  }>;
  risks: Array<{
    risk: string;
    likelihood: string;
    impact: string;
    severity: "High" | "Med" | "Low";
    owner: string;
    mitigation: string;
    confidence: number;
    evidence: string;
  }>;
  actionItems: Array<{
    action: string;
    owner: string;
    priority: "High" | "Med" | "Low";
  }>;
  dependencies: Array<{
    task: string;
    blockedBy: string;
    owner: string;
  }>;
}

export async function analyzeTranscript(
  transcript: string,
  meetingType?: string
): Promise<TranscriptAnalysisResult> {
  const systemPrompt = `You are an expert PM assistant that analyzes meeting transcripts and extracts structured information.
Your task is to identify:
1. Key decisions made (with owner, rationale, and confidence level)
2. Risks discussed (with likelihood, impact, severity, mitigation)
3. Action items (with owner and priority)
4. Dependencies and blockers
5. Executive summary

Be precise and extract evidence from the transcript. Rate confidence 0-100 based on how explicit the information is.`;

  const userPrompt = `Analyze this ${meetingType || "meeting"} transcript and extract structured information:

${transcript}

Return a JSON object with this exact structure:
{
  "summary": ["bullet point 1", "bullet point 2", ...],
  "decisions": [{
    "decision": "string",
    "owner": "string",
    "rationale": "string",
    "confidence": number (0-100),
    "evidence": "quote from transcript"
  }],
  "risks": [{
    "risk": "string",
    "likelihood": "High|Med|Low",
    "impact": "High|Med|Low",
    "severity": "High|Med|Low",
    "owner": "string",
    "mitigation": "string",
    "confidence": number (0-100),
    "evidence": "quote from transcript"
  }],
  "actionItems": [{
    "action": "string",
    "owner": "string",
    "priority": "High|Med|Low"
  }],
  "dependencies": [{
    "task": "string",
    "blockedBy": "string",
    "owner": "string"
  }]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = JSON.parse(completion.choices[0].message.content || "{}");
  return result as TranscriptAnalysisResult;
}

export async function generateJiraDrafts(
  decisions: any[],
  actionItems: any[],
  dependencies: any[]
): Promise<Array<{
  title: string;
  userStory: string;
  acceptanceCriteria: string[];
  dependencies: string[];
  priority: "High" | "Med" | "Low";
  owner: string;
}>> {
  const prompt = `Based on these decisions, action items, and dependencies, generate Jira story drafts:

Decisions: ${JSON.stringify(decisions)}
Action Items: ${JSON.stringify(actionItems)}
Dependencies: ${JSON.stringify(dependencies)}

Create 3-5 Jira stories with:
- title: Concise story title
- userStory: As a [role], I want [feature] so that [benefit]
- acceptanceCriteria: Array of 3-5 specific, testable criteria
- dependencies: Array of dependency names (if any)
- priority: "High" | "Med" | "Low"
- owner: Person responsible (from action items/decisions)

Return a JSON object with this structure:
{
  "stories": [
    {
      "title": "string",
      "userStory": "string",
      "acceptanceCriteria": ["string", "string", ...],
      "dependencies": ["string", ...],
      "priority": "High|Med|Low",
      "owner": "string"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"stories": []}');
  return result.stories || [];
}

export async function generateFollowUpEmail(
  summary: string[],
  decisions: any[],
  actionItems: any[],
  risks: any[]
): Promise<{
  general: { subject: string; body: string; recipients: string };
  risks: { subject: string; body: string; recipients: string } | null;
  blockers: { subject: string; body: string; recipients: string } | null;
  actions: { subject: string; body: string; recipients: string } | null;
}> {
  // Generate general summary email
  const generalPrompt = `Generate a professional follow-up email summarizing a meeting.

Summary: ${summary.join("; ")}
Decisions: ${decisions.length} key decisions made
Action Items: ${actionItems.length} action items assigned
Risks: ${risks.length} risks identified

Create a concise executive summary email that:
- Highlights key outcomes and decisions
- Mentions action items and risks at a high level
- Is suitable for all stakeholders
- Professional but friendly tone
- Signed "ActionLayer AI"

Return JSON:
{
  "subject": "Meeting Follow-Up: [brief topic]",
  "body": "Full email body with proper formatting",
  "recipients": "All Stakeholders"
}`;

  const generalCompletion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: generalPrompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const general = JSON.parse(generalCompletion.choices[0].message.content || '{"subject": "Meeting Follow-Up", "body": "", "recipients": "All Stakeholders"}');

  // Generate risk-specific email if there are high/medium risks
  let riskEmail = null;
  const criticalRisks = risks.filter((r: any) => r.severity === "High" || r.severity === "Med");
  if (criticalRisks.length > 0) {
    const riskPrompt = `Generate a focused email about project risks for product owners and risk managers.

Risks Identified:
${JSON.stringify(criticalRisks, null, 2)}

Create a detailed risk-focused email that:
- Lists each risk with severity, impact, and likelihood
- Includes mitigation strategies
- Identifies risk owners
- Requests immediate attention for high-severity items
- Professional and urgent tone for critical items
- Signed "ActionLayer AI"

Return JSON:
{
  "subject": "⚠️ Risk Alert: [project/topic]",
  "body": "Detailed risk breakdown with mitigation plans",
  "recipients": "Product Owners, Risk Managers"
}`;

    const riskCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: riskPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    riskEmail = JSON.parse(riskCompletion.choices[0].message.content || '{"subject": "Risk Alert", "body": "", "recipients": "Product Owners"}');
  }

  // Generate blocker/dependency email if there are dependencies
  let blockerEmail = null;
  const blockers = actionItems.filter((a: any) =>
    a.action.toLowerCase().includes("blocked") ||
    a.action.toLowerCase().includes("dependency") ||
    a.action.toLowerCase().includes("waiting")
  );
  if (blockers.length > 0) {
    const blockerPrompt = `Generate an email about blockers and dependencies for team leads and managers.

Blockers/Dependencies:
${JSON.stringify(blockers, null, 2)}

Create a focused email that:
- Lists each blocker with owner and priority
- Identifies what's blocking what
- Requests immediate action to unblock
- Suggests escalation if needed
- Clear call-to-action
- Signed "ActionLayer AI"

Return JSON:
{
  "subject": "🚧 Action Required: Blockers & Dependencies",
  "body": "Detailed blocker breakdown with action requests",
  "recipients": "Team Leads, Engineering Managers"
}`;

    const blockerCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: blockerPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    blockerEmail = JSON.parse(blockerCompletion.choices[0].message.content || '{"subject": "Blockers Alert", "body": "", "recipients": "Team Leads"}');
  }

  // Generate action items email if there are action items
  let actionsEmail = null;
  if (actionItems.length > 0) {
    const actionsPrompt = `Generate an email listing action items for assignees.

Action Items:
${JSON.stringify(actionItems, null, 2)}

Create a clear action-oriented email that:
- Lists each action item with owner and priority
- Groups by owner if possible
- Includes clear deadlines or urgency
- Requests confirmation of receipt
- Friendly but professional tone
- Signed "ActionLayer AI"

Return JSON:
{
  "subject": "✅ Action Items from Meeting",
  "body": "Organized list of action items by owner",
  "recipients": "Action Item Owners"
}`;

    const actionsCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: actionsPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    actionsEmail = JSON.parse(actionsCompletion.choices[0].message.content || '{"subject": "Action Items", "body": "", "recipients": "Assignees"}');
  }

  return {
    general,
    risks: riskEmail,
    blockers: blockerEmail,
    actions: actionsEmail,
  };
}


export async function generateWeeklyStatusUpdate(
  projectId: string,
  decisions: any[],
  risks: any[],
  actionItems: any[],
  completedItems: any[]
): Promise<{ subject: string; body: string; status: "green" | "yellow" | "red" }> {
  try {
    const prompt = `Generate a weekly PM status update for project ${projectId} with:

Decisions This Week: ${decisions.length} decisions made
Active Risks: ${risks.length} risks identified
Action Items: ${actionItems.length} total items (${completedItems.length} completed)

Sample Decisions: ${JSON.stringify(decisions.slice(0, 3))}
Sample Risks: ${JSON.stringify(risks.slice(0, 3))}
Sample Action Items: ${JSON.stringify(actionItems.slice(0, 5))}

The status update should include:
- Overall status (green/yellow/red) based on risk levels and completion rate
- Key wins this week
- Risks and mitigations
- Next week focus
- Blockers (if any)
- Professional PM tone

Return ONLY a valid JSON object with this exact structure:
{
  "subject": "Weekly Status: Project Update - [Status]",
  "body": "Full status update with sections",
  "status": "green"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const result = JSON.parse(content);
    return result;
  } catch (error: any) {
    console.error("Error in generateWeeklyStatusUpdate:", error);
    throw new Error(`Failed to generate weekly status: ${error.message}`);
  }
}

export async function generateWhatChangedSummary(
  previousAnalyses: any[],
  currentAnalysis: any
): Promise<{
  newDecisions: string[];
  changedRisks: string[];
  resolvedItems: string[];
  summary: string;
}> {
  try {
    // Simplify the data we send to OpenAI to avoid token limits
    const previousSummary = previousAnalyses.map(a => ({
      id: a.id,
      decisionsCount: a.decisionsCount,
      risksCount: a.risksCount,
      createdAt: a.createdAt,
    }));

    const prompt = `Compare previous analyses with current analysis and identify what changed:

Previous Analyses Count: ${previousAnalyses.length}
Previous Summary: ${JSON.stringify(previousSummary)}

Current Analysis:
- Decisions: ${currentAnalysis.decisions?.length || 0}
- Risks: ${currentAnalysis.risks?.length || 0}
- Action Items: ${currentAnalysis.actionItems?.length || 0}

Sample Current Decisions: ${JSON.stringify(currentAnalysis.decisions?.slice(0, 3) || [])}
Sample Current Risks: ${JSON.stringify(currentAnalysis.risks?.slice(0, 3) || [])}

Identify:
- New decisions made (list specific decisions)
- Changed risk levels (describe changes)
- Resolved action items (if any)
- Overall summary of what changed

Return ONLY a valid JSON object with this exact structure:
{
  "newDecisions": ["decision 1", "decision 2"],
  "changedRisks": ["risk change 1", "risk change 2"],
  "resolvedItems": ["resolved item 1"],
  "summary": "Brief summary of what changed"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const result = JSON.parse(content);
    return result;
  } catch (error: any) {
    console.error("Error in generateWhatChangedSummary:", error);
    throw new Error(`Failed to generate what changed summary: ${error.message}`);
  }
}

export async function handleCommand(command: string, context?: any): Promise<{
  intent: string;
  plan: string[];
  response: string;
  actions: Array<{ action: string; type: string }>;
}> {
  const systemPrompt = `You are ActionLayer AI, a PM command assistant. 
Interpret user commands and provide structured responses with:
1. Intent (what the user wants)
2. Plan (steps to accomplish it)
3. Response (natural language answer)
4. Proposed actions (concrete next steps)`;

  const userPrompt = `Command: ${command}
${context ? `Context: ${JSON.stringify(context)}` : ""}

Respond with JSON:
{
  "intent": "string",
  "plan": ["step 1", "step 2", ...],
  "response": "natural language response",
  "actions": [{"action": "string", "type": "jira|email|escalate|report"}]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const result = JSON.parse(completion.choices[0].message.content || "{}");
  return result;
}

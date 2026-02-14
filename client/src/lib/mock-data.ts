export const projects = [
  { id: "1", name: "BI Data Cloud" },
  { id: "2", name: "BSC M360" },
  { id: "3", name: "Takeda" },
];

export const dashboardMetrics = {
  highRiskItems: 3,
  overdueActions: 7,
  decisionsAwaiting: 4,
  blockedItems: 2,
};

export const riskDriftData = [
  {
    id: "1",
    risk: "Data pipeline latency exceeding SLA thresholds",
    severity: "High" as const,
    mentions: 12,
    lastSeen: "2026-02-13",
    trend: [3, 5, 4, 7, 8, 10, 12],
  },
  {
    id: "2",
    risk: "Third-party vendor contract renewal deadline approaching",
    severity: "High" as const,
    mentions: 8,
    lastSeen: "2026-02-12",
    trend: [1, 2, 3, 4, 5, 7, 8],
  },
  {
    id: "3",
    risk: "Team bandwidth constraints for Q2 deliverables",
    severity: "Med" as const,
    mentions: 6,
    lastSeen: "2026-02-14",
    trend: [2, 2, 3, 4, 5, 5, 6],
  },
  {
    id: "4",
    risk: "API versioning mismatch with downstream consumers",
    severity: "Med" as const,
    mentions: 5,
    lastSeen: "2026-02-11",
    trend: [1, 1, 2, 3, 4, 4, 5],
  },
  {
    id: "5",
    risk: "Security audit findings unresolved from last sprint",
    severity: "Low" as const,
    mentions: 3,
    lastSeen: "2026-02-10",
    trend: [1, 1, 1, 2, 2, 3, 3],
  },
];

export const dependencyChains = [
  {
    id: "1",
    task: "Deploy ML model v2.3",
    blockedBy: "Data validation pipeline completion",
    owner: "Platform Team",
    status: "blocked" as const,
  },
  {
    id: "2",
    task: "Client dashboard redesign",
    blockedBy: "API endpoint migration",
    owner: "Sarah Chen",
    status: "at-risk" as const,
  },
  {
    id: "3",
    task: "Compliance report generation",
    blockedBy: "Audit log schema approval",
    owner: "Legal/Engineering",
    status: "blocked" as const,
  },
];

export const recentRuns = [
  {
    id: "1",
    date: "2026-02-14 09:30",
    project: "BI Data Cloud",
    inputType: "Transcript" as const,
    outcome: "Escalate" as const,
    status: "completed" as const,
  },
  {
    id: "2",
    date: "2026-02-13 14:15",
    project: "BSC M360",
    inputType: "Command" as const,
    outcome: "Jira" as const,
    status: "completed" as const,
  },
  {
    id: "3",
    date: "2026-02-13 11:00",
    project: "Takeda",
    inputType: "Intake" as const,
    outcome: "Follow-up" as const,
    status: "in-progress" as const,
  },
  {
    id: "4",
    date: "2026-02-12 16:45",
    project: "BI Data Cloud",
    inputType: "Transcript" as const,
    outcome: "Jira" as const,
    status: "completed" as const,
  },
  {
    id: "5",
    date: "2026-02-12 10:00",
    project: "BSC M360",
    inputType: "Transcript" as const,
    outcome: "Escalate" as const,
    status: "failed" as const,
  },
];

export const analysisSummary = {
  execSummary: [
    "Client expressed concern about Q2 delivery timeline, specifically around the ML model integration milestone.",
    "Team agreed to fast-track the data validation pipeline to unblock downstream dependencies.",
    "Vendor contract renewal needs immediate attention \u2014 current terms expire March 15.",
    "Three action items assigned with owners; two require cross-team coordination.",
  ],
  decisionsCount: 4,
  risksCount: 3,
  blockersCount: 2,
};

export const analysisDecisions = [
  {
    id: "1",
    decision: "Fast-track data validation pipeline to 2-week sprint",
    owner: "Marcus Rivera",
    rationale: "Critical path dependency for ML model deployment",
    date: "2026-02-14",
    confidence: 92,
    evidence: "Client specifically stated: 'We need the pipeline done before we can even think about model deployment.'",
  },
  {
    id: "2",
    decision: "Negotiate vendor contract extension for 90 days",
    owner: "Lisa Park",
    rationale: "Current terms favorable; renegotiation requires board approval",
    date: "2026-02-14",
    confidence: 85,
    evidence: "Discussion around minutes 12\u201315 confirmed urgency of contract timeline.",
  },
  {
    id: "3",
    decision: "Hire two additional backend engineers for Q2",
    owner: "James Okonkwo",
    rationale: "Bandwidth analysis shows 30% deficit for planned deliverables",
    date: "2026-02-14",
    confidence: 68,
    evidence: "Team lead mentioned 'we\u2019re stretched thin' but no formal capacity analysis was presented.",
  },
  {
    id: "4",
    decision: "Adopt GraphQL for new API endpoints",
    owner: "Sarah Chen",
    rationale: "Reduces over-fetching and simplifies frontend data layer",
    date: "2026-02-14",
    confidence: 78,
    evidence: "Engineering consensus during technical discussion segment.",
  },
];

export const analysisRisks = [
  {
    id: "1",
    risk: "ML model deployment delayed beyond Q2",
    likelihood: "High",
    impact: "High",
    severity: "High" as const,
    owner: "Marcus Rivera",
    mitigation: "Fast-track validation pipeline; daily standups for blockers",
    confidence: 90,
    evidence: "Multiple references to tight timeline throughout the call.",
  },
  {
    id: "2",
    risk: "Vendor contract lapse causing service disruption",
    likelihood: "Med",
    impact: "High",
    severity: "High" as const,
    owner: "Lisa Park",
    mitigation: "Initiate renewal process immediately; prepare fallback vendor list",
    confidence: 88,
    evidence: "Contract expiry date confirmed as March 15, 2026.",
  },
  {
    id: "3",
    risk: "Team burnout from accelerated sprint cadence",
    likelihood: "Med",
    impact: "Med",
    severity: "Med" as const,
    owner: "James Okonkwo",
    mitigation: "Monitor velocity; implement no-meeting Wednesdays",
    confidence: 55,
    evidence: "Indirect references to workload; no explicit burnout discussion.",
  },
];

export const jiraDrafts = [
  {
    id: "1",
    title: "Fast-track Data Validation Pipeline",
    story: "As a data engineer, I want the validation pipeline completed in a 2-week sprint so that ML model deployment can proceed on schedule.",
    criteria: [
      "All data quality checks pass for production datasets",
      "Pipeline handles 10K records/second throughput",
      "Error reporting integrated with Slack notifications",
      "Documentation updated in Confluence",
    ],
    dependencies: ["Schema approval from Data Architecture team"],
    priority: "High" as const,
  },
  {
    id: "2",
    title: "Vendor Contract Renewal - 90 Day Extension",
    story: "As a project manager, I want the vendor contract extended by 90 days so that we maintain service continuity while negotiating new terms.",
    criteria: [
      "Extension agreement signed by both parties",
      "Current SLA terms preserved during extension",
      "Finance team notified of budget implications",
    ],
    dependencies: ["Legal review of extension terms"],
    priority: "High" as const,
  },
  {
    id: "3",
    title: "GraphQL API Migration - Phase 1",
    story: "As a frontend developer, I want new API endpoints available via GraphQL so that data fetching is more efficient and type-safe.",
    criteria: [
      "Schema defined for User, Project, and Task entities",
      "Query resolvers implemented with pagination",
      "Mutation resolvers for CRUD operations",
      "Integration tests covering all endpoints",
    ],
    dependencies: ["API versioning strategy finalized"],
    priority: "Med" as const,
  },
];

export const followUpDraft = `Hi team,

Thank you for a productive session today. Here's a quick recap of our key decisions and next steps:

**Decisions Made:**
1. Fast-track the data validation pipeline (2-week sprint) \u2014 Owner: Marcus
2. Negotiate 90-day vendor contract extension \u2014 Owner: Lisa
3. Proceed with GraphQL for new API endpoints \u2014 Owner: Sarah

**Action Items:**
- Marcus: Kick off validation pipeline sprint by EOD Monday
- Lisa: Schedule vendor call by Wednesday
- James: Submit headcount request for 2 backend engineers
- Sarah: Draft GraphQL schema proposal by Friday

**Risks to Watch:**
- ML model deployment timeline (High severity)
- Vendor contract expiry on March 15 (High severity)

Please flag any blockers in #project-risks. Next sync: Tuesday 10am.

Best,
ActionLayer AI`;

export const proposedActions = [
  { id: "1", action: "Create 3 Jira tickets", type: "jira" as const, selected: true },
  { id: "2", action: "Send follow-up email to 6 recipients", type: "email" as const, selected: true },
  { id: "3", action: "Escalate risk: ML model deployment delay", type: "escalate" as const, selected: false },
];

export const commandSuggestions = [
  "What are my top risks this week?",
  "Generate weekly status update",
  "Create Jira stories from last run",
  "What changed since last week?",
  "Who is blocked and why?",
];

export const commandResponse = {
  intent: "Risk Assessment Query",
  plan: [
    "Scanning all active projects for risk indicators",
    "Cross-referencing with historical risk drift data",
    "Identifying top 5 risks by severity and recurrence",
    "Generating actionable recommendations",
  ],
  actions: [
    { id: "1", action: "Generate risk report for stakeholders", selected: true },
    { id: "2", action: "Create follow-up tasks for risk owners", selected: true },
    { id: "3", action: "Schedule risk review meeting", selected: false },
  ],
};

export const memoryTimeline = [
  {
    id: "1",
    type: "decision" as const,
    title: "Adopted microservices architecture for payment module",
    project: "BI Data Cloud",
    date: "2026-02-14",
    severity: null,
    source: "Client Call - Feb 14",
  },
  {
    id: "2",
    type: "risk" as const,
    title: "Data pipeline latency exceeding SLA thresholds",
    project: "BI Data Cloud",
    date: "2026-02-13",
    severity: "High" as const,
    source: "Internal Standup - Feb 13",
  },
  {
    id: "3",
    type: "action" as const,
    title: "Submit headcount request for 2 backend engineers",
    project: "BSC M360",
    date: "2026-02-13",
    severity: null,
    source: "Planning Session - Feb 13",
  },
  {
    id: "4",
    type: "jira" as const,
    title: "JIRA-1234: Fast-track Data Validation Pipeline",
    project: "BI Data Cloud",
    date: "2026-02-12",
    severity: null,
    source: "Transcript Analysis - Feb 12",
  },
  {
    id: "5",
    type: "risk" as const,
    title: "Vendor contract lapse causing service disruption",
    project: "Takeda",
    date: "2026-02-12",
    severity: "High" as const,
    source: "Client Call - Feb 12",
  },
  {
    id: "6",
    type: "decision" as const,
    title: "Proceed with GraphQL for new API endpoints",
    project: "BSC M360",
    date: "2026-02-11",
    severity: null,
    source: "Internal Standup - Feb 11",
  },
  {
    id: "7",
    type: "action" as const,
    title: "Draft GraphQL schema proposal",
    project: "BSC M360",
    date: "2026-02-11",
    severity: null,
    source: "Planning Session - Feb 11",
  },
  {
    id: "8",
    type: "risk" as const,
    title: "Team burnout from accelerated sprint cadence",
    project: "BSC M360",
    date: "2026-02-10",
    severity: "Med" as const,
    source: "Internal Standup - Feb 10",
  },
];

export const crossCallInsights = {
  recurringRisks: [
    { risk: "Pipeline latency", count: 5, projects: ["BI Data Cloud", "BSC M360"] },
    { risk: "Resource constraints", count: 4, projects: ["BSC M360", "Takeda"] },
    { risk: "Vendor dependencies", count: 3, projects: ["Takeda"] },
  ],
  repeatedBlockers: [
    { blocker: "Schema approval delays", count: 3 },
    { blocker: "Cross-team coordination gaps", count: 2 },
  ],
  unexecutedDecisions: [
    { decision: "Migrate to event-driven architecture", daysPending: 14 },
    { decision: "Implement automated regression tests", daysPending: 21 },
  ],
};

export const intakeQuestions = [
  "What type of meeting was this?",
  "Who were the key participants?",
  "What was the main topic or agenda?",
  "Were any decisions made? If so, what?",
  "Were any risks or concerns raised?",
  "Are there any action items or follow-ups?",
  "Were there any blockers discussed?",
  "Anything else worth noting?",
];

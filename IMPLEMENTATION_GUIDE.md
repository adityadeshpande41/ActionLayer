# ActionLayer Implementation Guide

## Project Overview

ActionLayer is an AI-powered PM Copilot that transforms meeting conversations into actionable intelligence with human-in-the-loop control.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      INPUT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  1. Transcript Upload (txt/md/pdf)                          │
│  2. PM Intake Conversation (guided questions)                │
│  3. Voice/Text Commands (delegation mode)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  NORMALIZATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Canonical Call Context:                                     │
│  • Participants, Decisions, Risks, Actions, Dependencies    │
│  • Confidence flags, Evidence snippets                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  INTELLIGENCE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  • Decision Extraction (owner, rationale, confidence)        │
│  • Risk Detection (explicit + implicit, severity)            │
│  • Dependency Mapping (blockers, chains)                     │
│  • Confidence & Gap Check (missing owners, low confidence)   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   WORKFLOW ROUTER                            │
├─────────────────────────────────────────────────────────────┤
│  Outcomes: no-action | follow-up | jira-needed |            │
│            escalation | waiting                              │
│  Proposes: Jira tickets, emails, escalations                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 HUMAN-IN-THE-LOOP                            │
├─────────────────────────────────────────────────────────────┤
│  PM Reviews:                                                 │
│  • Proposed actions with confidence scores                   │
│  • Evidence snippets for verification                        │
│  • Items flagged for review                                  │
│  Actions: Approve / Edit / Discard                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  AUTOMATION OUTPUTS                          │
├─────────────────────────────────────────────────────────────┤
│  • Jira Story Drafts (with acceptance criteria)             │
│  • Follow-up Emails (decisions + actions + risks)            │
│  • Status Updates (weekly/ad-hoc)                            │
│  • Escalation Messages                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   MEMORY & CONTEXT                           │
├─────────────────────────────────────────────────────────────┤
│  Cross-call Intelligence:                                    │
│  • Risk Drift Detection (recurring risks, trends)            │
│  • Decision Conflicts (contradictions across calls)          │
│  • Recurring Blockers (repeated dependencies)                │
│  • Unresolved Items (pending actions, open risks)            │
└─────────────────────────────────────────────────────────────┘
```

## Key Features Implemented

### 1. Three Input Modes

#### A. Transcript Analysis
- **Endpoint**: `POST /api/analyses/analyze`
- **Supports**: .txt, .md, .pdf files
- **Process**: Upload → Extract text → AI analysis → Structured output

#### B. PM Intake Conversation
- **Endpoints**: 
  - `GET /api/analyses/intake/questions` - Get guided questions
  - `POST /api/analyses/intake/process` - Process answers
- **Flow**: 
  1. System asks 8 targeted questions
  2. PM provides answers
  3. AI synthesizes into context
  4. Checks for gaps, asks follow-up if needed
  5. Runs full analysis

#### C. Command Mode
- **Endpoint**: `POST /api/command`
- **Examples**:
  - "What are my top risks this week?"
  - "Create Jira tickets from yesterday's meeting"
  - "Generate weekly status update"

### 2. Intelligence Layer

#### Decision Extraction
```typescript
{
  decision: string,
  owner: string,
  rationale: string,
  confidence: number (0-100),
  evidence: string (quote from transcript)
}
```

#### Risk Detection
```typescript
{
  risk: string,
  likelihood: "High" | "Med" | "Low",
  impact: "High" | "Med" | "Low",
  severity: "High" | "Med" | "Low",
  owner: string,
  mitigation: string,
  confidence: number,
  evidence: string
}
```

#### Confidence Flags
- Low confidence (<70%) → Needs Review
- Missing owner → Needs Review
- Conflicting decisions → Flagged

### 3. Workflow Router

**Service**: `server/services/workflow-router.ts`

Routes analysis to appropriate outcome:
- ✅ **no-action**: Analysis complete, no critical actions
- 🔁 **follow-up**: Communication needed
- 🧩 **jira-needed**: Work items require tracking
- 🚨 **escalation**: High-severity risks need attention
- ⏳ **waiting**: Blocked by external dependencies

Proposes specific actions with priority and auto-approve flags.

### 4. Human-in-the-Loop Control

**Endpoints**: `/api/approvals/*`

Before execution, PM sees:
- Proposed actions with confidence scores
- Evidence snippets for verification
- Items flagged for review (low confidence, missing owners)

PM can:
- **Approve**: Execute proposed actions
- **Edit**: Modify before execution
- **Discard**: Reject analysis

### 5. Memory & Context

**Service**: `server/services/memory.ts`

#### Risk Drift Detection
Tracks risks across calls:
- Occurrence count
- Trend (increasing/stable/decreasing)
- First seen / last seen dates
- Affected projects

#### Decision Conflicts
Detects contradictory decisions:
- "Adopt GraphQL" vs "Avoid GraphQL"
- Flags for PM review

#### Cross-call Insights
- Recurring blockers
- Unresolved action items
- Pending decisions

### 6. PM Command Center

**Endpoint**: `GET /api/command/insights/:projectId`

Answers key PM questions:
- **What should I worry about today?**
  - High risks
  - Overdue actions
  - Blocked items

- **What changed since last week?**
  - New risks
  - New decisions
  - Completed actions

- **Who is blocked and why?**
  - Dependency chains
  - Blocker owners

- **What am I waiting on?**
  - Pending actions owned by others

- **Who is waiting on me?**
  - Actions assigned to current user

## API Endpoints Reference

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login
POST   /api/auth/logout        - Logout
GET    /api/auth/me            - Get current user
```

### Projects
```
GET    /api/projects           - List user's projects
GET    /api/projects/:id       - Get project
POST   /api/projects           - Create project
PATCH  /api/projects/:id       - Update project
```

### Analyses
```
GET    /api/analyses/project/:projectId     - Get project analyses
GET    /api/analyses/recent                 - Get recent analyses
GET    /api/analyses/:id                    - Get analysis details
POST   /api/analyses/analyze                - Analyze transcript (file upload)
GET    /api/analyses/intake/questions       - Get intake questions
POST   /api/analyses/intake/process         - Process intake answers
POST   /api/analyses/:id/jira               - Generate Jira drafts
POST   /api/analyses/:id/followup           - Generate follow-up email
```

### Command Mode
```
POST   /api/command                         - Execute command
GET    /api/command/insights/:projectId     - Get PM insights
```

### Approvals
```
GET    /api/approvals/analysis/:id          - Get pending approvals
POST   /api/approvals/analysis/:id/approve  - Approve and execute
POST   /api/approvals/analysis/:id/reject   - Reject analysis
```

### Dashboard
```
GET    /api/dashboard/metrics               - Get dashboard metrics
GET    /api/dashboard/risk-drift            - Get risk drift data
GET    /api/dashboard/recent-runs           - Get recent runs
```

## Data Flow Examples

### Example 1: Transcript Analysis

```
1. PM uploads meeting transcript
   POST /api/analyses/analyze
   { projectId, file: transcript.txt }

2. System processes:
   - Extracts text from file
   - Sends to OpenAI for analysis
   - Extracts decisions, risks, actions
   - Runs workflow router
   - Detects risk drift
   - Checks for decision conflicts

3. Returns structured analysis:
   {
     analysis: { id, status, summary },
     decisions: [...],
     risks: [...],
     actionItems: [...],
     workflow: {
       outcome: "jira-needed",
       proposedActions: [
         { type: "jira", description: "Create 3 tickets", priority: "high" }
       ],
       needsReview: ["2 decisions with low confidence"]
     },
     insights: {
       riskDrift: [...],
       conflicts: [...]
     }
   }

4. PM reviews in UI:
   - Sees proposed actions
   - Reviews flagged items
   - Edits if needed

5. PM approves:
   POST /api/approvals/analysis/:id/approve
   { actions: ["create-jira", "send-email"] }

6. System executes:
   - Generates Jira drafts
   - Creates follow-up email
   - Returns artifacts to PM
```

### Example 2: Intake Conversation

```
1. PM has no transcript, starts intake
   GET /api/analyses/intake/questions
   Returns: 8 guided questions

2. PM answers questions in UI
   POST /api/analyses/intake/process
   { projectId, answers: { meeting_type: "...", ... } }

3. System synthesizes context:
   - Converts answers to narrative
   - Checks for gaps
   - May ask follow-up question

4. If complete, runs full analysis
   (same as transcript flow)
```

### Example 3: Command Mode

```
1. PM asks: "What are my top risks this week?"
   POST /api/command
   { command: "What are my top risks this week?", projectId }

2. System:
   - Loads project context (risks, actions, decisions)
   - Adds memory insights (drift, trends)
   - Sends to OpenAI with rich context

3. Returns:
   {
     intent: "Risk Assessment Query",
     plan: ["Scan projects", "Cross-reference drift", ...],
     response: "Your top 3 risks are...",
     actions: [
       { action: "Generate risk report", type: "report" }
     ]
   }
```

## Frontend Integration

### Using the API Client

```typescript
import { analyses, command, approvals } from "@/lib/api";

// Analyze transcript
const result = await analyses.analyze({
  projectId: "123",
  meetingType: "Client Call",
  file: uploadedFile
});

// Process intake
const questions = await analyses.getIntakeQuestions();
const intakeResult = await analyses.processIntake({
  projectId: "123",
  answers: { meeting_type: "Standup", ... }
});

// Execute command
const cmdResult = await command.execute({
  command: "What changed this week?",
  projectId: "123"
});

// Get insights
const insights = await command.getInsights("123");

// Approve actions
await approvals.approve(analysisId, {
  actions: ["create-jira", "send-email"],
  edits: { /* optional edits */ }
});
```

## Configuration

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-your-key
SESSION_SECRET=your-secret

# Optional
DATABASE_URL=postgresql://...
PORT=5000
NODE_ENV=production
MAX_FILE_SIZE=10485760
```

### OpenAI Models Used

- **gpt-4o**: Primary model for all analysis
- **Temperature**: 0.3 for extraction, 0.5-0.7 for generation
- **JSON Mode**: Enabled for structured outputs

## Testing the System

### 1. Test Transcript Analysis

```bash
curl -X POST http://localhost:5000/api/analyses/analyze \
  -H "Content-Type: multipart/form-data" \
  -F "projectId=123" \
  -F "meetingType=Client Call" \
  -F "file=@transcript.txt"
```

### 2. Test Intake Mode

```bash
# Get questions
curl http://localhost:5000/api/analyses/intake/questions

# Submit answers
curl -X POST http://localhost:5000/api/analyses/intake/process \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "123",
    "answers": {
      "meeting_type": "Standup",
      "participants": "Team leads",
      "main_topic": "Sprint planning",
      "decisions": "Decided to use GraphQL",
      "risks": "Timeline is tight",
      "action_items": "Create tickets by EOD"
    }
  }'
```

### 3. Test Command Mode

```bash
curl -X POST http://localhost:5000/api/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "What are my top risks this week?",
    "projectId": "123"
  }'
```

## Next Steps for Production

1. **Database Migration**: Switch from in-memory to PostgreSQL
2. **File Storage**: Implement S3 or similar for transcript files
3. **Rate Limiting**: Add API rate limits
4. **Monitoring**: Set up error tracking and performance monitoring
5. **Webhooks**: Add Jira/Slack integrations
6. **Voice Input**: Implement real STT for voice commands
7. **Embeddings**: Use vector similarity for better risk/decision matching
8. **Notifications**: Real-time alerts for high-severity risks
9. **Collaboration**: Multi-user project access
10. **Analytics**: Usage tracking and insights

## Security Considerations

- All routes except `/api/auth/*` require authentication
- Session-based auth with secure cookies
- File uploads limited to 10MB
- Input validation on all endpoints
- SQL injection protection via Drizzle ORM
- XSS protection via React
- CSRF protection via SameSite cookies

## Performance Optimization

- OpenAI calls are the bottleneck (10-30s)
- Consider implementing:
  - Request queuing for high volume
  - Caching for repeated queries
  - Streaming responses for real-time feedback
  - Background job processing

## Support & Troubleshooting

See SETUP.md for detailed troubleshooting guide.

Common issues:
- OpenAI API key not set → Check .env
- Analysis timeout → Check OpenAI rate limits
- Session not persisting → Verify SESSION_SECRET
- File upload fails → Check MAX_FILE_SIZE

---

**Built with**: React, TypeScript, Express, OpenAI GPT-4, PostgreSQL, Drizzle ORM

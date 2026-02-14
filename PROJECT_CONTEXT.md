# Project Context & Data Persistence

## How Your Data is Saved

Your analysis data is **automatically saved** to the database when you run an analysis. Here's what gets saved:

### 1. Project Selection
- The project dropdown in the top-right corner lets you select which project to analyze
- This selection is now **shared across all pages** (Dashboard, Analyze, Command, Memory)
- When you run an analysis, it's saved to the currently selected project

### 2. What Gets Saved Automatically

When you analyze a transcript, the system saves:

**Analysis Record**
- Analysis ID (unique identifier)
- Project ID (which project it belongs to)
- User ID (who ran it)
- Timestamp
- Status (completed/failed)
- Summary points

**Decisions**
- Each decision extracted from the transcript
- Owner, rationale, confidence level
- Evidence (quote from transcript)

**Risks**
- Each risk identified
- Severity, likelihood, impact
- Mitigation strategy
- Owner

**Action Items**
- Each action item
- Owner, priority
- Status (pending/completed)

**Dependencies**
- Task dependencies and blockers

### 3. Where to View Saved Data

**Dashboard Page**
- Shows metrics across all your analyses
- Recent analyses list
- Risk drift detection (risks that keep appearing)

**Memory Page** (Coming Soon)
- Will show historical context
- Cross-call intelligence
- Decision conflicts

### 4. Current Storage

Right now, the app uses **in-memory storage**, which means:
- ✅ Everything works perfectly while the server is running
- ❌ Data is lost when you restart the server
- 🔄 To persist data permanently, you'll need to switch to PostgreSQL

### 5. Switching to PostgreSQL (Optional)

To make data persist across server restarts:

1. Set up a PostgreSQL database
2. Update `DATABASE_URL` in `.env`
3. The storage layer will automatically use PostgreSQL instead of memory

The code is already written to support both - just change the connection string!

## Project Workflow

1. **Select Project** - Use dropdown in top-right
2. **Analyze Transcript** - Go to Analyze page, paste transcript
3. **Generate Jira** - Click "Generate Jira Stories" button
4. **Generate Follow-Up** - Click "Generate Follow-Up" button
5. **View History** - Go to Dashboard to see all past analyses

## Data Flow

```
User Input (Transcript)
    ↓
OpenAI Analysis (GPT-4)
    ↓
Structured Data (Decisions, Risks, Actions)
    ↓
Database Storage (Automatic)
    ↓
Dashboard Metrics (Real-time)
```

All of this happens automatically - you don't need to manually save anything!

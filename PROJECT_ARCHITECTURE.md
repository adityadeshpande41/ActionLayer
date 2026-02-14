# ActionLayer - Project Architecture Overview

## 🎯 What is ActionLayer?

ActionLayer is an **AI-powered PM (Project Manager) Copilot** that helps product managers analyze meetings, track decisions, manage risks, and automate project management workflows. Think of it as your AI assistant that turns meeting transcripts into actionable insights.

---

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing (lightweight React Router alternative)
- **TanStack Query** for data fetching and caching
- **Tailwind CSS** + **shadcn/ui** for beautiful, accessible components
- **Vite** for fast development and building

### Backend
- **Express.js 5** (Node.js server)
- **TypeScript** throughout
- **OpenAI GPT-4o** for AI analysis
- **In-Memory Storage** (MemStorage class) - data resets on server restart
- **Express Session** for authentication
- **bcrypt** for password hashing

### Development
- **tsx** for running TypeScript directly
- **Drizzle ORM** (configured but using in-memory storage)
- **ESBuild** for production builds

---

## 📁 Project Structure

```
ActionLayer/
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── app-header.tsx
│   │   │   ├── app-sidebar.tsx
│   │   │   └── protected-route.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── home.tsx     # Landing/login page
│   │   │   ├── dashboard.tsx
│   │   │   ├── analyze.tsx  # Main analysis page
│   │   │   ├── calendar.tsx
│   │   │   ├── command.tsx
│   │   │   ├── memory.tsx
│   │   │   └── preferences.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities
│   │   │   ├── api.ts       # API client functions
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx          # Main app with routing
│   │   └── main.tsx         # Entry point
│   └── index.html
│
├── server/                   # Backend Express server
│   ├── routes/              # API route handlers
│   │   ├── auth.ts          # Login, register, logout
│   │   ├── projects.ts      # Project CRUD
│   │   ├── analyses.ts      # Analysis endpoints
│   │   ├── calendar.ts      # Calendar events
│   │   ├── command.ts       # Voice/text commands
│   │   ├── dashboard.ts     # Dashboard data
│   │   ├── approvals.ts     # Action approvals
│   │   └── init.ts          # Initial setup
│   ├── services/            # Business logic
│   │   ├── openai.ts        # AI analysis functions
│   │   ├── intake.ts        # PM intake questions
│   │   ├── workflow-router.ts
│   │   └── memory.ts        # Context/memory layer
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # Route registration
│   ├── storage.ts           # In-memory data storage
│   ├── static.ts            # Static file serving
│   └── vite.ts              # Vite dev server integration
│
├── shared/                  # Shared code between client/server
│   └── schema.ts            # TypeScript types & Zod schemas
│
└── Configuration files
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── .env
```

---

## 🔐 Authentication System

### How Login Works

#### 1. Session-Based Authentication
- Uses **express-session** middleware
- Sessions stored in memory (resets on server restart)
- Session cookie: `actionlayer.sid`
- Cookie settings:
  - `httpOnly: true` (prevents XSS attacks)
  - `maxAge: 7 days`
  - `sameSite: 'lax'`
  - `secure: false` (for localhost development)

#### 2. Authentication Flow

**Registration (`POST /api/auth/register`):**
```
1. User submits username, password, email
2. Check if username already exists
3. Hash password with bcrypt (10 rounds)
4. Create user in storage
5. Set session.userId = user.id
6. Save session explicitly
7. Return user data (without password)
```

**Login (`POST /api/auth/login`):**
```
1. User submits username, password
2. Find user by username
3. Compare password with bcrypt
4. If valid, set session.userId = user.id
5. Save session explicitly
6. Return user data
```

**Session Check (`GET /api/auth/me`):**
```
1. Check if session.userId exists
2. Fetch user from storage
3. Return user data or 401 Unauthorized
```

**Logout (`POST /api/auth/logout`):**
```
1. Destroy session
2. Clear cookie
3. Return success message
```

#### 3. Protected Routes
All API routes except `/api/auth/*` require authentication:

```typescript
// Middleware in server/routes.ts
async function requireAuth(req, res, next) {
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = user;  // Attach user to request
  next();
}
```

Applied to routes:
```typescript
app.use("/api/projects", requireAuth, projectsRouter);
app.use("/api/analyses", requireAuth, analysesRouter);
app.use("/api/calendar", requireAuth, calendarRouter);
// etc...
```

#### 4. Frontend Authentication
- `ProtectedRoute` component checks auth status
- Redirects to `/` (login page) if not authenticated
- Uses TanStack Query to fetch `/api/auth/me`
- Stores user data in React Query cache

---

## 🗄️ Data Storage

### Current: In-Memory Storage (MemStorage)

**Location:** `server/storage.ts`

**How it works:**
- Uses JavaScript `Map` objects to store data
- Each entity type has its own Map (users, projects, analyses, etc.)
- Data persists only while server is running
- **Data is lost when server restarts**

**Entities stored:**
```typescript
- users: Map<string, User>
- projects: Map<string, Project>
- transcripts: Map<string, Transcript>
- analyses: Map<string, Analysis>
- decisions: Map<string, Decision>
- risks: Map<string, Risk>
- actionItems: Map<string, ActionItem>
- calendarEvents: Map<string, CalendarEvent>
```

**Why in-memory?**
- Fast development and testing
- No database setup required
- Easy to reset and start fresh
- Perfect for prototyping

**Future: Database Migration**
- Drizzle ORM is already configured
- Schema defined in `shared/schema.ts`
- Can easily switch to PostgreSQL/SQLite
- Just need to implement database storage class

---

## 🚀 Backend API Structure

### Server Entry Point (`server/index.ts`)

```typescript
1. Load environment variables (.env)
2. Create Express app
3. Setup middleware:
   - JSON body parser
   - URL-encoded parser
   - Request logging
4. Register routes (auth, projects, analyses, etc.)
5. Setup error handling
6. In development: Start Vite dev server
7. In production: Serve static files
8. Listen on port 5001 (or PORT env variable)
```

### Route Registration (`server/routes.ts`)

```typescript
// Session middleware applied to all routes
app.use(sessionMiddleware);

// Public routes
app.use("/api/auth", authRouter);

// Protected routes (require authentication)
app.use("/api/projects", requireAuth, projectsRouter);
app.use("/api/analyses", requireAuth, analysesRouter);
app.use("/api/command", requireAuth, commandRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/approvals", requireAuth, approvalsRouter);
app.use("/api/calendar", requireAuth, calendarRouter);
```

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

#### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project

#### Analyses
- `POST /api/analyses/analyze` - Analyze transcript (with file upload)
- `POST /api/analyses/intake/process` - Process PM intake
- `GET /api/analyses/intake/questions` - Get intake questions
- `GET /api/analyses/:id` - Get analysis with all data
- `GET /api/analyses/project/:projectId` - List project analyses
- `DELETE /api/analyses/:id` - Delete analysis
- `POST /api/analyses/:id/jira` - Generate Jira stories
- `POST /api/analyses/:id/followup` - Generate follow-up emails
- `POST /api/analyses/weekly-status/:projectId` - Generate weekly status
- `POST /api/analyses/:id/what-changed` - Generate change summary

#### Calendar
- `GET /api/calendar/:projectId` - List calendar events
- `POST /api/calendar` - Create event
- `PUT /api/calendar/:id` - Update event
- `DELETE /api/calendar/:id` - Delete event
- `GET /api/calendar/:projectId/upcoming` - Get upcoming events

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity

---

## 🤖 AI Integration (OpenAI)

### Service: `server/services/openai.ts`

**Model:** GPT-4o (gpt-4o)

**Key Functions:**

1. **analyzeTranscript()**
   - Analyzes meeting transcripts
   - Extracts: decisions, risks, action items, dependencies
   - Returns structured JSON

2. **generateJiraDrafts()**
   - Creates Jira story tickets from decisions/actions
   - Includes: title, user story, acceptance criteria, priority

3. **generateFollowUpEmail()** (NEW - Multiple Emails)
   - General summary email
   - Risk alert email (if high/med risks)
   - Blocker email (if blockers exist)
   - Action items email (if actions exist)

4. **generateWeeklyStatusUpdate()**
   - Aggregates project data
   - Creates executive status update
   - Includes: progress, risks, blockers

5. **generateWhatChangedSummary()**
   - Compares current vs previous analyses
   - Identifies: new decisions, changed risks, resolved items

### Intake Service: `server/services/intake.ts`

**Purpose:** When PM doesn't have a transcript

**Functions:**
1. **synthesizeIntakeToContext()** - Converts Q&A into narrative
2. **generateFollowUpQuestion()** - AI asks clarifying questions
3. **intakeQuestions** - 8 predefined questions

---

## 🎨 Frontend Architecture

### Routing (Wouter)

```typescript
// client/src/App.tsx
<Route path="/" component={Home} />
<Route path="/dashboard" component={ProtectedRoute(Dashboard)} />
<Route path="/analyze" component={ProtectedRoute(Analyze)} />
<Route path="/calendar" component={ProtectedRoute(Calendar)} />
<Route path="/command" component={ProtectedRoute(Command)} />
<Route path="/memory" component={ProtectedRoute(Memory)} />
<Route path="/preferences" component={ProtectedRoute(Preferences)} />
```

### State Management

**TanStack Query** for server state:
- Automatic caching
- Background refetching
- Optimistic updates
- Query invalidation

**React useState** for local UI state:
- Form inputs
- Modal open/close
- Tab selection
- Loading states

### API Client (`client/src/lib/api.ts`)

Organized by feature:
```typescript
export const auth = {
  login, register, logout, getCurrentUser
};

export const projects = {
  list, create, get, update
};

export const analyses = {
  analyze, processIntake, get, delete,
  generateJira, generateFollowUp, 
  generateWeeklyStatus, generateWhatChanged
};

export const calendar = {
  list, create, update, delete, getUpcoming
};
```

---

## 🔄 Development Workflow

### Starting the Server

```bash
npm run dev
```

This runs: `NODE_ENV=development tsx server/index.ts`

**What happens:**
1. Server starts on port 5001
2. Vite dev server integrates with Express
3. Hot module replacement (HMR) enabled
4. API available at `http://localhost:5001/api/*`
5. Frontend available at `http://localhost:5001`

### Building for Production

```bash
npm run build
npm start
```

**Build process:**
1. Compiles TypeScript to JavaScript
2. Bundles frontend with Vite
3. Creates `dist/` folder
4. Production server serves static files

---

## 🔑 Environment Variables

**File:** `.env`

```bash
# OpenAI API Key (required for AI features)
OPENAI_API_KEY=sk-...

# Session Secret (for cookie signing)
SESSION_SECRET=your-secret-key-change-in-production

# Server Port (default: 5000, currently using 5001)
PORT=5001

# File Upload Limit (default: 10MB)
MAX_FILE_SIZE=10485760

# Node Environment
NODE_ENV=development
```

---

## 📊 Data Flow Example

### Analyzing a Transcript

```
1. User uploads transcript on /analyze page
   ↓
2. Frontend: analyses.analyze(data)
   ↓
3. POST /api/analyses/analyze
   ↓
4. Backend: Create transcript record
   ↓
5. Backend: Create analysis record (in-progress)
   ↓
6. Backend: Call OpenAI analyzeTranscript()
   ↓
7. OpenAI: Returns decisions, risks, actions
   ↓
8. Backend: Store all extracted data
   ↓
9. Backend: Run workflow router
   ↓
10. Backend: Update analysis (completed)
    ↓
11. Frontend: Display results in tabs
```

---

## 🎯 Key Features

### 1. Three Input Modes
- **Transcript Upload:** Upload/paste meeting transcripts
- **PM Intake:** Answer 8 questions (no transcript needed)
- **Voice/Text Command:** Quick commands (future)

### 2. AI Analysis
- Extracts decisions with owners and confidence
- Identifies risks with severity and mitigation
- Creates action items with priorities
- Detects dependencies and blockers

### 3. Workflow Automation
- Generates Jira story drafts
- Creates multiple targeted follow-up emails
- Produces weekly status updates
- Tracks what changed between analyses

### 4. Calendar Integration
- Schedule deadlines from Jira stories
- Track meetings, milestones, reminders
- Upcoming events sidebar

### 5. Dashboard
- Project overview
- Recent analyses
- Top risks
- Action items status

---

## 🚨 Important Notes

### Data Persistence
⚠️ **Data is NOT persistent!** 
- All data stored in memory
- Restarting server = data loss
- For production, migrate to database

### Session Management
- Sessions also in memory
- Users logged out on server restart
- For production, use Redis or database sessions

### Security Considerations
- Passwords hashed with bcrypt ✅
- Session cookies httpOnly ✅
- HTTPS required for production
- CORS needs configuration for production
- Rate limiting not implemented yet

### OpenAI Costs
- Each analysis calls GPT-4o
- Monitor API usage
- Consider caching results
- Implement usage limits per user

---

## 🔮 Future Enhancements

1. **Database Migration**
   - PostgreSQL with Drizzle ORM
   - Persistent data storage
   - Better query performance

2. **Real-time Features**
   - WebSocket support (ws package already installed)
   - Live collaboration
   - Real-time notifications

3. **Enhanced Security**
   - Rate limiting
   - CSRF protection
   - API key management
   - Role-based access control

4. **Integrations**
   - Jira API (actually create tickets)
   - Slack notifications
   - Email sending (SendGrid/AWS SES)
   - Calendar sync (Google Calendar)

5. **Analytics**
   - Usage tracking
   - AI accuracy metrics
   - User behavior insights

---

## 📝 Summary

**ActionLayer** is a full-stack TypeScript application that uses AI to help project managers analyze meetings and automate workflows. The backend is an Express.js server with session-based authentication and in-memory storage, while the frontend is a React SPA with Tailwind CSS. OpenAI GPT-4o powers the AI analysis features, extracting decisions, risks, and action items from meeting transcripts.

The authentication system uses express-session with bcrypt-hashed passwords, storing sessions in memory. All API routes except auth endpoints require authentication via a middleware that checks for a valid session.

Currently running on port 5001 with data stored in memory (resets on restart). Ready for database migration when needed for production deployment.

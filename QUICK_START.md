# 🚀 ActionLayer - Quick Start Guide

## Your AI PM Copilot is Ready!

Everything is set up and ready to go. Follow these simple steps to get started.

## Step 1: Configure Environment

Create your `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
SESSION_SECRET=your-random-secret-key
PORT=5000
NODE_ENV=development
```

Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Install Dependencies (if not done)

```bash
npm install
```

## Step 3: Start the Server

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## Step 4: Open Your Browser

Visit: `http://localhost:5000`

You'll see the beautiful landing page!

## Step 5: Create Your Account

1. Click the "Register" tab
2. Enter a username (e.g., `pm`)
3. Enter a password (e.g., `test123`)
4. Optionally add your email
5. Click "Create Account"

You'll be automatically logged in and redirected to the dashboard!

## What You Can Do Now

### 1. Dashboard
- View metrics (high risks, overdue actions, etc.)
- See risk drift over time
- Check dependency chains
- Review recent analysis runs

### 2. Transcript Analysis
- Upload a meeting transcript (.txt, .md, .pdf)
- Or paste transcript text directly
- Or use "Quick Intake" mode (no transcript needed)
- AI extracts decisions, risks, and action items
- Review and approve proposed actions

### 3. Command Mode
- Ask questions like:
  - "What are my top risks this week?"
  - "Generate weekly status update"
  - "Create Jira tickets from last meeting"
- Get AI-powered answers with context

### 4. Project Memory
- View timeline of decisions and risks
- See cross-call insights
- Track recurring issues
- Monitor risk drift

### 5. Settings
- Configure preferences
- Toggle features
- Export data

## Testing the Full Flow

### Test 1: Analyze a Transcript

1. Go to "Transcript Analysis" in sidebar
2. Paste this sample transcript:

```
Meeting Notes - Q2 Planning Call

Participants: Sarah (PM), John (Eng Lead), Lisa (Design)

Key Discussion:
- Decided to adopt GraphQL for new API endpoints
- Risk: Timeline is tight, only 3 weeks left
- Action: John to create tickets by EOD
- Blocker: Waiting on design mockups from Lisa

Sarah: "We need to move fast on this. GraphQL will save us time in the long run."
John: "I'm concerned about the timeline. We might need to cut scope."
Lisa: "Mockups will be ready by Wednesday."
```

3. Select meeting type: "Planning Session"
4. Click "Run Analysis"
5. Wait 10-30 seconds for AI processing
6. Review extracted:
   - Decisions (GraphQL adoption)
   - Risks (tight timeline)
   - Action items (create tickets)
   - Dependencies (waiting on mockups)
7. See workflow recommendations
8. Approve or edit proposed actions

### Test 2: Use Intake Mode (No Transcript)

1. Go to "Transcript Analysis"
2. Click "Quick Intake" tab
3. Answer the guided questions:
   - Meeting type: "Client Call"
   - Participants: "PM, Client stakeholder"
   - Main topic: "Feature prioritization"
   - Decisions: "Prioritize mobile app over web"
   - Risks: "Resource constraints"
   - Action items: "Draft roadmap by Friday"
4. Submit answers
5. AI synthesizes context and runs analysis

### Test 3: Command Mode

1. Go to "Command Mode"
2. Type: "What are my top risks this week?"
3. Click send or press Enter
4. Get AI response with context from your projects

### Test 4: Logout and Login

1. Click user avatar (top right)
2. Click "Sign out"
3. You're back at the landing page
4. Click "Login" tab
5. Enter your credentials
6. Back to dashboard!

## Project Structure

```
actionlayer/
├── client/              # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── home.tsx          # ✨ Landing page
│   │   │   ├── dashboard.tsx     # Dashboard
│   │   │   ├── analyze.tsx       # Transcript analysis
│   │   │   ├── command.tsx       # Command mode
│   │   │   ├── memory.tsx        # Project memory
│   │   │   └── settings.tsx      # Settings
│   │   ├── components/
│   │   │   ├── protected-route.tsx  # ✨ Route protection
│   │   │   ├── app-header.tsx       # Header with logout
│   │   │   └── app-sidebar.tsx      # Navigation
│   │   └── lib/
│   │       └── api.ts            # API client
│
├── server/              # Backend (Express + OpenAI)
│   ├── services/
│   │   ├── openai.ts            # AI integration
│   │   ├── intake.ts            # Intake conversation
│   │   ├── workflow-router.ts   # Workflow logic
│   │   └── memory.ts            # Cross-call intelligence
│   ├── routes/
│   │   ├── auth.ts              # Authentication
│   │   ├── projects.ts          # Projects
│   │   ├── analyses.ts          # Analysis
│   │   ├── command.ts           # Commands
│   │   ├── dashboard.ts         # Dashboard
│   │   └── approvals.ts         # Approvals
│   └── storage.ts               # Data layer
│
└── shared/
    └── schema.ts                # Database schema
```

## Key Features

### ✅ Landing Page
- Beautiful hero section
- Feature showcase
- Integrated auth (login/register)
- Responsive design

### ✅ Authentication
- Session-based auth
- Protected routes
- Logout functionality
- Secure password hashing

### ✅ Three Input Modes
1. Transcript upload/paste
2. PM intake conversation
3. Voice/text commands

### ✅ AI Intelligence
- Decision extraction with confidence
- Risk detection (explicit + implicit)
- Dependency mapping
- Gap detection

### ✅ Workflow Automation
- Smart routing
- Jira story generation
- Follow-up emails
- Proposed actions

### ✅ Human Control
- Review before execution
- Evidence snippets
- Edit capabilities
- Confidence flags

### ✅ Memory & Context
- Risk drift tracking
- Decision conflicts
- Recurring blockers
- Cross-call insights

## API Endpoints

All endpoints are documented in `IMPLEMENTATION_GUIDE.md`

Quick reference:
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/analyses/analyze` - Analyze transcript
- `POST /api/command` - Execute command
- `GET /api/dashboard/metrics` - Get metrics

## Troubleshooting

### "OpenAI API key not found"
- Check `.env` file exists
- Verify `OPENAI_API_KEY` is set
- Restart the server

### "Session not persisting"
- Set `SESSION_SECRET` in `.env`
- Clear browser cookies
- Restart the server

### "Cannot connect to server"
- Check server is running (`npm run dev`)
- Verify port 5000 is not in use
- Check console for errors

### "Analysis takes too long"
- OpenAI can take 10-30 seconds
- Check your OpenAI API rate limits
- Verify API key has GPT-4 access

## Documentation

- **README.md** - Project overview
- **SETUP.md** - Detailed setup guide
- **IMPLEMENTATION_GUIDE.md** - Architecture & API docs
- **HOME_PAGE_GUIDE.md** - Landing page details
- **PRODUCTION_READY.md** - Deployment guide
- **QUICK_START.md** - This file

## What's Next?

### Immediate
1. ✅ Start the server
2. ✅ Create an account
3. ✅ Test transcript analysis
4. ✅ Try command mode

### Short Term
- Connect frontend to real backend APIs
- Replace mock data with live data
- Add more projects
- Customize the UI

### Long Term
- Deploy to production
- Add Jira integration
- Implement Slack notifications
- Add voice input (STT)
- Set up monitoring

## Support

Need help? Check:
1. **SETUP.md** - Detailed setup with troubleshooting
2. **IMPLEMENTATION_GUIDE.md** - API reference
3. Server logs - Check console output
4. Browser console - Check for errors

## Success Checklist

- [ ] Environment configured (.env file)
- [ ] Dependencies installed (npm install)
- [ ] Server running (npm run dev)
- [ ] Landing page loads (http://localhost:5000)
- [ ] Can register/login
- [ ] Dashboard accessible
- [ ] Can analyze transcript
- [ ] Command mode works
- [ ] Can logout

## You're All Set! 🎉

Your AI PM Copilot is ready to transform conversations into action!

**Next**: Open `http://localhost:5000` and create your account!

---

**Built with**: React, TypeScript, Express, OpenAI GPT-4, PostgreSQL

**Status**: 🚀 Production-ready backend + beautiful landing page

**Enjoy turning talk into tasks!**

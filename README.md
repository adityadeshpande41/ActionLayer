# ActionLayer - Turn talk into tasks

A modern SaaS PM command center that transforms meeting transcripts into structured decisions, risks, and action items using AI.

## Features

- 📝 **Transcript Analysis**: Upload or paste meeting transcripts for AI-powered analysis
- 🎯 **Decision Tracking**: Extract and track key decisions with owners and confidence levels
- ⚠️ **Risk Management**: Identify risks with severity levels and mitigation strategies
- ✅ **Action Items**: Generate actionable tasks with owners and priorities
- 🤖 **Command Mode**: Natural language interface for querying project data
- 📊 **Dashboard**: Real-time metrics, risk drift analysis, and dependency tracking
- 🎫 **Jira Integration**: Auto-generate Jira story drafts from analysis
- 📧 **Follow-up Emails**: AI-generated meeting follow-up emails

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- Wouter for routing
- Tailwind CSS + shadcn/ui components
- TanStack Query for data fetching
- Framer Motion for animations

### Backend
- Express.js
- PostgreSQL with Drizzle ORM
- OpenAI GPT-4 for AI analysis
- Session-based authentication
- Multer for file uploads

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (optional - uses in-memory storage by default)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd actionlayer
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/actionlayer
OPENAI_API_KEY=sk-your-openai-api-key-here
SESSION_SECRET=your-super-secret-session-key
```

5. (Optional) Push database schema:
```bash
npm run db:push
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

### Production Build

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Project Structure

```
actionlayer/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and API client
│   │   └── hooks/         # Custom React hooks
├── server/                # Backend Express application
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic (OpenAI, etc.)
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # Route registration
│   └── storage.ts        # Data access layer
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and types
└── script/              # Build scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List user's projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PATCH /api/projects/:id` - Update project

### Analyses
- `GET /api/analyses/project/:projectId` - Get project analyses
- `GET /api/analyses/recent` - Get recent analyses
- `GET /api/analyses/:id` - Get analysis with details
- `POST /api/analyses/analyze` - Analyze transcript (supports file upload)
- `POST /api/analyses/:id/jira` - Generate Jira drafts
- `POST /api/analyses/:id/followup` - Generate follow-up email

### Command
- `POST /api/command` - Execute natural language command

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/risk-drift` - Get risk drift data
- `GET /api/dashboard/recent-runs` - Get recent analysis runs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `SESSION_SECRET` | Session encryption secret | - |
| `MAX_FILE_SIZE` | Max upload file size in bytes | `10485760` (10MB) |

## Storage

The application supports two storage modes:

1. **In-Memory Storage** (default): Data stored in memory, resets on restart. Good for development.
2. **PostgreSQL**: Persistent storage using Drizzle ORM. Configure `DATABASE_URL` to enable.

## OpenAI Integration

The application uses OpenAI GPT-4 for:
- Transcript analysis and information extraction
- Jira story generation
- Follow-up email composition
- Natural language command processing

Ensure you have a valid OpenAI API key with GPT-4 access.

## Design System

- **Primary Color**: Electric violet (#8B5CF6)
- **Highlight Color**: Neon lime (used sparingly for badges/CTAs)
- **Fonts**: Inter (sans-serif), JetBrains Mono (monospace)
- **Theme**: Dark mode by default with light mode support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

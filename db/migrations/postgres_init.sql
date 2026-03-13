-- PostgreSQL initialization script
-- Run this when deploying to production with PostgreSQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  google_calendar_token TEXT,
  jira_base_url TEXT,
  jira_email TEXT,
  jira_api_token TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  meeting_type TEXT,
  file_name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  transcript_id TEXT REFERENCES transcripts(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  input_type TEXT NOT NULL,
  summary TEXT,
  decisions_count INTEGER DEFAULT 0,
  risks_count INTEGER DEFAULT 0,
  blockers_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES analyses(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  decision TEXT NOT NULL,
  owner TEXT,
  rationale TEXT,
  confidence INTEGER,
  evidence TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Risks table
CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES analyses(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  risk TEXT NOT NULL,
  likelihood TEXT,
  impact TEXT,
  severity TEXT NOT NULL,
  owner TEXT,
  mitigation TEXT,
  confidence INTEGER,
  evidence TEXT,
  mentions INTEGER DEFAULT 1,
  last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Action Items table
CREATE TABLE IF NOT EXISTS action_items (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES analyses(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  action TEXT NOT NULL,
  owner TEXT,
  due_date TIMESTAMP,
  status TEXT DEFAULT 'pending',
  priority TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  attendees TEXT,
  related_analysis_id TEXT REFERENCES analyses(id),
  related_action_item_id TEXT REFERENCES action_items(id),
  status TEXT NOT NULL DEFAULT 'scheduled',
  reminder_minutes INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  credentials TEXT NOT NULL,
  metadata TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_project_id ON transcripts(project_id);
CREATE INDEX IF NOT EXISTS idx_analyses_project_id ON analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_analysis_id ON decisions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_risks_analysis_id ON risks(analysis_id);
CREATE INDEX IF NOT EXISTS idx_action_items_analysis_id ON action_items(analysis_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(provider);

-- Session table for connect-pg-simple
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

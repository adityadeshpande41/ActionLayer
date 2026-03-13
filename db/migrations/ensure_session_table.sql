-- Run this SQL in your Render PostgreSQL database to create the session table
-- This is required for connect-pg-simple to work

CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- Verify the table was created
SELECT tablename FROM pg_tables WHERE tablename = 'session';

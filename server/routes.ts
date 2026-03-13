import type { Express } from "express";
import type { Server } from "http";
import session from "express-session";
import pg from "pg";
import { storage } from "./storage";

// Import route modules
import { authRouter } from "./routes/auth";
import { initRouter } from "./routes/init";
import { projectsRouter } from "./routes/projects";
import { dashboardRouter } from "./routes/dashboard";
import { analysesRouter } from "./routes/analyses";
import { approvalsRouter } from "./routes/approvals";
import { commandRouter } from "./routes/command";
import { calendarRouter } from "./routes/calendar";
import { jiraRouter } from "./routes/jira";

// Auth middleware
async function requireAuth(req: any, res: any, next: any) {
  const userId = req.session?.userId;
  
  // Debug logging
  console.log('[Auth Check]', {
    hasSession: !!req.session,
    sessionId: req.sessionID,
    userId: userId,
    cookie: req.session?.cookie,
  });
  
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Error]', error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session store configuration
  const isProduction = process.env.NODE_ENV === "production";
  const databaseUrl = process.env.DATABASE_URL;

  let sessionStore: any;

  if (isProduction && databaseUrl?.startsWith("postgres")) {
    // Use PostgreSQL session store in production
    const { default: connectPgSimple } = await import("connect-pg-simple");
    const PgSession = connectPgSimple(session);

    const pgPool = new pg.Pool({ 
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    // Ensure session table exists (run this once manually or via migration)
    // CREATE TABLE "session" (
    //   "sid" varchar NOT NULL COLLATE "default",
    //   "sess" json NOT NULL,
    //   "expire" timestamp(6) NOT NULL
    // );
    // CREATE INDEX "IDX_session_expire" ON "session" ("expire");
    
    sessionStore = new PgSession({
      pool: pgPool,
      tableName: "session",
      createTableIfMissing: false, // Table should already exist from migration
    });
    console.log("[Session] Using PostgreSQL session store");
  } else {
    // Use memory store in development (default)
    console.log("[Session] Using memory session store");
  }

  // Session middleware
  const sessionMiddleware = session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // lax is fine for same-origin requests
    },
    name: 'actionlayer.sid', // Custom session cookie name
    proxy: isProduction, // Trust proxy in production (Render uses proxies)
  });

  // Apply session middleware
  app.use(sessionMiddleware);

  // Auth routes (public)
  app.use("/api/auth", authRouter);

  // Protected routes
  app.use("/api/init", requireAuth, initRouter);
  app.use("/api/projects", requireAuth, projectsRouter);
  app.use("/api/dashboard", requireAuth, dashboardRouter);
  app.use("/api/analyses", requireAuth, analysesRouter);
  app.use("/api/approvals", requireAuth, approvalsRouter);
  app.use("/api/command", requireAuth, commandRouter);
  app.use("/api/calendar", requireAuth, calendarRouter);
  app.use("/api/jira", requireAuth, jiraRouter);

  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { authRouter } from "./routes/auth";
import { projectsRouter } from "./routes/projects";
import { analysesRouter } from "./routes/analyses";
import { commandRouter } from "./routes/command";
import { dashboardRouter } from "./routes/dashboard";
import { approvalsRouter } from "./routes/approvals";
import { initRouter } from "./routes/init";
import { calendarRouter } from "./routes/calendar";

// Session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false for development (localhost)
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax', // Important for same-site requests
  },
  name: 'actionlayer.sid', // Custom session cookie name
});

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

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = user;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Apply session middleware
  app.use(sessionMiddleware);

  // Auth routes (public)
  app.use("/api/auth", authRouter);

  // Protected routes
  app.use("/api/projects", requireAuth, projectsRouter);
  app.use("/api/analyses", requireAuth, analysesRouter);
  app.use("/api/command", requireAuth, commandRouter);
  app.use("/api/dashboard", requireAuth, dashboardRouter);
  app.use("/api/approvals", requireAuth, approvalsRouter);
  app.use("/api/init", requireAuth, initRouter);
  app.use("/api/calendar", requireAuth, calendarRouter);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}

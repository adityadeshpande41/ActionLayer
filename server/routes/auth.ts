import { Router } from "express";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";

export const authRouter = Router();

// Register
authRouter.post("/register", async (req, res) => {
  try {
    const { username, password, email } = insertUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      email,
    });

    // Set session
    (req as any).session.userId = user.id;
    
    // Explicitly save session before responding
    await new Promise<void>((resolve, reject) => {
      (req as any).session.save((err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: "Failed to register user" });
  }
});

// Login
authRouter.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set session
    (req as any).session.userId = user.id;
    
    // Debug logging
    console.log('[Login Success]', {
      userId: user.id,
      sessionId: (req as any).sessionID,
      sessionData: (req as any).session,
    });
    
    // Explicitly save session before responding
    await new Promise<void>((resolve, reject) => {
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('[Session Save Error]', err);
          reject(err);
        } else {
          console.log('[Session Saved]', (req as any).sessionID);
          resolve();
        }
      });
    });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Logout
authRouter.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user
authRouter.get("/me", async (req, res) => {
  try {
    const userId = (req as any).session?.userId;
    
    // Debug logging
    console.log('[/me Check]', {
      hasSession: !!(req as any).session,
      sessionId: (req as any).sessionID,
      userId: userId,
      cookie: (req as any).session?.cookie,
    });
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

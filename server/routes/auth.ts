import { Router } from "express";
import bcrypt from "bcrypt";
import { storage } from "../storage";

export const authRouter = Router();

// Register
authRouter.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || typeof username !== "string" || username.trim().length < 2) {
      return res.status(400).json({ error: "Username must be at least 2 characters" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const existingUser = await storage.getUserByUsername(username.trim());
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await storage.createUser({
      username: username.trim(),
      password: hashedPassword,
      email: email || null,
    });

    // Set session
    (req as any).session.userId = user.id;
    
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
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error?.message || "Failed to register user" });
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
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update profile (email)
authRouter.patch("/profile", async (req, res) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { email } = req.body;
    if (email !== undefined && typeof email !== "string") {
      return res.status(400).json({ error: "Invalid email" });
    }

    const updated = await storage.updateUser(userId, { email: email || null });
    if (!updated) return res.status(404).json({ error: "User not found" });

    res.json({ id: updated.id, username: updated.username, email: updated.email, createdAt: updated.createdAt });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change password
authRouter.patch("/change-password", async (req, res) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await storage.updateUser(userId, { password: hashed });

    res.json({ success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

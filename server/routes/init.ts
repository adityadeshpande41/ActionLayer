import { Router } from "express";
import { storage } from "../storage";

export const initRouter = Router();

// Initialize default project for user if they don't have any
initRouter.post("/initialize", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user has projects
    const projects = await storage.getProjectsByUserId(userId);
    
    if (projects.length === 0) {
      // Create default project
      const project = await storage.createProject({
        name: "My First Project",
        description: "Default project created automatically",
        ownerId: userId,
      });
      
      return res.json({ project, created: true });
    }

    return res.json({ project: projects[0], created: false });
  } catch (error) {
    console.error("Error initializing:", error);
    res.status(500).json({ error: "Failed to initialize" });
  }
});

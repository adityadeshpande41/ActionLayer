import { Router } from "express";
import { storage } from "../storage";
import { insertProjectSchema } from "@shared/schema";

export const projectsRouter = Router();

// Get all projects for current user
projectsRouter.get("/", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const projects = await storage.getProjectsByUserId(userId);
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get single project
projectsRouter.get("/:id", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Create project
projectsRouter.post("/", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = insertProjectSchema.parse({
      ...req.body,
      ownerId: userId,
    });

    const project = await storage.createProject(validated);
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(400).json({ error: "Failed to create project" });
  }
});

// Update project
projectsRouter.patch("/:id", async (req, res) => {
  try {
    const project = await storage.updateProject(req.params.id, req.body);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(400).json({ error: "Failed to update project" });
  }
});

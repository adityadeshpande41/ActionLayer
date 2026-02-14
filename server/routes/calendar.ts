import { Router } from "express";
import { storage } from "../storage";

export const calendarRouter = Router();

// Get all events for a project
calendarRouter.get("/project/:projectId", async (req, res) => {
  try {
    const events = await storage.getCalendarEventsByProjectId(req.params.projectId);
    res.json(events);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

// Get events by date range
calendarRouter.get("/project/:projectId/range", async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "Start and end dates are required" });
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    const events = await storage.getCalendarEventsByDateRange(
      req.params.projectId,
      startDate,
      endDate
    );
    res.json(events);
  } catch (error) {
    console.error("Error fetching calendar events by range:", error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

// Get upcoming events
calendarRouter.get("/project/:projectId/upcoming", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const events = await storage.getUpcomingEvents(req.params.projectId, limit);
    res.json(events);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({ error: "Failed to fetch upcoming events" });
  }
});

// Get single event
calendarRouter.get("/:id", async (req, res) => {
  try {
    const event = await storage.getCalendarEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    console.error("Error fetching calendar event:", error);
    res.status(500).json({ error: "Failed to fetch calendar event" });
  }
});

// Create event
calendarRouter.post("/", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log('[Calendar] Creating event, body:', req.body);

    const {
      projectId,
      title,
      description,
      eventType,
      startDate,
      endDate,
      allDay,
      location,
      attendees,
      relatedAnalysisId,
      relatedActionItemId,
      reminderMinutes,
    } = req.body;

    if (!projectId || !title || !eventType || !startDate) {
      console.log('[Calendar] Missing required fields:', { projectId, title, eventType, startDate });
      return res.status(400).json({ error: "Missing required fields" });
    }

    const event = await storage.createCalendarEvent({
      projectId,
      userId,
      title,
      description,
      eventType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      allDay,
      location,
      attendees,
      relatedAnalysisId,
      relatedActionItemId,
      status: "scheduled",
      reminderMinutes,
    });

    console.log('[Calendar] Event created:', event.id);
    // Serialize dates to ISO strings for JSON response
    const response = {
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate ? event.endDate.toISOString() : null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
    console.log('[Calendar] Sending response:', JSON.stringify(response).substring(0, 200));
    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

// Update event
calendarRouter.patch("/:id", async (req, res) => {
  try {
    const event = await storage.updateCalendarEvent(req.params.id, req.body);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    console.error("Error updating calendar event:", error);
    res.status(500).json({ error: "Failed to update calendar event" });
  }
});

// Delete event
calendarRouter.delete("/:id", async (req, res) => {
  try {
    const deleted = await storage.deleteCalendarEvent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    res.status(500).json({ error: "Failed to delete calendar event" });
  }
});

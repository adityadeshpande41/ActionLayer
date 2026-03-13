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

// Google Calendar Integration
import { googleCalendarService } from "../services/google-calendar";

// Check if Google Calendar is configured
calendarRouter.get("/google/status", async (req, res) => {
  const userId = (req as any).user?.id;
  const isConfigured = googleCalendarService.isConfigured();
  
  let userConnected = false;
  if (userId && isConfigured) {
    const userToken = await storage.getUserGoogleToken(userId);
    userConnected = !!userToken;
  }
  
  res.json({
    configured: isConfigured && userConnected,
    authUrl: isConfigured ? googleCalendarService.getAuthUrl() : null,
  });
});

// List available Google Calendars
calendarRouter.get("/google/calendars", async (req, res) => {
  try {
    if (!googleCalendarService.isConfigured()) {
      return res.status(400).json({ error: "Google Calendar not configured" });
    }

    const calendars = await googleCalendarService.listCalendars();
    res.json(calendars);
  } catch (error: any) {
    console.error("Error listing Google Calendars:", error);
    res.status(500).json({ error: error.message });
  }
});

// Disconnect Google Calendar
calendarRouter.post("/google/disconnect", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await storage.updateUserGoogleToken(userId, null);
    res.json({ success: true, message: "Google Calendar disconnected successfully" });
  } catch (error: any) {
    console.error("Error disconnecting Google Calendar:", error);
    res.status(500).json({ error: error.message || "Failed to disconnect" });
  }
});

// Handle OAuth callback (GET request from Google redirect)
calendarRouter.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const userId = (req as any).user?.id;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).send("Authorization code required");
    }

    if (!userId) {
      return res.redirect("/calendar?google_error=not_logged_in");
    }

    const { tokens } = await googleCalendarService.handleAuthCallback(code);
    await storage.updateUserGoogleToken(userId, tokens);
    
    // Auto-import events from the last 30 days and next 90 days
    try {
      const projects = await storage.getProjectsByUserId(userId);
      if (projects.length > 0) {
        const projectId = projects[0].id; // Use first project
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // 30 days ago
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 90); // 90 days from now
        
        const googleEvents = await googleCalendarService.listEvents(
          tokens,
          startDate,
          endDate
        );
        
        console.log(`[Google Calendar] Auto-importing ${googleEvents.length} events`);
        
        // Import events
        for (const gEvent of googleEvents) {
          try {
            const description = gEvent.description 
              ? `${gEvent.description.substring(0, 500)} [Google Calendar: ${gEvent.id}]`
              : `[Google Calendar: ${gEvent.id}]`;
            
            const eventData = {
              projectId,
              userId,
              title: gEvent.summary || "Untitled Event",
              description,
              eventType: "meeting" as const,
              startDate: new Date(gEvent.start?.dateTime || gEvent.start?.date),
              endDate: gEvent.end ? new Date(gEvent.end?.dateTime || gEvent.end?.date) : undefined,
              allDay: !gEvent.start?.dateTime,
              location: gEvent.location || undefined,
              attendees: gEvent.attendees?.map((a: any) => a.email) || undefined,
              status: "scheduled" as const,
            };
            
            await storage.createCalendarEvent(eventData);
          } catch (err) {
            console.error(`[Google Calendar] Failed to import event ${gEvent.id}:`, err);
          }
        }
        
        console.log(`[Google Calendar] Auto-import complete`);
      }
    } catch (importError) {
      console.error("[Google Calendar] Auto-import failed:", importError);
      // Don't fail the connection if import fails
    }
    
    // Redirect to calendar page with success message
    res.redirect("/calendar?google_connected=true");
  } catch (error) {
    console.error("Error handling Google auth:", error);
    res.redirect("/calendar?google_error=auth_failed");
  }
});

// Handle OAuth callback (POST for manual code submission)
calendarRouter.post("/google/auth", async (req, res) => {
  try {
    const { code } = req.body;
    const userId = (req as any).user?.id;
    
    if (!code) {
      return res.status(400).json({ error: "Authorization code required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { tokens } = await googleCalendarService.handleAuthCallback(code);
    await storage.updateUserGoogleToken(userId, tokens);
    
    // Auto-import events from the last 30 days and next 90 days
    try {
      const projects = await storage.getProjectsByUserId(userId);
      if (projects.length > 0) {
        const projectId = projects[0].id;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 90);
        
        const googleEvents = await googleCalendarService.listEvents(
          tokens,
          startDate,
          endDate
        );
        
        console.log(`[Google Calendar] Auto-importing ${googleEvents.length} events`);
        
        for (const gEvent of googleEvents) {
          try {
            const description = gEvent.description 
              ? `${gEvent.description.substring(0, 500)} [Google Calendar: ${gEvent.id}]`
              : `[Google Calendar: ${gEvent.id}]`;
            
            const eventData = {
              projectId,
              userId,
              title: gEvent.summary || "Untitled Event",
              description,
              eventType: "meeting" as const,
              startDate: new Date(gEvent.start?.dateTime || gEvent.start?.date),
              endDate: gEvent.end ? new Date(gEvent.end?.dateTime || gEvent.end?.date) : undefined,
              allDay: !gEvent.start?.dateTime,
              location: gEvent.location || undefined,
              attendees: gEvent.attendees?.map((a: any) => a.email) || undefined,
              status: "scheduled" as const,
            };
            
            await storage.createCalendarEvent(eventData);
          } catch (err) {
            console.error(`[Google Calendar] Failed to import event ${gEvent.id}:`, err);
          }
        }
        
        console.log(`[Google Calendar] Auto-import complete`);
      }
    } catch (importError) {
      console.error("[Google Calendar] Auto-import failed:", importError);
    }
    
    res.json({ success: true, message: "Google Calendar connected and events imported successfully" });
  } catch (error) {
    console.error("Error handling Google auth:", error);
    res.status(500).json({ error: "Failed to authenticate with Google Calendar" });
  }
});

// Sync event to Google Calendar
calendarRouter.post("/:id/sync-to-google", async (req, res) => {
  try {
    if (!googleCalendarService.isConfigured()) {
      return res.status(400).json({ error: "Google Calendar not configured" });
    }

    const event = await storage.getCalendarEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Convert and create in Google Calendar
    const googleEvent = googleCalendarService.convertToGoogleEvent(event);
    const createdEvent = await googleCalendarService.createEvent(googleEvent);

    // Store Google Calendar event ID
    await storage.updateCalendarEvent(req.params.id, {
      // We could add a googleCalendarId field to the schema
      description: event.description 
        ? `${event.description}\n\n[Google Calendar ID: ${createdEvent.id}]`
        : `[Google Calendar ID: ${createdEvent.id}]`,
    });

    res.json({
      success: true,
      googleEventId: createdEvent.id,
      googleEventLink: createdEvent.htmlLink,
    });
  } catch (error: any) {
    console.error("Error syncing to Google Calendar:", error);
    res.status(500).json({ error: error.message || "Failed to sync to Google Calendar" });
  }
});

// Remove duplicate events
calendarRouter.post("/remove-duplicates/:projectId", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get all events for the project
    const events = await storage.getCalendarEventsByProjectId(req.params.projectId);
    
    // Group events by title and start date
    const eventMap = new Map<string, any[]>();
    for (const event of events) {
      const key = `${event.title}-${new Date(event.startDate).toISOString()}`;
      if (!eventMap.has(key)) {
        eventMap.set(key, []);
      }
      eventMap.get(key)!.push(event);
    }
    
    // Delete duplicates (keep the first one)
    let deletedCount = 0;
    for (const [key, duplicates] of eventMap.entries()) {
      if (duplicates.length > 1) {
        // Keep the first, delete the rest
        for (let i = 1; i < duplicates.length; i++) {
          await storage.deleteCalendarEvent(duplicates[i].id);
          deletedCount++;
        }
      }
    }
    
    res.json({
      success: true,
      deletedCount,
      message: `Removed ${deletedCount} duplicate events`,
    });
  } catch (error: any) {
    console.error("Error removing duplicates:", error);
    res.status(500).json({ error: error.message || "Failed to remove duplicates" });
  }
});

// Import events from Google Calendar
calendarRouter.post("/google/import/:projectId", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!googleCalendarService.isConfigured()) {
      return res.status(400).json({ error: "Google Calendar not configured" });
    }

    // Get user's Google Calendar token
    const userToken = await storage.getUserGoogleToken(userId);
    if (!userToken) {
      return res.status(400).json({ error: "Google Calendar not connected. Please connect first." });
    }

    const { startDate, endDate, clearExisting } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start and end dates required" });
    }

    // Clear existing imported events if requested
    if (clearExisting) {
      const existingEvents = await storage.getCalendarEventsByDateRange(
        req.params.projectId,
        new Date(startDate),
        new Date(endDate)
      );
      
      // Delete all events in the range (we'll re-import everything)
      for (const event of existingEvents) {
        await storage.deleteCalendarEvent(event.id);
      }
      console.log(`[Google Calendar Import] Cleared ${existingEvents.length} existing events`);
    }

    // Fetch events from Google Calendar using user's token
    const googleEvents = await googleCalendarService.listEvents(
      userToken,
      new Date(startDate),
      new Date(endDate)
    );

    // Import events to ActionLayer
    const importedEvents = [];
    for (const gEvent of googleEvents) {
      try {
        // Clean up description - remove HTML tags and extract plain text
        let cleanDescription = gEvent.description || "";
        
        if (cleanDescription) {
          // Remove HTML tags completely
          cleanDescription = cleanDescription.replace(/<[^>]*>/g, "");
          // Decode HTML entities
          cleanDescription = cleanDescription
            .replace(/&nbsp;/g, " ")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'");
          // Remove multiple spaces, newlines, and trim
          cleanDescription = cleanDescription
            .replace(/\s+/g, " ")
            .replace(/\n+/g, " ")
            .trim();
          // Limit length
          if (cleanDescription.length > 300) {
            cleanDescription = cleanDescription.substring(0, 297) + "...";
          }
        }
        
        // Add import marker at the end
        const importMarker = `[Google Calendar: ${gEvent.id}]`;
        cleanDescription = cleanDescription 
          ? `${cleanDescription} ${importMarker}`
          : importMarker;
        
        const event = await storage.createCalendarEvent({
          projectId: req.params.projectId,
          userId,
          title: gEvent.summary || "Untitled Event",
          description: cleanDescription,
          eventType: "meeting",
          startDate: new Date(gEvent.start.dateTime || gEvent.start.date),
          endDate: gEvent.end ? new Date(gEvent.end.dateTime || gEvent.end.date) : undefined,
          allDay: !!gEvent.start.date,
          location: gEvent.location,
          status: "scheduled",
        });
        importedEvents.push(event);
      } catch (error) {
        console.error(`Failed to import event ${gEvent.id}:`, error);
      }
    }

    res.json({
      success: true,
      imported: importedEvents.length,
      total: googleEvents.length,
      events: importedEvents,
    });
  } catch (error: any) {
    console.error("Error importing from Google Calendar:", error);
    res.status(500).json({ error: error.message || "Failed to import from Google Calendar" });
  }
});

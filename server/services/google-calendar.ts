import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const TOKEN_PATH = path.join(process.cwd(), "google-token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "google-credentials.json");

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

class GoogleCalendarService {
  private oauth2Client: OAuth2Client | null = null;
  private calendar: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Check if credentials file exists
      if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.log("[Google Calendar] Credentials file not found. Google Calendar integration disabled.");
        return;
      }

      const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
      const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

      this.oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      // Load token if exists
      if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
        this.oauth2Client.setCredentials(token);
        this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
        console.log("[Google Calendar] Initialized successfully");
      } else {
        console.log("[Google Calendar] Token not found. User needs to authenticate.");
      }
    } catch (error) {
      console.error("[Google Calendar] Initialization error:", error);
    }
  }

  isConfigured(): boolean {
    return this.oauth2Client !== null && this.calendar !== null;
  }

  disconnect(): boolean {
    try {
      // Remove token file
      if (fs.existsSync(TOKEN_PATH)) {
        fs.unlinkSync(TOKEN_PATH);
      }
      
      // Reset client
      this.calendar = null;
      
      console.log("[Google Calendar] Disconnected successfully");
      return true;
    } catch (error) {
      console.error("[Google Calendar] Disconnect error:", error);
      return false;
    }
  }

  getAuthUrl(): string | null {
    if (!this.oauth2Client) return null;

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
  }

  async handleAuthCallback(code: string): Promise<boolean> {
    try {
      if (!this.oauth2Client) return false;

      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Save token
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
      
      this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
      console.log("[Google Calendar] Authentication successful");
      return true;
    } catch (error) {
      console.error("[Google Calendar] Auth callback error:", error);
      return false;
    }
  }

  async createEvent(event: GoogleCalendarEvent): Promise<any> {
    if (!this.calendar) {
      throw new Error("Google Calendar not configured");
    }

    try {
      const response = await this.calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });

      console.log("[Google Calendar] Event created:", response.data.id);
      return response.data;
    } catch (error: any) {
      console.error("[Google Calendar] Create event error:", error);
      throw new Error(`Failed to create Google Calendar event: ${error.message}`);
    }
  }

  async updateEvent(eventId: string, event: Partial<GoogleCalendarEvent>): Promise<any> {
    if (!this.calendar) {
      throw new Error("Google Calendar not configured");
    }

    try {
      const response = await this.calendar.events.patch({
        calendarId: "primary",
        eventId: eventId,
        requestBody: event,
      });

      console.log("[Google Calendar] Event updated:", eventId);
      return response.data;
    } catch (error: any) {
      console.error("[Google Calendar] Update event error:", error);
      throw new Error(`Failed to update Google Calendar event: ${error.message}`);
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.calendar) {
      throw new Error("Google Calendar not configured");
    }

    try {
      await this.calendar.events.delete({
        calendarId: "primary",
        eventId: eventId,
      });

      console.log("[Google Calendar] Event deleted:", eventId);
    } catch (error: any) {
      console.error("[Google Calendar] Delete event error:", error);
      throw new Error(`Failed to delete Google Calendar event: ${error.message}`);
    }
  }

  async listEvents(timeMin: Date, timeMax: Date): Promise<any[]> {
    if (!this.calendar) {
      throw new Error("Google Calendar not configured");
    }

    try {
      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
    } catch (error: any) {
      console.error("[Google Calendar] List events error:", error);
      throw new Error(`Failed to list Google Calendar events: ${error.message}`);
    }
  }

  async getEvent(eventId: string): Promise<any> {
    if (!this.calendar) {
      throw new Error("Google Calendar not configured");
    }

    try {
      const response = await this.calendar.events.get({
        calendarId: "primary",
        eventId: eventId,
      });

      return response.data;
    } catch (error: any) {
      console.error("[Google Calendar] Get event error:", error);
      throw new Error(`Failed to get Google Calendar event: ${error.message}`);
    }
  }

  // Convert ActionLayer event to Google Calendar format
  convertToGoogleEvent(actionLayerEvent: any): GoogleCalendarEvent {
    const event: GoogleCalendarEvent = {
      summary: actionLayerEvent.title,
      description: actionLayerEvent.description || "",
      start: {},
      end: {},
    };

    if (actionLayerEvent.allDay) {
      // All-day event
      const startDate = new Date(actionLayerEvent.startDate);
      event.start.date = startDate.toISOString().split("T")[0];
      
      const endDate = actionLayerEvent.endDate 
        ? new Date(actionLayerEvent.endDate)
        : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      event.end.date = endDate.toISOString().split("T")[0];
    } else {
      // Timed event
      event.start.dateTime = new Date(actionLayerEvent.startDate).toISOString();
      event.start.timeZone = "America/Los_Angeles"; // TODO: Make configurable
      
      if (actionLayerEvent.endDate) {
        event.end.dateTime = new Date(actionLayerEvent.endDate).toISOString();
      } else {
        // Default to 1 hour duration
        const endTime = new Date(actionLayerEvent.startDate);
        endTime.setHours(endTime.getHours() + 1);
        event.end.dateTime = endTime.toISOString();
      }
      event.end.timeZone = "America/Los_Angeles";
    }

    if (actionLayerEvent.location) {
      event.location = actionLayerEvent.location;
    }

    if (actionLayerEvent.attendees && Array.isArray(actionLayerEvent.attendees)) {
      event.attendees = actionLayerEvent.attendees.map((email: string) => ({ email }));
    }

    if (actionLayerEvent.reminderMinutes) {
      event.reminders = {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: actionLayerEvent.reminderMinutes },
        ],
      };
    }

    return event;
  }
}

export const googleCalendarService = new GoogleCalendarService();

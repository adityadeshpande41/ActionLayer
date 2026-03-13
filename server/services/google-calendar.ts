import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
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
  private credentials: any = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Try to read from environment variable first (production)
      if (process.env.GOOGLE_CREDENTIALS) {
        try {
          this.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
          console.log("[Google Calendar] Loaded credentials from environment variable");
        } catch (error) {
          console.error("[Google Calendar] Failed to parse GOOGLE_CREDENTIALS env var:", error);
          return;
        }
      } 
      // Fall back to file (development)
      else if (fs.existsSync(CREDENTIALS_PATH)) {
        this.credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
        console.log("[Google Calendar] Loaded credentials from file");
      } else {
        console.log("[Google Calendar] No credentials found. Google Calendar integration disabled.");
        return;
      }

      const { client_id, client_secret, redirect_uris } = this.credentials.installed || this.credentials.web;

      // Choose redirect URI based on environment
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
                         (process.env.NODE_ENV === "production" 
                           ? redirect_uris.find((uri: string) => !uri.includes("localhost")) 
                           : redirect_uris.find((uri: string) => uri.includes("localhost"))) ||
                         redirect_uris[0];

      this.oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirectUri
      );

      console.log("[Google Calendar] OAuth client initialized with redirect:", redirectUri);
    } catch (error) {
      console.error("[Google Calendar] Initialization error:", error);
    }
  }

  isConfigured(): boolean {
    return this.oauth2Client !== null;
  }

  getAuthUrl(userId?: string): string | null {
    if (!this.oauth2Client) return null;

    const state = userId ? Buffer.from(JSON.stringify({ userId })).toString('base64') : undefined;

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent", // Force consent screen to get refresh token
      state,
    });
  }

  // Get calendar client for a specific user's token
  private getCalendarForUser(userTokenJson: string): any {
    if (!this.oauth2Client) {
      throw new Error("OAuth client not initialized");
    }

    const client = new google.auth.OAuth2(
      (this.oauth2Client as any)._clientId,
      (this.oauth2Client as any)._clientSecret,
      (this.oauth2Client as any).redirectUri
    );
    
    const tokens = JSON.parse(userTokenJson);
    
    // Check if refresh token exists
    if (!tokens.refresh_token) {
      throw new Error("No refresh token available. Please disconnect and reconnect your Google Calendar.");
    }
    
    client.setCredentials(tokens);
    return google.calendar({ version: "v3", auth: client });
  }

  // Exchange authorization code for tokens
  async handleAuthCallback(code: string): Promise<{ tokens: string }> {
    try {
      if (!this.oauth2Client) {
        throw new Error("OAuth client not initialized");
      }

      const { tokens } = await this.oauth2Client.getToken(code);
      console.log("[Google Calendar] Authentication successful");
      
      // Return tokens as JSON string to be stored in database
      return { tokens: JSON.stringify(tokens) };
    } catch (error) {
      console.error("[Google Calendar] Auth callback error:", error);
      throw error;
    }
  }

  async createEvent(userTokenJson: string, event: GoogleCalendarEvent): Promise<any> {
    try {
      const calendar = this.getCalendarForUser(userTokenJson);
      
      const response = await calendar.events.insert({
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

  async updateEvent(userTokenJson: string, eventId: string, event: Partial<GoogleCalendarEvent>): Promise<any> {
    try {
      const calendar = this.getCalendarForUser(userTokenJson);
      
      const response = await calendar.events.patch({
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

  async deleteEvent(userTokenJson: string, eventId: string): Promise<void> {
    try {
      const calendar = this.getCalendarForUser(userTokenJson);
      
      await calendar.events.delete({
        calendarId: "primary",
        eventId: eventId,
      });

      console.log("[Google Calendar] Event deleted:", eventId);
    } catch (error: any) {
      console.error("[Google Calendar] Delete event error:", error);
      throw new Error(`Failed to delete Google Calendar event: ${error.message}`);
    }
  }

  async listEvents(userTokenJson: string, timeMin: Date, timeMax: Date, calendarId: string = "primary"): Promise<any[]> {
    try {
      const calendar = this.getCalendarForUser(userTokenJson);
      
      const response = await calendar.events.list({
        calendarId: calendarId,
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

  async getEvent(userTokenJson: string, eventId: string): Promise<any> {
    try {
      const calendar = this.getCalendarForUser(userTokenJson);
      
      const response = await calendar.events.get({
        calendarId: "primary",
        eventId: eventId,
      });

      return response.data;
    } catch (error: any) {
      console.error("[Google Calendar] Get event error:", error);
      throw new Error(`Failed to get Google Calendar event: ${error.message}`);
    }
  }

  async listCalendars(userTokenJson: string): Promise<any[]> {
    try {
      const calendar = this.getCalendarForUser(userTokenJson);
      
      const response = await calendar.calendarList.list();
      return response.data.items || [];
    } catch (error: any) {
      console.error("[Google Calendar] List calendars error:", error);
      throw new Error(`Failed to list calendars: ${error.message}`);
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();

import {
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type Transcript,
  type InsertTranscript,
  type Analysis,
  type InsertAnalysis,
  type Decision,
  type InsertDecision,
  type Risk,
  type InsertRisk,
  type ActionItem,
  type InsertActionItem,
  type CalendarEvent,
  type InsertCalendarEvent,
  type UserIntegration,
  type InsertUserIntegration,
  users,
  projects,
  transcripts,
  analyses,
  decisions,
  risks,
  actionItems,
  calendarEvents,
  userIntegrations,
} from "@shared/schema";
import { db, isPostgres } from "./db";
import { sql } from "drizzle-orm";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserGoogleToken(userId: string, token: string | null): Promise<void>;
  getUserGoogleToken(userId: string): Promise<string | null>;
  updateUserJiraConfig(userId: string, config: { baseUrl: string; email: string; apiToken: string } | null): Promise<void>;
  getUserJiraConfig(userId: string): Promise<{ baseUrl: string; email: string; apiToken: string } | null>;

  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUserId(userId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;

  // Transcripts
  getTranscript(id: string): Promise<Transcript | undefined>;
  getTranscriptsByProjectId(projectId: string): Promise<Transcript[]>;
  createTranscript(transcript: InsertTranscript): Promise<Transcript>;

  // Analyses
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getAnalysesByProjectId(projectId: string): Promise<Analysis[]>;
  getRecentAnalyses(limit?: number): Promise<Analysis[]>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  updateAnalysis(id: string, analysis: Partial<InsertAnalysis>): Promise<Analysis | undefined>;
  deleteAnalysis(id: string): Promise<boolean>;

  // Decisions
  getDecisionsByAnalysisId(analysisId: string): Promise<Decision[]>;
  getDecisionsByProjectId(projectId: string): Promise<Decision[]>;
  createDecision(decision: InsertDecision): Promise<Decision>;

  // Risks
  getRisksByAnalysisId(analysisId: string): Promise<Risk[]>;
  getRisksByProjectId(projectId: string): Promise<Risk[]>;
  getTopRisks(limit?: number): Promise<Risk[]>;
  createRisk(risk: InsertRisk): Promise<Risk>;

  // Action Items
  getActionItemsByAnalysisId(analysisId: string): Promise<ActionItem[]>;
  getActionItemsByProjectId(projectId: string): Promise<ActionItem[]>;
  createActionItem(actionItem: InsertActionItem): Promise<ActionItem>;
  updateActionItem(id: string, actionItem: Partial<InsertActionItem>): Promise<ActionItem | undefined>;

  // Calendar Events
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  getCalendarEventsByProjectId(projectId: string): Promise<CalendarEvent[]>;
  getCalendarEventsByDateRange(projectId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  getUpcomingEvents(projectId: string, limit?: number): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private transcripts: Map<string, Transcript>;
  private analyses: Map<string, Analysis>;
  private decisions: Map<string, Decision>;
  private risks: Map<string, Risk>;
  private actionItems: Map<string, ActionItem>;
  private calendarEvents: Map<string, CalendarEvent>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.transcripts = new Map();
    this.analyses = new Map();
    this.decisions = new Map();
    this.risks = new Map();
    this.actionItems = new Map();
    this.calendarEvents = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      email: insertUser.email || null,
      googleCalendarToken: null,
      jiraBaseUrl: null,
      jiraEmail: null,
      jiraApiToken: null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserGoogleToken(userId: string, token: string | null): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.googleCalendarToken = token;
      this.users.set(userId, user);
    }
  }

  async getUserGoogleToken(userId: string): Promise<string | null> {
    const user = this.users.get(userId);
    return user?.googleCalendarToken || null;
  }

  async updateUserJiraConfig(userId: string, config: { baseUrl: string; email: string; apiToken: string } | null): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      if (config) {
        user.jiraBaseUrl = config.baseUrl;
        user.jiraEmail = config.email;
        user.jiraApiToken = config.apiToken;
      } else {
        user.jiraBaseUrl = null;
        user.jiraEmail = null;
        user.jiraApiToken = null;
      }
      this.users.set(userId, user);
    }
  }

  async getUserJiraConfig(userId: string): Promise<{ baseUrl: string; email: string; apiToken: string } | null> {
    const user = this.users.get(userId);
    if (user?.jiraBaseUrl && user?.jiraEmail && user?.jiraApiToken) {
      return {
        baseUrl: user.jiraBaseUrl,
        email: user.jiraEmail,
        apiToken: user.jiraApiToken,
      };
    }
    return null;
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.ownerId === userId,
    );
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = new Date();
    const project: Project = { 
      ...insertProject, 
      id, 
      description: insertProject.description || null,
      createdAt: now, 
      updatedAt: now 
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    const updated = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  // Transcripts
  async getTranscript(id: string): Promise<Transcript | undefined> {
    return this.transcripts.get(id);
  }

  async getTranscriptsByProjectId(projectId: string): Promise<Transcript[]> {
    return Array.from(this.transcripts.values()).filter(
      (transcript) => transcript.projectId === projectId,
    );
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const id = randomUUID();
    const transcript: Transcript = { 
      ...insertTranscript, 
      id, 
      meetingType: insertTranscript.meetingType || null,
      fileName: insertTranscript.fileName || null,
      createdAt: new Date() 
    };
    this.transcripts.set(id, transcript);
    return transcript;
  }

  // Analyses
  async getAnalysis(id: string): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getAnalysesByProjectId(projectId: string): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .filter((analysis) => analysis.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentAnalyses(limit: number = 10): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = randomUUID();
    const analysis: Analysis = { 
      ...insertAnalysis, 
      id, 
      summary: insertAnalysis.summary || null,
      transcriptId: insertAnalysis.transcriptId || null,
      status: insertAnalysis.status || "completed",
      decisionsCount: insertAnalysis.decisionsCount || null,
      risksCount: insertAnalysis.risksCount || null,
      blockersCount: insertAnalysis.blockersCount || null,
      createdAt: new Date() 
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async updateAnalysis(id: string, updates: Partial<InsertAnalysis>): Promise<Analysis | undefined> {
    const analysis = this.analyses.get(id);
    if (!analysis) return undefined;
    const updated = { ...analysis, ...updates };
    this.analyses.set(id, updated);
    return updated;
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    // In a real database, this would cascade delete related records
    // For now, we'll manually delete related data
    const analysis = this.analyses.get(id);
    if (!analysis) return false;

    // Delete related decisions
    Array.from(this.decisions.entries()).forEach(([key, decision]) => {
      if (decision.analysisId === id) {
        this.decisions.delete(key);
      }
    });

    // Delete related risks
    Array.from(this.risks.entries()).forEach(([key, risk]) => {
      if (risk.analysisId === id) {
        this.risks.delete(key);
      }
    });

    // Delete related action items
    Array.from(this.actionItems.entries()).forEach(([key, item]) => {
      if (item.analysisId === id) {
        this.actionItems.delete(key);
      }
    });

    // Delete the analysis itself
    return this.analyses.delete(id);
  }

  // Decisions
  async getDecisionsByAnalysisId(analysisId: string): Promise<Decision[]> {
    return Array.from(this.decisions.values()).filter(
      (decision) => decision.analysisId === analysisId,
    );
  }

  async getDecisionsByProjectId(projectId: string): Promise<Decision[]> {
    return Array.from(this.decisions.values()).filter(
      (decision) => decision.projectId === projectId,
    );
  }

  async createDecision(insertDecision: InsertDecision): Promise<Decision> {
    const id = randomUUID();
    const decision: Decision = { 
      ...insertDecision, 
      id, 
      owner: insertDecision.owner || null,
      rationale: insertDecision.rationale || null,
      confidence: insertDecision.confidence || null,
      evidence: insertDecision.evidence || null,
      createdAt: new Date() 
    };
    this.decisions.set(id, decision);
    return decision;
  }

  // Risks
  async getRisksByAnalysisId(analysisId: string): Promise<Risk[]> {
    return Array.from(this.risks.values()).filter(
      (risk) => risk.analysisId === analysisId,
    );
  }

  async getRisksByProjectId(projectId: string): Promise<Risk[]> {
    return Array.from(this.risks.values()).filter(
      (risk) => risk.projectId === projectId,
    );
  }

  async getTopRisks(limit: number = 5): Promise<Risk[]> {
    return Array.from(this.risks.values())
      .sort((a, b) => {
        const severityOrder = { High: 3, Med: 2, Low: 1 };
        const severityDiff = (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                            (severityOrder[a.severity as keyof typeof severityOrder] || 0);
        if (severityDiff !== 0) return severityDiff;
        return (b.mentions || 0) - (a.mentions || 0);
      })
      .slice(0, limit);
  }

  async createRisk(insertRisk: InsertRisk): Promise<Risk> {
    const id = randomUUID();
    const now = new Date();
    const risk: Risk = { 
      ...insertRisk, 
      id, 
      owner: insertRisk.owner || null,
      likelihood: insertRisk.likelihood || null,
      impact: insertRisk.impact || null,
      mitigation: insertRisk.mitigation || null,
      confidence: insertRisk.confidence || null,
      evidence: insertRisk.evidence || null,
      mentions: 1,
      createdAt: now, 
      lastSeen: now 
    };
    this.risks.set(id, risk);
    return risk;
  }

  // Action Items
  async getActionItemsByAnalysisId(analysisId: string): Promise<ActionItem[]> {
    return Array.from(this.actionItems.values()).filter(
      (item) => item.analysisId === analysisId,
    );
  }

  async getActionItemsByProjectId(projectId: string): Promise<ActionItem[]> {
    return Array.from(this.actionItems.values()).filter(
      (item) => item.projectId === projectId,
    );
  }

  async createActionItem(insertActionItem: InsertActionItem): Promise<ActionItem> {
    const id = randomUUID();
    const actionItem: ActionItem = { 
      ...insertActionItem, 
      id, 
      owner: insertActionItem.owner || null,
      dueDate: insertActionItem.dueDate || null,
      status: insertActionItem.status || null,
      priority: insertActionItem.priority || null,
      createdAt: new Date() 
    };
    this.actionItems.set(id, actionItem);
    return actionItem;
  }

  async updateActionItem(id: string, updates: Partial<InsertActionItem>): Promise<ActionItem | undefined> {
    const actionItem = this.actionItems.get(id);
    if (!actionItem) return undefined;
    const updated = { ...actionItem, ...updates };
    this.actionItems.set(id, updated);
    return updated;
  }

  // Calendar Events
  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    return this.calendarEvents.get(id);
  }

  async getCalendarEventsByProjectId(projectId: string): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values())
      .filter((event) => event.projectId === projectId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  async getCalendarEventsByDateRange(projectId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values())
      .filter((event) => 
        event.projectId === projectId &&
        new Date(event.startDate) >= startDate &&
        new Date(event.startDate) <= endDate
      )
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  async getUpcomingEvents(projectId: string, limit: number = 10): Promise<CalendarEvent[]> {
    const now = new Date();
    return Array.from(this.calendarEvents.values())
      .filter((event) => 
        event.projectId === projectId &&
        new Date(event.startDate) >= now &&
        event.status === "scheduled"
      )
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limit);
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = randomUUID();
    const now = new Date();
    const event: CalendarEvent = {
      ...insertEvent,
      id,
      status: insertEvent.status || "scheduled",
      allDay: insertEvent.allDay ?? false,
      endDate: insertEvent.endDate || null,
      location: insertEvent.location || null,
      attendees: insertEvent.attendees || null,
      relatedAnalysisId: insertEvent.relatedAnalysisId || null,
      relatedActionItemId: insertEvent.relatedActionItemId || null,
      reminderMinutes: insertEvent.reminderMinutes || null,
      description: insertEvent.description || null,
      createdAt: now,
      updatedAt: now,
    };
    this.calendarEvents.set(id, event);
    return event;
  }

  async updateCalendarEvent(id: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const event = this.calendarEvents.get(id);
    if (!event) return undefined;
    const updated = { ...event, ...updates, updatedAt: new Date() };
    this.calendarEvents.set(id, updated);
    return updated;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }
}

// Old in-memory storage - replaced with SQLite
// export const storage = new MemStorage();


// SQLite Storage Implementation
export class SqliteStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = sql`CURRENT_TIMESTAMP`;
    
    await db.insert(users).values({
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email || null,
      googleCalendarToken: null,
      jiraBaseUrl: null,
      jiraEmail: null,
      jiraApiToken: null,
      createdAt: now,
    });
    
    // Fetch the created user to get the actual timestamp
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0]!;
  }

  async updateUserGoogleToken(userId: string, token: string | null): Promise<void> {
    await db.update(users)
      .set({ googleCalendarToken: token })
      .where(eq(users.id, userId));
  }

  async getUserGoogleToken(userId: string): Promise<string | null> {
    const result = await db.select({ token: users.googleCalendarToken })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return result[0]?.token || null;
  }

  async updateUserJiraConfig(userId: string, config: { baseUrl: string; email: string; apiToken: string } | null): Promise<void> {
    if (config) {
      await db.update(users)
        .set({ 
          jiraBaseUrl: config.baseUrl,
          jiraEmail: config.email,
          jiraApiToken: config.apiToken,
        })
        .where(eq(users.id, userId));
    } else {
      await db.update(users)
        .set({ 
          jiraBaseUrl: null,
          jiraEmail: null,
          jiraApiToken: null,
        })
        .where(eq(users.id, userId));
    }
  }

  async getUserJiraConfig(userId: string): Promise<{ baseUrl: string; email: string; apiToken: string } | null> {
    const result = await db.select({ 
      baseUrl: users.jiraBaseUrl,
      email: users.jiraEmail,
      apiToken: users.jiraApiToken,
    })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    const config = result[0];
    if (config?.baseUrl && config?.email && config?.apiToken) {
      return {
        baseUrl: config.baseUrl,
        email: config.email,
        apiToken: config.apiToken,
      };
    }
    return null;
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.ownerId, userId));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = sql`CURRENT_TIMESTAMP`;
    
    await db.insert(projects).values({
      id,
      name: insertProject.name,
      description: insertProject.description || null,
      ownerId: insertProject.ownerId,
      createdAt: now,
      updatedAt: now,
    });
    
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0]!;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    await db.update(projects)
      .set({ ...updates, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(projects.id, id));
    return this.getProject(id);
  }

  // Transcripts
  async getTranscript(id: string): Promise<Transcript | undefined> {
    const result = await db.select().from(transcripts).where(eq(transcripts.id, id)).limit(1);
    return result[0];
  }

  async getTranscriptsByProjectId(projectId: string): Promise<Transcript[]> {
    return await db.select().from(transcripts).where(eq(transcripts.projectId, projectId));
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const id = randomUUID();
    
    await db.insert(transcripts).values({
      id,
      projectId: insertTranscript.projectId,
      userId: insertTranscript.userId,
      content: insertTranscript.content,
      meetingType: insertTranscript.meetingType || null,
      fileName: insertTranscript.fileName || null,
      createdAt: sql`CURRENT_TIMESTAMP`,
    });
    
    const result = await db.select().from(transcripts).where(eq(transcripts.id, id)).limit(1);
    return result[0]!;
  }

  // Analyses
  async getAnalysis(id: string): Promise<Analysis | undefined> {
    const result = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
    return result[0];
  }

  async getAnalysesByProjectId(projectId: string): Promise<Analysis[]> {
    return await db.select()
      .from(analyses)
      .where(eq(analyses.projectId, projectId))
      .orderBy(desc(analyses.createdAt));
  }

  async getRecentAnalyses(limit: number = 10): Promise<Analysis[]> {
    return await db.select()
      .from(analyses)
      .orderBy(desc(analyses.createdAt))
      .limit(limit);
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = randomUUID();
    
    await db.insert(analyses).values({
      id,
      transcriptId: insertAnalysis.transcriptId || null,
      projectId: insertAnalysis.projectId,
      userId: insertAnalysis.userId,
      inputType: insertAnalysis.inputType,
      summary: insertAnalysis.summary || null,
      status: insertAnalysis.status || "completed",
      decisionsCount: insertAnalysis.decisionsCount || null,
      risksCount: insertAnalysis.risksCount || null,
      blockersCount: insertAnalysis.blockersCount || null,
      createdAt: sql`CURRENT_TIMESTAMP`,
    });
    
    const result = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
    return result[0]!;
  }

  async updateAnalysis(id: string, updates: Partial<InsertAnalysis>): Promise<Analysis | undefined> {
    await db.update(analyses).set(updates).where(eq(analyses.id, id));
    return this.getAnalysis(id);
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    // Delete related data (cascade)
    await db.delete(decisions).where(eq(decisions.analysisId, id));
    await db.delete(risks).where(eq(risks.analysisId, id));
    await db.delete(actionItems).where(eq(actionItems.analysisId, id));
    
    // Delete the analysis
    const result = await db.delete(analyses).where(eq(analyses.id, id));
    return true;
  }

  // Decisions
  async getDecisionsByAnalysisId(analysisId: string): Promise<Decision[]> {
    return await db.select().from(decisions).where(eq(decisions.analysisId, analysisId));
  }

  async getDecisionsByProjectId(projectId: string): Promise<Decision[]> {
    return await db.select().from(decisions).where(eq(decisions.projectId, projectId));
  }

  async createDecision(insertDecision: InsertDecision): Promise<Decision> {
    const id = randomUUID();
    
    await db.insert(decisions).values({
      id,
      analysisId: insertDecision.analysisId,
      projectId: insertDecision.projectId,
      decision: insertDecision.decision,
      owner: insertDecision.owner || null,
      rationale: insertDecision.rationale || null,
      confidence: insertDecision.confidence || null,
      evidence: insertDecision.evidence || null,
      createdAt: sql`CURRENT_TIMESTAMP`,
    });
    
    const result = await db.select().from(decisions).where(eq(decisions.id, id)).limit(1);
    return result[0]!;
  }

  // Risks
  async getRisksByAnalysisId(analysisId: string): Promise<Risk[]> {
    return await db.select().from(risks).where(eq(risks.analysisId, analysisId));
  }

  async getRisksByProjectId(projectId: string): Promise<Risk[]> {
    return await db.select().from(risks).where(eq(risks.projectId, projectId));
  }

  async getTopRisks(limit: number = 5): Promise<Risk[]> {
    return await db.select()
      .from(risks)
      .orderBy(desc(risks.mentions))
      .limit(limit);
  }

  async createRisk(insertRisk: InsertRisk): Promise<Risk> {
    const id = randomUUID();
    const now = sql`CURRENT_TIMESTAMP`;
    
    await db.insert(risks).values({
      id,
      analysisId: insertRisk.analysisId,
      projectId: insertRisk.projectId,
      risk: insertRisk.risk,
      severity: insertRisk.severity,
      owner: insertRisk.owner || null,
      likelihood: insertRisk.likelihood || null,
      impact: insertRisk.impact || null,
      mitigation: insertRisk.mitigation || null,
      confidence: insertRisk.confidence || null,
      evidence: insertRisk.evidence || null,
      mentions: 1,
      createdAt: now,
      lastSeen: now,
    });
    
    const result = await db.select().from(risks).where(eq(risks.id, id)).limit(1);
    return result[0]!;
  }

  // Action Items
  async getActionItemsByAnalysisId(analysisId: string): Promise<ActionItem[]> {
    return await db.select().from(actionItems).where(eq(actionItems.analysisId, analysisId));
  }

  async getActionItemsByProjectId(projectId: string): Promise<ActionItem[]> {
    return await db.select().from(actionItems).where(eq(actionItems.projectId, projectId));
  }

  async createActionItem(insertActionItem: InsertActionItem): Promise<ActionItem> {
    const id = randomUUID();
    
    await db.insert(actionItems).values({
      id,
      analysisId: insertActionItem.analysisId,
      projectId: insertActionItem.projectId,
      action: insertActionItem.action,
      owner: insertActionItem.owner || null,
      dueDate: insertActionItem.dueDate || null,
      status: insertActionItem.status || null,
      priority: insertActionItem.priority || null,
      createdAt: sql`CURRENT_TIMESTAMP`,
    });
    
    const result = await db.select().from(actionItems).where(eq(actionItems.id, id)).limit(1);
    return result[0]!;
  }

  async updateActionItem(id: string, updates: Partial<InsertActionItem>): Promise<ActionItem | undefined> {
    await db.update(actionItems).set(updates).where(eq(actionItems.id, id));
    const result = await db.select().from(actionItems).where(eq(actionItems.id, id)).limit(1);
    return result[0];
  }

  // Calendar Events
  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const result = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)).limit(1);
    return result[0];
  }

  async getCalendarEventsByProjectId(projectId: string): Promise<CalendarEvent[]> {
    return await db.select()
      .from(calendarEvents)
      .where(eq(calendarEvents.projectId, projectId))
      .orderBy(calendarEvents.startDate);
  }

  async getCalendarEventsByDateRange(projectId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return await db.select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.projectId, projectId),
          gte(calendarEvents.startDate, startDate),
          lte(calendarEvents.startDate, endDate)
        )
      )
      .orderBy(calendarEvents.startDate);
  }

  async getUpcomingEvents(projectId: string, limit: number = 10): Promise<CalendarEvent[]> {
    const now = new Date();
    return await db.select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.projectId, projectId),
          gte(calendarEvents.startDate, now),
          eq(calendarEvents.status, "scheduled")
        )
      )
      .orderBy(calendarEvents.startDate)
      .limit(limit);
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = randomUUID();
    const now = sql`CURRENT_TIMESTAMP`;
    
    // For PostgreSQL, convert Date objects to ISO strings
    // For SQLite, keep as Date objects (Drizzle converts to integers)
    const startDate = isPostgres && insertEvent.startDate instanceof Date
      ? insertEvent.startDate.toISOString()
      : insertEvent.startDate;
    const endDate = insertEvent.endDate
      ? (isPostgres && insertEvent.endDate instanceof Date
          ? insertEvent.endDate.toISOString()
          : insertEvent.endDate)
      : null;
    
    await db.insert(calendarEvents).values({
      id,
      projectId: insertEvent.projectId,
      userId: insertEvent.userId,
      title: insertEvent.title,
      description: insertEvent.description || null,
      eventType: insertEvent.eventType,
      startDate: startDate as any,
      endDate: endDate as any,
      allDay: insertEvent.allDay ?? false,
      location: insertEvent.location || null,
      attendees: insertEvent.attendees || null,
      relatedAnalysisId: insertEvent.relatedAnalysisId || null,
      relatedActionItemId: insertEvent.relatedActionItemId || null,
      status: insertEvent.status || "scheduled",
      reminderMinutes: insertEvent.reminderMinutes || null,
      createdAt: now,
      updatedAt: now,
    });
    
    const result = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)).limit(1);
    return result[0]!;
  }

  async updateCalendarEvent(id: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    await db.update(calendarEvents)
      .set({ ...updates, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(calendarEvents.id, id));
    return this.getCalendarEvent(id);
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return true;
  }

  // User Integrations
  async getUserIntegration(userId: string, provider: string): Promise<UserIntegration | undefined> {
    const [integration] = await db.select()
      .from(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.provider, provider)
      ))
      .limit(1);
    return integration;
  }

  async getUserIntegrations(userId: string): Promise<UserIntegration[]> {
    return db.select()
      .from(userIntegrations)
      .where(eq(userIntegrations.userId, userId));
  }

  async createUserIntegration(integration: InsertUserIntegration): Promise<UserIntegration> {
    const id = randomUUID();
    const now = sql`CURRENT_TIMESTAMP`;
    
    await db.insert(userIntegrations).values({
      id,
      userId: integration.userId,
      provider: integration.provider,
      credentials: integration.credentials,
      metadata: integration.metadata || null,
      isActive: integration.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
    
    const result = await db.select().from(userIntegrations)
      .where(eq(userIntegrations.id, id))
      .limit(1);
    return result[0]!;
  }

  async updateUserIntegration(userId: string, provider: string, updates: Partial<InsertUserIntegration>): Promise<UserIntegration | undefined> {
    await db.update(userIntegrations)
      .set({ ...updates, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.provider, provider)
      ));
    return this.getUserIntegration(userId, provider);
  }

  async deleteUserIntegration(userId: string, provider: string): Promise<boolean> {
    await db.delete(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.provider, provider)
      ));
    return true;
  }
}

// Export the storage instance - now using SQLite!
export const storage = new SqliteStorage();

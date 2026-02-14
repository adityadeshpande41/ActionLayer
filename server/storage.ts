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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private transcripts: Map<string, Transcript>;
  private analyses: Map<string, Analysis>;
  private decisions: Map<string, Decision>;
  private risks: Map<string, Risk>;
  private actionItems: Map<string, ActionItem>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.transcripts = new Map();
    this.analyses = new Map();
    this.decisions = new Map();
    this.risks = new Map();
    this.actionItems = new Map();
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
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
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
}

export const storage = new MemStorage();

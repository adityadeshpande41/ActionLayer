import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Helper for UUID generation in SQLite
const generateId = () => crypto.randomUUID();

// Users
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(generateId),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Projects
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Transcripts
export const transcripts = sqliteTable("transcripts", {
  id: text("id").primaryKey().$defaultFn(generateId),
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  meetingType: text("meeting_type"),
  fileName: text("file_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertTranscriptSchema = createInsertSchema(transcripts).omit({ id: true, createdAt: true });
export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type Transcript = typeof transcripts.$inferSelect;

// Analyses
export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey().$defaultFn(generateId),
  transcriptId: text("transcript_id").references(() => transcripts.id),
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  inputType: text("input_type").notNull(), // 'transcript', 'intake', 'command'
  summary: text("summary", { mode: "json" }), // JSON stored as text
  decisionsCount: integer("decisions_count").default(0),
  risksCount: integer("risks_count").default(0),
  blockersCount: integer("blockers_count").default(0),
  status: text("status").notNull().default("completed"), // 'in-progress', 'completed', 'failed'
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({ id: true, createdAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

// Decisions
export const decisions = sqliteTable("decisions", {
  id: text("id").primaryKey().$defaultFn(generateId),
  analysisId: text("analysis_id").notNull().references(() => analyses.id),
  projectId: text("project_id").notNull().references(() => projects.id),
  decision: text("decision").notNull(),
  owner: text("owner"),
  rationale: text("rationale"),
  confidence: integer("confidence"),
  evidence: text("evidence"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertDecisionSchema = createInsertSchema(decisions).omit({ id: true, createdAt: true });
export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Decision = typeof decisions.$inferSelect;

// Risks
export const risks = sqliteTable("risks", {
  id: text("id").primaryKey().$defaultFn(generateId),
  analysisId: text("analysis_id").notNull().references(() => analyses.id),
  projectId: text("project_id").notNull().references(() => projects.id),
  risk: text("risk").notNull(),
  likelihood: text("likelihood"),
  impact: text("impact"),
  severity: text("severity").notNull(),
  owner: text("owner"),
  mitigation: text("mitigation"),
  confidence: integer("confidence"),
  evidence: text("evidence"),
  mentions: integer("mentions").default(1),
  lastSeen: integer("last_seen", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertRiskSchema = createInsertSchema(risks).omit({ id: true, createdAt: true, lastSeen: true });
export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type Risk = typeof risks.$inferSelect;

// Action Items
export const actionItems = sqliteTable("action_items", {
  id: text("id").primaryKey().$defaultFn(generateId),
  analysisId: text("analysis_id").notNull().references(() => analyses.id),
  projectId: text("project_id").notNull().references(() => projects.id),
  action: text("action").notNull(),
  owner: text("owner"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  status: text("status").default("pending"), // 'pending', 'in-progress', 'completed', 'cancelled'
  priority: text("priority"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertActionItemSchema = createInsertSchema(actionItems).omit({ id: true, createdAt: true });
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type ActionItem = typeof actionItems.$inferSelect;

// Calendar Events
export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey().$defaultFn(generateId),
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull(), // 'meeting', 'deadline', 'milestone', 'reminder', 'action-item'
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  allDay: integer("all_day", { mode: "boolean" }).default(false),
  location: text("location"),
  attendees: text("attendees", { mode: "json" }), // JSON array stored as text
  relatedAnalysisId: text("related_analysis_id").references(() => analyses.id),
  relatedActionItemId: text("related_action_item_id").references(() => actionItems.id),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'completed', 'cancelled'
  reminderMinutes: integer("reminder_minutes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

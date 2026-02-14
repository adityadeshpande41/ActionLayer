import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Projects
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Transcripts
export const transcripts = pgTable("transcripts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  meetingType: text("meeting_type"),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTranscriptSchema = createInsertSchema(transcripts).omit({ id: true, createdAt: true });
export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type Transcript = typeof transcripts.$inferSelect;

// Analyses
export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transcriptId: varchar("transcript_id").references(() => transcripts.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  inputType: text("input_type").notNull(), // 'transcript', 'intake', 'command'
  summary: jsonb("summary"),
  decisionsCount: integer("decisions_count").default(0),
  risksCount: integer("risks_count").default(0),
  blockersCount: integer("blockers_count").default(0),
  status: text("status").notNull().default("completed"), // 'in-progress', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({ id: true, createdAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

// Decisions
export const decisions = pgTable("decisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").notNull().references(() => analyses.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  decision: text("decision").notNull(),
  owner: text("owner"),
  rationale: text("rationale"),
  confidence: integer("confidence"),
  evidence: text("evidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDecisionSchema = createInsertSchema(decisions).omit({ id: true, createdAt: true });
export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Decision = typeof decisions.$inferSelect;

// Risks
export const risks = pgTable("risks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").notNull().references(() => analyses.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  risk: text("risk").notNull(),
  likelihood: text("likelihood"),
  impact: text("impact"),
  severity: text("severity").notNull(),
  owner: text("owner"),
  mitigation: text("mitigation"),
  confidence: integer("confidence"),
  evidence: text("evidence"),
  mentions: integer("mentions").default(1),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRiskSchema = createInsertSchema(risks).omit({ id: true, createdAt: true, lastSeen: true });
export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type Risk = typeof risks.$inferSelect;

// Action Items
export const actionItems = pgTable("action_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").notNull().references(() => analyses.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  action: text("action").notNull(),
  owner: text("owner"),
  dueDate: timestamp("due_date"),
  status: text("status").default("pending"), // 'pending', 'in-progress', 'completed'
  priority: text("priority"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActionItemSchema = createInsertSchema(actionItems).omit({ id: true, createdAt: true });
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type ActionItem = typeof actionItems.$inferSelect;

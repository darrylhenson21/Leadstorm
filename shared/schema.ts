import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  keyword: text("keyword"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const runs = pgTable("runs", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  keyword: text("keyword").notNull(),
  leadsAdded: integer("leads_added").default(0),
  duplicates: integer("duplicates").default(0),
  noEmail: integer("no_email").default(0),
  status: text("status").notNull(), // 'running', 'completed', 'failed'
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export const configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  googlePlacesKey: text("google_places_key"),
  defaultCity: text("default_city"),
  defaultKeyword: text("default_keyword"),
  dailyCap: integer("daily_cap").default(50),
  requestDelay: integer("request_delay").default(1000),
  maxRunDuration: integer("max_run_duration").default(30),
  retryAttempts: integer("retry_attempts").default(3),
  backoffMultiplier: integer("backoff_multiplier").default(2),
  enableUserAgentRotation: boolean("enable_user_agent_rotation").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertRunSchema = createInsertSchema(runs).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertConfigurationSchema = createInsertSchema(configurations).omit({
  id: true,
  updatedAt: true,
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Run = typeof runs.$inferSelect;
export type InsertRun = z.infer<typeof insertRunSchema>;
export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;

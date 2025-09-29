import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  decimal,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Settings table for API tokens and user preferences
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  key: text("key").notNull(),
  valueEncrypted: text("value_encrypted"), // Encrypted sensitive data
  valueText: text("value_text"), // Plain text data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transaction sync status enum
export const syncStatusEnum = pgEnum('sync_status', ['pending', 'synced', 'failed', 'conflict']);
export const transactionSourceEnum = pgEnum('transaction_source', ['up_bank', 'manual', 'transfer', 'import']);
export const transactionStatusEnum = pgEnum('transaction_status', ['HELD', 'SETTLED']);

// Enhanced transactions table with UP Bank integration
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  upTransactionId: varchar("up_transaction_id").unique(), // UP Bank ID for sync
  accountId: varchar("account_id"), // UP Bank account ID
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  tags: text("tags").default(""), // Comma-separated tags
  type: text("type"), // Purchase, Transfer, etc.
  status: transactionStatusEnum("status").default('SETTLED'),
  rawData: jsonb("raw_data"), // Complete UP Bank API response
  syncStatus: syncStatusEnum("sync_status").default('pending'),
  source: transactionSourceEnum("source").default('manual'),
  account: text("account").notNull(), // User-friendly account name
  uniqueId: varchar("unique_id").unique().default(sql`gen_random_uuid()`), // For manual entries
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Auto-tag rules table
export const autotagRulesStatusEnum = pgEnum('autotag_rule_status', ['active', 'inactive', 'draft']);

export const autotagRules = pgTable("autotag_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  status: autotagRulesStatusEnum("status").default('active'),
  searchCriteria: jsonb("search_criteria").notNull(), // SearchCriteria object
  applyCriteria: jsonb("apply_criteria").notNull(), // ApplyCriteria object
  performanceData: jsonb("performance_data"), // Rule performance metrics
  matches: integer("matches").default(0),
  lastRun: timestamp("last_run"),
  lastMatched: timestamp("last_matched"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Webhook events table
export const webhookEventTypeEnum = pgEnum('webhook_event_type', [
  'TRANSACTION_CREATED',
  'TRANSACTION_SETTLED',
  'TRANSACTION_DELETED',
  'PING'
]);

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: webhookEventTypeEnum("event_type").notNull(),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  upTransactionId: varchar("up_transaction_id"), // UP Bank transaction ID
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").default(false),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  error: text("error"), // Error message if processing failed
});

// Sync queue for retry logic
export const syncQueueStatusEnum = pgEnum('sync_queue_status', ['pending', 'processing', 'completed', 'failed']);

export const syncQueue = pgTable("sync_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").references(() => transactions.id).notNull(),
  field: text("field").notNull(), // 'category', 'tags', 'both'
  newValue: text("new_value").notNull(),
  attempts: integer("attempts").default(0),
  lastAttempt: timestamp("last_attempt"),
  status: syncQueueStatusEnum("status").default('pending'),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API logs for monitoring and debugging
export const apiLogs = pgTable("api_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time_ms"),
  error: text("error"),
  rateLimited: boolean("rate_limited").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertSettingsSchema = createInsertSchema(settings);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertAutotagRuleSchema = createInsertSchema(autotagRules);
export const insertWebhookEventSchema = createInsertSchema(webhookEvents);
export const insertSyncQueueSchema = createInsertSchema(syncQueue);
export const insertApiLogSchema = createInsertSchema(apiLogs);

// Select types
export type Setting = typeof settings.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type AutotagRule = typeof autotagRules.$inferSelect;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type ApiLog = typeof apiLogs.$inferSelect;

// Insert types
export type InsertSetting = z.infer<typeof insertSettingsSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertAutotagRule = z.infer<typeof insertAutotagRuleSchema>;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type InsertSyncQueueItem = z.infer<typeof insertSyncQueueSchema>;
export type InsertApiLog = z.infer<typeof insertApiLogSchema>;

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

// Bank type enum
export const bankTypeEnum = pgEnum('bank_type', ['up_bank', 'commbank', 'nab', 'anz', 'westpac', 'other']);

// Banks table for multi-bank configuration
export const banks = pgTable("banks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  bankType: bankTypeEnum("bank_type").default('other'),
  apiToken: text("api_token"), // Encrypted token
  enabled: boolean("enabled").default(true),
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
  bankId: varchar("bank_id").references(() => banks.id), // Reference to banks table
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

// Webhook sync state - tracks last processed webhook for smart sync
export const webhookSyncState = pgTable("webhook_sync_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  webhookId: varchar("webhook_id"), // UP Bank webhook ID
  lastProcessedWebhookDeliveryId: varchar("last_processed_webhook_delivery_id"),
  lastProcessedTimestamp: timestamp("last_processed_timestamp"),
  lastFullSync: timestamp("last_full_sync"), // Last time we did full sync fallback
  lastSmartSync: timestamp("last_smart_sync"), // Last time we did smart webhook log sync
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sync queue for retry logic
export const syncQueueStatusEnum = pgEnum('sync_queue_status', ['pending', 'processing', 'completed', 'failed', 'conflict']);

export const syncQueue = pgTable("sync_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").references(() => transactions.id).notNull(),
  upTransactionId: varchar("up_transaction_id"), // UP Bank transaction ID for direct lookup
  field: text("field").notNull(), // 'category', 'tags', 'both'
  oldValue: text("old_value"), // Previous value before change
  newValue: text("new_value").notNull(),
  attempts: integer("attempts").default(0),
  lastAttempt: timestamp("last_attempt"),
  status: syncQueueStatusEnum("status").default('pending'),
  priority: integer("priority").default(3), // 1=high, 5=low
  scheduledFor: timestamp("scheduled_for"), // Retry after this time
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

// API usage tracker for rate limiting
export const apiUsageTracker = pgTable("api_usage_tracker", {
  hourWindow: timestamp("hour_window").primaryKey(), // Rounded to hour: "2025-10-02T03:00:00Z"
  callsUsed: integer("calls_used").default(0).notNull(),
  callsLimit: integer("calls_limit").default(1000).notNull(),
  lastReset: timestamp("last_reset").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Deep sync progress tracking
export const deepSyncStatusEnum = pgEnum('deep_sync_status', ['idle', 'running', 'paused', 'completed', 'error']);

export const deepSyncProgress = pgTable("deep_sync_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  lastSyncedCursor: text("last_synced_cursor"), // UP Bank pagination cursor
  lastSyncedDate: timestamp("last_synced_date"), // Date of oldest synced transaction
  status: deepSyncStatusEnum("status").default('idle').notNull(),
  totalSynced: integer("total_synced").default(0).notNull(),
  currentBatch: integer("current_batch").default(0).notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertSettingsSchema = createInsertSchema(settings);
export const insertBankSchema = createInsertSchema(banks);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertAutotagRuleSchema = createInsertSchema(autotagRules);
export const insertWebhookEventSchema = createInsertSchema(webhookEvents);
export const insertWebhookSyncStateSchema = createInsertSchema(webhookSyncState);
export const insertSyncQueueSchema = createInsertSchema(syncQueue);
export const insertApiLogSchema = createInsertSchema(apiLogs);
export const insertApiUsageTrackerSchema = createInsertSchema(apiUsageTracker);
export const insertDeepSyncProgressSchema = createInsertSchema(deepSyncProgress);

// Select types
export type Setting = typeof settings.$inferSelect;
export type Bank = typeof banks.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type AutotagRule = typeof autotagRules.$inferSelect;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type WebhookSyncState = typeof webhookSyncState.$inferSelect;
export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type ApiLog = typeof apiLogs.$inferSelect;
export type ApiUsageTracker = typeof apiUsageTracker.$inferSelect;
export type DeepSyncProgress = typeof deepSyncProgress.$inferSelect;

// Insert types
export type InsertSetting = z.infer<typeof insertSettingsSchema>;
export type InsertBank = z.infer<typeof insertBankSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertAutotagRule = z.infer<typeof insertAutotagRuleSchema>;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type InsertWebhookSyncState = z.infer<typeof insertWebhookSyncStateSchema>;
export type InsertSyncQueueItem = z.infer<typeof insertSyncQueueSchema>;
export type InsertApiLog = z.infer<typeof insertApiLogSchema>;

CREATE TYPE "public"."autotag_rule_status" AS ENUM('active', 'inactive', 'draft');--> statement-breakpoint
CREATE TYPE "public"."bank_type" AS ENUM('up_bank', 'commbank', 'nab', 'anz', 'westpac', 'other');--> statement-breakpoint
CREATE TYPE "public"."deep_sync_status" AS ENUM('idle', 'running', 'paused', 'completed', 'error');--> statement-breakpoint
CREATE TYPE "public"."sync_queue_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'conflict');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'synced', 'failed', 'conflict');--> statement-breakpoint
CREATE TYPE "public"."transaction_source" AS ENUM('up_bank', 'manual', 'transfer', 'import');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('HELD', 'SETTLED');--> statement-breakpoint
CREATE TYPE "public"."webhook_event_type" AS ENUM('TRANSACTION_CREATED', 'TRANSACTION_SETTLED', 'TRANSACTION_DELETED', 'PING');--> statement-breakpoint
CREATE TABLE "api_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"status_code" integer,
	"response_time_ms" integer,
	"error" text,
	"rate_limited" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_usage_tracker" (
	"hour_window" timestamp PRIMARY KEY NOT NULL,
	"calls_used" integer DEFAULT 0 NOT NULL,
	"calls_limit" integer DEFAULT 1000 NOT NULL,
	"last_reset" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autotag_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"status" "autotag_rule_status" DEFAULT 'active',
	"search_criteria" jsonb NOT NULL,
	"apply_criteria" jsonb NOT NULL,
	"performance_data" jsonb,
	"matches" integer DEFAULT 0,
	"last_run" timestamp,
	"last_matched" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"bank_type" "bank_type" DEFAULT 'other',
	"api_token" text,
	"account_number" text,
	"csv_config" jsonb,
	"enabled" boolean DEFAULT true,
	"last_sync" timestamp,
	"transaction_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deep_sync_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"last_synced_cursor" text,
	"last_synced_date" timestamp,
	"status" "deep_sync_status" DEFAULT 'idle' NOT NULL,
	"total_synced" integer DEFAULT 0 NOT NULL,
	"current_batch" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"key" text NOT NULL,
	"value_encrypted" text,
	"value_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" varchar NOT NULL,
	"up_transaction_id" varchar,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text NOT NULL,
	"attempts" integer DEFAULT 0,
	"last_attempt" timestamp,
	"status" "sync_queue_status" DEFAULT 'pending',
	"priority" integer DEFAULT 3,
	"scheduled_for" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"up_transaction_id" varchar,
	"account_id" varchar,
	"bank_id" varchar,
	"amount" numeric(12, 2) NOT NULL,
	"date" timestamp NOT NULL,
	"description" text NOT NULL,
	"category" text,
	"tags" text DEFAULT '',
	"type" text,
	"status" "transaction_status" DEFAULT 'SETTLED',
	"raw_data" jsonb,
	"sync_status" "sync_status" DEFAULT 'pending',
	"source" "transaction_source" DEFAULT 'manual',
	"account" text NOT NULL,
	"unique_id" varchar DEFAULT gen_random_uuid(),
	"processed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_up_transaction_id_unique" UNIQUE("up_transaction_id"),
	CONSTRAINT "transactions_unique_id_unique" UNIQUE("unique_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "webhook_event_type" NOT NULL,
	"transaction_id" varchar,
	"up_transaction_id" varchar,
	"payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "webhook_sync_state" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"webhook_id" varchar,
	"last_processed_webhook_delivery_id" varchar,
	"last_processed_timestamp" timestamp,
	"last_full_sync" timestamp,
	"last_smart_sync" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autotag_rules" ADD CONSTRAINT "autotag_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banks" ADD CONSTRAINT "banks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bank_id_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;
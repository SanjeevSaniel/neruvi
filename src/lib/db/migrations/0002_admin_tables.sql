CREATE TYPE "public"."moderation_action" AS ENUM('warn', 'timeban', 'ban', 'unban', 'course_restrict', 'course_allow');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewed', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'banned', 'pending');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) DEFAULT 'general',
	"priority" varchar(20) DEFAULT 'normal',
	"target_roles" jsonb DEFAULT '["user", "moderator", "admin"]',
	"target_users" jsonb DEFAULT '[]',
	"is_active" boolean DEFAULT true,
	"is_pinned" boolean DEFAULT false,
	"show_from" timestamp DEFAULT now(),
	"show_until" timestamp,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_id" uuid NOT NULL,
	"reason" varchar(100) NOT NULL,
	"description" text,
	"priority" varchar(20) DEFAULT 'normal',
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"resolution" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_user_id" uuid NOT NULL,
	"moderator_id" uuid NOT NULL,
	"action" "moderation_action" NOT NULL,
	"reason" text NOT NULL,
	"duration" integer,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"revoked_at" timestamp,
	"revoked_by" uuid,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"active_users" integer DEFAULT 0,
	"new_users" integer DEFAULT 0,
	"total_conversations" integer DEFAULT 0,
	"total_messages" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"average_session_time" integer DEFAULT 0,
	"top_courses" jsonb DEFAULT '[]',
	"moderation_actions" integer DEFAULT 0,
	"reported_content" integer DEFAULT 0,
	"system_uptime" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "platform_analytics_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"conversations_created" integer DEFAULT 0,
	"messages_exchanged" integer DEFAULT 0,
	"tokens_used" integer DEFAULT 0,
	"courses_accessed" jsonb DEFAULT '[]',
	"features_used" jsonb DEFAULT '[]',
	"session_count" integer DEFAULT 0,
	"total_session_time" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"status_reason" text,
	"status_until" timestamp,
	"bio" text,
	"avatar_url" varchar(500),
	"last_active_at" timestamp DEFAULT now(),
	"nodejs_access" boolean DEFAULT true,
	"python_access" boolean DEFAULT true,
	"all_courses_access" boolean DEFAULT false,
	"two_factor_enabled" boolean DEFAULT false,
	"login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"preferences" jsonb DEFAULT '{}',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_warnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"issued_by" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"severity" "severity" DEFAULT 'low' NOT NULL,
	"strike_count" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"acknowledged_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_announcements_author" ON "announcements" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_announcements_type" ON "announcements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_announcements_active" ON "announcements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_announcements_show_dates" ON "announcements" USING btree ("show_from","show_until");--> statement-breakpoint
CREATE INDEX "idx_announcements_pinned" ON "announcements" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX "idx_content_reports_reporter" ON "content_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "idx_content_reports_content" ON "content_reports" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "idx_content_reports_status" ON "content_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_content_reports_priority" ON "content_reports" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_content_reports_created_at" ON "content_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_target_user" ON "moderation_actions" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_moderator" ON "moderation_actions" USING btree ("moderator_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_action" ON "moderation_actions" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_created_at" ON "moderation_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_active" ON "moderation_actions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_platform_analytics_date" ON "platform_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_user_activity_user_date" ON "user_activity" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_user_activity_date" ON "user_activity" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_user_id" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_status" ON "user_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_last_active" ON "user_profiles" USING btree ("last_active_at");--> statement-breakpoint
CREATE INDEX "idx_user_warnings_user_id" ON "user_warnings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_warnings_issued_by" ON "user_warnings" USING btree ("issued_by");--> statement-breakpoint
CREATE INDEX "idx_user_warnings_severity" ON "user_warnings" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_user_warnings_active" ON "user_warnings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_user_warnings_created_at" ON "user_warnings" USING btree ("created_at");
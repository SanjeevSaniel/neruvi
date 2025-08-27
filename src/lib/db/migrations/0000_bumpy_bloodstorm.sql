CREATE TABLE "chat_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"statistic_date" timestamp NOT NULL,
	"total_conversations" integer DEFAULT 0,
	"total_messages" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"courses_used" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tag_name" varchar(50) NOT NULL,
	"color" varchar(7) DEFAULT '#6B7280',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"selected_course" varchar(50),
	"message_count" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"archived" boolean DEFAULT false,
	"starred" boolean DEFAULT false,
	"tags" jsonb DEFAULT '[]',
	"last_accessed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"chunk_order" integer NOT NULL,
	"chunk_content" text NOT NULL,
	"chunk_size" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"content_large" text,
	"content_compressed" text,
	"content_external_url" varchar(500),
	"token_count" integer DEFAULT 0,
	"character_count" integer DEFAULT 0,
	"content_type" varchar(20) DEFAULT 'text',
	"compression_type" varchar(20),
	"sources" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now(),
	"processing_time_ms" integer
);
--> statement-breakpoint
CREATE TABLE "user_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"message_count" integer DEFAULT 0,
	"last_reset_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "chat_statistics" ADD CONSTRAINT "chat_statistics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_tags" ADD CONSTRAINT "conversation_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_chunks" ADD CONSTRAINT "message_chunks_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_statistics_user_date" ON "chat_statistics" USING btree ("user_id","statistic_date");--> statement-breakpoint
CREATE INDEX "idx_conversation_tags_user_tag" ON "conversation_tags" USING btree ("user_id","tag_name");--> statement-breakpoint
CREATE INDEX "idx_conversations_user_id" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_created_at" ON "conversations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_conversations_user_course" ON "conversations" USING btree ("user_id","selected_course");--> statement-breakpoint
CREATE INDEX "idx_conversations_user_updated_at" ON "conversations" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_message_chunks_message_id_order" ON "message_chunks" USING btree ("message_id","chunk_order");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation_id" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_messages_role" ON "messages" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_messages_content_size" ON "messages" USING btree ("character_count");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation_created_at" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_user_usage_user_id" ON "user_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_clerk_id" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");
-- Migration: Add user roles and additional user fields
-- This adds role, isActive, and lastLoginAt fields to the users table

-- Create the user_role enum type
CREATE TYPE "user_role" AS ENUM ('user', 'admin', 'moderator');

-- Add new columns to users table
ALTER TABLE "users" 
ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL,
ADD COLUMN "is_active" boolean DEFAULT true NOT NULL,
ADD COLUMN "last_login_at" timestamp;

-- Create index on role column for efficient role-based queries
CREATE INDEX "idx_users_role" ON "users" ("role");

-- Update existing users to have 'user' role (already handled by DEFAULT)
-- Set the first user as admin if you want (optional - uncomment and modify as needed)
-- UPDATE "users" SET "role" = 'admin' WHERE "email" = 'your-admin-email@example.com';

-- Comments
COMMENT ON COLUMN "users"."role" IS 'User role: user, admin, or moderator';
COMMENT ON COLUMN "users"."is_active" IS 'Whether the user account is active';
COMMENT ON COLUMN "users"."last_login_at" IS 'Timestamp of last login/activity';
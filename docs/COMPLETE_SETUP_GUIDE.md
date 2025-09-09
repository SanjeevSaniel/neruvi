# 🚀 FlowMind Complete Setup Guide

Complete documentation for setting up FlowMind with Advanced RAG, Clerk Authentication, NeonDB, and User Management.

## 📋 Table of Contents

1. [Environment Setup](#environment-setup)
2. [Local Development](#local-development)
3. [Clerk Webhook Configuration](#clerk-webhook-configuration)  
4. [Database Setup](#database-setup)
5. [Production Deployment](#production-deployment)
6. [Advanced RAG Configuration](#advanced-rag-configuration)
7. [User Role Management](#user-role-management)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Environment Setup

### Required Environment Variables

Create `.env.local` with:

```bash
# === Clerk Authentication ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# === Database (NeonDB) ===
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
NEXT_PUBLIC_USE_DATABASE=true

# === OpenAI ===
OPENAI_API_KEY=sk-proj-...

# === Qdrant Vector Database ===
QDRANT_URL=https://your-cluster-url.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key

# === User Management ===
DEFAULT_ADMIN_EMAIL=your-admin@example.com

# === Optional: Advanced RAG ===
ENABLE_ADVANCED_RAG=true
ENABLE_CORRECTIVE_RAG=true
ENABLE_LLM_JUDGE=true
```

---

## 🏠 Local Development

### 1. Start Development Server

```bash
npm install
npm run dev
```

**Local Server:** `http://localhost:3001` (port 3000 is often occupied)

### 2. Local API Endpoints

- **Chat API:** `http://localhost:3001/api/chat`
- **Webhook:** `http://localhost:3001/api/webhooks/clerk`
- **Users API:** `http://localhost:3001/api/users`
- **Conversations:** `http://localhost:3001/api/conversations`

### 3. Test Local Webhook Endpoint

```bash
curl http://localhost:3001/api/webhooks/clerk
```

Expected response:
```json
{
  "message": "Clerk webhook endpoint is active",
  "timestamp": "2024-XX-XX..."
}
```

### 4. Local Development with Webhooks

Since Clerk can't reach localhost directly, use **ngrok** for webhook testing:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3001

# Use the generated URL in Clerk Dashboard:
# https://abc123.ngrok.io/api/webhooks/clerk
```

---

## 🔗 Clerk Webhook Configuration

### 1. Webhook Endpoint URLs

#### **Production (Vercel):**
```
https://your-app.vercel.app/api/webhooks/clerk
```

#### **Custom Domain:**
```
https://flowmind.com/api/webhooks/clerk
```

#### **Local Development (via ngrok):**
```
https://abc123.ngrok.io/api/webhooks/clerk
```

### 2. Clerk Dashboard Setup

1. **Go to:** [Clerk Dashboard](https://dashboard.clerk.com)
2. **Navigate:** Your App → **Webhooks** → **Add Endpoint**
3. **Configure:**
   - **Endpoint URL:** Your production/ngrok URL above
   - **Description:** "FlowMind User Sync"
   
4. **Select Events:**
   - ✅ `user.created` - New user signups
   - ✅ `user.updated` - Profile updates  
   - ✅ `user.deleted` - User deletions (optional)

5. **Copy Webhook Secret** → Add to `.env.local` as `CLERK_WEBHOOK_SECRET`

### 3. Webhook Security

- Uses **Svix** for signature verification
- Automatically validates all webhook requests
- Rejects unauthorized requests with 400 status

---

## 🗄️ Database Setup

### 1. NeonDB Configuration

1. **Create NeonDB Project:** [console.neon.tech](https://console.neon.tech)
2. **Get Connection String:** `postgresql://...`
3. **Add to `.env.local`** as `DATABASE_URL`

### 2. Run Database Migrations

```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Or manually run the role migration
psql -h your-neon-host -U username -d database -f drizzle/migrations/add_user_roles.sql
```

### 3. User Schema with Roles

```sql
-- Users table structure
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  role user_role DEFAULT 'user' NOT NULL,  -- user, moderator, admin
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role enum
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
```

### 4. Test Database Connection

```bash
npm run test-db
```

---

## 🚀 Production Deployment

### 1. Deploy to Vercel

```bash
# Build and deploy
npm run build
vercel --prod

# Your app will be available at:
# https://your-app.vercel.app
```

### 2. Configure Environment Variables in Vercel

**Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add all variables from `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
QDRANT_URL=https://...
QDRANT_API_KEY=...
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
```

### 3. Update Clerk Webhook URL

**Clerk Dashboard** → **Webhooks** → **Edit Endpoint:**
- **Update URL:** `https://your-app.vercel.app/api/webhooks/clerk`
- **Test delivery** to ensure it works

---

## 🧠 Advanced RAG Configuration

### 1. Features Included

- **🔄 Corrective RAG (CRAG)** - Self-correcting retrieval system
- **⚖️ LLM-as-a-Judge** - Response quality evaluation  
- **🔄 Multi-Strategy Query Rewriting** - 6 different approaches
- **🧩 Sub-query Decomposition** - Complex query breakdown
- **📈 HyDE Enhancement** - Hypothetical Document Embeddings

### 2. API Usage

```typescript
// Enable all advanced features (default)
POST /api/chat
{
  "messages": [...],
  "course": "nodejs",
  "useAdvancedRAG": true,
  "advancedRAGConfig": {
    "enableCorrectiveRAG": true,
    "enableQueryRewriting": true, 
    "enableSubqueryDecomposition": true,
    "enableLLMJudge": true,
    "enableHyDE": true
  }
}
```

### 3. Response Headers

```javascript
// Check response headers for metrics
const response = await fetch('/api/chat', {...});
const sources = JSON.parse(response.headers.get('X-Sources') || '[]');
const metrics = JSON.parse(response.headers.get('X-RAG-Metrics') || '{}');

console.log('Processing time:', metrics.processingTime);
console.log('Confidence score:', metrics.confidence);
console.log('Technique used:', metrics.technique);
```

### 4. Performance Optimization

- **GPT-4o** for response generation (quality)
- **GPT-4o-mini** for evaluations (cost optimization)
- Smart caching and parallel processing
- Automatic technique selection based on complexity

---

## 👥 User Role Management

### 1. Role Hierarchy

```typescript
const ROLES = {
  USER: 'user',        // Level 1 - Basic access
  MODERATOR: 'moderator', // Level 2 - Content moderation
  ADMIN: 'admin'       // Level 3 - Full access
};
```

### 2. Automatic Admin Assignment

Set `DEFAULT_ADMIN_EMAIL` in environment:
```bash
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
```

**First user with this email gets admin role automatically**

### 3. Role-Based Access Control

```typescript
import { hasMinimumRole, isAdmin } from '@/lib/auth/roles';

// Check permissions
if (isAdmin(user)) {
  // Admin-only features
}

if (hasMinimumRole(user, 'moderator')) {
  // Moderator and admin features  
}
```

### 4. Role Management UI

```typescript
// Get role display info
import { RoleUI } from '@/lib/auth/roles';

const badgeColor = RoleUI.getRoleBadgeColor(user.role);
const roleIcon = RoleUI.getRoleIcon(user.role);
```

---

## 👥 Existing Clerk Users Migration

### The Problem
If you already have users in Clerk before setting up the webhook, they won't exist in NeonDB and will get 404 errors when trying to use the app.

### Solution 1: Automatic Migration Script

**Run this once after setting up the webhook:**

```bash
npm run migrate-users
```

**What it does:**
- Fetches all existing Clerk users
- Creates them in NeonDB with appropriate roles
- Preserves existing users who are already in the database
- Shows detailed progress and error reporting

### Solution 2: Auto-Creation on First Access

The app now automatically creates missing users when they first access any API endpoint:

- ✅ **Conversation creation** - Auto-creates user if missing
- ✅ **User profile access** - Auto-creates user if missing  
- ✅ **Chat API calls** - Handles missing users gracefully

### Solution 3: Manual User Validation

If you prefer manual control:

```typescript
import { ensureAuthenticatedUser } from '@/lib/auth/ensure-user';

// In your API routes
const user = await ensureAuthenticatedUser();
if (!user) {
  return Response.json({ error: 'User not found' }, { status: 401 });
}
```

### Verification Steps

1. **Check existing users count:**
   ```bash
   # In your database
   SELECT COUNT(*) FROM users;
   ```

2. **Run migration:**
   ```bash
   npm run migrate-users
   ```

3. **Verify migration:**
   ```bash
   # Check users were created
   SELECT email, role, created_at FROM users ORDER BY created_at DESC;
   ```

4. **Test existing user login:**
   - Have an existing user sign in
   - Navigate to chat interface
   - Verify no 404 errors occur
   - Check user can create conversations

---

## 🧪 Testing & Verification

### 1. Test Local Setup

```bash
# Start development server
npm run dev

# Test endpoints
curl http://localhost:3001/api/webhooks/clerk
curl http://localhost:3001/api/users
```

### 2. Test User Creation Flow

1. **Sign up new user** in your app
2. **Check logs** for webhook processing:
   ```
   👤 Processing user.created webhook for: user_xxxxx
   ✅ User created in database: test@example.com (ID: xxx)
   ```
3. **Verify in database** - user should exist with correct role

### 3. Test Advanced RAG

```bash
# Run advanced RAG test
npx tsx src/scripts/test-advanced-rag.ts
```

### 4. Test Course Selection

1. **Open chat interface** 
2. **Select a course** (Node.js or Python)
3. **Verify conversation creation** without 404 errors
4. **Check database** for conversation record

### 5. Monitor Webhook Deliveries

**Clerk Dashboard** → **Webhooks** → **Recent Deliveries**
- Check delivery status (should be 200)
- View request/response details
- Debug any failed deliveries

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### **1. 404 Conversation Errors**
✅ **Fixed** - API routes now auto-create users

**Additional Fix for Existing Users:**
```bash
# Run this to migrate existing Clerk users
npm run migrate-users
```

#### **2. Webhook Not Firing**
- Check endpoint URL in Clerk Dashboard
- Verify `CLERK_WEBHOOK_SECRET` is correct  
- Test endpoint accessibility
- Check Vercel function logs

#### **3. User Not Created in Database**
- Verify `DATABASE_URL` connection
- Check webhook secret configuration
- Ensure `NEXT_PUBLIC_USE_DATABASE=true`
- Run database migrations

#### **4. Advanced RAG Errors**
- Check `OPENAI_API_KEY` is valid
- Verify Qdrant connection (`QDRANT_URL`, `QDRANT_API_KEY`)
- Monitor API rate limits
- Check console logs for specific errors

#### **5. Role Assignment Issues**
- Verify `DEFAULT_ADMIN_EMAIL` matches exactly
- Check database migration was applied
- Ensure user was created after role system deployment

### Debug Commands

```bash
# Check database connection
npm run test-db

# Test Qdrant connection  
npm run test-qdrant

# View development logs
npm run dev

# Check Vercel function logs
vercel logs your-app
```

### Environment Validation

```bash
# Verify all required environment variables exist
node -e "
const required = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY', 
  'DATABASE_URL',
  'OPENAI_API_KEY'
];
required.forEach(key => {
  if (!process.env[key]) console.log('❌ Missing:', key);
  else console.log('✅ Found:', key);
});
"
```

---

## 📚 Additional Resources

- **Advanced RAG Guide:** `ADVANCED_RAG.md`
- **Clerk Webhook Setup:** `CLERK_WEBHOOK_SETUP.md` 
- **Database Schema:** `src/lib/db/schema.ts`
- **Role Management:** `src/lib/auth/roles.ts`
- **Test Scripts:** `src/scripts/`

---

## 🎯 Quick Start Checklist

- [ ] Clone repository and install dependencies
- [ ] Configure `.env.local` with all required variables
- [ ] Set up NeonDB and run migrations  
- [ ] Configure Clerk authentication and webhooks
- [ ] Set up Qdrant vector database
- [ ] Test local development server
- [ ] Deploy to Vercel
- [ ] Update Clerk webhook URL to production
- [ ] Test complete user flow
- [ ] Verify admin user creation
- [ ] Test Advanced RAG features

**🎉 FlowMind is ready for production!**
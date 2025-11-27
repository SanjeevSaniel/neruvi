# Production Conversation Loading Troubleshooting Guide

## Problem
Conversations created in development mode are not loading in production.

## Root Causes

### 1. Different Clerk Environments (Most Common)
- **Development**: Uses Clerk Test keys (`pk_test_...`)
- **Production**: Uses Clerk Live keys (`pk_live_...`)
- **Result**: Different `userId` values for the same user → Conversations are tied to different user IDs

### 2. Environment Variables Not Set
The `NEXT_PUBLIC_USE_DATABASE` flag might not be set to `true` in production.

### 3. User Not Synced
The production user exists in Clerk but wasn't created in the database.

---

## Solution Steps

### Step 1: Verify Your Clerk Environment

#### Check Which Keys You're Using:

**Development (.env.local):**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  ← Test environment
CLERK_SECRET_KEY=sk_test_...  ← Test environment
```

**Production (Vercel/Deployment):**
Should use:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...  ← Production environment
CLERK_SECRET_KEY=sk_live_...  ← Production environment
```

#### What This Means:
- ✅ **Same Environment (both test)**: Conversations should load
- ❌ **Different Environments (test vs live)**: Conversations WON'T load (users are different)

---

### Step 2: Choose Your Approach

#### Option A: Use Same Clerk Environment Everywhere (Recommended for Testing)

**Keep using test keys in both dev and production:**

1. In your deployment platform (Vercel/Netlify/etc), set:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_...
   ```

2. Redeploy your application

3. Log in with the same account you used in development

4. Your conversations should now appear!

**Pros:**
- ✅ Simple and immediate
- ✅ No data migration needed
- ✅ Same users across environments

**Cons:**
- ⚠️ Not ideal for real production (test environment has limits)
- ⚠️ All users share the same Clerk instance

---

#### Option B: Use Separate Environments (Production Best Practice)

**Use live keys in production and migrate data:**

This is the proper way but requires more steps:

1. **Set production environment variables:**
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   DATABASE_URL=postgresql://...  (same database is fine)
   NEXT_PUBLIC_USE_DATABASE=true
   OPENAI_API_KEY=...
   QDRANT_URL=...
   QDRANT_API_KEY=...
   MEM0_API_KEY=...
   ```

2. **Sign up again in production** (it's a different Clerk environment)

3. **Your dev conversations won't appear** - This is expected! They're tied to test user IDs.

4. **Start fresh conversations** in production, or migrate data manually.

---

### Step 3: Run Diagnostics

Run this command to check your current setup:

```bash
npx tsx src/scripts/diagnose-production.ts
```

This will show:
- ✅ Database connection status
- 👥 All users in database
- 💬 Conversations per user
- 🔧 Environment configuration
- ⚠️ Whether you're using test or live keys

---

## Quick Fix for Most Cases

If you just want your dev conversations to work in production immediately:

### 1. Copy Your Test Keys to Production

In your deployment platform (e.g., Vercel):

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
DATABASE_URL=''
NEXT_PUBLIC_USE_DATABASE=true
```

### 2. Redeploy

### 3. Log In with Same Account

Use the same email you used in development.

### 4. Done! 🎉

Your conversations should now load.

---

## Understanding the Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                          │
│                                                              │
│  Development                    Production                   │
│  ┌─────────────┐              ┌─────────────┐              │
│  │ Clerk Test  │              │ Clerk Live  │              │
│  │ Environment │              │ Environment │              │
│  │             │              │             │              │
│  │ user_abc123 │              │ user_xyz789 │  ← Different IDs!
│  └──────┬──────┘              └──────┬──────┘              │
│         │                            │                      │
│         └────────────┬───────────────┘                      │
│                      │                                       │
│              ┌───────▼────────┐                             │
│              │  Neon Database │                             │
│              │                │                             │
│              │  conversations │                             │
│              │  ├─ userId: user_abc123  ← Dev conversations  │
│              │  └─ userId: user_xyz789  ← Prod conversations │
│              └────────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Insight:**
- Same email in Clerk Test and Clerk Live = **Different user IDs**
- Conversations are stored by **database user ID**
- If user IDs don't match, conversations won't load!

---

## Verification Checklist

- [ ] Check which Clerk keys are in production (test vs live)
- [ ] Verify `NEXT_PUBLIC_USE_DATABASE=true` in production
- [ ] Run diagnostic script to see users and conversations
- [ ] Decide: Same environment everywhere OR separate environments
- [ ] Update production environment variables accordingly
- [ ] Redeploy application
- [ ] Test login and conversation loading

---

## Need Help?

1. Run the diagnostic script first
2. Check the console logs in your production deployment
3. Verify environment variables are set correctly
4. Make sure you're logging in with the correct account

## Common Errors

### "Unauthorized" or 401 errors
- ❌ Clerk keys not set correctly
- ❌ User not authenticated

### "Database not enabled" or 503 errors
- ❌ `NEXT_PUBLIC_USE_DATABASE` not set to `true`
- ❌ `DATABASE_URL` not set

### No conversations showing
- ❌ Different Clerk environments (test vs live)
- ❌ Logged in with different account
- ❌ User not synced to database

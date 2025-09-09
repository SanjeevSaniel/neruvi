# Clerk Webhook Setup Guide

This guide explains how to configure automatic user creation in NeonDB when users sign up with Clerk.

## Overview

When a user signs up through Clerk, a webhook will automatically:
1. **Create the user** in your NeonDB database
2. **Update user information** when profile changes occur
3. **Handle user deletions** (logs event but preserves database record)

## Setup Instructions

### 1. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Clerk Webhook Secret (get this from Clerk Dashboard)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Make sure database is enabled
NEXT_PUBLIC_USE_DATABASE=true
```

### 2. Configure Clerk Dashboard

1. **Go to Clerk Dashboard** → Your Application → Webhooks
2. **Create New Webhook**:
   - **Endpoint URL**: `https://yourdomain.com/api/webhooks/clerk`
   - **Events to Subscribe**: 
     - ✅ `user.created`
     - ✅ `user.updated` 
     - ✅ `user.deleted` (optional)
3. **Copy the Webhook Secret** and add it to your `.env.local` as `CLERK_WEBHOOK_SECRET`

### 3. Webhook Events Handled

#### `user.created`
- **Triggers**: When a new user signs up
- **Action**: Creates user record in NeonDB with:
  - Clerk ID
  - Primary email address
  - Display name (first + last name, username, or "User")
  - Creation timestamp

#### `user.updated`
- **Triggers**: When user profile is updated in Clerk
- **Action**: Updates user record in NeonDB with latest information

#### `user.deleted`
- **Triggers**: When user is deleted from Clerk
- **Action**: Logs the deletion but preserves database record for data integrity

## Testing the Webhook

### 1. Test Endpoint Accessibility

```bash
curl https://yourdomain.com/api/webhooks/clerk
```

Should return:
```json
{
  "message": "Clerk webhook endpoint is active",
  "timestamp": "2024-01-XX..."
}
```

### 2. Test User Creation

1. **Create a test user** in your Clerk application
2. **Check the logs** for webhook processing messages:
   ```
   👤 Processing user.created webhook for: user_xxxxx
   ✅ User created in database: test@example.com (ID: xxx)
   ```
3. **Verify in database** that the user was created in the `users` table

### 3. Monitor Webhook Delivery

In Clerk Dashboard:
1. Go to **Webhooks** → Your webhook
2. Check **Recent Deliveries** tab
3. Ensure webhooks are being delivered successfully (200 status)

## Database Schema

The webhook creates users with this structure:

```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Benefits

✅ **Automatic User Sync**: No manual user creation required  
✅ **Data Consistency**: User data stays synchronized between Clerk and NeonDB  
✅ **Real-time Updates**: Immediate user creation upon signup  
✅ **Error Handling**: Comprehensive error logging and fallback mechanisms  
✅ **Security**: Webhook verification prevents unauthorized requests  

## Troubleshooting

### Webhook Not Firing
1. **Check Clerk Dashboard** → Webhooks → Recent Deliveries
2. **Verify endpoint URL** is accessible and correct
3. **Check webhook secret** matches your environment variable

### User Not Created in Database
1. **Check application logs** for error messages
2. **Verify database connection** and permissions
3. **Ensure `NEXT_PUBLIC_USE_DATABASE=true`** in environment

### 400/500 Errors
1. **Check webhook secret** is correct
2. **Verify Svix headers** are present in request
3. **Check database connectivity** and schema

## Fallback Behavior

Even without webhooks, the application handles user creation gracefully:

- **API Routes**: Automatically create users when they first interact with the app
- **Conversation Creation**: Auto-creates users if they don't exist
- **Profile Access**: Creates user records on first profile access

This ensures the application works regardless of webhook configuration status.

## Security Notes

- **Webhook signatures** are verified using Svix
- **Database operations** are protected by authentication middleware
- **User data** is handled according to privacy best practices
- **Webhook secret** should be kept secure and rotated regularly

## Next Steps

After setting up the webhook:

1. **Test with a new user signup** to verify everything works
2. **Monitor webhook deliveries** in Clerk Dashboard
3. **Check application logs** for any issues
4. **Consider setting up alerts** for webhook failures
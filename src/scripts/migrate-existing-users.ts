#!/usr/bin/env tsx

/**
 * Migration script for existing Clerk users
 * This script fetches all existing Clerk users and creates them in NeonDB
 * Run this once after setting up the webhook system
 */

import { createClerkClient } from '@clerk/backend';
import { config } from 'dotenv';
import { DatabaseService } from '../lib/db/database-service';
import { isDatabaseEnabled } from '../lib/db/connection';
import { getInitialUserRole } from '../lib/auth/roles';

// Load environment variables
config({ path: '.env.local' });

async function migrateExistingUsers() {
  try {
    console.log('🚀 Starting migration of existing Clerk users to NeonDB...\n');

    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      console.error('❌ Database not enabled. Set NEXT_PUBLIC_USE_DATABASE=true');
      process.exit(1);
    }

    // Initialize services
    const dbService = new DatabaseService();
    
    // Initialize Clerk client
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    // Get all Clerk users with pagination
    console.log('📋 Fetching existing Clerk users...');
    let allUsers: any[] = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
      const response = await clerkClient.users.getUserList({
        limit,
        offset,
        orderBy: '-created_at'
      });

      allUsers = [...allUsers, ...response.data];
      hasMore = response.totalCount > allUsers.length;
      offset += limit;

      console.log(`   Fetched ${allUsers.length} users so far...`);
    }

    console.log(`\n✅ Found ${allUsers.length} existing Clerk users`);

    if (allUsers.length === 0) {
      console.log('ℹ️ No existing users to migrate');
      return;
    }

    // Process each user
    let createdCount = 0;
    let existingCount = 0;
    let errorCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    console.log('\n🔄 Processing users...');

    for (const clerkUser of allUsers) {
      try {
        // Check if user already exists in database
        const existingUser = await dbService.getUserByClerkId(clerkUser.id);
        
        if (existingUser) {
          console.log(`   ⏭️ User already exists: ${existingUser.email}`);
          existingCount++;
          continue;
        }

        // Get primary email
        const primaryEmail = clerkUser.emailAddresses.find((e: any) => e.id === clerkUser.primaryEmailAddressId);
        if (!primaryEmail) {
          console.log(`   ⚠️ No primary email for user: ${clerkUser.id}`);
          errorCount++;
          continue;
        }

        // Create display name
        const displayName = clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.username || clerkUser.firstName || 'User';

        // Determine user role
        const userRole = getInitialUserRole(primaryEmail.emailAddress);

        // Create user in database
        const newUser = await dbService.createOrUpdateUser(
          clerkUser.id,
          primaryEmail.emailAddress,
          displayName,
          userRole
        );

        console.log(`   ✅ Created user: ${newUser.email} (${newUser.role})`);
        createdCount++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`   ❌ Error processing user ${clerkUser.id}: ${errorMessage}`);
        errors.push({ userId: clerkUser.id, error: errorMessage });
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Users created: ${createdCount}`);
    console.log(`   ⏭️ Users already existed: ${existingCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Total processed: ${allUsers.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(({ userId, error }) => {
        console.log(`   - ${userId}: ${error}`);
      });
    }

    if (createdCount > 0) {
      console.log(`\n🎉 Successfully migrated ${createdCount} existing users to NeonDB!`);
      console.log('   These users can now fully access the Neruvi application.');
    }

    console.log('\n📋 Next steps:');
    console.log('   1. Webhook is now configured for future user signups');
    console.log('   2. Existing users have been migrated to NeonDB');
    console.log('   3. All users should now have full app access');
    
    if (createdCount > 0) {
      console.log('   4. Check admin users and update roles if needed');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
    }
    
    process.exit(1);
  }
}

// Add cleanup function to handle existing users on app startup
export async function ensureUserExists(clerkUserId: string, email: string, displayName?: string) {
  try {
    if (!isDatabaseEnabled()) {
      return null; // Skip if database not enabled
    }

    const dbService = new DatabaseService();
    
    // Check if user exists
    let user = await dbService.getUserByClerkId(clerkUserId);
    
    if (!user) {
      // Create user on-the-fly
      console.log(`🔧 Auto-creating missing user: ${email}`);
      const userRole = getInitialUserRole(email);
      
      user = await dbService.createOrUpdateUser(
        clerkUserId,
        email,
        displayName || 'User',
        userRole
      );
      
      console.log(`✅ User created: ${user.email} (${user.role})`);
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error ensuring user exists:', error);
    return null;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateExistingUsers();
}
/**
 * Diagnostic script for production conversation loading issues
 * Run this to check database connectivity and user data
 */

import { getDatabase } from '@/lib/db/connection';
import { users, conversations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function diagnoseProduction() {
  console.log('🔍 Starting Production Diagnostics...\n');

  try {
    const db = getDatabase();

    // 1. Check database connection
    console.log('1️⃣ Testing database connection...');
    await db.execute({ sql: 'SELECT 1', args: [] });
    console.log('✅ Database connection successful\n');

    // 2. List all users in database
    console.log('2️⃣ Fetching all users from database...');
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} user(s):\n`);
    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  - Database ID: ${user.id}`);
      console.log(`  - Clerk ID: ${user.clerkId}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Display Name: ${user.displayName}`);
      console.log(`  - Created At: ${user.createdAt}`);
      console.log('');
    });

    // 3. Check conversations for each user
    console.log('3️⃣ Checking conversations per user...\n');
    for (const user of allUsers) {
      const userConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, user.id));

      console.log(`📊 User: ${user.email}`);
      console.log(`   Conversations: ${userConversations.length}`);

      if (userConversations.length > 0) {
        userConversations.forEach((conv, idx) => {
          console.log(`   ${idx + 1}. ${conv.title} (${conv.selectedCourse})`);
          console.log(`      - ID: ${conv.id}`);
          console.log(`      - Messages: ${conv.messageCount}`);
          console.log(`      - Created: ${conv.createdAt}`);
        });
      }
      console.log('');
    }

    // 4. Environment check
    console.log('4️⃣ Environment Configuration:');
    console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`  - DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not Set'}`);
    console.log(`  - NEXT_PUBLIC_USE_DATABASE: ${process.env.NEXT_PUBLIC_USE_DATABASE}`);
    console.log(`  - Clerk Publishable Key: ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20)}...`);
    console.log(`  - Is Test Key: ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('test') ? '⚠️ YES (Development)' : '✅ NO (Production)'}`);
    console.log('');

    console.log('✅ Diagnostics completed successfully!');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  }
}

diagnoseProduction();

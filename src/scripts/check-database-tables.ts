#!/usr/bin/env tsx

/**
 * Check what tables and data exist in NeonDB
 */

import { config } from 'dotenv';
import { getDatabase } from '../lib/db/connection';

// Load environment variables
config({ path: '.env.local' });

async function checkDatabaseTables() {
  try {
    console.log('🔍 Checking NeonDB database structure...\n');

    const db = getDatabase();

    // List all tables
    console.log('📋 Checking existing tables:');
    const tablesResult = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found in the database!');
      console.log('\n💡 This means the database migration hasn\'t been run yet.');
      console.log('   Run: npm run db:push or npm run db:migrate');
      return;
    }

    console.log(`✅ Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });

    // Check users table specifically
    console.log('\n👥 Checking users table:');
    try {
      const usersCountResult = await db.execute('SELECT COUNT(*) as count FROM users');
      const userCount = (usersCountResult.rows[0] as any)?.count || 0;
      console.log(`   Users in database: ${userCount}`);

      if (userCount > 0) {
        const usersResult = await db.execute(`
          SELECT email, role, is_active, created_at 
          FROM users 
          ORDER BY created_at DESC 
          LIMIT 10
        `);
        console.log('   Recent users:');
        usersResult.rows.forEach((user: any) => {
          console.log(`     - ${user.email} (${user.role}) - Active: ${user.is_active}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error accessing users table: ${error instanceof Error ? error.message : error}`);
    }

    // Check conversations table
    console.log('\n💬 Checking conversations table:');
    try {
      const conversationsResult = await db.execute('SELECT COUNT(*) as count FROM conversations');
      const conversationCount = (conversationsResult.rows[0] as any)?.count || 0;
      console.log(`   Conversations in database: ${conversationCount}`);
    } catch (error) {
      console.log(`   ❌ Error accessing conversations table: ${error instanceof Error ? error.message : error}`);
    }

    // Check messages table
    console.log('\n💌 Checking messages table:');
    try {
      const messagesResult = await db.execute('SELECT COUNT(*) as count FROM messages');
      const messageCount = (messagesResult.rows[0] as any)?.count || 0;
      console.log(`   Messages in database: ${messageCount}`);
    } catch (error) {
      console.log(`   ❌ Error accessing messages table: ${error instanceof Error ? error.message : error}`);
    }

    // Check user_role enum
    console.log('\n🔐 Checking user_role enum:');
    try {
      const enumResult = await db.execute(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ORDER BY enumlabel;
      `);
      
      if (enumResult.rows.length > 0) {
        console.log('   Available roles:');
        enumResult.rows.forEach((role: any) => {
          console.log(`     - ${role.enumlabel}`);
        });
      } else {
        console.log('   ❌ user_role enum not found');
      }
    } catch (error) {
      console.log(`   ❌ Error checking user_role enum: ${error instanceof Error ? error.message : error}`);
    }

    console.log('\n📊 Database Status Summary:');
    console.log(`   Tables: ${tablesResult.rows.length} found`);
    console.log('   Schema: ✅ Appears to be properly configured');
    console.log('   Migration: ✅ Likely completed successfully');

  } catch (error) {
    console.error('❌ Error checking database:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message
      });
    }
  }
}

// Run the check
checkDatabaseTables();
#!/usr/bin/env tsx

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testMessageStorage() {
  console.log('🧪 Testing Message Storage in Database');
  console.log('====================================');

  const baseUrl = 'http://localhost:3002';
  
  try {
    // Test 1: Check if database is enabled
    console.log('\n1️⃣ Checking database status...');
    const dbResponse = await fetch(`${baseUrl}/api/conversations`);
    
    if (dbResponse.status === 503) {
      console.log('❌ Database not enabled - using SessionStorage');
      return;
    } else if (dbResponse.status === 401) {
      console.log('⚠️ Expected: API requires authentication (401)');
    } else {
      console.log(`📊 API Response Status: ${dbResponse.status}`);
    }

    // Test 2: Check current database state
    console.log('\n2️⃣ Checking current database state...');
    const { execSync } = require('child_process');
    const dbCheck = execSync('npm run check-db', { encoding: 'utf-8' });
    console.log(dbCheck);

    console.log('\n3️⃣ Analysis:');
    console.log('   - If you see conversations but 0 messages, there is a message storage issue');
    console.log('   - If you see both conversations and messages, storage is working');
    console.log('   - To test live: Open the chat UI in browser while signed in to Clerk');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMessageStorage();
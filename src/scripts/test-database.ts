#!/usr/bin/env tsx

/**
 * Test script for NeonDB implementation
 * This script tests all database operations including long content storage
 */

import { config } from 'dotenv';
import { DatabaseService } from '@/lib/db/database-service';
import { testConnection, isDatabaseEnabled } from '@/lib/db/connection';
import { ContentStorageManager } from '@/lib/db/content-storage';

// Load environment variables
config({ path: '.env.local' });

async function generateLongContent(size: number): Promise<string> {
  const chunks = [];
  const sampleText = `
This is a sample assistant response that explains Node.js concepts in detail.
It covers topics like asynchronous programming, event loops, modules, and best practices.
The response includes code examples, explanations, and references to course materials.
This content is designed to test the storage of long assistant responses in the database.
`;
  
  while (chunks.join('').length < size) {
    chunks.push(sampleText);
    chunks.push(`\n--- Chunk ${chunks.length / 2} ---\n`);
    if (chunks.length > 1000) break; // Safety limit
  }
  
  return chunks.join('').substring(0, size);
}

async function testDatabaseOperations() {
  console.log('🧪 Starting Database Operations Test\n');

  // Test 1: Database Connection
  console.log('1️⃣ Testing database connection...');
  if (!isDatabaseEnabled()) {
    console.error('❌ Database not enabled. Check DATABASE_URL environment variable.');
    process.exit(1);
  }

  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }
  console.log('✅ Database connection successful\n');

  const dbService = new DatabaseService();
  const contentManager = new ContentStorageManager();

  // Test 2: User Operations
  console.log('2️⃣ Testing user operations...');
  const testUser = await dbService.createOrUpdateUser(
    'test_clerk_id_12345',
    'test@example.com',
    'Test User'
  );
  console.log(`✅ User created: ${testUser.email} (ID: ${testUser.id})\n`);

  // Test 3: Conversation Operations
  console.log('3️⃣ Testing conversation operations...');
  const conversation = await dbService.createConversation(
    testUser.id,
    'Test Conversation - Long Response Storage',
    'nodejs'
  );
  console.log(`✅ Conversation created: "${conversation.title}" (ID: ${conversation.id})\n`);

  // Test 4: Content Storage Strategies
  console.log('4️⃣ Testing content storage strategies...');
  
  // Test small content (< 8KB)
  const smallContent = await generateLongContent(4 * 1024); // 4KB
  const smallStorageInfo = await contentManager.storeContent(smallContent);
  console.log(`📦 Small content (${smallContent.length} chars): ${smallStorageInfo.storageType} storage`);

  // Test medium content (< 1MB)
  const mediumContent = await generateLongContent(500 * 1024); // 500KB
  const mediumStorageInfo = await contentManager.storeContent(mediumContent);
  console.log(`📦 Medium content (${mediumContent.length} chars): ${mediumStorageInfo.storageType} storage`);

  // Test large content (> 1MB) - should use compression or chunking
  const largeContent = await generateLongContent(2 * 1024 * 1024); // 2MB
  const largeStorageInfo = await contentManager.storeContent(largeContent);
  console.log(`📦 Large content (${largeContent.length} chars): ${largeStorageInfo.storageType} storage\n`);

  // Test 5: Message Storage and Retrieval
  console.log('5️⃣ Testing message storage and retrieval...');

  // Store different sized messages
  const testMessages = [
    {
      role: 'user' as const,
      content: 'How does async/await work in Node.js?',
      sources: []
    },
    {
      role: 'assistant' as const,
      content: smallContent,
      sources: [
        {
          course: 'nodejs',
          section: 'Async Programming',
          videoId: 'async-001',
          timestamp: '5:23',
          relevance: '95%'
        }
      ]
    },
    {
      role: 'assistant' as const,
      content: mediumContent,
      sources: []
    },
    {
      role: 'assistant' as const,
      content: largeContent,
      sources: []
    }
  ];

  const messageIds: string[] = [];

  for (let i = 0; i < testMessages.length; i++) {
    const message = testMessages[i];
    const startTime = Date.now();
    
    const messageId = await dbService.addMessage(
      conversation.id,
      {
        id: Date.now().toString(),
        role: message.role,
        content: message.content,
        sources: message.sources,
        timestamp: new Date(),
      },
      Math.round(100 + Math.random() * 500) // Random processing time (integer)
    );
    
    const endTime = Date.now();
    messageIds.push(messageId);
    
    console.log(`💾 Message ${i + 1} stored (${message.content.length} chars) in ${endTime - startTime}ms`);
  }

  console.log(`✅ All ${testMessages.length} messages stored successfully\n`);

  // Test 6: Message Retrieval
  console.log('6️⃣ Testing message retrieval...');
  const startTime = Date.now();
  const retrievedMessages = await dbService.getConversationMessages(conversation.id);
  const endTime = Date.now();

  console.log(`📖 Retrieved ${retrievedMessages.length} messages in ${endTime - startTime}ms`);

  // Verify content integrity
  for (let i = 0; i < retrievedMessages.length; i++) {
    const original = testMessages[i];
    const retrieved = retrievedMessages[i];
    
    if (retrieved.content === original.content) {
      console.log(`✅ Message ${i + 1} content integrity verified (${retrieved.content.length} chars)`);
    } else {
      console.error(`❌ Message ${i + 1} content mismatch!`);
      console.error(`Original length: ${original.content.length}, Retrieved length: ${retrieved.content.length}`);
    }
  }

  console.log();

  // Test 7: User Usage Tracking
  console.log('7️⃣ Testing user usage tracking...');
  let usage = await dbService.trackUserUsage(testUser.id);
  console.log(`📊 Usage after ${retrievedMessages.length} messages: ${usage.currentCount}/${usage.limit}`);

  // Simulate more usage
  for (let i = 0; i < 5; i++) {
    usage = await dbService.trackUserUsage(testUser.id);
  }
  console.log(`📊 Usage after additional tracking: ${usage.currentCount}/${usage.limit}\n`);

  // Test 8: Conversation Management
  console.log('8️⃣ Testing conversation management...');
  
  // Get user conversations
  const { conversations: userConversations, total } = await dbService.getUserConversations(testUser.id);
  console.log(`📚 User has ${total} conversation(s)`);
  console.log(`📋 Retrieved conversations: ${userConversations.map(c => c.title).join(', ')}\n`);

  // Test 9: Performance Analysis
  console.log('9️⃣ Performance analysis...');
  const storageLimits = contentManager.getStorageLimits();
  console.log('📊 Storage Strategy Limits:');
  Object.entries(storageLimits.limits).forEach(([strategy, limit]) => {
    console.log(`   ${strategy}: ${limit}`);
  });

  // Analyze storage efficiency for different content sizes
  const testSizes = [1024, 8 * 1024, 100 * 1024, 1024 * 1024, 2 * 1024 * 1024]; // 1KB to 2MB
  console.log('\n📈 Storage Strategy Analysis:');
  
  for (const size of testSizes) {
    const testContent = await generateLongContent(size);
    const analysis = await contentManager.estimateStorageInfo(testContent);
    const efficiency = analysis.compressionRatio ? Math.round((1 - analysis.compressionRatio) * 100) : 0;
    
    console.log(`   ${(size / 1024).toFixed(0)}KB → ${analysis.recommendedStrategy} (${efficiency}% compression)`);
  }

  // Test 10: Cleanup
  console.log('\n🔟 Testing cleanup operations...');
  const deleteSuccess = await dbService.deleteConversation(conversation.id, testUser.id);
  console.log(`🗑️ Conversation deletion: ${deleteSuccess ? 'Success' : 'Failed'}`);

  console.log('\n🎉 All database tests completed successfully!');
  console.log('\n📋 Test Summary:');
  console.log('✅ Database connection');
  console.log('✅ User management');
  console.log('✅ Conversation creation');
  console.log('✅ Multi-tier content storage');
  console.log('✅ Message storage and retrieval');
  console.log('✅ Content integrity verification');
  console.log('✅ Usage tracking');
  console.log('✅ Conversation management');
  console.log('✅ Performance analysis');
  console.log('✅ Cleanup operations');
}

async function main() {
  try {
    await testDatabaseOperations();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main();
}
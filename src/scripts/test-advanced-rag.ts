#!/usr/bin/env tsx

import { config } from 'dotenv';
import { advancedRAGPipeline } from '../lib/advanced-rag-pipeline';

// Load environment variables
config({ path: '.env.local' });

async function testAdvancedRAG() {
  try {
    console.log('🚀 Testing Advanced RAG Pipeline Integration...\n');

    // Test 1: Simple query
    console.log('📋 Test 1: Simple Query');
    const simpleResult = await advancedRAGPipeline.processQuery(
      'What is a function in Node.js?',
      'nodejs',
      [],
      { preferredLanguage: 'nodejs', skillLevel: 'beginner' },
      { enableCorrectiveRAG: false, enableSubqueryDecomposition: false }
    );

    console.log(`✅ Simple query completed:`);
    console.log(`   - Technique: ${simpleResult.technique}`);
    console.log(`   - Confidence: ${simpleResult.confidence.toFixed(2)}`);
    console.log(`   - Processing Time: ${simpleResult.processingTime}ms`);
    console.log(`   - Sources: ${simpleResult.sources.length}`);
    console.log(`   - Response Length: ${simpleResult.response.length} chars\n`);

    // Test 2: Complex query with all features enabled
    console.log('📋 Test 2: Complex Query with Full Features');
    const complexResult = await advancedRAGPipeline.processQuery(
      'How do I implement authentication and authorization in Express.js with middleware and session management?',
      'nodejs',
      [
        { role: 'user', content: 'I want to learn about Express.js' },
        { role: 'assistant', content: 'Express.js is a web framework for Node.js...' }
      ],
      { preferredLanguage: 'nodejs', skillLevel: 'intermediate' },
      {
        enableCorrectiveRAG: true,
        enableQueryRewriting: true,
        enableSubqueryDecomposition: true,
        enableLLMJudge: true,
        enableHyDE: true,
        maxSources: 5,
        qualityThreshold: 0.7
      }
    );

    console.log(`✅ Complex query completed:`);
    console.log(`   - Technique: ${complexResult.technique}`);
    console.log(`   - Confidence: ${complexResult.confidence.toFixed(2)}`);
    console.log(`   - Processing Time: ${complexResult.processingTime}ms`);
    console.log(`   - Sources: ${complexResult.sources.length}`);
    console.log(`   - Query Transformations: ${complexResult.queryTransformations.length}`);
    console.log(`   - Response Length: ${complexResult.response.length} chars`);
    
    if (complexResult.queryTransformations.length > 0) {
      console.log(`   - Transformations Applied:`);
      complexResult.queryTransformations.forEach((transform, i) => {
        console.log(`     ${i + 1}. ${transform}`);
      });
    }
    
    console.log('\n🎯 Advanced RAG Pipeline integration test completed successfully!');

  } catch (error) {
    console.error('❌ Advanced RAG test failed:', error);
    
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

// Run the test
testAdvancedRAG();
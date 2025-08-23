import dotenv from 'dotenv';
import { qdrantRAG } from '../lib/qdrant-rag';

dotenv.config({ path: '.env.local' });

async function populateQdrant() {
  console.log('🚀 Starting Qdrant Database Population');
  console.log('=====================================');

  try {
    console.log('🔗 Connecting to Qdrant...');
    
    // Initialize the RAG system (this will populate data if not exists)
    await qdrantRAG.initialize();
    
    // Get final status
    console.log('\n📊 Final Qdrant Status:');
    const status = await qdrantRAG.getStatus();
    console.log(JSON.stringify(status, null, 2));
    
    console.log('\n🎉 Qdrant population completed successfully!');
    console.log('\n💡 You can now run queries using the enhanced RAG system.');
    
  } catch (error) {
    console.error('❌ Failed to populate Qdrant:', error);
    process.exit(1);
  }
}

// Run the population script
populateQdrant().catch(console.error);
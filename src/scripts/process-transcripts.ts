import dotenv from 'dotenv'
import { VTTProcessor } from '../lib/vtt-processor'
import { qdrant } from '../lib/qdrant'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function processTranscripts() {
  console.log('🚀 Processing VTT Transcripts for FlowMind RAG')
  console.log('===============================================')

  try {
    // Test connection first
    console.log('🔗 Testing Qdrant connection...')
    const collections = await qdrant.getCollections()
    console.log(`✅ Connected! Found ${collections.collections?.length || 0} collections`)
    
    // Initialize processor (skip collection creation)
    const processor = new VTTProcessor()
    
    // Process transcripts directly
    console.log('\n📚 Starting transcript processing...')
    await processor.processAllTranscripts()
    
    console.log('\n🎉 All transcripts processed successfully!')
    console.log('\nRAG system is now ready with:')
    console.log('✅ Vector embeddings')
    console.log('✅ Chunked content')
    console.log('✅ Semantic search')
    console.log('✅ HyDE implementation')
    console.log('✅ Context rewriting')
    
  } catch (error) {
    console.error('\n❌ Processing failed:', error)
    process.exit(1)
  }
}

processTranscripts()
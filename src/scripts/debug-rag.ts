import dotenv from 'dotenv'
import { localRAG } from '../lib/local-rag'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function debugRAG() {
  console.log('🔧 Debugging RAG System')
  console.log('=======================')

  try {
    console.log('🚀 Initializing RAG system...')
    await localRAG.initialize()
    
    const status = localRAG.getStatus()
    console.log('📊 Final Status:', status)
    
    if (status.totalChunks > 0) {
      console.log('✅ Successfully processed transcripts!')
      
      // Test a simple search
      console.log('\n🔍 Testing search with processed data...')
      const results = await localRAG.semanticSearch('what is node.js', 2)
      console.log('Search Results:', results.length)
      results.forEach((result, index) => {
        console.log(`${index + 1}. [${result.metadata.course.toUpperCase()}] ${result.metadata.section}`)
        console.log(`   Score: ${result.score.toFixed(3)}`)
        console.log(`   Content: ${result.content.slice(0, 100)}...`)
      })
    } else {
      console.log('❌ No chunks were processed')
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugRAG()
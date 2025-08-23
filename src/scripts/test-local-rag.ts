import dotenv from 'dotenv'
import { localRAG } from '../lib/local-rag'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testLocalRAG() {
  console.log('🧪 Testing Local RAG System')
  console.log('============================')

  try {
    // Initialize RAG system
    console.log('🚀 Initializing RAG system...')
    await localRAG.initialize()
    
    // Get system status
    const status = localRAG.getStatus()
    console.log('📊 RAG System Status:', status)
    
    // Test queries
    const testQueries = [
      'What is async await in Node.js?',
      'How do Python functions work?',
      'Explain Express.js middleware',
      'What are Python classes?'
    ]
    
    console.log('\\n🔍 Testing Search Capabilities...')
    
    for (const query of testQueries) {
      console.log(`\\n📝 Query: "${query}"`)
      
      // Test semantic search
      console.log('🔍 Semantic search results:')
      const semanticResults = await localRAG.semanticSearch(query, 2)
      semanticResults.forEach((result, index) => {
        console.log(`  ${index + 1}. [${result.metadata.course.toUpperCase()}] Score: ${result.score.toFixed(3)}`)
        console.log(`     ${result.content.slice(0, 100)}...`)
        console.log(`     Section: ${result.metadata.section} | Time: ${result.metadata.timestamp}`)
      })
      
      // Test HyDE search
      console.log('🧠 HyDE search results:')
      const hydeResults = await localRAG.hydeSearch(query)
      hydeResults.forEach((result, index) => {
        console.log(`  ${index + 1}. [${result.metadata.course.toUpperCase()}] Score: ${result.score.toFixed(3)}`)
        console.log(`     ${result.content.slice(0, 100)}...`)
      })
      
      // Test query rewriting
      console.log('🔄 Query rewriting:')
      const rewrittenQueries = await localRAG.rewriteQuery(query)
      rewrittenQueries.forEach((rewritten, index) => {
        console.log(`  ${index + 1}. "${rewritten}"`)
      })
    }
    
    console.log('\\n✅ Local RAG system test completed successfully!')
    
  } catch (error) {
    console.error('❌ RAG test failed:', error)
    process.exit(1)
  }
}

testLocalRAG()
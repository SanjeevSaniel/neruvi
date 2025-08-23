import dotenv from 'dotenv'
import { QdrantClient } from '@qdrant/js-client-rest'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testQdrantConnection() {
  console.log('🚀 Testing Qdrant Cloud Connection')
  console.log('==================================')

  const qdrantUrl = process.env.QDRANT_URL
  const qdrantApiKey = process.env.QDRANT_API_KEY

  console.log(`URL: ${qdrantUrl}`)
  console.log(`API Key: ${qdrantApiKey ? 'Set ✅' : 'Missing ❌'}`)

  if (!qdrantUrl || !qdrantApiKey) {
    console.error('❌ Missing Qdrant configuration!')
    return
  }

  try {
    const qdrant = new QdrantClient({
      url: qdrantUrl,
      apiKey: qdrantApiKey,
    })

    console.log('\n🔗 Testing connection...')
    const info = await qdrant.api('cluster')
    console.log('✅ Qdrant Cloud connection successful!')
    console.log('Cluster info:', info)

    // List existing collections
    console.log('\n📁 Checking collections...')
    const collections = await qdrant.getCollections()
    console.log('Existing collections:', collections.collections?.map(c => c.name) || [])

  } catch (error) {
    console.error('❌ Connection failed:', error)
  }
}

testQdrantConnection()
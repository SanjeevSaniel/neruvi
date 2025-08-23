import dotenv from 'dotenv'
import { QdrantClient } from '@qdrant/js-client-rest'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function initCollections() {
  console.log('🚀 Initializing Qdrant Collections')
  console.log('==================================')

  const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
  })

  const collections = [
    {
      name: 'nodejs_transcripts',
      vectorSize: 1536,
      distance: 'Cosine' as const
    },
    {
      name: 'python_transcripts', 
      vectorSize: 1536,
      distance: 'Cosine' as const
    }
  ]

  for (const config of collections) {
    try {
      console.log(`\n📁 Creating collection: ${config.name}`)
      
      await qdrant.createCollection(config.name, {
        vectors: {
          size: config.vectorSize,
          distance: config.distance,
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
        write_consistency_factor: 1,
      })

      console.log(`✅ Collection '${config.name}' created successfully!`)
      
      // Verify collection
      const info = await qdrant.getCollection(config.name)
      console.log(`   Status: ${info.status}`)
      console.log(`   Vector size: ${info.config?.params?.vectors?.size || 'unknown'}`)
      
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`ℹ️  Collection '${config.name}' already exists`)
      } else {
        console.error(`❌ Failed to create '${config.name}':`, error.message)
      }
    }
  }

  // List all collections
  console.log('\n📋 All collections:')
  const allCollections = await qdrant.getCollections()
  allCollections.collections?.forEach(collection => {
    console.log(`   - ${collection.name}`)
  })

  console.log('\n🎉 Collections setup complete!')
}

initCollections().catch(console.error)
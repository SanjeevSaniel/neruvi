import { qdrant, COLLECTIONS } from './qdrant'

export interface CollectionConfig {
  name: string
  vectorSize: number
  distance: 'Cosine' | 'Euclid' | 'Dot'
}

export class QdrantSetup {
  private collections: CollectionConfig[] = [
    {
      name: COLLECTIONS.NODEJS_TRANSCRIPTS,
      vectorSize: 1536, // OpenAI text-embedding-3-small dimensions
      distance: 'Cosine'
    },
    {
      name: COLLECTIONS.PYTHON_TRANSCRIPTS,
      vectorSize: 1536,
      distance: 'Cosine'
    }
  ]

  async initializeCollections(): Promise<void> {
    console.log('🚀 Initializing Qdrant Cloud collections...')

    for (const config of this.collections) {
      try {
        // Check if collection exists
        const exists = await this.collectionExists(config.name)
        
        if (!exists) {
          console.log(`📁 Creating collection: ${config.name}`)
          await this.createCollection(config)
        } else {
          console.log(`✅ Collection exists: ${config.name}`)
        }
      } catch (error) {
        console.error(`❌ Failed to setup collection ${config.name}:`, error)
        throw error
      }
    }

    console.log('🎉 All collections initialized successfully!')
  }

  private async collectionExists(name: string): Promise<boolean> {
    try {
      await qdrant.getCollection(name)
      return true
    } catch (error) {
      return false
    }
  }

  private async createCollection(config: CollectionConfig): Promise<void> {
    await qdrant.createCollection(config.name, {
      vectors: {
        size: config.vectorSize,
        distance: config.distance,
      },
      optimizers_config: {
        default_segment_number: 2,
      },
      replication_factor: 1, // For cloud instances
      write_consistency_factor: 1,
    })
  }

  async getCollectionInfo(): Promise<void> {
    console.log('📊 Qdrant Cloud Collection Status:')
    
    for (const config of this.collections) {
      try {
        const info = await qdrant.getCollection(config.name)
        console.log(`
Collection: ${config.name}
Status: ${info.status}
Vectors Count: ${info.vectors_count || 0}
Points Count: ${info.points_count || 0}
        `)
      } catch (error) {
        console.log(`Collection: ${config.name} - Not found`)
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔗 Testing Qdrant Cloud connection...')
      await qdrant.getCollections()
      console.log('✅ Qdrant Cloud connection successful!')
      return true
    } catch (error) {
      console.error('❌ Qdrant Cloud connection failed:', error)
      return false
    }
  }

  // Optimized for cloud performance
  async batchUpsertVectors(
    collectionName: string,
    points: Array<{
      id: string | number
      vector: number[]
      payload: Record<string, any>
    }>,
    batchSize: number = 100
  ): Promise<void> {
    console.log(`📤 Upserting ${points.length} vectors to ${collectionName}...`)

    // Process in batches for better cloud performance
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize)
      
      try {
        await qdrant.upsert(collectionName, {
          wait: true, // Ensure consistency
          points: batch
        })
        
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)} completed`)
      } catch (error) {
        console.error(`❌ Batch upload failed at index ${i}:`, error)
        throw error
      }
    }

    console.log(`🎉 All vectors uploaded to ${collectionName}!`)
  }
}
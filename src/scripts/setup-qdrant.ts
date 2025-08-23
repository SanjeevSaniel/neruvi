import dotenv from 'dotenv'
import { QdrantSetup } from '../lib/qdrant-setup'
import { VTTProcessor } from '../lib/vtt-processor'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function main() {
  console.log('🚀 FlowMind Qdrant Cloud Setup')
  console.log('================================')

  const qdrantSetup = new QdrantSetup()
  
  try {
    // Test connection
    console.log('\n1️⃣ Testing Qdrant Cloud connection...')
    const isConnected = await qdrantSetup.testConnection()
    
    if (!isConnected) {
      console.error('❌ Cannot connect to Qdrant Cloud. Please check your configuration.')
      process.exit(1)
    }

    // Initialize collections
    console.log('\n2️⃣ Setting up collections...')
    await qdrantSetup.initializeCollections()

    // Show collection status
    console.log('\n3️⃣ Collection status:')
    await qdrantSetup.getCollectionInfo()

    console.log('\n✅ Qdrant Cloud setup complete!')
    console.log('\nNext steps:')
    console.log('1. Run: npm run process-vtt')
    console.log('2. Start the app: npm run dev')

  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  }
}

async function processVTTData() {
  console.log('🚀 Processing VTT Files for Qdrant Cloud')
  console.log('=========================================')

  const processor = new VTTProcessor()
  
  try {
    await processor.processAllTranscripts()
    console.log('\n✅ VTT processing complete!')
  } catch (error) {
    console.error('\n❌ VTT processing failed:', error)
    process.exit(1)
  }
}

// Check command line argument
const command = process.argv[2]

if (command === 'process-vtt') {
  processVTTData()
} else {
  main()
}
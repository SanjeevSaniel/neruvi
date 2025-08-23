import { QdrantClient } from '@qdrant/js-client-rest'

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
})

export const COLLECTIONS = {
  NODEJS_TRANSCRIPTS: 'nodejs_transcripts',
  PYTHON_TRANSCRIPTS: 'python_transcripts'
} as const
import OpenAI from 'openai'

// Initialize OpenAI client with error handling
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface VTTSegment {
  id: string
  startTime: number
  endTime: number
  text: string
  courseId: 'nodejs' | 'python'
  videoId: string
  topics: string[]
}
import { openai } from './openai'
import { QdrantSetup } from './qdrant-setup'
import { COLLECTIONS } from './qdrant'
import { getSectionInfo } from './content-mapping'
import fs from 'fs/promises'
import path from 'path'

export interface VTTCue {
  startTime: number
  endTime: number
  text: string
}

export interface ProcessedSegment {
  id: string
  content: string
  startTime: number
  endTime: number
  videoId: string
  courseId: 'nodejs' | 'python'
  sectionId: string
  sectionName: string
  topics: string[]
  embedding: number[]
}

export class VTTProcessor {
  private qdrantSetup: QdrantSetup

  constructor() {
    this.qdrantSetup = new QdrantSetup()
  }

  async processAllTranscripts(): Promise<void> {
    console.log('🚀 Starting VTT processing pipeline...')

    // Check if collections exist, create if needed
    try {
      await this.qdrantSetup.initializeCollections()
    } catch (error) {
      console.log('ℹ️  Collections already exist, skipping creation...')
    }

    // Process Node.js transcripts
    await this.processCourseTranscripts('nodejs')
    
    // Process Python transcripts  
    await this.processCourseTranscripts('python')

    console.log('🎉 All transcripts processed successfully!')
  }

  private async processCourseTranscripts(course: 'nodejs' | 'python'): Promise<void> {
    console.log(`📚 Processing ${course.toUpperCase()} transcripts...`)

    const transcriptsPath = path.join(process.cwd(), 'src', 'data', 'transcripts', course)
    const allSegments: ProcessedSegment[] = []

    try {
      const folders = await fs.readdir(transcriptsPath, { withFileTypes: true })
      
      for (const folder of folders) {
        if (folder.isDirectory()) {
          const folderPath = path.join(transcriptsPath, folder.name)
          const sectionInfo = getSectionInfo(course, folder.name)
          
          console.log(`📁 Processing section: ${sectionInfo?.name || folder.name}`)
          
          const vttFiles = await fs.readdir(folderPath)
          
          for (const vttFile of vttFiles) {
            if (vttFile.endsWith('.vtt')) {
              console.log(`  📄 Processing: ${vttFile}`)
              const segments = await this.processVTTFile(
                path.join(folderPath, vttFile),
                course,
                vttFile,
                folder.name,
                sectionInfo?.name || folder.name
              )
              allSegments.push(...segments)
            }
          }
        }
      }

      // Upload to Qdrant Cloud
      const collectionName = course === 'nodejs' 
        ? COLLECTIONS.NODEJS_TRANSCRIPTS 
        : COLLECTIONS.PYTHON_TRANSCRIPTS

      const points = allSegments.map(segment => ({
        id: segment.id,
        vector: segment.embedding,
        payload: {
          content: segment.content,
          startTime: segment.startTime,
          endTime: segment.endTime,
          videoId: segment.videoId,
          courseId: segment.courseId,
          sectionId: segment.sectionId,
          sectionName: segment.sectionName,
          topics: segment.topics,
          text: segment.content // For keyword search
        }
      }))

      await this.qdrantSetup.batchUpsertVectors(collectionName, points)

    } catch (error) {
      console.error(`❌ Error processing ${course} transcripts:`, error)
      throw error
    }
  }

  private async processVTTFile(
    filePath: string,
    courseId: 'nodejs' | 'python',
    fileName: string,
    sectionId: string,
    sectionName: string
  ): Promise<ProcessedSegment[]> {
    const content = await fs.readFile(filePath, 'utf-8')
    const cues = this.parseVTT(content)
    const videoId = fileName.replace('.vtt', '')
    
    // Group cues into meaningful segments (30-60 seconds)
    const segments = this.groupCues(cues, videoId, courseId)
    
    // Process each segment
    const processedSegments: ProcessedSegment[] = []
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const segmentId = `${courseId}_${sectionId}_${videoId}_${i}`
      
      // Generate embedding
      const embedding = await this.createEmbedding(segment.content)
      
      // Extract topics (enhanced with section info)
      const topics = await this.extractTopics(segment.content, courseId, sectionId)
      
      processedSegments.push({
        id: segmentId,
        content: segment.content,
        startTime: segment.startTime,
        endTime: segment.endTime,
        videoId,
        courseId,
        sectionId,
        sectionName,
        topics,
        embedding
      })

      // Rate limiting for OpenAI API
      await this.delay(100)
    }

    return processedSegments
  }

  private parseVTT(content: string): VTTCue[] {
    const cues: VTTCue[] = []
    const lines = content.split('\n')
    let i = 0

    // Skip WEBVTT header
    while (i < lines.length && !lines[i].includes('-->')) {
      i++
    }

    while (i < lines.length) {
      const line = lines[i].trim()
      
      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map(s => s.trim())
        const startTime = this.parseTimestamp(startStr)
        const endTime = this.parseTimestamp(endStr)
        
        i++
        let text = ''
        
        // Collect text lines until empty line
        while (i < lines.length && lines[i].trim() !== '') {
          text += lines[i].trim() + ' '
          i++
        }
        
        if (text.trim()) {
          cues.push({
            startTime,
            endTime,
            text: text.trim()
          })
        }
      }
      i++
    }

    return cues
  }

  private parseTimestamp(timestamp: string): number {
    // Parse format: 00:01:23.456 or 01:23.456
    const parts = timestamp.split(':')
    let seconds = 0

    if (parts.length === 3) {
      // HH:MM:SS.mmm
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])
    } else if (parts.length === 2) {
      // MM:SS.mmm
      seconds = parseInt(parts[0]) * 60 + parseFloat(parts[1])
    }

    return seconds
  }

  private groupCues(cues: VTTCue[], videoId: string, courseId: 'nodejs' | 'python') {
    const segments = []
    const targetSegmentLength = 45 // seconds
    
    let currentSegment = {
      content: '',
      startTime: 0,
      endTime: 0
    }

    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i]
      
      if (currentSegment.content === '') {
        // Start new segment
        currentSegment.startTime = cue.startTime
        currentSegment.content = cue.text
        currentSegment.endTime = cue.endTime
      } else {
        // Add to current segment
        currentSegment.content += ' ' + cue.text
        currentSegment.endTime = cue.endTime
        
        // Check if segment is long enough or we're at the end
        const segmentDuration = currentSegment.endTime - currentSegment.startTime
        
        if (segmentDuration >= targetSegmentLength || i === cues.length - 1) {
          segments.push({ ...currentSegment })
          currentSegment = { content: '', startTime: 0, endTime: 0 }
        }
      }
    }

    return segments
  }

  private async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 1536
      })
      return response.data[0].embedding
    } catch (error) {
      console.error('Embedding creation failed:', error)
      return new Array(1536).fill(0) // Fallback zero vector
    }
  }

  private async extractTopics(text: string, course: 'nodejs' | 'python', sectionId?: string): Promise<string[]> {
    const courseKeywords = course === 'nodejs' 
      ? ['express', 'async', 'await', 'promise', 'module', 'server', 'middleware', 'api', 'http', 'npm']
      : ['function', 'class', 'decorator', 'generator', 'list', 'dict', 'loop', 'import', 'module', 'exception']

    const topics: string[] = []
    const textLower = text.toLowerCase()

    // Add section-specific topics
    if (sectionId) {
      const sectionInfo = getSectionInfo(course, sectionId)
      if (sectionInfo) {
        topics.push(...sectionInfo.topics)
      }
    }

    // Extract course-specific keywords
    courseKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        topics.push(keyword)
      }
    })

    // Use GPT for advanced topic extraction (rate limited)
    try {
      const prompt = `Extract 2-3 main technical topics from this ${course} course content: "${text.slice(0, 200)}..."`
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 50
      })

      const extractedTopics = response.choices[0].message.content
        ?.split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0) || []

      topics.push(...extractedTopics)
    } catch (error) {
      console.error('Topic extraction failed:', error)
    }

    return [...new Set(topics)] // Remove duplicates
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
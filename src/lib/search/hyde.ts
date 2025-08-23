import { openai } from '@/lib/openai'
import { qdrant, COLLECTIONS } from '@/lib/qdrant'

export interface HyDEResult {
  hypotheticalDocument: string
  embedding: number[]
  searchResults: VTTSearchResult[]
  confidence: number
}

export interface VTTSearchResult {
  id: string
  content: string
  startTime: number
  endTime: number
  videoId: string
  courseId: 'nodejs' | 'python'
  sectionId: string
  sectionName: string
  topics: string[]
  score: number
  timestamp: string
}

export class HyDESearchEngine {
  
  async generateHypotheticalDocument(
    query: string, 
    course: 'nodejs' | 'python', 
    context: string = ''
  ): Promise<string> {
    const courseContext = course === 'nodejs' 
      ? 'Node.js backend development, Express.js framework, async/await patterns, modules, HTTP servers, middleware'
      : 'Python programming fundamentals, functions, classes, decorators, generators, data structures, OOP concepts'

    const prompt = `
You are a ${course} instructor creating educational content. Generate a detailed, hypothetical transcript segment that would answer this question: "${query}"

Course Context: ${courseContext}
${context ? `Additional Context: ${context}` : ''}

The response should sound like actual course content with:
- Clear technical explanations
- Practical examples and code snippets  
- Common use cases and best practices
- Learning-focused language

Generate a comprehensive response (200-400 words) that would typically appear in a ${course} course transcript:
`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      })

      return response.choices[0].message.content || query
    } catch (error) {
      console.error('HyDE generation failed:', error)
      return query
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 1536
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Embedding creation failed:', error)
      return []
    }
  }

  async searchVTTContent(
    embedding: number[],
    course: 'nodejs' | 'python',
    limit: number = 10
  ): Promise<VTTSearchResult[]> {
    const collectionName = course === 'nodejs' 
      ? COLLECTIONS.NODEJS_TRANSCRIPTS 
      : COLLECTIONS.PYTHON_TRANSCRIPTS

    try {
      const searchResult = await qdrant.search(collectionName, {
        vector: embedding,
        limit,
        with_payload: true,
        with_vector: false
      })

      return searchResult.map(result => ({
        id: result.id as string,
        content: result.payload?.text as string || '',
        startTime: result.payload?.startTime as number || 0,
        endTime: result.payload?.endTime as number || 0,
        videoId: result.payload?.videoId as string || '',
        courseId: course,
        sectionId: result.payload?.sectionId as string || '',
        sectionName: result.payload?.sectionName as string || '',
        topics: result.payload?.topics as string[] || [],
        score: result.score || 0,
        timestamp: this.formatTimestamp(result.payload?.startTime as number || 0)
      }))
    } catch (error) {
      console.error('Qdrant search failed:', error)
      return []
    }
  }

  async hydeSearch(
    query: string, 
    course: 'nodejs' | 'python' = 'both' as any,
    additionalContext: string = ''
  ): Promise<{
    direct: VTTSearchResult[],
    hyde: VTTSearchResult[],
    combined: VTTSearchResult[]
  }> {
    try {
      const courses = course === 'both' ? ['nodejs', 'python'] as const : [course]
      const results = { direct: [] as VTTSearchResult[], hyde: [] as VTTSearchResult[], combined: [] as VTTSearchResult[] }

      for (const courseType of courses) {
        // Direct query embedding
        const directEmbedding = await this.createEmbedding(query)
        const directResults = await this.searchVTTContent(directEmbedding, courseType, 5)

        // HyDE approach
        const hypotheticalDoc = await this.generateHypotheticalDocument(query, courseType, additionalContext)
        const hydeEmbedding = await this.createEmbedding(hypotheticalDoc)
        const hydeResults = await this.searchVTTContent(hydeEmbedding, courseType, 5)

        results.direct.push(...directResults)
        results.hyde.push(...hydeResults)
      }

      // Combine and deduplicate results
      const combined = this.combineResults(results.direct, results.hyde)
      results.combined = combined

      return results
    } catch (error) {
      console.error('HyDE search failed:', error)
      return { direct: [], hyde: [], combined: [] }
    }
  }

  private combineResults(direct: VTTSearchResult[], hyde: VTTSearchResult[]): VTTSearchResult[] {
    const seen = new Set<string>()
    const combined: VTTSearchResult[] = []

    // Weighted combination: HyDE results get slight boost
    const allResults = [
      ...hyde.map(r => ({ ...r, score: r.score * 1.1 })),
      ...direct
    ]

    // Sort by score and deduplicate
    allResults
      .sort((a, b) => b.score - a.score)
      .forEach(result => {
        const key = `${result.videoId}-${result.startTime}`
        if (!seen.has(key)) {
          seen.add(key)
          combined.push(result)
        }
      })

    return combined.slice(0, 10) // Top 10 results
  }

  // Re-rank results based on original query
  async reRankResults(results: VTTSearchResult[], originalQuery: string): Promise<VTTSearchResult[]> {
    if (results.length <= 3) return results

    const prompt = `
Rank these course content segments by relevance to the query: "${originalQuery}"

Segments:
${results.map((r, i) => `${i + 1}. ${r.content.slice(0, 200)}...`).join('\n')}

Return only the numbers of the top 5 most relevant segments in order: [1, 3, 5, 2, 4]
`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 50
      })

      const content = response.choices[0].message.content || ''
      const rankings = content.match(/\[[\d,\s]+\]/)
      
      if (rankings) {
        const indices = JSON.parse(rankings[0]) as number[]
        return indices
          .filter(i => i >= 1 && i <= results.length)
          .map(i => results[i - 1])
      }
    } catch (error) {
      console.error('Re-ranking failed:', error)
    }

    return results
  }

  private formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}
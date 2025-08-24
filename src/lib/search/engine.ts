import { QueryRewriter } from '@/lib/query/rewriter'
import { QueryDecisionTranslator } from '@/lib/query/translator'
import { HyDESearchEngine } from '@/lib/search/hyde'
import type { VTTSearchResult } from '@/lib/search/hyde'

export interface SearchResult {
  query: string
  results: VTTSearchResult[]
  searchStrategy: 'semantic' | 'keyword' | 'hybrid'
  processingSteps: {
    originalQuery: string
    rewrittenQueries: string[]
    translatedQueries: string[]
    hydeGenerated: boolean
  }
  metadata: {
    totalResults: number
    processingTimeMs: number
    confidence: number
  }
}

export class EnhancedSearchEngine {
  private queryRewriter: QueryRewriter
  private queryTranslator: QueryDecisionTranslator  
  private hydeEngine: HyDESearchEngine

  constructor() {
    this.queryRewriter = new QueryRewriter()
    this.queryTranslator = new QueryDecisionTranslator()
    this.hydeEngine = new HyDESearchEngine()
  }

  async search(originalQuery: string): Promise<SearchResult> {
    const startTime = Date.now()
    let results: VTTSearchResult[] = []
    let searchStrategy: 'semantic' | 'keyword' | 'hybrid' = 'semantic'

    try {
      // Step 1: Query rewriting for multiple perspectives
      console.log('🔄 Rewriting query...')
      const rewriteResult = await this.queryRewriter.rewriteQuery(originalQuery)
      
      // Step 2: Query decision translation  
      console.log('🔄 Translating query...')
      const translationResult = await this.queryTranslator.translateQuery(originalQuery)
      searchStrategy = translationResult.searchStrategy

      // Step 3: Enhanced search based on strategy
      console.log(`🔍 Searching with ${searchStrategy} strategy...`)
      
      if (searchStrategy === 'hybrid') {
        results = await this.hybridSearch(rewriteResult, translationResult)
      } else if (searchStrategy === 'semantic') {
        results = await this.semanticSearch(rewriteResult, translationResult)
      } else {
        results = await this.keywordSearch(rewriteResult, translationResult)
      }

      // Step 4: Re-rank and filter results
      console.log('📊 Re-ranking results...')
      results = await this.hydeEngine.reRankResults(results, originalQuery)

      const processingTime = Date.now() - startTime

      return {
        query: originalQuery,
        results,
        searchStrategy,
        processingSteps: {
          originalQuery,
          rewrittenQueries: rewriteResult.rewrittenQueries,
          translatedQueries: translationResult.searchQueries,
          hydeGenerated: searchStrategy !== 'keyword'
        },
        metadata: {
          totalResults: results.length,
          processingTimeMs: processingTime,
          confidence: rewriteResult.confidence
        }
      }

    } catch (error) {
      console.error('Enhanced search failed:', error)
      
      // Fallback to simple search
      const fallbackResults = await this.fallbackSearch(originalQuery)
      
      return {
        query: originalQuery,
        results: fallbackResults,
        searchStrategy: 'semantic',
        processingSteps: {
          originalQuery,
          rewrittenQueries: [originalQuery],
          translatedQueries: [originalQuery],
          hydeGenerated: false
        },
        metadata: {
          totalResults: fallbackResults.length,
          processingTimeMs: Date.now() - startTime,
          confidence: 0.5
        }
      }
    }
  }

  private async semanticSearch(
    rewriteResult: any,
    translationResult: any
  ): Promise<VTTSearchResult[]> {
    const course = translationResult.filters.course || 'both'
    
    // Use HyDE for semantic search
    const hydeResults = await this.hydeEngine.hydeSearch(
      rewriteResult.originalQuery,
      course,
      JSON.stringify(translationResult.filters)
    )

    return hydeResults.combined
  }

  private async keywordSearch(
    rewriteResult: any, 
    translationResult: any
  ): Promise<VTTSearchResult[]> {
    // For keyword search, use direct embeddings without HyDE
    const course = translationResult.filters.course || 'both'
    const courses = course === 'both' ? ['nodejs', 'python'] as const : [course]
    
    const allResults: VTTSearchResult[] = []

    for (const courseType of courses) {
      for (const query of rewriteResult.rewrittenQueries) {
        const embedding = await this.hydeEngine.createEmbedding(query)
        const results = await this.hydeEngine.searchVTTContent(embedding, courseType, 5)
        allResults.push(...results)
      }
    }

    // Deduplicate and sort
    const seen = new Set<string>()
    const unique = allResults.filter(result => {
      const key = `${result.videoId}-${result.startTime}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return unique.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  private async hybridSearch(
    rewriteResult: any,
    translationResult: any  
  ): Promise<VTTSearchResult[]> {
    // Combine semantic and keyword approaches
    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(rewriteResult, translationResult),
      this.keywordSearch(rewriteResult, translationResult)
    ])

    // Merge results with weighted scoring
    const combined = new Map<string, VTTSearchResult>()
    
    // Add semantic results with higher weight
    semanticResults.forEach(result => {
      const key = `${result.videoId}-${result.startTime}`
      combined.set(key, { ...result, score: result.score * 1.2 })
    })

    // Add keyword results
    keywordResults.forEach(result => {
      const key = `${result.videoId}-${result.startTime}`
      const existing = combined.get(key)
      if (existing) {
        // Boost score if found in both approaches
        existing.score = Math.max(existing.score, result.score) * 1.3
      } else {
        combined.set(key, result)
      }
    })

    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }

  private async fallbackSearch(query: string): Promise<VTTSearchResult[]> {
    try {
      const embedding = await this.hydeEngine.createEmbedding(query)
      const results = await Promise.all([
        this.hydeEngine.searchVTTContent(embedding, 'nodejs', 5),
        this.hydeEngine.searchVTTContent(embedding, 'python', 5)
      ])
      
      return [...results[0], ...results[1]]
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
    } catch (error) {
      console.error('Fallback search failed:', error)
      return []
    }
  }
}
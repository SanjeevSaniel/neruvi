import { openai } from '@/lib/openai'

export interface QueryTranslation {
  originalQuery: string
  searchQueries: string[]
  filters: {
    course?: 'nodejs' | 'python'
    topics?: string[]
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    type?: 'concept' | 'practical' | 'example'
  }
  searchStrategy: 'semantic' | 'keyword' | 'hybrid'
}

export class QueryDecisionTranslator {
  async translateQuery(query: string): Promise<QueryTranslation> {
    const prompt = `
Translate this learning query into optimized search parameters:

Query: "${query}"

Analyze and provide:
1. Search-optimized queries (3-5 variations)
2. Filters (course, topics, difficulty, type)  
3. Best search strategy (semantic/keyword/hybrid)

Course detection:
- nodejs: Node.js, Express, backend, server, async/await, modules
- python: Python, functions, classes, decorators, generators, data structures

Topic extraction examples:
- "async await" -> ["asynchronous programming", "promises", "async functions"]
- "python classes" -> ["object oriented programming", "inheritance", "constructors"]

Return JSON:
{
  "searchQueries": ["optimized query 1", "optimized query 2"],
  "filters": {
    "course": "nodejs",
    "topics": ["async programming", "promises"],
    "difficulty": "intermediate", 
    "type": "concept"
  },
  "searchStrategy": "semantic"
}
`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        originalQuery: query,
        searchQueries: result.searchQueries || [query],
        filters: result.filters || {},
        searchStrategy: result.searchStrategy || 'semantic'
      }
    } catch (error) {
      console.error('Query translation failed:', error)
      return {
        originalQuery: query,
        searchQueries: [query],
        filters: {},
        searchStrategy: 'semantic'
      }
    }
  }

  // Decision tree for search strategy
  determineSearchStrategy(query: string): 'semantic' | 'keyword' | 'hybrid' {
    const keywords = query.toLowerCase()
    
    // Keyword search for specific terms
    const keywordPatterns = [
      /\b(syntax|error|fix|debug|install|setup)\b/,
      /\b(command|function name|method name)\b/,
      /\bwhat is\s+\w+\s*\?\b/
    ]

    // Semantic search for concepts  
    const semanticPatterns = [
      /\b(explain|understand|how does|why|concept|difference)\b/,
      /\b(best practices|patterns|approach|strategy)\b/,
      /\b(when to use|comparison|vs)\b/
    ]

    const hasKeywordIntent = keywordPatterns.some(pattern => pattern.test(keywords))
    const hasSemanticIntent = semanticPatterns.some(pattern => pattern.test(keywords))

    if (hasKeywordIntent && hasSemanticIntent) return 'hybrid'
    if (hasKeywordIntent) return 'keyword'
    return 'semantic'
  }

  // Extract learning context
  extractLearningContext(query: string) {
    const context = {
      needsExample: /\b(example|show me|demo|sample)\b/i.test(query),
      needsExplanation: /\b(explain|what is|how does|why)\b/i.test(query),
      needsComparison: /\b(vs|versus|difference|compare)\b/i.test(query),
      needsSteps: /\b(how to|steps|process|tutorial)\b/i.test(query),
      difficulty: this.estimateDifficulty(query)
    }

    return context
  }

  private estimateDifficulty(query: string): 'beginner' | 'intermediate' | 'advanced' {
    const beginnerTerms = ['basic', 'introduction', 'getting started', 'what is', 'simple']
    const advancedTerms = ['optimization', 'performance', 'advanced', 'complex', 'architecture']
    
    const queryLower = query.toLowerCase()
    
    if (beginnerTerms.some(term => queryLower.includes(term))) return 'beginner'
    if (advancedTerms.some(term => queryLower.includes(term))) return 'advanced'
    return 'intermediate'
  }
}
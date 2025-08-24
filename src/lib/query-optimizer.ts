import OpenAI from 'openai';
import { createHash } from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface OptimizedQuery {
  original: string;
  expanded: string[];
  technical_terms: string[];
  intent: 'concept' | 'implementation' | 'debugging' | 'comparison' | 'example';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  course_preference: 'nodejs' | 'python' | 'both';
  search_strategy: 'semantic' | 'keyword' | 'hybrid';
}

export interface QueryCache {
  optimizations: Map<string, OptimizedQuery>;
  embeddings: Map<string, number[]>;
  lastCleanup: number;
}

export class QueryOptimizer {
  private cache: QueryCache;
  private readonly MAX_CACHE_SIZE = 500;
  private readonly CACHE_CLEANUP_INTERVAL = 3600000; // 1 hour

  constructor() {
    this.cache = {
      optimizations: new Map(),
      embeddings: new Map(),
      lastCleanup: Date.now(),
    };

    // Periodic cache cleanup
    setInterval(() => this.cleanupCache(), this.CACHE_CLEANUP_INTERVAL);
  }

  async optimizeQuery(query: string): Promise<OptimizedQuery> {
    const cacheKey = this.createCacheKey(query);
    
    // Check cache first
    const cached = this.cache.optimizations.get(cacheKey);
    if (cached) {
      console.log('⚡ Using cached query optimization');
      return cached;
    }

    try {
      // console.log(`🔧 Optimizing query: "${query}"`);
      
      // Generate optimized query using AI
      const optimized = await this.generateOptimizedQuery(query);
      
      // Cache the result
      this.cacheOptimization(cacheKey, optimized);
      
      return optimized;
    } catch (error) {
      console.error('❌ Query optimization failed:', error);
      
      // Return fallback optimization
      return this.createFallbackOptimization(query);
    }
  }

  private async generateOptimizedQuery(query: string): Promise<OptimizedQuery> {
    const prompt = `Analyze this programming learning query and optimize it for vector search:

Query: "${query}"

Provide a JSON response with:
1. expanded: Array of 3-5 expanded/rephrased versions focusing on different aspects
2. technical_terms: Array of key technical terms and concepts mentioned or implied
3. intent: One of "concept", "implementation", "debugging", "comparison", "example"
4. difficulty: One of "beginner", "intermediate", "advanced"
5. course_preference: One of "nodejs", "python", "both"
6. search_strategy: One of "semantic", "keyword", "hybrid"

Guidelines:
- For concept questions → semantic search
- For specific implementation → keyword search  
- For comparisons or complex queries → hybrid search
- Expand queries with synonyms and related terms
- Include both theoretical and practical variations

Return only valid JSON.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      original: query,
      expanded: result.expanded || [query],
      technical_terms: result.technical_terms || [],
      intent: result.intent || 'concept',
      difficulty: result.difficulty || 'intermediate',
      course_preference: result.course_preference || 'both',
      search_strategy: result.search_strategy || 'semantic',
    };
  }

  async getOptimizedEmbedding(query: string): Promise<number[]> {
    const cacheKey = this.createCacheKey(query);
    
    // Check embedding cache
    const cached = this.cache.embeddings.get(cacheKey);
    if (cached) {
      // console.log('⚡ Using cached query embedding');
      return cached;
    }

    try {
      // Get optimized query first
      const optimized = await this.optimizeQuery(query);
      
      // Create embedding for the most comprehensive expanded version
      const textToEmbed = this.createOptimalEmbeddingText(optimized);
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: textToEmbed,
        dimensions: 1536,
      });

      const embedding = response.data[0].embedding;
      
      // Cache the embedding
      this.cache.embeddings.set(cacheKey, embedding);
      
      // console.log(`🔧 Created optimized embedding for: "${query}"`);
      return embedding;
    } catch (error) {
      console.error('❌ Optimized embedding creation failed:', error);
      
      // Fallback to simple embedding
      return this.createSimpleEmbedding(query);
    }
  }

  private createOptimalEmbeddingText(optimized: OptimizedQuery): string {
    // Combine original query with best expansions and technical terms
    const components = [
      optimized.original,
      ...optimized.expanded.slice(0, 2), // Top 2 expansions
      ...optimized.technical_terms.slice(0, 5), // Top 5 technical terms
    ];

    // Add context based on intent
    const contextMap = {
      concept: 'theoretical explanation understanding concept definition',
      implementation: 'code example practical implementation syntax usage',
      debugging: 'troubleshooting error fixing problem solving',
      comparison: 'difference comparison contrast versus alternative',
      example: 'example demonstration sample code tutorial',
    };

    components.push(contextMap[optimized.intent]);
    
    // Add course context if specific
    if (optimized.course_preference !== 'both') {
      components.push(`${optimized.course_preference} programming`);
    }

    return components.join(' ');
  }

  private async createSimpleEmbedding(query: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 1536,
    });

    return response.data[0].embedding;
  }

  private createFallbackOptimization(query: string): OptimizedQuery {
    // Simple rule-based optimization as fallback
    const queryLower = query.toLowerCase();
    
    const hasNodeJSTerms = /\b(node|express|npm|javascript|js|server|middleware|callback)\b/i.test(query);
    const hasPythonTerms = /\b(python|py|def|class|pip|django|flask|pandas)\b/i.test(query);
    
    const course_preference = hasNodeJSTerms && !hasPythonTerms ? 'nodejs' :
                            hasPythonTerms && !hasNodeJSTerms ? 'python' : 'both';

    const intent = queryLower.includes('how to') || queryLower.includes('implement') ? 'implementation' :
                  queryLower.includes('what is') || queryLower.includes('explain') ? 'concept' :
                  queryLower.includes('error') || queryLower.includes('debug') ? 'debugging' :
                  queryLower.includes('vs') || queryLower.includes('difference') ? 'comparison' : 'example';

    const difficulty = queryLower.includes('basic') || queryLower.includes('beginner') ? 'beginner' :
                      queryLower.includes('advanced') || queryLower.includes('complex') ? 'advanced' : 'intermediate';

    return {
      original: query,
      expanded: [query, `${query} tutorial`, `${query} example`],
      technical_terms: this.extractTechnicalTerms(query),
      intent,
      difficulty,
      course_preference,
      search_strategy: 'hybrid',
    };
  }

  private extractTechnicalTerms(query: string): string[] {
    const technicalPatterns = [
      /\b(function|class|method|variable|array|object|string|number|boolean)\b/gi,
      /\b(async|await|promise|callback|event|module|import|export)\b/gi,
      /\b(express|react|node|npm|server|api|http|middleware)\b/gi,
      /\b(python|django|flask|pandas|numpy|pip|def|lambda)\b/gi,
      /\b(database|sql|json|xml|html|css|dom|ajax)\b/gi,
    ];

    const terms = new Set<string>();
    
    technicalPatterns.forEach(pattern => {
      const matches = query.match(pattern) || [];
      matches.forEach(match => terms.add(match.toLowerCase()));
    });

    return Array.from(terms);
  }

  private createCacheKey(query: string): string {
    return createHash('md5').update(query.toLowerCase().trim()).digest('hex');
  }

  private cacheOptimization(key: string, optimization: OptimizedQuery): void {
    // Implement LRU behavior
    if (this.cache.optimizations.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.optimizations.keys().next().value;
      if (firstKey) {
        this.cache.optimizations.delete(firstKey);
      }
    }

    this.cache.optimizations.set(key, optimization);
  }

  private cleanupCache(): void {
    const now = Date.now();
    
    // Only cleanup if it's been more than an hour
    if (now - this.cache.lastCleanup > this.CACHE_CLEANUP_INTERVAL) {
      console.log('🧹 Cleaning up query optimizer cache...');
      
      // Keep only the most recent half of the cache
      const optimizationEntries = Array.from(this.cache.optimizations.entries());
      const embeddingEntries = Array.from(this.cache.embeddings.entries());
      
      if (optimizationEntries.length > this.MAX_CACHE_SIZE / 2) {
        this.cache.optimizations.clear();
        optimizationEntries
          .slice(optimizationEntries.length - Math.floor(this.MAX_CACHE_SIZE / 2))
          .forEach(([key, value]) => this.cache.optimizations.set(key, value));
      }
      
      if (embeddingEntries.length > this.MAX_CACHE_SIZE / 2) {
        this.cache.embeddings.clear();
        embeddingEntries
          .slice(embeddingEntries.length - Math.floor(this.MAX_CACHE_SIZE / 2))
          .forEach(([key, value]) => this.cache.embeddings.set(key, value));
      }
      
      this.cache.lastCleanup = now;
      console.log('✅ Cache cleanup completed');
    }
  }

  // Smart query suggestions based on cache analysis
  getSimilarQueries(query: string, limit: number = 5): string[] {
    const queryTerms = new Set(query.toLowerCase().split(/\s+/));
    const suggestions: { query: string; similarity: number }[] = [];

    for (const [, optimization] of this.cache.optimizations) {
      const cached = optimization.original.toLowerCase();
      const cachedTerms = new Set(cached.split(/\s+/));
      
      // Calculate Jaccard similarity
      const intersection = new Set([...queryTerms].filter(x => cachedTerms.has(x)));
      const union = new Set([...queryTerms, ...cachedTerms]);
      const similarity = intersection.size / union.size;
      
      if (similarity > 0.2 && similarity < 0.9) { // Not too similar, not too different
        suggestions.push({
          query: optimization.original,
          similarity,
        });
      }
    }

    return suggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(s => s.query);
  }

  getStats() {
    return {
      cachedOptimizations: this.cache.optimizations.size,
      cachedEmbeddings: this.cache.embeddings.size,
      lastCleanup: new Date(this.cache.lastCleanup).toISOString(),
      memoryUsage: {
        optimizations: this.cache.optimizations.size * 200, // Rough estimate in bytes
        embeddings: this.cache.embeddings.size * 1536 * 4, // 1536 float32 numbers
      },
    };
  }
}

export const queryOptimizer = new QueryOptimizer();
import OpenAI from 'openai';
import { createHash } from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export type CourseType = 'nodejs' | 'python' | 'both';

export interface HydeQuery {
  original: string;
  hypotheticalAnswers: string[];
  technicalContext: string;
  relatedQuestions: string[];
  expectedTopics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  queryType: 'concept' | 'implementation' | 'debugging' | 'comparison' | 'example';
}

export interface EnhancedHydeResult {
  query: HydeQuery;
  searchEmbeddings: number[][];
  metadata: {
    processingTime: number;
    confidence: number;
    course: CourseType;
  };
}

class HydeEnhancedSystem {
  private cache = new Map<string, EnhancedHydeResult>();
  private readonly CACHE_SIZE = 200;

  async generateEnhancedHyde(
    query: string, 
    course: CourseType = 'both'
  ): Promise<EnhancedHydeResult> {
    const startTime = Date.now();
    const cacheKey = this.createCacheKey(query, course);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('⚡ Using cached HYDE result');
      return this.cache.get(cacheKey)!;
    }

    try {
      // console.log(`🧠 Generating enhanced HYDE for: "${query}" (${course})`);
      
      // Generate comprehensive HYDE query
      const hydeQuery = await this.generateHydeQuery(query, course);
      
      // Create embeddings for all HYDE components
      const searchEmbeddings = await this.createSearchEmbeddings(hydeQuery);
      
      const result: EnhancedHydeResult = {
        query: hydeQuery,
        searchEmbeddings,
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: this.calculateConfidence(hydeQuery),
          course,
        },
      };

      // Cache the result
      this.cacheResult(cacheKey, result);
      
      console.log(`✅ Enhanced HYDE generated in ${result.metadata.processingTime}ms`);
      return result;
    } catch (error) {
      console.error('❌ Enhanced HYDE generation failed:', error);
      throw error;
    }
  }

  private async generateHydeQuery(query: string, course: CourseType): Promise<HydeQuery> {
    const courseContext = this.getCourseContext(course);
    
    const prompt = `You are an expert programming instructor creating comprehensive learning materials.

User Query: "${query}"
Course Context: ${courseContext}

Generate a comprehensive analysis for semantic search optimization. Provide a JSON response with:

1. hypotheticalAnswers: Array of 2-3 concise hypothetical answers that would match this query
   - Include brief code examples and key explanations
   - Write as if from course transcripts/documentation
   - Keep each answer 100-200 words focused and clear

2. technicalContext: Brief technical background and related concepts (100-150 words)

3. relatedQuestions: Array of 3-4 related questions a student might ask

4. expectedTopics: Array of key technical topics and keywords

5. difficulty: One of "beginner", "intermediate", "advanced" 

6. queryType: One of "concept", "implementation", "debugging", "comparison", "example"

Focus on creating concise, relevant content for ${courseContext} course materials.
Keep responses brief but informative.

Return only valid JSON with no additional text or markdown formatting.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    let result;
    try {
      const content = response.choices[0].message.content || '{}';
      // Clean the content to ensure valid JSON
      const cleanedContent = content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
      result = JSON.parse(cleanedContent);
    } catch (error) {
      console.warn('⚠️ HYDE JSON parsing failed, using fallback');
      // Fallback to basic structure
      result = {
        hypothetical_answers: [query],
        technical_context: `Technical context for: ${query}`,
        related_questions: [`How to implement ${query}?`],
        expected_topics: ['programming', 'development'],
        difficulty: 'intermediate',
        query_type: 'concept'
      };
    }
    
    return {
      original: query,
      hypotheticalAnswers: result.hypotheticalAnswers || [],
      technicalContext: result.technicalContext || '',
      relatedQuestions: result.relatedQuestions || [],
      expectedTopics: result.expectedTopics || [],
      difficulty: result.difficulty || 'intermediate',
      queryType: result.queryType || 'concept',
    };
  }

  private async createSearchEmbeddings(hydeQuery: HydeQuery): Promise<number[][]> {
    // Prepare texts for embedding
    const textsToEmbed = [
      // Original query
      hydeQuery.original,
      
      // Hypothetical answers (each one separately for better matching)
      ...hydeQuery.hypotheticalAnswers,
      
      // Technical context
      hydeQuery.technicalContext,
      
      // Related questions (combined for efficiency)
      hydeQuery.relatedQuestions.join(' '),
      
      // Expected topics (combined)
      hydeQuery.expectedTopics.join(' '),
      
      // Query-type specific text
      this.getQueryTypeContext(hydeQuery.queryType, hydeQuery.original),
    ];

    // Create embeddings in batch
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: textsToEmbed,
      dimensions: 1536,
    });

    return response.data.map(item => item.embedding);
  }

  private getQueryTypeContext(queryType: string, query: string): string {
    const contexts = {
      concept: `Theoretical explanation and definition: ${query}. Understanding fundamental concepts, principles, and theory.`,
      implementation: `Practical implementation and coding examples: ${query}. Step-by-step guide, code samples, and best practices.`,
      debugging: `Troubleshooting and error resolution: ${query}. Common issues, error messages, debugging techniques, and solutions.`,
      comparison: `Comparison and differences: ${query}. Pros and cons, alternatives, when to use each approach.`,
      example: `Practical examples and demonstrations: ${query}. Real-world use cases, sample code, and working examples.`,
    };
    
    return contexts[queryType as keyof typeof contexts] || contexts.concept;
  }

  private getCourseContext(course: CourseType): string {
    const contexts = {
      nodejs: 'Node.js backend development, Express.js framework, async/await patterns, REST APIs, middleware, npm packages, server-side JavaScript, MongoDB integration, authentication systems',
      python: 'Python programming fundamentals, data structures, object-oriented programming, functions, classes, Django/Flask frameworks, data science libraries, NumPy, pandas, machine learning basics',
      both: 'Full-stack programming concepts, software development best practices, algorithms, data structures, web development, API design, database integration, programming fundamentals',
    };
    
    return contexts[course];
  }

  private calculateConfidence(hydeQuery: HydeQuery): number {
    let confidence = 0.5; // Base confidence
    
    // More hypothetical answers = higher confidence
    confidence += Math.min(0.2, hydeQuery.hypotheticalAnswers.length * 0.05);
    
    // Quality of technical context
    confidence += Math.min(0.15, hydeQuery.technicalContext.length / 1000);
    
    // Number of expected topics
    confidence += Math.min(0.1, hydeQuery.expectedTopics.length * 0.02);
    
    // Related questions indicate comprehensive understanding
    confidence += Math.min(0.15, hydeQuery.relatedQuestions.length * 0.025);
    
    return Math.min(1.0, confidence);
  }

  private createCacheKey(query: string, course: CourseType): string {
    return createHash('md5')
      .update(`${query.toLowerCase().trim()}_${course}`)
      .digest('hex');
  }

  private cacheResult(key: string, result: EnhancedHydeResult): void {
    // LRU cache implementation
    if (this.cache.size >= this.CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
  }

  // Multi-vector search strategy
  async createSearchStrategy(hydeResult: EnhancedHydeResult): Promise<{
    primaryEmbedding: number[];
    secondaryEmbeddings: number[][];
    searchWeights: number[];
    metadata: any;
  }> {
    const embeddings = hydeResult.searchEmbeddings;
    
    // Primary embedding: weighted combination of hypothetical answers
    const primaryEmbedding = this.createWeightedEmbedding(
      embeddings.slice(1, hydeResult.query.hypotheticalAnswers.length + 1),
      [0.4, 0.3, 0.2, 0.1] // Decreasing weights
    );

    // Secondary embeddings for multi-vector search
    const secondaryEmbeddings = [
      embeddings[0], // Original query
      embeddings[embeddings.length - 2], // Technical context
      embeddings[embeddings.length - 1], // Query type context
    ];

    // Search weights based on query type and difficulty
    const searchWeights = this.calculateSearchWeights(hydeResult.query);

    return {
      primaryEmbedding,
      secondaryEmbeddings,
      searchWeights,
      metadata: {
        queryType: hydeResult.query.queryType,
        difficulty: hydeResult.query.difficulty,
        expectedTopics: hydeResult.query.expectedTopics,
        confidence: hydeResult.metadata.confidence,
      },
    };
  }

  private createWeightedEmbedding(embeddings: number[][], weights: number[]): number[] {
    if (embeddings.length === 0) return new Array(1536).fill(0);
    
    const result = new Array(1536).fill(0);
    const normalizedWeights = weights.slice(0, embeddings.length);
    const weightSum = normalizedWeights.reduce((sum, w) => sum + w, 0);
    
    for (let i = 0; i < embeddings.length; i++) {
      const weight = normalizedWeights[i] / weightSum;
      for (let j = 0; j < 1536; j++) {
        result[j] += embeddings[i][j] * weight;
      }
    }
    
    return result;
  }

  private calculateSearchWeights(query: HydeQuery): number[] {
    // Base weights: [primary, original, technical, queryType]
    const baseWeights = [0.5, 0.2, 0.2, 0.1];
    
    // Adjust based on query type
    const adjustments = {
      concept: [0.4, 0.2, 0.3, 0.1], // More technical context
      implementation: [0.6, 0.15, 0.15, 0.1], // Focus on hypothetical answers
      debugging: [0.5, 0.3, 0.1, 0.1], // Original query + hypotheticals
      comparison: [0.4, 0.2, 0.2, 0.2], // Balanced approach
      example: [0.6, 0.1, 0.2, 0.1], // Focus on examples
    };
    
    return adjustments[query.queryType] || baseWeights;
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.CACHE_SIZE,
      cacheHitRate: this.cache.size > 0 ? 'Available' : 'Empty',
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🧹 HYDE cache cleared');
  }
}

export const hydeEnhanced = new HydeEnhancedSystem();
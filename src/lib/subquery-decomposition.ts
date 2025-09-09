import OpenAI from 'openai';
import { qdrantRAG } from './qdrant-rag';
import type { QdrantSearchResult } from './qdrant-rag';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface SubqueryDecomposition {
  needsDecomposition: boolean;
  subqueries: string[];
  executionOrder: number[];
  dependencies: { [key: number]: number[] };
  strategy: 'simple' | 'decomposed';
  complexity: 'low' | 'medium' | 'high';
}

export interface SubqueryResult {
  query: string;
  result: string;
  sources: QdrantSearchResult[];
  dependencies: number[];
  executionOrder: number;
  confidence: number;
}

export interface SubqueryResults {
  subqueryResults: SubqueryResult[];
  synthesizedAnswer: string;
  totalSubqueries: number;
  processingTime: number;
  overallConfidence: number;
}

export class SubqueryDecomposer {
  private readonly COMPLEXITY_THRESHOLD = 10; // words
  private readonly MAX_SUBQUERIES = 5;

  /**
   * Analyze and decompose complex queries into manageable sub-questions
   */
  async decomposeQuery(
    complexQuery: string,
    course: 'nodejs' | 'python'
  ): Promise<SubqueryDecomposition> {
    console.log(`🔍 Subquery Decomposer: Analyzing query complexity: "${complexQuery}"`);

    // Quick complexity check
    if (!this.isComplexQuery(complexQuery)) {
      console.log('📝 Query is simple, no decomposition needed');
      return {
        needsDecomposition: false,
        subqueries: [complexQuery],
        executionOrder: [0],
        dependencies: {},
        strategy: 'simple',
        complexity: 'low'
      };
    }

    console.log('🧩 Query is complex, attempting decomposition');

    try {
      const decompositionPrompt = `You are an expert ${course} programming instructor breaking down complex questions for better learning.

COMPLEX QUERY: "${complexQuery}"
COURSE: ${course.toUpperCase()}

Analyze this query and break it into 2-4 focused sub-questions that:
1. Can be answered independently with educational content
2. Follow a logical learning progression
3. Cover all aspects of the original question
4. Are specific and actionable for ${course} development
5. Build upon each other when dependencies exist

Rules:
- Each sub-question should be clear and concise
- Maintain the educational context for ${course}
- Order questions from basic concepts to advanced implementation
- Identify dependencies between questions

Respond in JSON format:
{
  "subqueries": [
    "What are the basic concepts of X in ${course}?",
    "How do you implement X in ${course}?",
    "What are the best practices for X in ${course}?",
    "What are common pitfalls when using X in ${course}?"
  ],
  "executionOrder": [0, 1, 2, 3],
  "dependencies": {
    "1": [0],
    "2": [0, 1],
    "3": [1, 2]
  },
  "complexity": "high"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: decompositionPrompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No decomposition response');
      }

      const decomposition = JSON.parse(content);

      // Validate and clean the decomposition
      const validatedDecomposition = this.validateDecomposition(decomposition, complexQuery);

      console.log(`✅ Decomposed into ${validatedDecomposition.subqueries.length} sub-questions`);
      return validatedDecomposition;

    } catch (error) {
      console.error('❌ Decomposition failed:', error);
      
      // Fallback to simple heuristic decomposition
      return this.heuristicDecomposition(complexQuery, course);
    }
  }

  /**
   * Execute sub-queries in dependency order and synthesize results
   */
  async executeSubqueries(
    decomposition: SubqueryDecomposition,
    course: 'nodejs' | 'python'
  ): Promise<SubqueryResults> {
    const startTime = Date.now();
    console.log(`🚀 Executing ${decomposition.subqueries.length} sub-queries in dependency order`);

    const results: SubqueryResult[] = [];
    const completedQueries = new Set<number>();

    try {
      // Execute in dependency order
      for (const queryIndex of decomposition.executionOrder) {
        const subquery = decomposition.subqueries[queryIndex];
        console.log(`📋 Executing sub-query ${queryIndex}: "${subquery}"`);

        // Check dependencies
        const dependencies = decomposition.dependencies[queryIndex] || [];
        const canExecute = dependencies.every(dep => completedQueries.has(dep));

        if (!canExecute) {
          console.error(`❌ Dependencies not met for subquery ${queryIndex}: needs ${dependencies}`);
          throw new Error(`Dependencies not met for subquery ${queryIndex}`);
        }

        // Gather context from previous results
        const context = dependencies
          .map(dep => results[dep])
          .filter(Boolean)
          .map(r => `Previous context: ${r.result.slice(0, 200)}...`)
          .join('\n\n');

        // Execute subquery with context
        const subqueryResult = await this.executeWithContext(
          subquery,
          context,
          course,
          queryIndex
        );

        results[queryIndex] = {
          ...subqueryResult,
          dependencies,
          executionOrder: queryIndex
        };

        completedQueries.add(queryIndex);
        console.log(`✅ Completed sub-query ${queryIndex} with confidence ${subqueryResult.confidence.toFixed(2)}`);
      }

      // Synthesize final comprehensive answer
      const synthesizedAnswer = await this.synthesizeResults(
        decomposition.subqueries[0], // Use first subquery as base
        results.filter(Boolean),
        course
      );

      const processingTime = Date.now() - startTime;
      const overallConfidence = results.length > 0 
        ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
        : 0.5;

      const finalResults: SubqueryResults = {
        subqueryResults: results.filter(Boolean),
        synthesizedAnswer,
        totalSubqueries: decomposition.subqueries.length,
        processingTime,
        overallConfidence
      };

      console.log(`🎯 Synthesis complete in ${processingTime}ms, overall confidence: ${overallConfidence.toFixed(2)}`);
      return finalResults;

    } catch (error) {
      console.error('❌ Subquery execution failed:', error);
      
      // Return partial results if available
      return {
        subqueryResults: results.filter(Boolean),
        synthesizedAnswer: 'Partial results available due to execution error.',
        totalSubqueries: decomposition.subqueries.length,
        processingTime: Date.now() - startTime,
        overallConfidence: 0.3
      };
    }
  }

  /**
   * Execute a single subquery with context from previous results
   */
  private async executeWithContext(
    subquery: string,
    context: string,
    course: 'nodejs' | 'python',
    queryIndex: number
  ): Promise<Omit<SubqueryResult, 'dependencies' | 'executionOrder'>> {
    // Search for relevant content
    const sources = await qdrantRAG.search(subquery, 5, course);
    
    // Generate answer using sources and context
    const answerPrompt = `You are an expert ${course} instructor answering a focused question.

SUB-QUESTION: "${subquery}"
COURSE: ${course.toUpperCase()}

${context ? `PREVIOUS CONTEXT:\n${context}\n` : ''}

RELEVANT SOURCES:
${sources.map((source, i) => 
  `${i + 1}. [${source.metadata.section}] ${source.metadata.timestamp}
  ${source.content.slice(0, 300)}...`
).join('\n\n')}

Provide a clear, focused answer that:
1. Directly addresses the sub-question
2. Uses information from the sources when available
3. Builds upon previous context if provided
4. Is educational and appropriate for learning ${course}
5. Is concise but complete (200-400 words)

Focus only on this specific aspect - other parts will be covered separately.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Using 4o for response generation
        messages: [{ role: 'user', content: answerPrompt }],
        temperature: 0.3,
        max_tokens: 600
      });

      const result = response.choices[0].message.content || 'No answer generated';
      
      // Calculate confidence based on sources and content quality
      const confidence = this.calculateSubqueryConfidence(sources, result);

      return {
        query: subquery,
        result,
        sources,
        confidence
      };

    } catch (error) {
      console.error(`❌ Failed to execute subquery ${queryIndex}:`, error);
      
      return {
        query: subquery,
        result: `Failed to generate answer for: ${subquery}`,
        sources: [],
        confidence: 0.1
      };
    }
  }

  /**
   * Synthesize all subquery results into a comprehensive final answer
   */
  private async synthesizeResults(
    originalQuery: string,
    subqueryResults: SubqueryResult[],
    course: 'nodejs' | 'python'
  ): Promise<string> {
    if (subqueryResults.length === 0) {
      return 'Unable to generate comprehensive answer due to execution errors.';
    }

    if (subqueryResults.length === 1) {
      return subqueryResults[0].result;
    }

    const synthesisPrompt = `You are an expert ${course} instructor creating a comprehensive answer by combining multiple focused responses.

ORIGINAL COMPLEX QUESTION: "${originalQuery}"
COURSE: ${course.toUpperCase()}

SUB-QUESTION RESULTS:
${subqueryResults.map((result, i) => 
  `${i + 1}. Q: "${result.query}"
  A: ${result.result}
  Confidence: ${result.confidence.toFixed(2)}
  Sources: ${result.sources.length} references
  `
).join('\n---\n')}

Create a comprehensive, well-structured answer that:
1. Addresses the original complex question completely
2. Integrates insights from all sub-questions seamlessly
3. Maintains logical flow and coherence
4. Provides practical value for learning ${course}
5. Is educational and engaging
6. Includes relevant examples when available

Structure the response with:
- Clear introduction addressing the main question
- Well-organized body covering all aspects
- Practical examples or code snippets when relevant
- Concluding summary or recommendations

Target length: 500-800 words for comprehensive coverage.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Using 4o for synthesis
        messages: [{ role: 'user', content: synthesisPrompt }],
        temperature: 0.2,
        max_tokens: 1200
      });

      return response.choices[0].message.content || 'Synthesis failed, showing partial results.';

    } catch (error) {
      console.error('❌ Result synthesis failed:', error);
      
      // Fallback: concatenate results with headers
      return subqueryResults.map(result => 
        `## ${result.query}\n\n${result.result}`
      ).join('\n\n---\n\n');
    }
  }

  /**
   * Check if a query is complex enough to warrant decomposition
   */
  private isComplexQuery(query: string): boolean {
    const wordCount = query.trim().split(/\s+/).length;
    
    // Word count threshold
    if (wordCount < this.COMPLEXITY_THRESHOLD) {
      return false;
    }

    // Look for complexity indicators
    const complexityIndicators = [
      'and', 'or', 'but', 'however', 'also', 'additionally',
      'difference between', 'compare', 'versus', 'vs',
      'how to implement', 'step by step', 'complete guide',
      'explain everything', 'all about', 'comprehensive',
      'from scratch', 'end to end', 'full tutorial'
    ];

    const hasComplexityIndicators = complexityIndicators.some(indicator =>
      query.toLowerCase().includes(indicator)
    );

    // Multiple questions in one
    const questionCount = (query.match(/\?/g) || []).length;
    const hasMultipleQuestions = questionCount > 1;

    return hasComplexityIndicators || hasMultipleQuestions;
  }

  /**
   * Validate and clean decomposition results
   */
  private validateDecomposition(
    decomposition: any,
    originalQuery: string
  ): SubqueryDecomposition {
    // Ensure we have valid subqueries
    const subqueries = Array.isArray(decomposition.subqueries) 
      ? decomposition.subqueries.filter((q: string) => q && q.trim().length > 0).slice(0, this.MAX_SUBQUERIES)
      : [originalQuery];

    // Create execution order if missing
    const executionOrder = Array.isArray(decomposition.executionOrder)
      ? decomposition.executionOrder.slice(0, subqueries.length)
      : subqueries.map((_, i) => i);

    // Clean dependencies
    const dependencies = typeof decomposition.dependencies === 'object' && decomposition.dependencies !== null
      ? decomposition.dependencies
      : {};

    return {
      needsDecomposition: subqueries.length > 1,
      subqueries,
      executionOrder,
      dependencies,
      strategy: 'decomposed',
      complexity: decomposition.complexity || 'medium'
    };
  }

  /**
   * Fallback heuristic decomposition when AI decomposition fails
   */
  private heuristicDecomposition(
    complexQuery: string,
    course: 'nodejs' | 'python'
  ): SubqueryDecomposition {
    console.log('🔧 Using heuristic decomposition as fallback');

    const subqueries: string[] = [];
    
    // Basic decomposition patterns
    if (complexQuery.toLowerCase().includes('implement') || complexQuery.toLowerCase().includes('build')) {
      subqueries.push(
        `What are the basic concepts needed for: ${complexQuery.replace(/how to |implement |build /gi, '')}`,
        `How to implement ${complexQuery.replace(/how to |implement |build /gi, '')} in ${course}`,
        `Best practices for ${complexQuery.replace(/how to |implement |build /gi, '')} in ${course}`
      );
    } else if (complexQuery.toLowerCase().includes('difference') || complexQuery.toLowerCase().includes('compare')) {
      const topics = complexQuery.split(/\b(?:and|vs|versus|compared to)\b/i);
      if (topics.length >= 2) {
        subqueries.push(
          `What is ${topics[0].trim()}?`,
          `What is ${topics[1].trim()}?`,
          `How do ${topics[0].trim()} and ${topics[1].trim()} compare?`
        );
      }
    } else {
      // Generic decomposition
      subqueries.push(
        `Basic concepts: ${complexQuery}`,
        `Implementation details: ${complexQuery}`,
        `Examples and best practices: ${complexQuery}`
      );
    }

    return {
      needsDecomposition: true,
      subqueries: subqueries.slice(0, 3),
      executionOrder: [0, 1, 2],
      dependencies: { 1: [0], 2: [0, 1] },
      strategy: 'decomposed',
      complexity: 'medium'
    };
  }

  /**
   * Calculate confidence for a subquery result
   */
  private calculateSubqueryConfidence(
    sources: QdrantSearchResult[],
    result: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Source quality
    if (sources.length > 0) {
      const avgSourceScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length;
      confidence += avgSourceScore * 0.3;
    }

    // Result length (reasonable length indicates completeness)
    const wordCount = result.split(/\s+/).length;
    if (wordCount >= 50 && wordCount <= 500) {
      confidence += 0.1;
    }

    // Has specific technical content
    if (/\b(function|class|method|variable|import|export|async|await)\b/i.test(result)) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Get decomposer system statistics
   */
  getStats() {
    return {
      complexityThreshold: this.COMPLEXITY_THRESHOLD,
      maxSubqueries: this.MAX_SUBQUERIES,
      features: [
        'complexity_analysis',
        'intelligent_decomposition', 
        'dependency_resolution',
        'context_preservation',
        'result_synthesis'
      ]
    };
  }
}

export const subqueryDecomposer = new SubqueryDecomposer();
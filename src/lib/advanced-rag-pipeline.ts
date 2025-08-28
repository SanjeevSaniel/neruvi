import OpenAI from 'openai';
import { correctiveRAG } from './corrective-rag';
import { queryRewriter } from './query-rewriter';
import { llmJudge } from './llm-judge';
import { subqueryDecomposer } from './subquery-decomposition';
import { hydeEnhanced } from './hyde-enhanced';
import { qdrantRAG } from './qdrant-rag';
import type { Message } from '@/components/chat/types';
import type { CRAGResult } from './corrective-rag';
import type { QueryRewriteResult } from './query-rewriter';
import type { ResponseEvaluation } from './llm-judge';
import type { SubqueryResults } from './subquery-decomposition';
import type { EnhancedHydeResult } from './hyde-enhanced';
import type { QdrantSearchResult } from './qdrant-rag';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface UserContext {
  userId?: string;
  technicalLevel: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'theoretical' | 'practical' | 'balanced';
  previousQueries: string[];
  courseFocus: 'nodejs' | 'python';
}

export interface AdvancedRAGResult {
  originalQuery: string;
  finalResponse: string;
  processingSteps: string[];
  metadata: {
    processingTime: number;
    totalSources: number;
    confidenceScore: number;
    techniquesUsed: string[];
    tokensUsed: number;
  };
  
  // Component results
  queryVariants?: string[];
  hydeDocuments?: any[];
  subqueryResults?: any[];
  retrievedDocuments?: QdrantSearchResult[];
  evaluation?: ResponseEvaluation;
  correctionApplied?: boolean;
  
  // Query analysis
  isComplexQuery?: boolean;
  queryType: 'simple' | 'complex' | 'decomposed';
}

export interface PipelineConfig {
  enableCorrectiveRAG: boolean;
  enableQueryRewriting: boolean;  
  enableLLMJudge: boolean;
  enableSubqueryDecomposition: boolean;
  enableEnhancedHyDE: boolean;
  qualityThreshold: number;
  maxRetries: number;
}

export class AdvancedRAGPipeline {
  private readonly defaultConfig: PipelineConfig = {
    enableCorrectiveRAG: true,
    enableQueryRewriting: true,
    enableLLMJudge: true,
    enableSubqueryDecomposition: true,
    enableEnhancedHyDE: true,
    qualityThreshold: 0.75,
    maxRetries: 2
  };

  /**
   * Main pipeline method - processes queries using all advanced RAG techniques
   */
  async processQuery(
    originalQuery: string,
    course: 'nodejs' | 'python',
    conversationHistory: Message[] = [],
    userContext?: Partial<UserContext>,
    config?: Partial<PipelineConfig>
  ): Promise<AdvancedRAGResult> {
    const startTime = Date.now();
    const pipelineConfig = { ...this.defaultConfig, ...config };
    const processingSteps: string[] = [];
    const techniquesUsed: string[] = [];
    let tokensUsed = 0;

    console.log(`🚀 Advanced RAG Pipeline: Starting processing for: "${originalQuery}"`);

    try {
      // Step 1: Query Analysis and Decomposition Check
      processingSteps.push('query_analysis');
      const needsDecomposition = pipelineConfig.enableSubqueryDecomposition && 
        await this.shouldDecomposeQuery(originalQuery, course);

      if (needsDecomposition) {
        console.log('🧩 Complex query detected, using decomposition strategy');
        techniquesUsed.push('subquery_decomposition');
        return await this.handleComplexQuery(
          originalQuery, 
          course, 
          conversationHistory,
          userContext,
          pipelineConfig,
          processingSteps,
          techniquesUsed,
          startTime
        );
      }

      // Step 2: Simple/Medium complexity query processing
      console.log('📝 Processing as simple/medium complexity query');
      return await this.handleSimpleQuery(
        originalQuery,
        course,
        conversationHistory,
        userContext,
        pipelineConfig,
        processingSteps,
        techniquesUsed,
        startTime
      );

    } catch (error) {
      console.error('❌ Advanced RAG Pipeline failed:', error);
      
      // Fallback to basic RAG
      return await this.handleFallback(
        originalQuery,
        course,
        processingSteps,
        techniquesUsed,
        startTime
      );
    }
  }

  /**
   * Handle complex queries using decomposition
   */
  private async handleComplexQuery(
    originalQuery: string,
    course: 'nodejs' | 'python',
    conversationHistory: Message[],
    userContext?: Partial<UserContext>,
    config?: PipelineConfig,
    processingSteps: string[] = [],
    techniquesUsed: string[] = [],
    startTime: number = Date.now()
  ): Promise<AdvancedRAGResult> {
    
    // Step 1: Decompose the complex query
    processingSteps.push('subquery_decomposition');
    const decomposition = await subqueryDecomposer.decomposeQuery(originalQuery, course);
    
    if (!decomposition.needsDecomposition) {
      // Fallback to simple processing
      return this.handleSimpleQuery(
        originalQuery, course, conversationHistory, 
        userContext, config, processingSteps, techniquesUsed, startTime
      );
    }

    // Step 2: Execute subqueries with advanced techniques
    processingSteps.push('subquery_execution');
    const subqueryResults = await subqueryDecomposer.executeSubqueries(decomposition, course);
    
    // Step 3: Apply quality evaluation to synthesized result
    let finalResponse = subqueryResults.synthesizedAnswer;
    let evaluation: ResponseEvaluation | undefined;

    if (config?.enableLLMJudge) {
      processingSteps.push('quality_evaluation');
      techniquesUsed.push('llm_judge');
      
      // Collect all sources from subqueries
      const allSources = subqueryResults.subqueryResults.flatMap(r => r.sources);
      
      evaluation = await llmJudge.evaluateResponse(
        originalQuery,
        finalResponse,
        allSources,
        course
      );

      // Improve response if quality is below threshold
      if (!evaluation.passesThreshold && config?.qualityThreshold) {
        processingSteps.push('response_improvement');
        finalResponse = await llmJudge.generateImprovedResponse(
          finalResponse,
          evaluation,
          originalQuery,
          allSources,
          course
        );
      }
    }

    const processingTime = Date.now() - startTime;
    const allSources = subqueryResults.subqueryResults.flatMap(r => r.sources);

    return {
      originalQuery,
      finalResponse,
      processingSteps,
      queryType: 'decomposed',
      isComplexQuery: true,
      subqueryResults: subqueryResults.subqueryResults,
      retrievedDocuments: allSources.slice(0, 10), // Top 10 sources
      evaluation,
      metadata: {
        processingTime,
        totalSources: allSources.length,
        confidenceScore: subqueryResults.overallConfidence,
        techniquesUsed,
        tokensUsed: this.estimateTokenUsage(originalQuery, finalResponse)
      }
    };
  }

  /**
   * Handle simple to medium complexity queries
   */
  private async handleSimpleQuery(
    originalQuery: string,
    course: 'nodejs' | 'python',
    conversationHistory: Message[],
    userContext?: Partial<UserContext>,
    config?: PipelineConfig,
    processingSteps: string[] = [],
    techniquesUsed: string[] = [],
    startTime: number = Date.now()
  ): Promise<AdvancedRAGResult> {

    let queryVariants: string[] = [];
    let hydeResult: EnhancedHydeResult | undefined;
    let cragResults: CRAGResult[] = [];

    // Step 1: Query Rewriting (if enabled)
    if (config?.enableQueryRewriting) {
      processingSteps.push('query_rewriting');
      techniquesUsed.push('multi_strategy_rewriting');
      
      const rewriteResult = await queryRewriter.rewriteQuery(
        originalQuery,
        course,
        conversationHistory
      );
      queryVariants = rewriteResult.rewritten;
      console.log(`✍️ Generated ${queryVariants.length} query variants`);
    }

    // Step 2: Enhanced HyDE (if enabled)  
    if (config?.enableEnhancedHyDE) {
      processingSteps.push('hyde_generation');
      techniquesUsed.push('enhanced_hyde');
      
      try {
        hydeResult = await hydeEnhanced.generateEnhancedHyde(originalQuery, course);
        console.log('🧠 HyDE hypothetical documents generated');
      } catch (error) {
        console.error('❌ HyDE generation failed:', error);
      }
    }

    // Step 3: Corrective RAG Retrieval (if enabled)
    if (config?.enableCorrectiveRAG) {
      processingSteps.push('corrective_retrieval');
      techniquesUsed.push('corrective_rag');
      
      // Apply CRAG to original query and variants
      const queriesToSearch = [originalQuery, ...queryVariants.slice(0, 3)];
      cragResults = await Promise.all(
        queriesToSearch.map(query => 
          correctiveRAG.searchWithCorrection(query, course)
        )
      );
      console.log(`🔄 CRAG applied to ${cragResults.length} query variants`);
    } else {
      // Fallback to basic search
      processingSteps.push('basic_retrieval');
      const basicResults = await qdrantRAG.search(originalQuery, 10, course);
      cragResults = [{
        documents: basicResults,
        confidence: 0.7,
        correctionApplied: false,
        retrievalAttempts: 1,
        originalQuery,
        finalQuery: originalQuery,
        corrections: []
      }];
    }

    // Step 4: Combine and Deduplicate Results
    processingSteps.push('result_combination');
    const allDocuments = this.combineAndDeduplicateResults(cragResults, hydeResult);
    const topDocuments = allDocuments.slice(0, 8); // Use top 8 sources

    // Step 5: Generate Response
    processingSteps.push('response_generation');
    let finalResponse = await this.generateResponse(
      originalQuery,
      topDocuments,
      course,
      userContext
    );

    // Step 6: Quality Evaluation and Improvement (if enabled)
    let evaluation: ResponseEvaluation | undefined;
    if (config?.enableLLMJudge) {
      processingSteps.push('quality_evaluation');
      techniquesUsed.push('llm_judge');
      
      evaluation = await llmJudge.evaluateResponse(
        originalQuery,
        finalResponse,
        topDocuments,
        course
      );

      // Improve response if needed
      if (!evaluation.passesThreshold && config?.qualityThreshold) {
        processingSteps.push('response_improvement');
        console.log(`🔧 Response quality ${evaluation.overallScore.toFixed(2)} below threshold, improving...`);
        
        finalResponse = await llmJudge.generateImprovedResponse(
          finalResponse,
          evaluation,
          originalQuery,
          topDocuments,
          course
        );

        // Re-evaluate improved response
        evaluation = await llmJudge.evaluateResponse(
          originalQuery,
          finalResponse,
          topDocuments,
          course
        );
      }
    }

    const processingTime = Date.now() - startTime;
    const correctionApplied = cragResults.some(r => r.correctionApplied);

    return {
      originalQuery,
      finalResponse,
      processingSteps,
      queryType: 'simple',
      queryVariants,
      hydeDocuments: hydeResult?.query.hypotheticalAnswers,
      retrievedDocuments: topDocuments,
      evaluation,
      correctionApplied,
      metadata: {
        processingTime,
        totalSources: allDocuments.length,
        confidenceScore: evaluation?.overallScore || 0.7,
        techniquesUsed,
        tokensUsed: this.estimateTokenUsage(originalQuery, finalResponse)
      }
    };
  }

  /**
   * Determine if a query needs decomposition
   */
  private async shouldDecomposeQuery(
    query: string,
    course: 'nodejs' | 'python'
  ): Promise<boolean> {
    const wordCount = query.trim().split(/\s+/).length;
    
    // Quick heuristics
    if (wordCount < 8) return false;
    
    const complexityIndicators = [
      'and', 'also', 'additionally', 'furthermore',
      'difference between', 'compare', 'versus', 'vs',
      'step by step', 'complete guide', 'everything about',
      'how to implement and', 'what are all the'
    ];

    return complexityIndicators.some(indicator =>
      query.toLowerCase().includes(indicator)
    );
  }

  /**
   * Combine and deduplicate results from different sources
   */
  private combineAndDeduplicateResults(
    cragResults: CRAGResult[],
    hydeResult?: EnhancedHydeResult
  ): QdrantSearchResult[] {
    const allDocuments: QdrantSearchResult[] = [];
    const seenContent = new Set<string>();

    // Add CRAG results
    cragResults.forEach(cragResult => {
      cragResult.documents.forEach(doc => {
        const contentKey = `${doc.metadata.videoId}-${Math.floor(doc.metadata.startTime)}`;
        if (!seenContent.has(contentKey)) {
          seenContent.add(contentKey);
          allDocuments.push({
            ...doc,
            score: doc.score * (cragResult.confidence || 1) // Boost by CRAG confidence
          });
        }
      });
    });

    // Add HyDE results (if any)
    if (hydeResult?.retrievedDocuments) {
      hydeResult.retrievedDocuments.forEach((doc: any) => {
        if (doc.metadata) {
          const contentKey = `${doc.metadata.videoId}-${Math.floor(doc.metadata.startTime)}`;
          if (!seenContent.has(contentKey)) {
            seenContent.add(contentKey);
            allDocuments.push(doc);
          }
        }
      });
    }

    // Sort by score and return top results
    return allDocuments
      .sort((a, b) => b.score - a.score)
      .slice(0, 15); // Keep top 15 before final selection
  }

  /**
   * Generate response using retrieved documents
   */
  private async generateResponse(
    query: string,
    sources: QdrantSearchResult[],
    course: 'nodejs' | 'python',
    userContext?: Partial<UserContext>
  ): Promise<string> {
    const contextLevel = userContext?.technicalLevel || 'intermediate';
    const learningStyle = userContext?.learningStyle || 'balanced';

    const systemPrompt = `You are FlowMind, an expert ${course} programming tutor. Provide comprehensive, detailed explanations based on course materials.

USER CONTEXT:
- Technical Level: ${contextLevel}
- Learning Style: ${learningStyle}
- Course Focus: ${course.toUpperCase()}

QUERY: "${query}"

RELEVANT COURSE MATERIALS:
${sources.map((source, i) => 
  `## Source ${i + 1}: ${source.metadata.section} (${source.metadata.timestamp})
${source.content.trim()}`
).join('\n\n---\n\n')}

INSTRUCTIONS:
- Provide comprehensive, step-by-step explanations based on course materials
- Include practical examples and code snippets from the sources
- Explain concepts thoroughly with proper ${course} context
- Reference timestamps naturally (e.g., "at 5:23, the instructor explains...")
- Break down complex topics into digestible parts
- Provide detailed implementation guidance when available
- Include best practices and common pitfalls from the courses
- Target ${contextLevel} level understanding
- Emphasize ${learningStyle === 'practical' ? 'hands-on examples' : learningStyle === 'theoretical' ? 'conceptual understanding' : 'balanced theory and practice'}
- Aim for detailed, educational responses (400-800 words for complex topics)
- Use exact terminology from course content
- Connect related concepts when covered in multiple sources

Focus on providing excellent educational value for learning ${course}.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Using GPT-4o for core response generation
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      return response.choices[0].message.content || 'Unable to generate response';

    } catch (error) {
      console.error('❌ Response generation failed:', error);
      return `I apologize, but I encountered an error generating a comprehensive response for your ${course} question. Please try rephrasing your question or ask about a specific aspect.`;
    }
  }

  /**
   * Fallback to basic RAG when advanced pipeline fails
   */
  private async handleFallback(
    originalQuery: string,
    course: 'nodejs' | 'python',
    processingSteps: string[],
    techniquesUsed: string[],
    startTime: number
  ): Promise<AdvancedRAGResult> {
    console.log('🔄 Using fallback basic RAG');
    processingSteps.push('fallback_retrieval');
    techniquesUsed.push('basic_rag');

    try {
      const sources = await qdrantRAG.search(originalQuery, 5, course);
      const response = await this.generateResponse(originalQuery, sources, course);
      
      return {
        originalQuery,
        finalResponse: response,
        processingSteps,
        queryType: 'simple',
        retrievedDocuments: sources,
        metadata: {
          processingTime: Date.now() - startTime,
          totalSources: sources.length,
          confidenceScore: 0.6,
          techniquesUsed,
          tokensUsed: this.estimateTokenUsage(originalQuery, response)
        }
      };
    } catch (error) {
      console.error('❌ Fallback also failed:', error);
      
      return {
        originalQuery,
        finalResponse: `I apologize, but I'm unable to provide a comprehensive answer to your ${course} question at the moment. Please try asking about a specific concept or check if the question contains any technical terms I might have missed.`,
        processingSteps: [...processingSteps, 'error_fallback'],
        queryType: 'simple',
        metadata: {
          processingTime: Date.now() - startTime,
          totalSources: 0,
          confidenceScore: 0.1,
          techniquesUsed,
          tokensUsed: 100
        }
      };
    }
  }

  /**
   * Estimate token usage for cost tracking
   */
  private estimateTokenUsage(query: string, response: string): number {
    // Rough estimation: ~4 characters per token for English
    return Math.ceil((query.length + response.length) / 4);
  }

  /**
   * Get pipeline statistics and configuration
   */
  getStats() {
    return {
      components: [
        'corrective_rag',
        'query_rewriter', 
        'llm_judge',
        'subquery_decomposer',
        'enhanced_hyde'
      ],
      capabilities: [
        'complex_query_decomposition',
        'multi_strategy_retrieval',
        'quality_evaluation',
        'response_improvement',
        'contextual_adaptation'
      ],
      defaultConfig: this.defaultConfig
    };
  }
}

export const advancedRAGPipeline = new AdvancedRAGPipeline();
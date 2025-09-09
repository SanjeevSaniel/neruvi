import OpenAI from 'openai';
import { qdrantRAG } from './qdrant-rag';
import type { QdrantSearchResult } from './qdrant-rag';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface CRAGResult {
  documents: QdrantSearchResult[];
  confidence: number;
  correctionApplied: boolean;
  retrievalAttempts: number;
  originalQuery: string;
  finalQuery: string;
  corrections: string[];
}

export interface RelevanceEvaluation {
  documentScores: number[];
  averageRelevance: number;
  feedback: string;
  suggestedRefinements: string[];
  needsCorrection: boolean;
}

export class CorrectiveRAG {
  private readonly MIN_CONFIDENCE = 0.7;
  private readonly MAX_ATTEMPTS = 3;

  /**
   * Main CRAG method - searches with automatic correction if needed
   */
  async searchWithCorrection(
    query: string,
    course: 'nodejs' | 'python',
    maxAttempts: number = this.MAX_ATTEMPTS
  ): Promise<CRAGResult> {
    console.log(`🔄 CRAG: Starting corrective search for: "${query}"`);
    
    let attempts = 0;
    let documents: QdrantSearchResult[] = [];
    let confidence = 0;
    let currentQuery = query;
    const corrections: string[] = [];
    const originalQuery = query;

    while (attempts < maxAttempts && confidence < this.MIN_CONFIDENCE) {
      attempts++;
      console.log(`🔍 CRAG: Attempt ${attempts}/${maxAttempts} with query: "${currentQuery}"`);

      try {
        // Step 1: Perform initial retrieval
        documents = await qdrantRAG.search(currentQuery, 10, course);
        
        if (documents.length === 0) {
          console.log('⚠️ CRAG: No documents found, trying query expansion');
          currentQuery = await this.expandQuery(currentQuery, course);
          corrections.push(`Expanded query (no results): "${currentQuery}"`);
          continue;
        }

        // Step 2: Evaluate relevance using LLM-as-a-Judge
        const evaluation = await this.evaluateRelevance(currentQuery, documents, course);
        confidence = evaluation.averageRelevance;
        
        console.log(`📊 CRAG: Confidence score: ${confidence.toFixed(2)} (threshold: ${this.MIN_CONFIDENCE})`);

        if (confidence >= this.MIN_CONFIDENCE) {
          console.log('✅ CRAG: Acceptable confidence reached');
          break;
        }

        if (attempts >= maxAttempts) {
          console.log('⚠️ CRAG: Max attempts reached, using best available results');
          break;
        }

        // Step 3: Apply corrections based on evaluation
        const correctedQuery = await this.correctQuery(
          originalQuery, 
          currentQuery, 
          evaluation, 
          course
        );
        
        if (correctedQuery !== currentQuery) {
          corrections.push(`Refined query: "${correctedQuery}" (confidence was ${confidence.toFixed(2)})`);
          currentQuery = correctedQuery;
        } else {
          console.log('⚠️ CRAG: No query correction suggested, breaking loop');
          break;
        }

      } catch (error) {
        console.error(`❌ CRAG: Error in attempt ${attempts}:`, error);
        break;
      }
    }

    const result: CRAGResult = {
      documents,
      confidence,
      correctionApplied: attempts > 1,
      retrievalAttempts: attempts,
      originalQuery,
      finalQuery: currentQuery,
      corrections
    };

    console.log(`🏁 CRAG: Completed with ${attempts} attempts, final confidence: ${confidence.toFixed(2)}`);
    return result;
  }

  /**
   * Evaluate the relevance of retrieved documents using LLM-as-a-Judge
   */
  private async evaluateRelevance(
    query: string,
    documents: QdrantSearchResult[],
    course: 'nodejs' | 'python'
  ): Promise<RelevanceEvaluation> {
    if (documents.length === 0) {
      return {
        documentScores: [],
        averageRelevance: 0,
        feedback: 'No documents to evaluate',
        suggestedRefinements: ['Try broader terms', 'Check spelling'],
        needsCorrection: true
      };
    }

    const prompt = `You are an expert ${course} instructor evaluating search result relevance.

QUERY: "${query}"
COURSE: ${course.toUpperCase()}

DOCUMENTS:
${documents.map((doc, i) => 
  `${i + 1}. [${doc.metadata.course}] ${doc.metadata.section} (${doc.metadata.timestamp})
  Content: ${doc.content.slice(0, 300)}...
  Current Score: ${doc.score.toFixed(2)}`
).join('\n\n')}

Evaluate each document's relevance to the query (0-1 scale):
- 1.0: Perfect match, directly answers the query
- 0.8: Very relevant, covers most aspects  
- 0.6: Moderately relevant, related content
- 0.4: Somewhat relevant, tangentially related
- 0.2: Minimally relevant, mentions topic
- 0.0: Not relevant, unrelated content

Consider:
1. Direct relevance to the specific question asked
2. Technical accuracy for ${course} context
3. Completeness of information provided
4. Educational value for learning ${course}

Respond in JSON format:
{
  "documentScores": [0.8, 0.6, 0.9, 0.4],
  "averageRelevance": 0.68,
  "feedback": "Results are moderately relevant but lack specific implementation details",
  "suggestedRefinements": ["Add implementation keywords", "Specify ${course} context"],
  "needsCorrection": true
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using 4o-mini for evaluation tasks
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response content');
      }

      const evaluation = JSON.parse(content);
      
      // Ensure we have valid scores
      if (!evaluation.documentScores || !Array.isArray(evaluation.documentScores)) {
        evaluation.documentScores = documents.map(() => 0.5);
      }

      // Calculate average if not provided or invalid
      if (typeof evaluation.averageRelevance !== 'number') {
        evaluation.averageRelevance = evaluation.documentScores.reduce((sum: number, score: number) => sum + score, 0) / evaluation.documentScores.length;
      }

      return {
        documentScores: evaluation.documentScores,
        averageRelevance: evaluation.averageRelevance,
        feedback: evaluation.feedback || 'No feedback provided',
        suggestedRefinements: evaluation.suggestedRefinements || [],
        needsCorrection: evaluation.averageRelevance < this.MIN_CONFIDENCE
      };

    } catch (error) {
      console.error('❌ CRAG: Relevance evaluation failed:', error);
      
      // Fallback evaluation based on search scores
      const scores = documents.map(doc => Math.min(1.0, doc.score * 1.5)); // Boost search scores
      const avgRelevance = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      return {
        documentScores: scores,
        averageRelevance: avgRelevance,
        feedback: 'Fallback evaluation based on search scores',
        suggestedRefinements: ['Add more specific terms', 'Include technical keywords'],
        needsCorrection: avgRelevance < this.MIN_CONFIDENCE
      };
    }
  }

  /**
   * Generate corrected query based on evaluation feedback
   */
  private async correctQuery(
    originalQuery: string,
    currentQuery: string,
    evaluation: RelevanceEvaluation,
    course: 'nodejs' | 'python'
  ): Promise<string> {
    if (!evaluation.needsCorrection || evaluation.suggestedRefinements.length === 0) {
      return currentQuery;
    }

    const prompt = `You are a search query optimization expert for ${course} programming education.

ORIGINAL QUERY: "${originalQuery}"
CURRENT QUERY: "${currentQuery}"
COURSE: ${course.toUpperCase()}

EVALUATION FEEDBACK: ${evaluation.feedback}
SUGGESTED REFINEMENTS: ${evaluation.suggestedRefinements.join(', ')}
AVERAGE RELEVANCE: ${evaluation.averageRelevance.toFixed(2)} (needs improvement)

Generate an improved search query that addresses the feedback and refinements.

Guidelines:
1. Keep the core intent of the original query
2. Add specific ${course} technical terms when relevant
3. Make the query more precise and focused
4. Include context that would help find better educational content
5. Don't make the query overly complex or long

Examples of good corrections:
- "functions" → "function definition and parameters in ${course}"
- "loops" → "for loop and while loop syntax examples in ${course}"
- "async" → "async/await pattern implementation in ${course}"

Return only the improved query text (no quotes or explanation).`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 100
      });

      const correctedQuery = response.choices[0].message.content?.trim();
      
      if (correctedQuery && correctedQuery !== currentQuery && correctedQuery.length > 0) {
        console.log(`🔧 CRAG: Query corrected to: "${correctedQuery}"`);
        return correctedQuery;
      }

      return currentQuery;

    } catch (error) {
      console.error('❌ CRAG: Query correction failed:', error);
      return currentQuery;
    }
  }

  /**
   * Expand query when no results are found
   */
  private async expandQuery(
    query: string,
    course: 'nodejs' | 'python'
  ): Promise<string> {
    const prompt = `Expand this ${course} programming query to be broader and more likely to find educational content:

ORIGINAL: "${query}"
COURSE: ${course.toUpperCase()}

Make it more general while keeping the core concept. Add related terms and synonyms.

Examples:
- "express middleware" → "express middleware functions request response"
- "python classes" → "python class object oriented programming"
- "async functions" → "asynchronous programming async await functions"

Return only the expanded query (no quotes or explanation).`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 50
      });

      const expandedQuery = response.choices[0].message.content?.trim();
      return expandedQuery || query;

    } catch (error) {
      console.error('❌ CRAG: Query expansion failed:', error);
      // Simple fallback expansion
      return `${query} programming tutorial example`;
    }
  }

  /**
   * Get CRAG system statistics
   */
  getStats() {
    return {
      minConfidenceThreshold: this.MIN_CONFIDENCE,
      maxAttempts: this.MAX_ATTEMPTS,
      features: [
        'relevance_evaluation',
        'query_correction',
        'query_expansion',
        'iterative_improvement'
      ]
    };
  }
}

export const correctiveRAG = new CorrectiveRAG();
import OpenAI from 'openai';
import type { QdrantSearchResult } from './qdrant-rag';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface JudgmentCriteria {
  accuracy: number;      // 0-1: Factual correctness
  relevance: number;     // 0-1: Query relevance
  completeness: number;  // 0-1: Answer completeness
  clarity: number;       // 0-1: Explanation clarity
  helpfulness: number;   // 0-1: Educational value
}

export interface ResponseEvaluation {
  scores: JudgmentCriteria;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  missingInfo: string[];
  confidence: number;
  passesThreshold: boolean;
}

export interface ComparisonResult {
  winner: 'response_a' | 'response_b' | 'tie';
  confidence: number;
  reasoning: string;
  scoreA: number;
  scoreB: number;
}

export class LLMJudge {
  private readonly QUALITY_THRESHOLD = 0.7;
  private readonly HIGH_QUALITY_THRESHOLD = 0.85;

  /**
   * Comprehensive evaluation of a response against multiple criteria
   */
  async evaluateResponse(
    query: string,
    response: string,
    sources: QdrantSearchResult[],
    course: 'nodejs' | 'python'
  ): Promise<ResponseEvaluation> {
    console.log(`⚖️ LLM Judge: Evaluating response for query: "${query.slice(0, 50)}..."`);

    const evaluationPrompt = `You are an expert ${course} instructor and educational content evaluator.

STUDENT QUERY: "${query}"
AI RESPONSE: "${response}"
COURSE CONTEXT: ${course.toUpperCase()}

SOURCE MATERIALS USED:
${sources.map((source, i) => 
  `${i + 1}. [${source.metadata.section}] ${source.metadata.timestamp}
  Content: ${source.content.slice(0, 200)}...
  Relevance: ${(source.score * 100).toFixed(0)}%`
).join('\n\n')}

Evaluate the AI response across these dimensions (0-1 scale):

1. ACCURACY (0-1): Is the information factually correct and technically accurate?
   - 1.0: Completely accurate, no errors
   - 0.8: Mostly accurate, minor issues
   - 0.6: Generally accurate, some concerns
   - 0.4: Mixed accuracy, notable errors
   - 0.2: Largely inaccurate
   - 0.0: Completely wrong

2. RELEVANCE (0-1): Does it directly address the student's query?
   - 1.0: Perfectly addresses the question
   - 0.8: Addresses most aspects well
   - 0.6: Addresses the main point
   - 0.4: Partially relevant
   - 0.2: Tangentially related
   - 0.0: Off-topic

3. COMPLETENESS (0-1): Is the answer thorough and complete?
   - 1.0: Comprehensive, covers all aspects
   - 0.8: Covers most important points
   - 0.6: Adequate coverage
   - 0.4: Missing key information
   - 0.2: Incomplete
   - 0.0: Severely lacking

4. CLARITY (0-1): Is the explanation clear and well-structured?
   - 1.0: Crystal clear, excellent structure
   - 0.8: Very clear, good organization
   - 0.6: Generally clear
   - 0.4: Somewhat unclear
   - 0.2: Confusing
   - 0.0: Incomprehensible

5. HELPFULNESS (0-1): Is it educationally valuable for learning ${course}?
   - 1.0: Excellent educational value
   - 0.8: Very helpful for learning
   - 0.6: Reasonably helpful
   - 0.4: Somewhat helpful
   - 0.2: Limited value
   - 0.0: Not helpful

Also identify:
- STRENGTHS: What the response does well
- WEAKNESSES: Areas that need improvement
- IMPROVEMENTS: Specific suggestions for enhancement
- MISSING INFO: Important information that should be included

Respond in JSON format:
{
  "scores": {
    "accuracy": 0.85,
    "relevance": 0.90,
    "completeness": 0.75,
    "clarity": 0.88,
    "helpfulness": 0.82
  },
  "overallScore": 0.84,
  "strengths": ["Clear explanation", "Good examples", "Proper technical terms"],
  "weaknesses": ["Missing error handling", "Could use more examples"],
  "improvements": ["Add practical examples", "Explain edge cases", "Include best practices"],
  "missingInfo": ["Security considerations", "Performance implications", "Common pitfalls"],
  "confidence": 0.9
}`;

    try {
      const response_eval = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using 4o-mini for evaluation tasks
        messages: [{ role: 'user', content: evaluationPrompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response_eval.choices[0].message.content;
      if (!content) {
        throw new Error('No evaluation response');
      }

      const evaluation = JSON.parse(content);
      
      // Ensure we have valid scores
      const scores: JudgmentCriteria = {
        accuracy: this.validateScore(evaluation.scores?.accuracy),
        relevance: this.validateScore(evaluation.scores?.relevance),
        completeness: this.validateScore(evaluation.scores?.completeness),
        clarity: this.validateScore(evaluation.scores?.clarity),
        helpfulness: this.validateScore(evaluation.scores?.helpfulness)
      };

      // Calculate overall score if not provided
      const overallScore = evaluation.overallScore || 
        (scores.accuracy + scores.relevance + scores.completeness + scores.clarity + scores.helpfulness) / 5;

      const result: ResponseEvaluation = {
        scores,
        overallScore: this.validateScore(overallScore),
        strengths: evaluation.strengths || [],
        weaknesses: evaluation.weaknesses || [],
        improvements: evaluation.improvements || [],
        missingInfo: evaluation.missingInfo || [],
        confidence: this.validateScore(evaluation.confidence, 0.8),
        passesThreshold: overallScore >= this.QUALITY_THRESHOLD
      };

      console.log(`⚖️ LLM Judge: Overall score ${overallScore.toFixed(2)} (threshold: ${this.QUALITY_THRESHOLD})`);
      return result;

    } catch (error) {
      console.error('❌ LLM Judge: Evaluation failed:', error);
      
      // Fallback evaluation
      return this.createFallbackEvaluation();
    }
  }

  /**
   * Generate improved response based on evaluation feedback
   */
  async generateImprovedResponse(
    originalResponse: string,
    evaluation: ResponseEvaluation,
    query: string,
    sources: QdrantSearchResult[],
    course: 'nodejs' | 'python'
  ): Promise<string> {
    if (evaluation.passesThreshold) {
      console.log('✅ LLM Judge: Response already passes threshold, no improvement needed');
      return originalResponse;
    }

    console.log(`🔧 LLM Judge: Generating improved response (current score: ${evaluation.overallScore.toFixed(2)})`);

    const improvementPrompt = `You are an expert ${course} instructor improving an AI response based on detailed feedback.

STUDENT QUERY: "${query}"
ORIGINAL RESPONSE: "${originalResponse}"
COURSE: ${course.toUpperCase()}

EVALUATION FEEDBACK:
- Overall Score: ${evaluation.overallScore.toFixed(2)}/1.0 (needs improvement)
- Accuracy: ${evaluation.scores.accuracy.toFixed(2)}
- Relevance: ${evaluation.scores.relevance.toFixed(2)}
- Completeness: ${evaluation.scores.completeness.toFixed(2)}
- Clarity: ${evaluation.scores.clarity.toFixed(2)}
- Helpfulness: ${evaluation.scores.helpfulness.toFixed(2)}

STRENGTHS TO MAINTAIN: ${evaluation.strengths.join(', ')}
WEAKNESSES TO ADDRESS: ${evaluation.weaknesses.join(', ')}
SPECIFIC IMPROVEMENTS NEEDED: ${evaluation.improvements.join(', ')}
MISSING INFORMATION TO ADD: ${evaluation.missingInfo.join(', ')}

AVAILABLE SOURCE MATERIALS:
${sources.map((source, i) => 
  `${i + 1}. [${source.metadata.section}] ${source.metadata.timestamp}
  ${source.content.slice(0, 400)}...`
).join('\n\n')}

Generate an improved response that:
1. Maintains the strengths of the original
2. Addresses all identified weaknesses
3. Incorporates the missing information
4. Uses the source materials more effectively
5. Provides better examples and explanations
6. Is more helpful for learning ${course}

Focus on making it accurate, complete, clear, and educationally valuable.
Target score: above ${this.QUALITY_THRESHOLD}.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Using 4o for core response generation
        messages: [{ role: 'user', content: improvementPrompt }],
        temperature: 0.3,
        max_tokens: 2000
      });

      const improvedResponse = response.choices[0].message.content;
      
      if (improvedResponse) {
        console.log('✅ LLM Judge: Improved response generated');
        return improvedResponse;
      } else {
        console.log('⚠️ LLM Judge: No improved response generated, returning original');
        return originalResponse;
      }

    } catch (error) {
      console.error('❌ LLM Judge: Response improvement failed:', error);
      return originalResponse;
    }
  }

  /**
   * Compare two responses and determine which is better
   */
  async compareResponses(
    query: string,
    responseA: string,
    responseB: string,
    course: 'nodejs' | 'python'
  ): Promise<ComparisonResult> {
    const comparisonPrompt = `You are an expert ${course} instructor comparing two AI responses.

STUDENT QUERY: "${query}"
COURSE: ${course.toUpperCase()}

RESPONSE A: "${responseA}"

RESPONSE B: "${responseB}"

Compare these responses across:
1. Accuracy and technical correctness
2. Relevance to the query
3. Completeness of the answer
4. Clarity of explanation
5. Educational value for learning ${course}

Determine which response is better and provide reasoning.

Respond in JSON format:
{
  "winner": "response_a", // or "response_b" or "tie"
  "confidence": 0.8,
  "reasoning": "Response A provides clearer examples and better addresses the specific question about...",
  "scoreA": 0.75,
  "scoreB": 0.65
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: comparisonPrompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No comparison response');
      }

      const comparison = JSON.parse(content);

      return {
        winner: comparison.winner || 'tie',
        confidence: this.validateScore(comparison.confidence, 0.5),
        reasoning: comparison.reasoning || 'No reasoning provided',
        scoreA: this.validateScore(comparison.scoreA, 0.5),
        scoreB: this.validateScore(comparison.scoreB, 0.5)
      };

    } catch (error) {
      console.error('❌ LLM Judge: Comparison failed:', error);
      
      return {
        winner: 'tie',
        confidence: 0.3,
        reasoning: 'Comparison failed, treating as tie',
        scoreA: 0.5,
        scoreB: 0.5
      };
    }
  }

  /**
   * Batch evaluate multiple responses
   */
  async batchEvaluate(
    evaluationTasks: Array<{
      query: string;
      response: string;
      sources: QdrantSearchResult[];
      course: 'nodejs' | 'python';
    }>
  ): Promise<ResponseEvaluation[]> {
    console.log(`⚖️ LLM Judge: Batch evaluating ${evaluationTasks.length} responses`);

    const evaluationPromises = evaluationTasks.map(task =>
      this.evaluateResponse(task.query, task.response, task.sources, task.course)
        .catch(error => {
          console.error(`❌ Batch evaluation failed for query "${task.query}":`, error);
          return this.createFallbackEvaluation();
        })
    );

    return Promise.all(evaluationPromises);
  }

  /**
   * Validate and clamp scores to 0-1 range
   */
  private validateScore(score: any, defaultValue: number = 0.5): number {
    if (typeof score !== 'number' || isNaN(score)) {
      return defaultValue;
    }
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Create fallback evaluation when LLM evaluation fails
   */
  private createFallbackEvaluation(): ResponseEvaluation {
    const fallbackScore = 0.6; // Neutral score

    return {
      scores: {
        accuracy: fallbackScore,
        relevance: fallbackScore,
        completeness: fallbackScore,
        clarity: fallbackScore,
        helpfulness: fallbackScore
      },
      overallScore: fallbackScore,
      strengths: ['Response provided'],
      weaknesses: ['Evaluation system unavailable'],
      improvements: ['Manual review recommended'],
      missingInfo: ['Unable to assess'],
      confidence: 0.3,
      passesThreshold: false
    };
  }

  /**
   * Get judge system statistics
   */
  getStats() {
    return {
      qualityThreshold: this.QUALITY_THRESHOLD,
      highQualityThreshold: this.HIGH_QUALITY_THRESHOLD,
      evaluationCriteria: [
        'accuracy',
        'relevance', 
        'completeness',
        'clarity',
        'helpfulness'
      ],
      features: [
        'response_evaluation',
        'response_improvement',
        'response_comparison',
        'batch_evaluation'
      ]
    };
  }
}

export const llmJudge = new LLMJudge();
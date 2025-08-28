import OpenAI from 'openai';
import type { Message } from '@/components/chat/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface QueryContext {
  course: 'nodejs' | 'python';
  conversationHistory: Message[];
  userIntent: QueryIntent;
  technicalLevel: TechnicalLevel;
}

export interface QueryIntent {
  type: 'concept' | 'implementation' | 'debugging' | 'comparison' | 'example';
  confidence: number;
  keywords: string[];
}

export interface TechnicalLevel {
  level: 'beginner' | 'intermediate' | 'advanced';
  confidence: number;
  indicators: string[];
}

export interface QueryRewriteResult {
  original: string;
  rewritten: string[];
  strategies: string[];
  context: QueryContext;
  metadata: {
    processingTime: number;
    totalVariants: number;
    bestVariants: string[];
  };
}

export interface QueryRewritingStrategy {
  name: string;
  execute(query: string, context: QueryContext): Promise<string[]>;
}

export class MultiStrategyQueryRewriter {
  private strategies: QueryRewritingStrategy[];

  constructor() {
    this.strategies = [
      new SemanticExpansionStrategy(),
      new TechnicalTermStrategy(),
      new ContextualRefinementStrategy(),
      new SynonymExpansionStrategy(),
      new QuestionDecompositionStrategy(),
      new ConversationalContextStrategy()
    ];
  }

  /**
   * Main query rewriting method using multiple strategies
   */
  async rewriteQuery(
    originalQuery: string,
    course: 'nodejs' | 'python',
    conversationHistory: Message[] = []
  ): Promise<QueryRewriteResult> {
    const startTime = Date.now();
    console.log(`✍️ Query Rewriter: Processing query: "${originalQuery}"`);

    try {
      // Step 1: Analyze query context
      const userIntent = await this.detectIntent(originalQuery, course);
      const technicalLevel = await this.assessTechnicalLevel(originalQuery, conversationHistory);

      const context: QueryContext = {
        course,
        conversationHistory,
        userIntent,
        technicalLevel
      };

      console.log(`📊 Context: ${userIntent.type} query at ${technicalLevel.level} level`);

      // Step 2: Apply all strategies
      const allVariants: string[] = [];
      const appliedStrategies: string[] = [];

      for (const strategy of this.strategies) {
        try {
          const strategyVariants = await strategy.execute(originalQuery, context);
          if (strategyVariants.length > 0) {
            allVariants.push(...strategyVariants);
            appliedStrategies.push(strategy.name);
            console.log(`📝 ${strategy.name}: Generated ${strategyVariants.length} variants`);
          }
        } catch (error) {
          console.error(`❌ Strategy ${strategy.name} failed:`, error);
        }
      }

      // Step 3: Deduplicate and rank variants
      const uniqueVariants = this.deduplicateQueries([originalQuery, ...allVariants]);
      const rankedVariants = await this.rankQueries(originalQuery, uniqueVariants, context);

      const processingTime = Date.now() - startTime;
      
      const result: QueryRewriteResult = {
        original: originalQuery,
        rewritten: rankedVariants.slice(1, 6), // Top 5 (excluding original)
        strategies: appliedStrategies,
        context,
        metadata: {
          processingTime,
          totalVariants: allVariants.length,
          bestVariants: rankedVariants.slice(0, 3)
        }
      };

      console.log(`✅ Query Rewriter: Generated ${result.rewritten.length} variants in ${processingTime}ms`);
      return result;

    } catch (error) {
      console.error('❌ Query rewriting failed:', error);
      return this.createFallbackResult(originalQuery, course, conversationHistory);
    }
  }

  /**
   * Detect user intent from the query
   */
  private async detectIntent(query: string, course: string): Promise<QueryIntent> {
    const prompt = `Analyze this ${course} programming query to determine the user's intent:

QUERY: "${query}"

Classify the intent as one of:
1. concept: Understanding theoretical concepts, definitions, principles
2. implementation: How to code/build something, step-by-step instructions
3. debugging: Solving errors, troubleshooting, fixing problems
4. comparison: Comparing options, alternatives, pros/cons
5. example: Requesting examples, demonstrations, sample code

Also identify key technical keywords mentioned or implied.

Respond in JSON:
{
  "type": "implementation",
  "confidence": 0.9,
  "keywords": ["async", "await", "promise", "javascript"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response');

      const result = JSON.parse(content);
      
      return {
        type: result.type || 'concept',
        confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
        keywords: result.keywords || []
      };

    } catch (error) {
      console.error('❌ Intent detection failed:', error);
      
      // Fallback intent detection
      const queryLower = query.toLowerCase();
      let type: QueryIntent['type'] = 'concept';
      
      if (queryLower.includes('how to') || queryLower.includes('implement')) {
        type = 'implementation';
      } else if (queryLower.includes('error') || queryLower.includes('debug')) {
        type = 'debugging';
      } else if (queryLower.includes('vs') || queryLower.includes('difference')) {
        type = 'comparison';
      } else if (queryLower.includes('example') || queryLower.includes('show')) {
        type = 'example';
      }

      return {
        type,
        confidence: 0.5,
        keywords: query.split(/\s+/).filter(word => word.length > 3)
      };
    }
  }

  /**
   * Assess technical level based on query and conversation history
   */
  private async assessTechnicalLevel(
    query: string,
    conversationHistory: Message[]
  ): Promise<TechnicalLevel> {
    const recentMessages = conversationHistory.slice(-6).map(m => m.content).join(' ');
    const context = `${recentMessages} ${query}`.slice(0, 1000);

    const prompt = `Assess the technical level of this programming conversation:

CONTEXT: "${context}"

Determine if the user is:
1. beginner: New to programming, asking basic questions, simple terminology
2. intermediate: Some experience, asking about specific features, moderate complexity
3. advanced: Experienced developer, complex topics, optimization, architecture

Provide indicators that support your assessment.

Respond in JSON:
{
  "level": "intermediate",
  "confidence": 0.8,
  "indicators": ["uses technical terms", "asks about specific implementation", "mentions frameworks"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response');

      const result = JSON.parse(content);
      
      return {
        level: result.level || 'intermediate',
        confidence: Math.max(0, Math.min(1, result.confidence || 0.6)),
        indicators: result.indicators || []
      };

    } catch (error) {
      console.error('❌ Technical level assessment failed:', error);
      
      return {
        level: 'intermediate',
        confidence: 0.5,
        indicators: ['fallback assessment']
      };
    }
  }

  /**
   * Rank query variants by expected effectiveness
   */
  private async rankQueries(
    originalQuery: string,
    variants: string[],
    context: QueryContext
  ): Promise<string[]> {
    if (variants.length <= 1) return variants;

    const prompt = `Rank these query variants by their effectiveness for finding relevant ${context.course} educational content:

ORIGINAL: "${originalQuery}"
USER INTENT: ${context.userIntent.type}
TECHNICAL LEVEL: ${context.technicalLevel.level}
COURSE: ${context.course.toUpperCase()}

VARIANTS:
${variants.map((variant, i) => `${i}: "${variant}"`).join('\n')}

Consider:
1. Specificity and clarity
2. Technical accuracy for ${context.course}
3. Likelihood to find educational content
4. Appropriateness for ${context.technicalLevel.level} level
5. Alignment with ${context.userIntent.type} intent

Return the indices in order of effectiveness (best first):
[2, 0, 4, 1, 3]`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      const content = response.choices[0].message.content?.trim();
      if (!content) throw new Error('No ranking response');

      // Parse ranking
      const match = content.match(/\[([\d,\s]+)\]/);
      if (match) {
        const indices = match[1].split(',').map(s => parseInt(s.trim())).filter(i => !isNaN(i) && i < variants.length);
        return indices.map(i => variants[i]).filter(Boolean);
      }

      throw new Error('Could not parse ranking');

    } catch (error) {
      console.error('❌ Query ranking failed:', error);
      
      // Fallback: sort by length (longer = more specific)
      return variants.sort((a, b) => b.length - a.length);
    }
  }

  /**
   * Remove duplicate queries
   */
  private deduplicateQueries(queries: string[]): string[] {
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const query of queries) {
      const normalized = query.toLowerCase().trim();
      if (!seen.has(normalized) && query.trim().length > 0) {
        seen.add(normalized);
        unique.push(query.trim());
      }
    }

    return unique;
  }

  /**
   * Create fallback result when rewriting fails
   */
  private createFallbackResult(
    originalQuery: string,
    course: 'nodejs' | 'python',
    conversationHistory: Message[]
  ): QueryRewriteResult {
    const simpleVariants = [
      `${originalQuery} tutorial`,
      `${originalQuery} example`,
      `${originalQuery} ${course} programming`,
      `how to ${originalQuery}`,
      `${originalQuery} explanation`
    ];

    return {
      original: originalQuery,
      rewritten: simpleVariants.slice(0, 3),
      strategies: ['fallback'],
      context: {
        course,
        conversationHistory,
        userIntent: { type: 'concept', confidence: 0.5, keywords: [] },
        technicalLevel: { level: 'intermediate', confidence: 0.5, indicators: [] }
      },
      metadata: {
        processingTime: 0,
        totalVariants: simpleVariants.length,
        bestVariants: simpleVariants.slice(0, 2)
      }
    };
  }

  /**
   * Get rewriter system statistics
   */
  getStats() {
    return {
      strategies: this.strategies.map(s => s.name),
      capabilities: [
        'intent_detection',
        'technical_level_assessment',
        'multi_strategy_rewriting',
        'query_ranking',
        'contextual_analysis'
      ]
    };
  }
}

/**
 * Strategy implementations
 */

class SemanticExpansionStrategy implements QueryRewritingStrategy {
  name = 'semantic_expansion';

  async execute(query: string, context: QueryContext): Promise<string[]> {
    const courseContext = context.course === 'nodejs' 
      ? 'Node.js backend development, Express.js, async/await, npm'
      : 'Python programming, functions, classes, data structures, libraries';

    const prompt = `Expand this ${context.course} query with semantically related terms:

QUERY: "${query}"
CONTEXT: ${courseContext}
USER LEVEL: ${context.technicalLevel.level}

Generate 3 semantically expanded versions that:
1. Add relevant ${context.course} terminology
2. Include related concepts and synonyms  
3. Maintain the original intent
4. Are appropriate for ${context.technicalLevel.level} level

Return as simple list (one per line, no numbers or bullets).`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 200
    });

    return this.parseQueries(response.choices[0].message.content || '');
  }

  private parseQueries(response: string): string[] {
    return response.split('\n')
      .map(line => line.trim().replace(/^[-*•\d.)]\s*/, ''))
      .filter(line => line.length > 0 && !line.includes(':'))
      .slice(0, 3);
  }
}

class TechnicalTermStrategy implements QueryRewritingStrategy {
  name = 'technical_terms';

  async execute(query: string, context: QueryContext): Promise<string[]> {
    const technicalTerms = context.course === 'nodejs'
      ? ['Express.js', 'middleware', 'async/await', 'npm', 'modules', 'callback', 'promise', 'server', 'API']
      : ['functions', 'classes', 'decorators', 'comprehensions', 'generators', 'modules', 'packages', 'OOP'];

    const relevantTerms = technicalTerms.filter(term => 
      !query.toLowerCase().includes(term.toLowerCase())
    ).slice(0, 5);

    if (relevantTerms.length === 0) return [];

    const prompt = `Rewrite this query using appropriate ${context.course} technical terms:

QUERY: "${query}"
AVAILABLE TERMS: ${relevantTerms.join(', ')}
LEVEL: ${context.technicalLevel.level}

Generate 2 technical variants that naturally incorporate relevant terms.
Make them sound natural, not forced.

Return as simple list.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 150
    });

    return this.parseQueries(response.choices[0].message.content || '');
  }

  private parseQueries(response: string): string[] {
    return response.split('\n')
      .map(line => line.trim().replace(/^[-*•\d.)]\s*/, ''))
      .filter(line => line.length > 0)
      .slice(0, 2);
  }
}

class ContextualRefinementStrategy implements QueryRewritingStrategy {
  name = 'contextual_refinement';

  async execute(query: string, context: QueryContext): Promise<string[]> {
    if (context.conversationHistory.length === 0) return [];

    const recentContext = context.conversationHistory
      .slice(-3)
      .map(m => m.content)
      .join(' ')
      .slice(0, 300);

    const prompt = `Refine this query based on conversation context:

CURRENT QUERY: "${query}"
RECENT CONTEXT: "${recentContext}"
COURSE: ${context.course}

Generate 2 refined versions that:
1. Build on previous discussion points
2. Are more specific based on context
3. Connect to recent topics mentioned

Return as simple list.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 150
    });

    return this.parseQueries(response.choices[0].message.content || '');
  }

  private parseQueries(response: string): string[] {
    return response.split('\n')
      .map(line => line.trim().replace(/^[-*•\d.)]\s*/, ''))
      .filter(line => line.length > 0)
      .slice(0, 2);
  }
}

class SynonymExpansionStrategy implements QueryRewritingStrategy {
  name = 'synonym_expansion';

  async execute(query: string, context: QueryContext): Promise<string[]> {
    // Simple synonym expansion
    const variants: string[] = [];
    
    // Add common programming synonyms
    let expanded = query;
    const synonyms = {
      'function': 'method',
      'method': 'function',
      'variable': 'identifier',
      'loop': 'iteration',
      'array': 'list',
      'object': 'instance'
    };

    Object.entries(synonyms).forEach(([from, to]) => {
      if (query.toLowerCase().includes(from)) {
        variants.push(query.replace(new RegExp(from, 'gi'), to));
      }
    });

    // Add tutorial/example variants
    variants.push(`${query} tutorial example`);
    variants.push(`learn ${query} ${context.course}`);

    return variants.slice(0, 2);
  }
}

class QuestionDecompositionStrategy implements QueryRewritingStrategy {
  name = 'question_decomposition';

  async execute(query: string, context: QueryContext): Promise<string[]> {
    // Only decompose complex questions
    if (query.split(' ').length < 8 || !this.isComplexQuestion(query)) {
      return [];
    }

    const prompt = `Break down this complex ${context.course} question into simpler parts:

COMPLEX QUERY: "${query}"

Create 2-3 focused sub-questions that can be searched independently.
Each should be clear and specific.

Return as simple list.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 200
    });

    return this.parseQueries(response.choices[0].message.content || '');
  }

  private isComplexQuestion(query: string): boolean {
    const complexIndicators = ['and', 'or', 'but', 'however', 'difference between', 'compare', 'versus'];
    return complexIndicators.some(indicator => query.toLowerCase().includes(indicator));
  }

  private parseQueries(response: string): string[] {
    return response.split('\n')
      .map(line => line.trim().replace(/^[-*•\d.)]\s*/, ''))
      .filter(line => line.length > 0 && line.endsWith('?'))
      .slice(0, 3);
  }
}

class ConversationalContextStrategy implements QueryRewritingStrategy {
  name = 'conversational_context';

  async execute(query: string, context: QueryContext): Promise<string[]> {
    if (context.conversationHistory.length < 2) return [];

    const lastUserMessage = context.conversationHistory
      .filter(m => m.role === 'user')
      .slice(-2)[0]?.content;

    if (!lastUserMessage) return [];

    // Check for follow-up patterns
    const followUpPatterns = ['can you', 'what about', 'how about', 'also', 'and'];
    const isFollowUp = followUpPatterns.some(pattern => 
      query.toLowerCase().startsWith(pattern)
    );

    if (isFollowUp) {
      return [`${lastUserMessage} ${query}`, `${query} ${context.course} programming`];
    }

    return [];
  }
}

export const queryRewriter = new MultiStrategyQueryRewriter();
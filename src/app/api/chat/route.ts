import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Lazy initialization of OpenAI client to handle missing API key during build
let openaiClient: ReturnType<typeof createOpenAI> | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiClient = createOpenAI({ apiKey });
  }
  return openaiClient;
}

interface SourceTimestamp {
  course: string;
  section: string;
  videoId: string;
  timestamp: string;
  relevance: string;
}

interface ChatRequestBody {
  messages: any[];
  course?: 'nodejs' | 'python';
  useAdvancedRAG?: boolean;
  advancedRAGConfig?: {
    enableCorrectiveRAG?: boolean;
    enableQueryRewriting?: boolean;
    enableSubqueryDecomposition?: boolean;
    enableLLMJudge?: boolean;
    enableHyDE?: boolean;
  };
}

// Quick query complexity analysis
function analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
  const lowerQuery = query.toLowerCase();
  
  // Simple queries - direct answers, basic concepts
  const simpleIndicators = [
    'what is', 'how to', 'define', 'explain', 'show me',
    'example of', 'syntax for', 'basic', 'simple'
  ];
  
  // Complex queries - require deep analysis
  const complexIndicators = [
    'compare', 'difference between', 'best practice', 'architecture',
    'design pattern', 'optimize', 'debug', 'troubleshoot', 'multiple',
    'various ways', 'pros and cons', 'when to use', 'why choose'
  ];
  
  // Check for complex indicators first
  if (complexIndicators.some(indicator => lowerQuery.includes(indicator))) {
    return 'complex';
  }
  
  // Check for simple indicators
  if (simpleIndicators.some(indicator => lowerQuery.includes(indicator))) {
    return 'simple';
  }
  
  // Check query length and structure
  const wordCount = query.split(' ').length;
  const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
  const hasMultipleSentences = (query.match(/[.!?]/g) || []).length > 1;
  
  if (wordCount > 20 || hasMultipleQuestions || hasMultipleSentences) {
    return 'complex';
  }
  
  if (wordCount < 8) {
    return 'simple';
  }
  
  return 'medium';
}

export const POST = async (req: Request) => {
  try {
    // Validate environment
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Missing OPENAI_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    
    // Validate request body
    let parsedBody;
    try {
      parsedBody = await req.json();
    } catch (parseError) {
      console.error('❌ Invalid JSON in request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, course }: ChatRequestBody = parsedBody;
    
    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content;
    
    if (!userQuery || typeof userQuery !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid user query is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const selectedCourse = course || 'nodejs';
    
    // Dynamic RAG selection based on query complexity
    const queryComplexity = analyzeQueryComplexity(userQuery);
    console.log(`🔍 Query: "${userQuery}" | Complexity: ${queryComplexity}`);
    
    // Configure RAG strategy based on complexity
    let useAdvancedRAG = false;
    let maxSources = 3; // Start with minimal sources for speed
    let ragTimeout = 5000; // 5 second timeout
    
    switch (queryComplexity) {
      case 'simple':
        useAdvancedRAG = false;
        maxSources = 3;
        ragTimeout = 20000; // Increased timeout to account for HyDE processing
        break;
      case 'medium':
        useAdvancedRAG = false;
        maxSources = 4;
        ragTimeout = 25000; // Increased timeout
        break;
      case 'complex':
        useAdvancedRAG = true; // Only use advanced RAG for truly complex queries
        maxSources = 6;
        ragTimeout = 30000; // Increased timeout for complex queries
        break;
    }

    // Use Advanced RAG pipeline or fallback to basic RAG
    let ragContext = '';
    let sourceTimestamps: SourceTimestamp[] = [];
    let ragMetrics = {
      processingTime: 0,
      confidence: 0,
      technique: 'none' as string,
      corrections: [] as string[]
    };

    // Wrap RAG calls with timeout for guaranteed fast responses
    const ragStartTime = Date.now();
    
    try {
      const ragPromise = (async () => {
        if (useAdvancedRAG && queryComplexity === 'complex') {
          console.log('🚀 Using Advanced RAG Pipeline for complex query');
          const { advancedRAGPipeline } = await import('@/lib/advanced-rag-pipeline');
          
          const conversationHistory = messages.slice(0, -1);
          const userContext = {
            preferredLanguage: selectedCourse,
            skillLevel: 'intermediate'
          };
          
          const advancedResult = await advancedRAGPipeline.processQuery(
            userQuery,
            selectedCourse as 'nodejs' | 'python',
            conversationHistory,
            userContext,
            {
              enableCorrectiveRAG: false, // Disabled for speed
              enableQueryRewriting: true,
              enableSubqueryDecomposition: false, // Disabled for speed
              enableLLMJudge: false, // Disabled for speed
              enableHyDE: true,
              maxSources: maxSources,
              qualityThreshold: 0.6 // Lower threshold for speed
            }
          );
          
          ragContext = advancedResult.response;
          sourceTimestamps = advancedResult.sources.slice(0, maxSources).map((result) => ({
            course: result.metadata.course || 'Unknown',
            section: result.metadata.section || 'General', 
            videoId: result.metadata.videoId || 'unknown',
            timestamp: formatTimestamp(result.metadata.startTime),
            relevance: `${(result.score * 100).toFixed(0)}%`,
          }));
          
          ragMetrics = {
            processingTime: advancedResult.processingTime,
            confidence: advancedResult.confidence,
            technique: 'advanced_rag_fast',
            corrections: advancedResult.queryTransformations
          };
          
        } else {
          console.log(`📝 Using Fast Basic RAG (${queryComplexity} query)`);
          const { qdrantRAG } = await import('@/lib/qdrant-rag');
          await qdrantRAG.initialize();

          const searchResults = await qdrantRAG.search(
            userQuery,
            maxSources * 2, // Search more, return less
            selectedCourse as 'nodejs' | 'python',
          );

          console.log(`🔍 RAG Search Results: Found ${searchResults?.length || 0} results`);
          if (searchResults?.length > 0) {
            console.log('📋 First result:', {
              content: searchResults[0].content.substring(0, 100),
              score: searchResults[0].score,
              course: searchResults[0].metadata.course,
              section: searchResults[0].metadata.section,
              startTime: searchResults[0].metadata.startTime
            });
            // Simplified deduplication for speed
            const uniqueResults = searchResults
              .filter((result) => result.score > 0.35) // Lower threshold for speed
              .sort((a, b) => b.score - a.score)
              .slice(0, maxSources);

            sourceTimestamps = uniqueResults.map((result) => ({
              course: result.metadata.course || 'Unknown',
              section: result.metadata.section || 'General',
              videoId: result.metadata.videoId || 'unknown', 
              timestamp: formatTimestamp(result.metadata.startTime),
              relevance: `${(result.score * 100).toFixed(0)}%`,
            }));

            ragContext = uniqueResults
              .map((result) => `${result.metadata.section} (${formatTimestamp(result.metadata.startTime)}): ${result.content.trim()}`)
              .join('\n\n');
            
            ragMetrics.technique = `basic_rag_${queryComplexity}`;
            ragMetrics.processingTime = Date.now() - ragStartTime;
          }
        }
      })();

      // Add timeout wrapper for guaranteed fast responses
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('RAG_TIMEOUT')), ragTimeout);
      });

      // Race between RAG processing and timeout
      await Promise.race([ragPromise, timeoutPromise]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage === 'RAG_TIMEOUT') {
        console.log(`⏰ RAG timeout (${ragTimeout}ms) - proceeding without context for speed`);
        ragMetrics.technique = `timeout_${queryComplexity}`;
      } else {
        console.log('⚠️ RAG system error:', errorMessage);
        ragMetrics.technique = `error_${queryComplexity}`;
      }
      
      ragMetrics.processingTime = Date.now() - ragStartTime;
      
      // Don't add mock sources - just proceed without RAG context for speed
      console.log('🚀 Proceeding with direct LLM response for maximum speed');
    }

    // Create optimized system prompt based on query complexity and context
    let systemPrompt = `You are FlowMind, an expert ${selectedCourse === 'nodejs' ? 'Node.js' : 'Python'} programming tutor.`;
    
    if (ragContext) {
      if (queryComplexity === 'simple') {
        systemPrompt += `

Course content: ${ragContext}

Provide a clear, concise answer based on this material. Be direct and helpful.`;
      } else if (queryComplexity === 'medium') {
        systemPrompt += `

Relevant course material: ${ragContext}

Provide a thorough explanation with examples where helpful. Reference timestamps naturally.`;
      } else {
        systemPrompt += `

Course material: ${ragContext}

Provide comprehensive explanation with examples, best practices, and detailed guidance. Reference course sections naturally.`;
      }
    } else {
      systemPrompt += `

Answer based on your ${selectedCourse === 'nodejs' ? 'Node.js' : 'Python'} expertise. Be concise and practical.`;
    }

    // Dynamic model and parameters based on query complexity
    const modelConfig = {
      simple: { maxTokens: 600, temperature: 0.2 },
      medium: { maxTokens: 1200, temperature: 0.3 },
      complex: { maxTokens: 2000, temperature: 0.4 }
    }[queryComplexity];

    const result = streamText({
      model: getOpenAIClient()('gpt-4o-mini'), // Fastest model
      system: systemPrompt,
      messages,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
    });

    const response = result.toTextStreamResponse();

    // Add sources and metrics headers if we found any relevant transcript content
    if (sourceTimestamps.length > 0) {
      console.log(`📚 Found ${sourceTimestamps.length} sources for response`);
      response.headers.set('X-Sources', JSON.stringify(sourceTimestamps));
    } else {
      console.log('📭 No sources found for this query');
    }
    
    // Add RAG metrics for debugging and analytics
    response.headers.set('X-RAG-Metrics', JSON.stringify({
      processingTime: ragMetrics.processingTime,
      confidence: ragMetrics.confidence,
      technique: ragMetrics.technique,
      corrections: ragMetrics.corrections,
      useAdvancedRAG,
      sourceCount: sourceTimestamps.length
    }));

    const endTime = Date.now();
    console.log(`⚡ Response time: ${endTime - startTime}ms`);

    return response;
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    
    // Return a more descriptive error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Full error details:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: process.env.NODE_ENV === 'development' ? errorMessage : 'Server error occurred'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

const formatTimestamp = (seconds: number | undefined): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) {
    return '0:00';
  }
  
  const validSeconds = Math.max(0, Math.floor(seconds));
  const totalMinutes = Math.floor(validSeconds / 60);
  const remainingSeconds = validSeconds % 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
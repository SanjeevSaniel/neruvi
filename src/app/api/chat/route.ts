import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { qdrantRAG } from '@/lib/qdrant-rag';

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

// Check if we're in a deployment environment where file system access is limited
const isDeployment = process.env.VERCEL || process.env.NODE_ENV === 'production';

// Simple in-memory cache
const responseCache = new Map<string, string>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

interface SourceTimestamp {
  course: string;
  section: string;
  videoId: string;
  timestamp: string;
  relevance: string;
}

// Helper function to create cache key
const getCacheKey = (query: string): string => {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/)
    .sort()
    .join(' ');
};

// Clean expired cache entries
const cleanCache = () => {
  const now = Date.now();
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > CACHE_TTL) {
      responseCache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
};

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

    const { messages, course } = parsedBody;
    
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

    const selectedCourse = course || 'both';

    console.log('🔍 User query:', userQuery);

    // Check cache first
    const cacheKey = getCacheKey(userQuery);
    cleanCache();

    if (responseCache.has(cacheKey)) {
      console.log('📦 Cache hit for query');
      const cachedResponse = responseCache.get(cacheKey);
      if (cachedResponse) {
        return new Response(cachedResponse, {
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

    // Optimize RAG search with Promise.all for parallel processing
    let ragContext = '';
    let sourceTimestamps: SourceTimestamp[] = [];

    const ragPromise = (async () => {
      try {
        // Skip RAG in deployment if file system is not available
        if (isDeployment) {
          console.log('⚠️ RAG disabled in deployment environment');
          return;
        }

        await qdrantRAG.initialize();
        
        // Enhanced search with course filtering and HYDE
        const searchResults = await qdrantRAG.search(
          userQuery, 
          8, // Get more results to find the most relevant ones
          selectedCourse as 'nodejs' | 'python' | 'both'
        );

        if (searchResults?.length > 0) {
          // Ensure unique references with proper timestamps
          const uniqueResults = new Map<string, typeof searchResults[0]>();
          
          searchResults.forEach(result => {
            const key = `${result.metadata.videoId}-${Math.floor(result.metadata.startTime / 10) * 10}`; // 10-second windows
            if (!uniqueResults.has(key) || (uniqueResults.get(key)!.score < result.score)) {
              uniqueResults.set(key, result);
            }
          });
          
          const sortedResults = Array.from(uniqueResults.values())
            .sort((a, b) => b.score - a.score);
          
          // Natural filtering based on course content structure
          console.log('📊 Relevance scores:', sortedResults.map((r, i) => `${i}: ${r.score.toFixed(3)}`));
          
          const finalResults = [];
          
          // Return only the single best reference - the exact match
          if (sortedResults.length > 0) {
            finalResults.push(sortedResults[0]);
          }
          
          console.log(`📋 Found ${finalResults.length} relevant references from ${sortedResults.length} candidates`);
          
          sourceTimestamps = finalResults.map(
            (result, index): SourceTimestamp => {
              const score = result.score;
              let relevanceMessage = result.metadata.relevance_reason;
              
              // Generate better relevance messages if not provided
              if (!relevanceMessage || relevanceMessage === 'Relevant content') {
                if (index === 0 && score > 0.7) {
                  relevanceMessage = 'Primary explanation';
                } else if (score > 0.8) {
                  relevanceMessage = 'Direct answer';
                } else if (score > 0.65) {
                  relevanceMessage = 'Main reference';
                } else if (score > 0.5) {
                  relevanceMessage = 'Related topic';
                } else {
                  relevanceMessage = 'Additional context';
                }
              }
              
              return {
                course: result.metadata.course || 'Unknown',
                section: result.metadata.section || 'General',
                videoId: result.metadata.videoId || 'unknown',
                timestamp: formatTimestamp(result.metadata.startTime),
                relevance: `${(score * 100).toFixed(0)}`, // Store as percentage for dynamic display
              };
            }
          );

          // Create rich context from unique results with better formatting
          ragContext = finalResults
            .map(
              (result, index) =>
                `## Context ${index + 1}: ${result.metadata.course.toUpperCase()} - ${result.metadata.section} (${formatTimestamp(result.metadata.startTime)})
**Relevance**: ${result.metadata.relevance_reason}
**Content**: ${result.content.trim()}`,
            )
            .join('\n\n')
            .substring(0, 4000); // Increased for richer context
        }
      } catch (error: unknown) {
        console.error('Enhanced Qdrant RAG search failed:', error);
      }
    })();

    // Wait for RAG to complete
    await ragPromise;

    const systemPrompt = `You are FlowMind, an AI assistant specializing in Node.js and Python programming.

${
  ragContext
    ? `## Relevant Course Material:
${ragContext}

Use the above course material as your primary reference.`
    : isDeployment 
    ? 'Provide clear, practical programming guidance based on your knowledge of Node.js and Python best practices. Focus on commonly used patterns and provide working code examples.'
    : 'No specific course material found, but I can help with general programming concepts.'
}

Provide clear, practical programming guidance. Keep responses focused and under 300 words for faster delivery.`;

    const result = streamText({
      model: getOpenAIClient()('gpt-4o-mini'), // Fastest model
      system: systemPrompt,
      messages,
      temperature: 0.7, // Lower for speed and focus
      // maxTokens: 500, // Limit response length
      topP: 1,
    });

    const response = result.toTextStreamResponse();

    // Add sources header
    if (sourceTimestamps.length > 0) {
      response.headers.set('X-Sources', JSON.stringify(sourceTimestamps));
    }

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

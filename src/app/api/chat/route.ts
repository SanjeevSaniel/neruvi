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

    const selectedCourse = course || 'nodejs'; // Default to nodejs since we removed 'both'
    console.log('🔍 User query:', userQuery);

    // Try to use Qdrant RAG if available, fallback gracefully if not
    let ragContext = '';
    let sourceTimestamps: SourceTimestamp[] = [];

    try {
      // Dynamic import to avoid build issues when dependencies aren't available
      const { qdrantRAG } = await import('@/lib/qdrant-rag');
      
      await qdrantRAG.initialize();
      
      const searchResults = await qdrantRAG.search(
        userQuery, 
        20, // Get more candidates to find the absolute best match
        selectedCourse as 'nodejs' | 'python'
      );

      if (searchResults?.length > 0) {
        const uniqueResults = new Map<string, typeof searchResults[0]>();
        
        searchResults.forEach(result => {
          // Very strict deduplication - remove if timestamps are within 2 minutes or same section
          const key = `${result.metadata.videoId}-${result.metadata.section}-${Math.floor(result.metadata.startTime / 120) * 120}`;
          if (!uniqueResults.has(key) || (uniqueResults.get(key)!.score < result.score)) {
            uniqueResults.set(key, result);
          }
        });
        
        const sortedResults = Array.from(uniqueResults.values())
          .filter(result => result.score > 0.4) // Balanced threshold to ensure sources appear
          .sort((a, b) => b.score - a.score)
          .slice(0, 1); // Only the single most relevant result
          
        console.log(`🔍 Search found ${searchResults.length} initial results, ${uniqueResults.size} unique, ${sortedResults.length} after filtering`);
        if (sortedResults.length > 0) {
          console.log('📚 Source found:', sortedResults[0].metadata);
        }
        
        sourceTimestamps = sortedResults.map(result => ({
          course: result.metadata.course || 'Unknown',
          section: result.metadata.section || 'General',
          videoId: result.metadata.videoId || 'unknown',
          timestamp: formatTimestamp(result.metadata.startTime),
          relevance: `${(result.score * 100).toFixed(0)}%`,
        }));

        ragContext = sortedResults
          .map((result) =>
            `## ${result.metadata.course.toUpperCase()} Course - ${result.metadata.section} at ${formatTimestamp(result.metadata.startTime)}
${result.content.trim()}`)
          .join('\n\n---\n\n');
      }
    } catch (error) {
      console.log('⚠️ RAG system not available in this environment:', error?.message || error);
      // Add some mock sources for testing if RAG fails completely
      if (process.env.NODE_ENV === 'development') {
        sourceTimestamps = [
          {
            course: selectedCourse === 'python' ? 'python' : 'nodejs',
            section: selectedCourse === 'python' ? 'Python Fundamentals' : 'Node.js Basics',
            videoId: 'test-123',
            timestamp: '5:23',
            relevance: '75%'
          }
        ];
        ragContext = `Test context for debugging source display in ${selectedCourse} course`;
        console.log('🧪 Added test sources for debugging:', sourceTimestamps);
      }
    }

    const systemPrompt = `You are FlowMind, an expert programming tutor specializing in Node.js and Python. You provide detailed, comprehensive explanations based on course transcript content.

${ragContext ? 
`## Relevant Course Material:
${ragContext}

INSTRUCTIONS FOR DETAILED RESPONSES:
- Provide comprehensive, step-by-step explanations based on the course material
- Include practical examples and code snippets when mentioned in the transcripts
- Explain concepts thoroughly with context and reasoning
- Reference timestamps naturally (e.g., "at 5:23, the instructor explains..." or "as covered at 12:45...")
- Instead of saying "Context 1" or "Context 2", reference the actual timestamp and section
- Break down complex topics into digestible parts with clear explanations
- Provide detailed implementation guidance when available in the transcripts
- Give thorough context about why certain approaches are used
- Include best practices and common pitfalls mentioned in the courses
- Make responses educational and insightful, not just brief answers
- Aim for detailed, helpful responses (400-800 words when appropriate for complex topics)
- Use the exact terminology and explanations from the course content
- Connect related concepts when mentioned in multiple transcript sections
- When multiple timestamps cover the same topic, reference them naturally (e.g., "This concept is introduced at 3:15 and expanded upon at 8:42")` 
: 
`No relevant transcript content was found for this specific query.

I don't have information about that topic in the available course transcripts. Please try asking about topics covered in the Node.js or Python courses, such as:

**For Node.js:** Express.js setup, HTTP servers, middleware, authentication, routing, modules, file system operations, async/await, npm packages
**For Python:** Functions, classes, data types, loops, error handling, OOP concepts, decorators, list comprehensions, file handling`}

Focus on ${selectedCourse === 'nodejs' ? 'Node.js' : 'Python'} course content when possible.`;

    const result = streamText({
      model: getOpenAIClient()('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      temperature: 0.3, // Lower temperature for more focused, accurate responses
      topP: 0.9, // Slightly more focused sampling
      maxTokens: 1200, // Allow for longer, more detailed responses
    });

    const response = result.toTextStreamResponse();

    // Add sources header if we found any relevant transcript content
    if (sourceTimestamps.length > 0) {
      console.log(`📚 Found ${sourceTimestamps.length} sources for response`);
      response.headers.set('X-Sources', JSON.stringify(sourceTimestamps));
    } else {
      console.log('📭 No sources found for this query');
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
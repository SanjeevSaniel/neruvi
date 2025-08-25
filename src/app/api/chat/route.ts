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

    const selectedCourse = course || 'both';
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
        8,
        selectedCourse as 'nodejs' | 'python' | 'both'
      );

      if (searchResults?.length > 0) {
        const uniqueResults = new Map<string, typeof searchResults[0]>();
        
        searchResults.forEach(result => {
          const key = `${result.metadata.videoId}-${Math.floor(result.metadata.startTime / 10) * 10}`;
          if (!uniqueResults.has(key) || (uniqueResults.get(key)!.score < result.score)) {
            uniqueResults.set(key, result);
          }
        });
        
        const sortedResults = Array.from(uniqueResults.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 3); // Top 3 results
        
        sourceTimestamps = sortedResults.map(result => ({
          course: result.metadata.course || 'Unknown',
          section: result.metadata.section || 'General',
          videoId: result.metadata.videoId || 'unknown',
          timestamp: formatTimestamp(result.metadata.startTime),
          relevance: `${(result.score * 100).toFixed(0)}%`,
        }));

        ragContext = sortedResults
          .map((result, index) =>
            `## Context ${index + 1}: ${result.metadata.course.toUpperCase()} - ${result.metadata.section} (${formatTimestamp(result.metadata.startTime)})
**Content**: ${result.content.trim()}`)
          .join('\n\n');
      }
    } catch (error) {
      console.log('⚠️ RAG system not available in this environment:', error);
      // Continue without RAG - will show appropriate message
    }

    const systemPrompt = `You are FlowMind, an AI assistant that ONLY provides information from programming course transcripts.

${ragContext ? 
`## Relevant Course Material:
${ragContext}

IMPORTANT: Base your response EXCLUSIVELY on the course material above. Do not add information from general knowledge.` 
: 
`No relevant transcript content was found for this query.

Respond with: "I don't have information about that topic in the available course transcripts. Please try asking about topics covered in the Node.js or Python courses, such as:

For Node.js: Express.js, HTTP servers, authentication, modules, file system operations
For Python: Functions, classes, data types, loops, error handling, OOP concepts"`}

If course material is available:
- Answer based solely on the transcript content provided
- Reference specific videos and timestamps when relevant  
- Keep responses focused and under 300 words for faster delivery
- If the transcripts don't fully answer the question, acknowledge the limitation

Focus on ${selectedCourse === 'both' ? 'both Node.js and Python' : selectedCourse === 'nodejs' ? 'Node.js' : 'Python'} course content when possible.`;

    const result = streamText({
      model: getOpenAIClient()('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      topP: 1,
    });

    const response = result.toTextStreamResponse();

    // Add sources header if we found transcript content
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
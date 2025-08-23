import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { localRAG } from '@/lib/local-rag';

// Define the interface for source timestamps
interface SourceTimestamp {
  course: string;
  section: string;
  videoId: string;
  timestamp: string;
  relevance: string;
}

export const POST = async (req: Request) => {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    console.log('🔍 User query:', userQuery);

    // Get RAG context - explicitly type sourceTimestamps
    let ragContext = '';
    let sourceTimestamps: SourceTimestamp[] = []; // Fixed: Explicit type declaration

    try {
      await localRAG.initialize();
      const hydeResults = await localRAG.hydeSearch(userQuery);

      if (hydeResults?.length > 0) {
        const searchResults = hydeResults.slice(0, 5);

        // Fixed: Explicit type mapping
        sourceTimestamps = searchResults.map(
          (result): SourceTimestamp => ({
            course: result.metadata?.course || 'Unknown',
            section: result.metadata?.section || 'General',
            videoId: result.metadata?.videoId || 'unknown',
            timestamp: formatTimestamp(result.metadata?.startTime),
            relevance: (result.score * 100).toFixed(1),
          }),
        );

        ragContext = searchResults
          .map(
            (result, index) => `Context ${index + 1}: ${result.content.trim()}`,
          )
          .join('\n\n');
      }
    } catch (error: unknown) {
      console.error('RAG search failed:', error);
    }

    const systemPrompt = `You are FlowMind, an AI assistant specializing in Node.js and Python programming.

${
  ragContext
    ? `## Relevant Course Material:
${ragContext}

Use the above course material as your primary reference.`
    : ''
}

Provide clear, practical programming guidance with code examples when appropriate.`;

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      temperature: 0.3,
    });

    // Create custom response with sources in headers
    const response = result.toTextStreamResponse();

    // Add sources as a custom header - Fixed: Type-safe JSON stringification
    if (sourceTimestamps.length > 0) {
      response.headers.set('X-Sources', JSON.stringify(sourceTimestamps));
    }

    return response;
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

// Helper function with proper typing
const formatTimestamp = (seconds: number | undefined): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

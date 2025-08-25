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

// Check if we're in a deployment environment
const isDeployment = process.env.VERCEL || process.env.NODE_ENV === 'production';

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

    // Simplified system prompt without RAG for deployment
    const systemPrompt = `You are FlowMind, an AI assistant specializing in Node.js and Python programming.

You are an expert programming tutor with deep knowledge of:
- Node.js: Express.js, async/await, modules, npm, API development, middleware
- Python: Functions, classes, data structures, libraries, web frameworks like Flask/Django
- General programming concepts: debugging, best practices, code optimization

Provide clear, practical programming guidance with working code examples. Keep responses focused and under 300 words for faster delivery. Always include:
1. Direct answer to the question
2. Working code example when applicable  
3. Brief explanation of key concepts
4. Best practices or common pitfalls to avoid

Focus on ${selectedCourse === 'both' ? 'both Node.js and Python' : selectedCourse === 'nodejs' ? 'Node.js' : 'Python'} when possible.`;

    const result = streamText({
      model: getOpenAIClient()('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      topP: 1,
    });

    const response = result.toTextStreamResponse();

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
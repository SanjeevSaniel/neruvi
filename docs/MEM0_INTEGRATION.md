# Mem0 Integration - Personalized Learning Memory

## Overview

Neruvi integrates **Mem0 AI** to provide personalized learning experiences through intelligent memory management. Mem0 tracks user interactions, learning patterns, and comprehension levels to deliver adaptive, context-aware responses.

## What is Mem0?

**Mem0** is an intelligent memory layer for AI applications that:
- Stores and retrieves conversation context
- Tracks user learning patterns over time
- Enables personalized AI responses
- Provides semantic search across user history
- Maintains long-term memory across sessions

## Architecture

```
User Interaction
      ↓
[Chat API] → [Mem0 Service] → [Mem0 Cloud]
      ↓                              ↓
[RAG System]                  [User Memory Store]
      ↓                              ↓
AI Response ← Personalized Context ←┘
```

## Core Features

### 1. Learning Profile Tracking

Mem0 automatically builds a comprehensive learning profile for each user:

```typescript
interface LearningMemory {
  topics: string[]                     // Topics the user has explored
  struggledWith: string[]              // Concepts that were difficult
  masteredTopics: string[]             // Topics with advanced understanding
  learningStyle: 'visual' | 'practical' | 'theoretical' | 'mixed'
  preferredCourse: 'nodejs' | 'python' | 'both'
  lastActiveTopics: string[]           // Recent learning focus
  comprehensionLevel: {
    [topic: string]: 'beginner' | 'intermediate' | 'advanced'
  }
}
```

**Example Profile:**
```json
{
  "topics": ["async/await", "promises", "error handling"],
  "struggledWith": ["closures", "prototypes"],
  "masteredTopics": ["arrow functions", "destructuring"],
  "learningStyle": "practical",
  "preferredCourse": "nodejs",
  "lastActiveTopics": ["async/await", "promises"],
  "comprehensionLevel": {
    "async/await": "intermediate",
    "promises": "advanced"
  }
}
```

### 2. Conversation Context Storage

Every interaction is stored with rich metadata:

```typescript
interface ConversationContext {
  userId: string
  conversationId: string
  course: 'nodejs' | 'python'
  query: string
  response?: string
  topics?: string[]
  timestamp: Date
}
```

**Storage Example:**
```typescript
await mem0Service.storeConversation({
  userId: 'user_abc123',
  conversationId: 'conv_xyz789',
  course: 'nodejs',
  query: 'How do async/await work?',
  response: 'Async/await is syntactic sugar for promises...',
  topics: ['async', 'promises', 'asynchronous programming'],
  timestamp: new Date()
})
```

### 3. Personalized Context Retrieval

Before generating responses, Neruvi retrieves relevant user context:

```typescript
const personalizedContext = await mem0Service.getPersonalizedContext(
  userId,
  query,
  course
)

// Returns enriched context like:
// --- User Learning Context ---
// Learning Style: practical
// Previously struggled with: closures, prototypes
// Has mastered: arrow functions, destructuring
//
// Recent related learning:
// 1. User asked about async/await patterns
// 2. User explored promise chaining
// --- End Context ---
```

### 4. Comprehension Tracking

Track and update user understanding levels:

```typescript
await mem0Service.updateTopicComprehension(
  userId,
  'async/await',
  'intermediate',
  false  // struggledWith
)

// Or when user struggles:
await mem0Service.updateTopicComprehension(
  userId,
  'prototypes',
  'beginner',
  true  // struggledWith
)
```

## Implementation

### Service Initialization

```typescript
// src/lib/mem0-service.ts
class Mem0Service {
  private client: MemoryClient | null = null
  private initialized = false

  async initialize(): Promise<void> {
    const apiKey = process.env.MEM0_API_KEY
    if (!apiKey) {
      console.warn('⚠️ MEM0_API_KEY not configured - memory features disabled')
      return
    }

    this.client = new MemoryClient({ apiKey })
    this.initialized = true
    console.log('✅ Mem0 initialized successfully')
  }
}

export const mem0Service = new Mem0Service()
```

### Chat API Integration

```typescript
// src/app/api/chat/route.ts
export async function POST(req: Request) {
  const { userId, conversationId, query, course } = await req.json()

  // 1. Get personalized context from Mem0
  const personalizedContext = await mem0Service.getPersonalizedContext(
    userId,
    query,
    course
  )

  // 2. Enhance RAG with user context
  const ragResults = await ragService.search(query, course)
  const enhancedContext = ragResults + personalizedContext

  // 3. Generate AI response
  const response = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: enhancedContext },
      { role: 'user', content: query }
    ]
  })

  // 4. Store conversation in Mem0
  await mem0Service.storeConversation({
    userId,
    conversationId,
    course,
    query,
    response: response.choices[0].message.content,
    topics: extractTopics(query),
    timestamp: new Date()
  })

  return response
}
```

### Learning Profile API

```typescript
// src/app/api/learning-profile/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  const profile = await mem0Service.getUserLearningProfile(userId)

  return Response.json({
    success: true,
    profile: profile || {
      message: 'No learning history yet'
    }
  })
}
```

## Benefits

### 1. Adaptive Learning Paths

Mem0 enables Neruvi to:
- **Adjust complexity** based on comprehension level
- **Provide additional examples** for struggled topics
- **Skip basics** for mastered concepts
- **Recommend relevant topics** based on learning history

**Example:**
```
User Profile: Beginner in async/await, struggled with closures

Query: "How do I handle errors in async functions?"

AI Response (Adapted):
"Since you're learning async/await, let me explain error handling step by step.
Unlike closures (which you mentioned were tricky), async error handling is
more straightforward. Here's a practical example..."
```

### 2. Consistent Context Across Sessions

User context persists across:
- Multiple chat sessions
- Different conversations
- Days/weeks of learning
- Course switches (Node.js ↔ Python)

### 3. Learning Analytics

Track user progress over time:
- Topics explored
- Comprehension improvements
- Learning velocity
- Knowledge gaps

### 4. Intelligent Recommendations

Based on memory analysis:
```typescript
// If user mastered basics but never touched advanced topics
if (profile.masteredTopics.includes('promises') &&
    !profile.topics.includes('generators')) {
  suggest('generators', 'Next step after promises')
}

// If user struggled with concept multiple times
if (profile.struggledWith.includes('closures')) {
  provideDeeperExplanation('closures')
  suggestAlternativeResources('closures')
}
```

## Configuration

### Environment Variables

```env
# Required for Mem0 functionality
MEM0_API_KEY=m0-your-api-key-here

# Optional: Customize memory behavior
MEM0_MEMORY_LIMIT=100          # Max memories to retrieve
MEM0_RETENTION_DAYS=365        # How long to keep memories
```

### Feature Flags

```typescript
// Check if Mem0 is enabled
if (mem0Service.isEnabled()) {
  // Use personalized features
} else {
  // Fallback to basic RAG
}
```

## Best Practices

### 1. Privacy & GDPR Compliance

```typescript
// Clear user memory on request
async function handleUserDeletion(userId: string) {
  await mem0Service.clearUserMemory(userId)
  console.log(`🗑️ Cleared all memories for user ${userId}`)
}
```

### 2. Graceful Degradation

```typescript
// Always have fallback if Mem0 is unavailable
async function getContext(userId: string, query: string) {
  try {
    return await mem0Service.getPersonalizedContext(userId, query, course)
  } catch (error) {
    console.error('Mem0 unavailable, using basic context')
    return getBasicRAGContext(query)
  }
}
```

### 3. Efficient Memory Storage

```typescript
// Only store meaningful interactions
if (query.length > 10 && !isTestQuery(query)) {
  await mem0Service.storeConversation(context)
}
```

### 4. Semantic Search Optimization

```typescript
// Use relevant memory limit based on context
const memories = await mem0Service.getRelevantMemories(
  userId,
  query,
  isComplexQuery(query) ? 10 : 5  // More memories for complex queries
)
```

## Monitoring & Debugging

### Memory Storage Logs

```
💾 Stored conversation memory for user user_abc123
🧠 Retrieved 3 relevant memories
📈 Updated comprehension: async/await -> intermediate
```

### Profile Analysis

```typescript
const profile = await mem0Service.getUserLearningProfile(userId)
console.log('User Learning Profile:', {
  totalTopics: profile.topics.length,
  struggledWith: profile.struggledWith,
  masteredTopics: profile.masteredTopics,
  learningStyle: profile.learningStyle
})
```

## Future Enhancements

### Planned Features

1. **Learning Recommendations**
   - Suggest next topics based on progression
   - Identify knowledge gaps
   - Personalized learning paths

2. **Spaced Repetition**
   - Remind users to review struggled topics
   - Periodic knowledge checks
   - Adaptive review scheduling

3. **Learning Analytics Dashboard**
   - Visual progress tracking
   - Topic mastery heatmaps
   - Learning velocity charts

4. **Collaborative Learning**
   - Share learning patterns (anonymized)
   - Community insights
   - Peer comparison metrics

## Resources

- **Mem0 Documentation:** https://docs.mem0.ai
- **Mem0 GitHub:** https://github.com/mem0ai/mem0
- **Service Implementation:** `src/lib/mem0-service.ts`
- **API Integration:** `src/app/api/chat/route.ts`

## Summary

Mem0 transforms Neruvi from a static Q&A system into an **adaptive learning companion** that:
- Remembers user learning history
- Adapts explanations to skill level
- Tracks comprehension over time
- Provides personalized recommendations
- Maintains context across sessions

**Key Takeaway:** By integrating Mem0, Neruvi delivers truly personalized learning experiences that improve as users engage more with the platform.

---

**Part of Neruvi Documentation** - AI-Powered Learning with Intelligent Memory

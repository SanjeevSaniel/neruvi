# FlowMind API Documentation

## 🚀 Overview

The FlowMind API provides intelligent chat responses powered by RAG (Retrieval-Augmented Generation) technology. It specializes in Node.js and Python programming education with context-aware responses based on course content.

---

## 📡 Base URL

```
Local Development: http://localhost:3002
Production: [Your deployment URL]
```

---

## 🔐 Authentication

Currently, the API is open for educational use. Future versions will include:
- API key authentication
- Rate limiting per user
- Usage analytics

---

## 📋 Endpoints

### POST /api/chat

**Purpose**: Process user messages and return AI-generated responses with course context

#### Request

**Headers**:
```http
Content-Type: application/json
Accept: text/plain
```

**Body**:
```typescript
interface ChatRequest {
  messages: Message[];                    // Conversation history
  course: 'nodejs' | 'python' | 'both'; // Course filter
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}
```

**Example Request**:
```json
{
  "messages": [
    {
      "role": "user", 
      "content": "How do I create an Express.js server?"
    }
  ],
  "course": "nodejs"
}
```

#### Response

**Success Response (200)**:
- **Content-Type**: `text/plain; charset=utf-8`
- **Body**: Streaming text response
- **Headers**:
  - `X-Sources`: JSON array of source references (if available)

**Source Header Format**:
```typescript
interface SourceTimestamp {
  course: string;     // 'nodejs' | 'python' | 'both'
  section: string;    // Course section name
  videoId: string;    // Video identifier
  timestamp: string;  // Formatted time (MM:SS or HH:MM:SS)
  relevance: string;  // Relevance percentage (e.g., "85.2")
}
```

**Example Response Headers**:
```http
X-Sources: [
  {
    "course": "nodejs",
    "section": "Express Fundamentals",
    "videoId": "express-intro-01",
    "timestamp": "5:42",
    "relevance": "92.1"
  },
  {
    "course": "nodejs", 
    "section": "Server Setup",
    "videoId": "server-setup-02",
    "timestamp": "12:15",
    "relevance": "87.8"
  }
]
```

**Error Responses**:

```http
400 Bad Request
{
  "error": "Invalid request format",
  "message": "Messages array is required"
}

429 Too Many Requests  
{
  "error": "Rate limit exceeded",
  "message": "Maximum 30 requests per minute"
}

500 Internal Server Error
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 🎯 Request Examples

### Basic Node.js Query

```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What is middleware in Express.js?"
      }
    ],
    "course": "nodejs"
  }'
```

### Python-Specific Query

```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user", 
        "content": "How do Python list comprehensions work?"
      }
    ],
    "course": "python"
  }'
```

### Multi-Turn Conversation

```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What is async/await in Node.js?"
      },
      {
        "role": "assistant", 
        "content": "Async/await is a way to handle asynchronous operations..."
      },
      {
        "role": "user",
        "content": "Can you show me an example with error handling?"
      }
    ],
    "course": "nodejs"
  }'
```

### Cross-Course Query

```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What are the differences between Node.js and Python for web development?"
      }
    ],
    "course": "both"
  }'
```

---

## 🔄 Response Processing

### Streaming Response

The API returns streaming responses for real-time user experience:

**JavaScript (Fetch API)**:
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages, course })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log('Received chunk:', chunk);
  // Update UI with chunk
}

// Get source references from headers
const sources = response.headers.get('X-Sources');
if (sources) {
  const sourceList = JSON.parse(sources);
  console.log('Sources:', sourceList);
}
```

**Python (with requests)**:
```python
import requests
import json

response = requests.post(
    'http://localhost:3002/api/chat',
    json={
        'messages': [{'role': 'user', 'content': 'What is Express.js?'}],
        'course': 'nodejs'
    },
    stream=True
)

for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
    if chunk:
        print(chunk, end='')

# Get sources
sources_header = response.headers.get('X-Sources')
if sources_header:
    sources = json.loads(sources_header)
    print(f"\nSources: {sources}")
```

---

## 📊 Response Quality Factors

### Context Relevance

The API uses advanced RAG techniques to provide contextual responses:

1. **HYDE Enhancement**: Generates hypothetical ideal answers to improve search
2. **Vector Search**: Finds semantically similar content from course materials  
3. **Metadata Filtering**: Filters by course, difficulty, and topic
4. **Cross-Encoder Reranking**: Reorders results by relevance

### Course Specialization

**Node.js Course Content**:
- Express.js framework and middleware
- Async/await patterns and promises
- REST API development
- Authentication and security (JWT, bcrypt)
- Database integration (MongoDB, Mongoose)
- NPM package management
- Server deployment and scaling

**Python Course Content**:
- Language fundamentals (variables, functions, classes)
- Data structures and algorithms
- Object-oriented programming
- Web frameworks (Django, Flask)
- Data science libraries (NumPy, pandas, matplotlib)
- Machine learning basics
- File I/O and data processing

**Both Courses Content**:
- General programming concepts
- Software architecture patterns
- Debugging techniques and best practices
- Version control (Git)
- Testing strategies
- Performance optimization

---

## ⚡ Performance Optimization

### Caching Strategy

The API implements intelligent caching for improved response times:

**Cache Key Generation**:
```typescript
// Normalized query for consistent caching
const cacheKey = query
  .toLowerCase()
  .replace(/[^\w\s]/g, '')
  .trim()
  .split(/\s+/)
  .sort()
  .join(' ');
```

**Cache Benefits**:
- **Identical Queries**: "What is Express.js?" = "what is express js"
- **Order Independence**: "async await node" = "node async await"  
- **5-minute TTL**: Fresh content with performance benefits
- **Memory Efficient**: LRU eviction for memory management

### Response Time Optimization

**Parallel Processing**:
```typescript
// Concurrent operations for faster response
const [ragResults, hydeResults] = await Promise.all([
  qdrantRAG.search(query, 4, course),
  hydeEnhanced.generateEnhancedHyde(query, course)
]);
```

**Expected Response Times**:
- **Cache Hit**: 10-50ms
- **Cache Miss (Simple Query)**: 500-1500ms
- **Cache Miss (Complex Query)**: 1000-3000ms
- **First Request (Cold Start)**: 2000-5000ms

---

## 🎨 Integration Examples

### React Integration

```tsx
import { useState, useCallback } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ChatComponent = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [course, setCourse] = useState<'nodejs' | 'python' | 'both'>('nodejs');

  const sendMessage = useCallback(async (content: string) => {
    const newMessages = [...messages, { role: 'user' as const, content }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          course
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantMessage += chunk;
          
          // Update UI in real-time
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: assistantMessage 
          }]);
        }
      }

      // Get and display sources
      const sources = response.headers.get('X-Sources');
      if (sources) {
        console.log('Response sources:', JSON.parse(sources));
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, course]);

  return (
    <div className="chat-container">
      <select value={course} onChange={(e) => setCourse(e.target.value as any)}>
        <option value="nodejs">Node.js</option>
        <option value="python">Python</option>
        <option value="both">Both Courses</option>
      </select>
      
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="loading">AI is thinking...</div>}
      </div>
      
      <input 
        type="text" 
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
        placeholder="Ask about Node.js or Python..."
      />
    </div>
  );
};
```

### Vue.js Integration

```vue
<template>
  <div class="chat-component">
    <div class="course-selector">
      <select v-model="selectedCourse">
        <option value="nodejs">Node.js</option>
        <option value="python">Python</option>
        <option value="both">Both</option>
      </select>
    </div>
    
    <div class="messages" ref="messagesContainer">
      <div 
        v-for="(message, index) in messages" 
        :key="index"
        :class="['message', message.role]"
      >
        {{ message.content }}
      </div>
    </div>
    
    <div class="input-area">
      <input 
        v-model="currentInput"
        @keyup.enter="sendMessage"
        :disabled="isLoading"
        placeholder="Ask your programming question..."
      />
      <button @click="sendMessage" :disabled="isLoading || !currentInput.trim()">
        Send
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const messages = reactive([]);
const currentInput = ref('');
const selectedCourse = ref('nodejs');
const isLoading = ref(false);

const sendMessage = async () => {
  if (!currentInput.value.trim()) return;
  
  const userMessage = { role: 'user', content: currentInput.value };
  messages.push(userMessage);
  
  const requestMessages = [...messages];
  isLoading.value = true;
  currentInput.value = '';
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: requestMessages,
        course: selectedCourse.value
      })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    const assistantMessage = { role: 'assistant', content: '' };
    messages.push(assistantMessage);
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      assistantMessage.content += decoder.decode(value);
    }
    
  } catch (error) {
    console.error('Chat error:', error);
    messages.push({
      role: 'assistant',
      content: 'Sorry, something went wrong. Please try again.'
    });
  } finally {
    isLoading.value = false;
  }
};
</script>
```

---

## 🐛 Error Handling

### Common Error Scenarios

**1. Invalid Request Format**
```http
HTTP 400 Bad Request
{
  "error": "Validation Error",
  "details": [
    "messages array is required",
    "course must be one of: nodejs, python, both"
  ]
}
```

**2. Rate Limiting**
```http
HTTP 429 Too Many Requests
{
  "error": "Rate Limit Exceeded", 
  "message": "Maximum 30 requests per minute exceeded",
  "retryAfter": 45
}
```

**3. Server Errors**
```http
HTTP 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "RAG service unavailable",
  "requestId": "req_123456"
}
```

### Error Recovery Strategies

**Client-Side Retry Logic**:
```typescript
const chatWithRetry = async (messages: Message[], course: string, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, course })
      });
      
      if (response.ok) return response;
      
      if (response.status === 429) {
        // Rate limited - wait before retry
        const retryAfter = response.headers.get('Retry-After') || '60';
        await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
        continue;
      }
      
      if (response.status >= 500) {
        // Server error - exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      // Client error - don't retry
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.warn(`Attempt ${attempt} failed, retrying...`, error);
    }
  }
};
```

---

## 📈 Usage Analytics

### Request Monitoring

**Response Time Tracking**:
```http
X-Response-Time: 1247ms
X-Cache-Status: miss
X-RAG-Results: 4
X-Processing-Time: 890ms
```

**Usage Metrics**:
- Average response time per course
- Cache hit/miss ratios
- Most common query types
- Peak usage patterns

### Best Practices

**Optimization Tips**:
1. **Cache Similar Queries**: Rephrase common questions consistently
2. **Course Selection**: Use specific course filters for better context
3. **Conversation Context**: Include previous messages for better responses
4. **Error Handling**: Implement retry logic with exponential backoff
5. **Rate Limiting**: Respect API limits and implement client-side queuing

**Query Optimization**:
```typescript
// Good: Specific, clear questions
"How do I handle errors in Express.js middleware?"

// Better: Include context for more targeted responses
"I'm getting a 500 error in my Express.js app when users submit invalid data. How should I handle validation errors in middleware?"

// Best: Build on previous conversation
[
  { role: 'user', content: 'How do I validate user input in Express?' },
  { role: 'assistant', content: '...' },
  { role: 'user', content: 'What happens if validation fails?' }
]
```

---

## 🔮 Future API Features

### Planned Enhancements

**v2.0 Features**:
- User authentication and personalization
- Custom course content upload
- Advanced search filters (difficulty, topic, duration)
- Conversation history persistence
- Real-time collaboration features

**v2.1 Features**:
- Multi-language support
- Voice input/output integration
- Code execution sandbox
- Interactive coding challenges
- Learning progress tracking

---

*This API documentation is actively maintained. For the latest updates, please refer to the project repository or contact the development team.*
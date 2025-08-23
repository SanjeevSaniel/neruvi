# 🧠 FlowMind ✨

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-BB4B96?style=for-the-badge&logo=framer&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3-88CE02?style=for-the-badge&logo=greensock&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-5-74AA9C?style=for-the-badge&logo=openai&logoColor=white)
![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-5-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-1-FF6154?style=for-the-badge&logo=qdrant&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-FF9800?style=for-the-badge&logo=zustand&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-5FA04E?style=for-the-badge&logo=node.js&logoColor=white)
![Lucide React](https://img.shields.io/badge/Lucide_React-0.5-2563EB?style=for-the-badge&logo=lucide&logoColor=white)

**Advanced AI-powered learning assistant** for Node.js and Python courses with **RAG (Retrieval-Augmented Generation)** capabilities and Microsoft Copilot/Claude-style interface.

## 🚀 **Production-Ready Features**

✅ **Advanced RAG System Implementation**  
✅ **Real-time Chat Interface with Streaming**  
✅ **Vector Embeddings & Semantic Search**  
✅ **HyDE (Hypothetical Document Embeddings)**  
✅ **Intelligent Context Rewriting**  
✅ **Lavender Theme with Figtree Typography**  
✅ **61+ Course Content Chunks Processed**  

---

## 🏗️ **Technical Architecture**

> 📊 **[View Complete Architecture Flow Diagram →](./ARCHITECTURE.md)**

### **RAG System Core**

- **Vector Database**: Local fallback system with OpenAI embeddings (1536 dimensions)
- **Chunking Strategy**: Intelligent VTT transcript processing with temporal awareness
- **Search Methods**: Semantic search + HyDE + Context rewriting
- **Content Sources**: 61 chunks from Node.js & Python course transcripts

### **AI Integration**

- **OpenAI GPT-4o-mini**: Chat completions with streaming
- **OpenAI text-embedding-3-small**: Vector embeddings generation
- **Vercel AI SDK**: Streaming interface and response handling
- **Custom System Prompts**: Course-aligned educational responses

### **Frontend Stack**

- **Next.js 15**: App Router with TypeScript
- **Tailwind CSS**: Custom Figtree font integration + Lavender theme
- **Framer Motion**: Smooth animations and transitions
- **Streaming UI**: Real-time response rendering

---

## 📊 **RAG Implementation Details**

### **1. Document Processing Pipeline**

```typescript
// VTT Transcript → Chunks → Embeddings → Vector Store
const processVTTFile = async (filePath: string) => {
  const content = await fs.readFile(filePath, 'utf-8')
  const chunks = this.chunkVTTContent(content)  // ~500 char chunks
  
  for (const chunk of chunks) {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk.content,
      dimensions: 1536
    })
    // Store with metadata: course, section, videoId, timestamps, topics
  }
}
```

### **2. Semantic Search Engine**

```typescript
// Cosine similarity search with relevance scoring
const semanticSearch = async (query: string, limit = 5) => {
  const queryEmbedding = await createEmbedding(query)
  
  return vectorStore
    .map(item => ({
      ...item,
      score: cosineSimilarity(queryEmbedding, item.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .filter(r => r.score > 0.1)  // Relevance threshold
}
```

### **3. HyDE (Hypothetical Document Embeddings)**

```typescript
// Generate hypothetical document → Search → Combine results
const hydeSearch = async (query: string) => {
  const hypotheticalDoc = await generateHypotheticalDocument(query)
  const hydeResults = await semanticSearch(hypotheticalDoc, 3)
  const directResults = await semanticSearch(query, 3)
  
  return deduplicateAndRank([...hydeResults, ...directResults])
}
```

### **4. Context Rewriting System**

```typescript
// Multi-perspective query enhancement
const rewriteQuery = async (query: string) => {
  const prompt = `Rewrite this learning query into 3-4 variations:
  1. Use different technical terms
  2. Focus on different aspects (concepts vs implementation)
  3. Use beginner and advanced language
  4. Include related topics`
  
  return await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  })
}
```

---

## 🎯 **Performance Metrics**

| Metric | Value |
|--------|--------|
| **Content Processed** | 61 chunks (31 Node.js + 30 Python) |
| **Search Accuracy** | 0.4+ similarity scores for relevant queries |
| **Response Time** | <2s for semantic search |
| **Chunk Size** | ~500 characters optimal |
| **Embedding Model** | text-embedding-3-small (1536d) |
| **Chat Model** | GPT-4o-mini with streaming |

---

## 🚀 **Quick Start**

### **Prerequisites**

```bash
Node.js 18+ • OpenAI API Key • Modern Browser
```

### **Installation**

```bash
# Clone and install
git clone <repository>
cd flowmind
npm install

# Environment setup
cp .env.example .env.local
# Add your OPENAI_API_KEY

# Start development
npm run dev
# Visit: http://localhost:3000
```

### **Test RAG System**

```bash
# Test complete pipeline
npm run test-rag

# Debug processing
npm run debug-rag

# Process additional transcripts
npm run process-vtt
```

---

## 🔧 **Available Commands**

```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run start           # Production server

# RAG System Testing
npm run test-rag        # Complete RAG pipeline test
npm run debug-rag       # Detailed processing debug
npm run process-vtt     # Process VTT transcripts

# Legacy Qdrant Commands (fallback available)
npm run test-qdrant     # Test Qdrant connection
npm run init-collections # Initialize Qdrant collections
```

---

## 📁 **Project Structure**

```Plaintext
flowmind/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts      # Streaming chat API with RAG
│   │   ├── globals.css            # Figtree font integration
│   │   └── page.tsx               # Main application
│   ├── components/chat/
│   │   └── ChatInterface.tsx      # Lavender-themed chat UI
│   ├── data/transcripts/          # Course content (61 chunks processed)
│   │   ├── nodejs/                # Node.js course sections
│   │   │   ├── 01-fundamentals/   # 26 VTT files
│   │   │   ├── 02-authentication/ # 8 VTT files
│   │   │   └── 03-system-design/  # 12 VTT files
│   │   └── python/                # Python course sections
│   │       ├── 01-introduction/   # 10 VTT files
│   │       ├── 02-data-types/     # 9 VTT files
│   │       └── ...10 sections     # 80+ VTT files total
│   ├── lib/
│   │   ├── local-rag.ts           # Core RAG system implementation
│   │   ├── openai.ts              # OpenAI client configuration
│   │   └── content-mapping.ts     # Course section mappings
│   ├── scripts/
│   │   ├── test-local-rag.ts      # RAG system testing
│   │   └── debug-rag.ts           # Processing diagnostics
│   └── tailwind.config.js         # Figtree font configuration
```

---

## 🎨 **Design System**

### **Color Palette**

- **Primary**: Lavender (#FAD4FF) with complementary purples
- **Backgrounds**: Subtle gradients from primary color
- **Typography**: Figtree font family for modern readability
- **Interactive**: Solid/faded button states for clear UX

### **Component Architecture**

- **Message Cards**: Enhanced with user avatars and intelligent timestamps
- **Input System**: Elevated design with gradients and glows
- **Status Indicators**: Real-time RAG system status display
- **Responsive Layout**: Compact yet spacious design philosophy

---

## 🔑 **Environment Configuration**

```env
# Required
OPENAI_API_KEY=sk-proj-your-openai-key

# Optional (Local RAG fallback active)
QDRANT_URL=https://your-qdrant-instance.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key

# Database (if needed)
DATABASE_URL=your-database-url

# Next.js
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

---

## 🧠 **RAG System Capabilities**

### **Intelligent Search**

- **Semantic Understanding**: Vector similarity with 0.4+ accuracy
- **Multi-perspective Queries**: 3-4 query variations per request
- **Hypothetical Document Generation**: AI-enhanced search relevance
- **Course-specific Context**: Tailored responses for Node.js/Python

### **Content Processing**

- **VTT Transcript Parsing**: Temporal-aware chunking with timestamps
- **Section Mapping**: Organized by course structure and topics
- **Topic Extraction**: Keyword-based topic identification
- **Metadata Enhancement**: Rich context with video IDs and time references

### **Response Generation**

```typescript
// Enhanced system prompt with RAG context
const systemPrompt = `You are FlowMind, an advanced AI learning assistant.

## RAG Context:
${ragContext}

## Response Guidelines:
- Be Precise: Use provided context for accuracy
- Be Practical: Include code examples and applications  
- Be Educational: Structure responses progressively
- Reference Sources: Mention course materials when relevant`
```

---

## 📊 **Usage Analytics**

### **Processed Content**

- **Node.js Fundamentals**: 21 chunks covering V8 engine, runtime concepts
- **Node.js Installation**: 10 chunks with setup procedures
- **Python Introduction**: 12 chunks with instructor content
- **Python Programming Basics**: 18 chunks with core concepts

### **Search Performance**

- **Node.js Query**: "What is async await?" → 0.613 similarity score
- **Python Query**: "How do functions work?" → 0.417 similarity score
- **Context Rewriting**: 3-4 variations per query for comprehensive coverage

---

## 🤝 **Contributing**

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Test RAG system**: `npm run test-rag`
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open Pull Request**

---

## 📝 **Usage Examples**

### **Course Content Queries**

```Plaintext
User: "What is Node.js and how does it work?"
FlowMind: Based on course materials, Node.js is a JavaScript runtime 
environment that embeds the V8 engine into a C program, allowing you 
to execute JavaScript outside the browser...
[Timestamp: 7:09 - Node.js Fundamentals]
```

### **Programming Concepts**

```Plaintext
User: "Explain Python functions"
FlowMind: From the course content, Python functions are reusable blocks 
of code that encapsulate specific functionality. They help reduce 
duplication and split complex tasks...
[Course Section: Functions & Scope]
```

---

## 🛠️ **Technical Specifications**

| Component | Technology | Version |
|-----------|------------|---------|
| **Runtime** | Node.js | 18+ |
| **Framework** | Next.js | 15 |
| **Language** | TypeScript | 5+ |
| **Styling** | Tailwind CSS | 3+ |
| **Font** | Figtree | Google Fonts |
| **AI Model** | GPT-4o-mini | Latest |
| **Embeddings** | text-embedding-3-small | 1536d |
| **Vector Store** | Local RAG System | Custom |
| **Streaming** | Vercel AI SDK | 3+ |

---

## 🚀 **Deployment**

### **Vercel (Recommended)**

```bash
# Deploy to Vercel
vercel --prod

# Environment variables required:
# OPENAI_API_KEY
```

### **Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **OpenAI** for GPT-4 and embedding models
- **Vercel** for AI SDK and deployment platform
- **Next.js Team** for the excellent framework
- **Tailwind CSS** for the utility-first styling approach
- **Course Creators** for the educational content

---

**Built with ❤️ for enhanced learning experiences through AI**

*FlowMind - Where AI meets education for accelerated learning*

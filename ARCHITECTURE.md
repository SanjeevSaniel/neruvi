# FlowMind Architecture Flow Diagram

```mermaid
graph TB
    %% User Interface Layer
    subgraph "Frontend Layer"
        UI[🎨 User Interface]
        CI[💬 ChatInterface]
        WS[🏠 WelcomeScreen]
        CS[📚 CourseSelector]
        MC[💭 MessagesContainer]
        MB[💬 MessageBubble]
        MDP[📋 MessageDetailPanel]
        CHI[⌨️ ChatInput]
        CHH[🔝 ChatHeader]
        CBS[📂 ConversationSidebar]
    end

    %% State Management
    subgraph "State Management"
        ZS[🗃️ Zustand Store<br/>conversationStore]
    end

    %% API Layer
    subgraph "API Layer"
        API[🔌 /api/chat Route]
        RAG[🧠 RAG System]
        LR[💾 Local RAG]
        QC[🔍 Qdrant Client]
    end

    %% AI Services
    subgraph "AI Services"
        OAI[🤖 OpenAI API]
        EMB[📊 Embeddings<br/>text-embedding-3-small]
        GPT[🧩 GPT-4o-mini<br/>Chat Completion]
        HYDE[📝 HyDE System]
    end

    %% Data Layer
    subgraph "Data Processing"
        VTT[📹 VTT Transcripts]
        CHUNKS[📦 Content Chunks]
        VS[🗂️ Vector Store<br/>Local/Qdrant]
        META[📋 Metadata<br/>Course, Timestamps]
    end

    %% User Flow
    UI --> WS
    UI --> CS
    UI --> CI

    %% Welcome Screen Flow
    WS --> CS
    WS --> CHI

    %% Course Selection Flow
    CS --> ZS
    CS --> CI

    %% Chat Interface Flow
    CI --> CHH
    CI --> MC
    CI --> MDP
    CI --> CHI
    CI --> CBS

    %% Message Flow
    MC --> MB
    MB --> MDP
    CHI --> API

    %% State Management Flow
    ZS --> CI
    ZS --> MC
    ZS --> CBS

    %% API Processing Flow
    API --> RAG
    RAG --> LR
    RAG --> QC
    RAG --> OAI

    %% AI Processing Flow
    OAI --> EMB
    OAI --> GPT
    RAG --> HYDE

    %% Data Flow
    VTT --> CHUNKS
    CHUNKS --> EMB
    EMB --> VS
    VS --> RAG
    META --> VS

    %% Response Flow
    GPT --> API
    API --> CI
    VS --> API

    %% Styling
    classDef frontend fill:#E8F4FD,stroke:#1976D2,stroke-width:2px
    classDef state fill:#FFF3E0,stroke:#F57C00,stroke-width:2px
    classDef api fill:#E8F5E8,stroke:#388E3C,stroke-width:2px
    classDef ai fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
    classDef data fill:#FFF8E1,stroke:#FBC02D,stroke-width:2px

    class UI,CI,WS,CS,MC,MB,MDP,CHI,CHH,CBS frontend
    class ZS state
    class API,RAG,LR,QC api
    class OAI,EMB,GPT,HYDE ai
    class VTT,CHUNKS,VS,META data
```

## Architecture Components

### 🎨 Frontend Layer

- **ChatInterface**: Main orchestrator component
- **WelcomeScreen**: Initial user onboarding
- **CourseSelector**: Course selection interface
- **MessagesContainer**: Chat message display
- **MessageBubble**: Individual message rendering
- **MessageDetailPanel**: Expandable message details
- **ChatInput**: User input handling
- **ChatHeader**: Navigation and branding
- **ConversationSidebar**: Conversation management

### 🗃️ State Management

- **Zustand Store**: Centralized conversation state
  - Current conversation tracking
  - Message history management
  - Course selection persistence
  - UI state coordination

### 🔌 API Layer

- **Chat Route**: Streaming chat API endpoint
- **RAG System**: Retrieval-augmented generation
- **Local RAG**: Fallback vector search
- **Qdrant Client**: Vector database integration

### 🤖 AI Services

- **OpenAI API**: Primary AI service provider
- **Embeddings**: Text-to-vector conversion
- **GPT-4o-mini**: Chat completion generation
- **HyDE System**: Hypothetical document embeddings

### 💾 Data Processing

- **VTT Transcripts**: Course content source
- **Content Chunks**: Processed text segments
- **Vector Store**: Embedded content storage
- **Metadata**: Course and timestamp information

## Data Flow Sequence

```mermaid
sequenceDiagram
    participant User
    participant ChatInterface
    participant ZustandStore
    participant ChatAPI
    participant RAGSystem
    participant OpenAI
    participant VectorStore

    User->>ChatInterface: Send Message
    ChatInterface->>ZustandStore: Update Messages
    ChatInterface->>ChatAPI: POST /api/chat

    ChatAPI->>RAGSystem: Search Context
    RAGSystem->>VectorStore: Query Embeddings
    VectorStore-->>RAGSystem: Return Matches

    RAGSystem->>OpenAI: Create Embedding
    OpenAI-->>RAGSystem: Return Embedding

    RAGSystem->>OpenAI: HyDE Generation
    OpenAI-->>RAGSystem: Hypothetical Doc

    RAGSystem-->>ChatAPI: Contextualized Results

    ChatAPI->>OpenAI: Chat Completion
    OpenAI-->>ChatAPI: Stream Response
    ChatAPI-->>ChatInterface: Stream Chunks

    ChatInterface->>ZustandStore: Update Response
    ChatInterface->>User: Display Response
```

## Component Interactions

### 🔄 State Flow

1. **Course Selection** → ZustandStore → ChatInterface
2. **Message Creation** → ZustandStore → MessagesContainer
3. **Conversation Management** → ZustandStore → ConversationSidebar

### 🚀 Request Flow

1. **User Input** → ChatInput → ChatInterface
2. **API Call** → Chat Route → RAG System
3. **Context Retrieval** → Vector Store → OpenAI
4. **Response Generation** → Streaming → UI Update

### 📊 Data Processing Flow

1. **VTT Files** → Content Chunking → Embedding Generation
2. **Vector Storage** → Semantic Search → Context Retrieval
3. **HyDE Enhancement** → Query Expansion → Better Matching

## Key Features

### 🎯 Smart Context Retrieval

- Semantic search with cosine similarity
- HyDE for query enhancement
- Multi-perspective query rewriting
- Relevance scoring and filtering

### 💫 Real-time UI

- Streaming response rendering
- Animated typing indicators
- Smooth transitions with Framer Motion
- Responsive two-column layout

### 🧠 Advanced AI Integration

- GPT-4o-mini for chat completions
- text-embedding-3-small for vectors
- Custom system prompts
- Source attribution with timestamps

### 📱 Modern UX

- Course-specific conversations
- Expandable message details
- Markdown export functionality
- Smart panel visibility controls

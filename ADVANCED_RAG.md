# Advanced RAG Integration in FlowMind

This document explains the Advanced RAG (Retrieval-Augmented Generation) system integrated into the FlowMind chat application.

## Overview

The Advanced RAG system enhances the quality and accuracy of responses by combining multiple sophisticated techniques:

- **Corrective RAG (CRAG)** - Self-correcting retrieval system
- **LLM-as-a-Judge** - Response quality evaluation using GPT-4o-mini
- **Multi-strategy Query Rewriting** - 6 different query enhancement approaches
- **Sub-query Decomposition** - Breaking complex queries into manageable parts
- **Enhanced HyDE** - Hypothetical Document Embeddings
- **Query Optimization** - Smart query preprocessing

## API Integration

### Request Format

The chat API now supports advanced RAG configuration:

```typescript
POST /api/chat
{
  "messages": [...],
  "course": "nodejs" | "python",
  "useAdvancedRAG": true,  // Default: true
  "advancedRAGConfig": {
    "enableCorrectiveRAG": true,
    "enableQueryRewriting": true,
    "enableSubqueryDecomposition": true,
    "enableLLMJudge": true,
    "enableHyDE": true
  }
}
```

### Response Headers

The API includes additional headers for monitoring and analytics:

```
X-Sources: [...] // Source timestamps as before
X-RAG-Metrics: {
  "processingTime": 1200,
  "confidence": 0.85,
  "technique": "corrective_rag_with_subqueries",
  "corrections": ["Query expanded with technical terms"],
  "useAdvancedRAG": true,
  "sourceCount": 3
}
```

## System Architecture

### 1. Query Processing Pipeline

```
User Query → Query Analysis → Strategy Selection → Retrieval → Quality Evaluation → Response Generation
```

### 2. Technique Selection Logic

- **Simple queries**: Basic RAG or Query Rewriting
- **Complex queries**: Sub-query Decomposition + Corrective RAG
- **Low-quality results**: Corrective RAG with iterative improvement
- **High-quality results**: LLM-as-a-Judge validation

### 3. Quality Assurance

- Confidence scoring for all responses
- Automatic correction when quality falls below threshold (0.7)
- LLM-as-a-Judge evaluation with detailed feedback
- Multiple fallback strategies

## Key Features

### Corrective RAG (CRAG)
- Evaluates retrieval quality using LLM-as-a-Judge
- Automatically refines queries when results are poor
- Iterative improvement with up to 3 attempts
- Minimum confidence threshold of 0.7

### Query Rewriting Strategies
1. **Contextual Enhancement** - Add conversation context
2. **Technical Specification** - Add technical keywords
3. **Synonym Expansion** - Include related terms
4. **Clarification** - Make ambiguous queries specific
5. **Decomposition Preview** - Break into sub-parts
6. **Educational Focus** - Emphasize learning aspects

### Sub-query Decomposition
- Breaks complex queries into 2-4 focused sub-questions
- Maintains dependency relationships between sub-queries
- Synthesizes comprehensive final answers
- Ideal for multi-part or tutorial-style questions

### LLM-as-a-Judge
- Evaluates responses across 5 criteria: accuracy, relevance, completeness, clarity, helpfulness
- Uses GPT-4o-mini for cost-effective evaluation
- Provides detailed feedback and improvement suggestions
- Automatically triggers response improvement when needed

## Configuration Options

### Pipeline Configuration

```typescript
interface PipelineConfig {
  enableCorrectiveRAG?: boolean;      // Default: true
  enableQueryRewriting?: boolean;     // Default: true
  enableSubqueryDecomposition?: boolean; // Default: true
  enableLLMJudge?: boolean;          // Default: true
  enableHyDE?: boolean;              // Default: true
  maxSources?: number;               // Default: 5
  qualityThreshold?: number;         // Default: 0.7
  maxRetries?: number;               // Default: 3
}
```

### User Context Configuration

```typescript
interface UserContext {
  preferredLanguage?: 'nodejs' | 'python';
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  previousQueries?: string[];
  interests?: string[];
}
```

## Performance Considerations

### Model Usage Optimization

- **GPT-4o** for core response generation and synthesis
- **GPT-4o-mini** for evaluations, query rewriting, and decomposition
- Smart caching to reduce redundant API calls
- Parallel processing where possible

### Processing Time

- Simple queries: ~500-1000ms
- Complex queries with full features: ~2000-4000ms
- Corrective iterations add ~800-1200ms each

### Cost Optimization

- GPT-4o-mini for evaluation tasks (90% cost reduction vs GPT-4o)
- Intelligent technique selection based on query complexity
- Early termination when quality thresholds are met

## Testing

Run the Advanced RAG integration test:

```bash
npm run test:advanced-rag
# or
npx tsx src/scripts/test-advanced-rag.ts
```

## Fallback Behavior

The system gracefully falls back to basic RAG if:
- Advanced RAG components are unavailable
- API limits are reached
- Errors occur during processing
- `useAdvancedRAG` is set to `false`

## Monitoring and Analytics

Use the `X-RAG-Metrics` header to monitor:
- Response quality and confidence scores
- Processing times and performance
- Technique effectiveness
- Error rates and fallback usage

This enables continuous improvement and optimization of the RAG system.
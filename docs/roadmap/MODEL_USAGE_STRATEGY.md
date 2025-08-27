# 🤖 FlowMind Model Usage Strategy: GPT-4o vs GPT-4o-mini

## 🎯 **Strategic Model Allocation**

### **Core Principle**: Optimize for both performance and cost-efficiency by using the right model for the right task.

---

## 🚀 **GPT-4o: Core Features & High-Value Tasks**

### **Primary Use Cases**:
- **Main Chat Responses**: User-facing response generation  
- **Complex Query Processing**: Multi-step reasoning and synthesis
- **Response Improvement**: Enhancing responses based on evaluation feedback
- **Content Generation**: Creating educational content and examples
- **Subquery Synthesis**: Combining multiple subquery results into coherent responses

### **Technical Implementation**:

```typescript
// src/lib/model-selector.ts
export const CORE_MODEL_CONFIG = {
  model: 'gpt-4o',
  temperature: 0.7,
  max_tokens: 1200,
  top_p: 0.9,
  use_cases: [
    'chat_response',
    'response_improvement', 
    'content_synthesis',
    'complex_reasoning',
    'educational_content'
  ]
};

// Chat API Route - Updated
export const POST = async (req: Request) => {
  // ... existing code ...
  
  const result = streamText({
    model: getOpenAIClient()('gpt-4o'), // ✅ Using GPT-4o for main responses
    system: systemPrompt,
    messages,
    temperature: 0.7,
    topP: 0.9,
  });
  
  // ... rest of implementation
};
```

### **Usage Scenarios**:

```typescript
class CoreResponseGenerator {
  async generateMainResponse(
    query: string, 
    context: string, 
    course: string
  ): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o', // ✅ Core feature - use GPT-4o
      messages: [
        { role: 'system', content: this.buildSystemPrompt(course) },
        { role: 'user', content: `Context: ${context}\n\nQuery: ${query}` }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });
    
    return response.choices[0].message.content;
  }
  
  async improveResponse(
    originalResponse: string,
    evaluation: ResponseEvaluation,
    context: string
  ): Promise<string> {
    const improved = await this.openai.chat.completions.create({
      model: 'gpt-4o', // ✅ High-value improvement task
      messages: [{
        role: 'user',
        content: `Improve this response based on evaluation feedback:
                 Original: ${originalResponse}
                 Feedback: ${JSON.stringify(evaluation)}
                 Context: ${context}`
      }],
      temperature: 0.3,
      max_tokens: 1500
    });
    
    return improved.choices[0].message.content;
  }
}
```

---

## ⚖️ **GPT-4o-mini: Evaluation & Utility Tasks**

### **Primary Use Cases**:
- **LLM-as-a-Judge**: Response quality evaluation
- **Query Classification**: Intent detection and categorization  
- **Content Evaluation**: Relevance and quality scoring
- **Metadata Extraction**: Extracting structured data from responses
- **Quick Analysis**: Fast computational tasks that don't require deep reasoning

### **Technical Implementation**:

```typescript
export const JUDGE_MODEL_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.1, // Lower temperature for consistent evaluation
  max_tokens: 800,
  use_cases: [
    'response_evaluation',
    'relevance_scoring',
    'query_classification',
    'metadata_extraction',
    'quick_analysis'
  ]
};

class EvaluationSystem {
  async evaluateResponseQuality(
    query: string,
    response: string,
    sources: Document[]
  ): Promise<ResponseEvaluation> {
    
    const evaluation = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // ✅ Perfect for evaluation tasks
      messages: [{
        role: 'user',
        content: this.buildEvaluationPrompt(query, response, sources)
      }],
      temperature: 0.1, // Consistent evaluation
      max_tokens: 600
    });
    
    return JSON.parse(evaluation.choices[0].message.content);
  }
  
  async classifyQueryIntent(query: string, course: string): Promise<QueryIntent> {
    const classification = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // ✅ Quick classification task
      messages: [{
        role: 'user',
        content: `Classify this ${course} query intent:
                 "${query}"
                 
                 Categories: concept_explanation, code_help, debugging, 
                           best_practices, project_guidance, other
                 
                 Return JSON: {"intent": "category", "confidence": 0.95}`
      }],
      temperature: 0.1,
      max_tokens: 100
    });
    
    return JSON.parse(classification.choices[0].message.content);
  }
}
```

---

## 🔄 **Advanced RAG Implementation Updates**

### **Model-Specific Task Allocation**:

```typescript
// Updated Advanced RAG Pipeline
class AdvancedRAGPipeline {
  private coreModel = 'gpt-4o';      // For response generation
  private judgeModel = 'gpt-4o-mini'; // For evaluation tasks
  
  async processQuery(
    originalQuery: string,
    course: string,
    userContext: UserContext
  ): Promise<AdvancedRAGResult> {
    
    // Step 1: Query Analysis (Judge Model)
    const queryIntent = await this.classifyQuery(originalQuery, course);
    
    // Step 2: Document Retrieval & Evaluation (Judge Model)
    const documents = await this.retrieveAndEvaluateDocuments(originalQuery, course);
    
    // Step 3: Response Generation (Core Model)  
    const response = await this.generateResponse(originalQuery, documents, course);
    
    // Step 4: Quality Evaluation (Judge Model)
    const evaluation = await this.evaluateResponse(originalQuery, response, documents);
    
    // Step 5: Response Improvement if needed (Core Model)
    const finalResponse = evaluation.overallScore < 0.7 
      ? await this.improveResponse(response, evaluation, documents)
      : response;
    
    return {
      originalQuery,
      finalResponse,
      evaluation,
      modelUsage: {
        coreModelCalls: evaluation.overallScore < 0.7 ? 2 : 1, // Generation + potential improvement
        judgeModelCalls: 3 // Classification + document evaluation + response evaluation
      }
    };
  }
  
  private async generateResponse(
    query: string, 
    documents: Document[], 
    course: string
  ): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.coreModel, // ✅ GPT-4o for main response
      messages: [
        { role: 'system', content: this.buildSystemPrompt(course) },
        { role: 'user', content: this.buildQueryPrompt(query, documents) }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });
    
    return response.choices[0].message.content;
  }
  
  private async evaluateResponse(
    query: string,
    response: string,
    documents: Document[]
  ): Promise<ResponseEvaluation> {
    const evaluation = await this.openai.chat.completions.create({
      model: this.judgeModel, // ✅ GPT-4o-mini for evaluation
      messages: [{
        role: 'user',
        content: this.buildEvaluationPrompt(query, response, documents)
      }],
      temperature: 0.1,
      max_tokens: 500
    });
    
    return JSON.parse(evaluation.choices[0].message.content);
  }
}
```

---

## 💰 **Cost Optimization Strategy**

### **Expected Cost Savings**:

```typescript
// Cost Analysis
const MODEL_COSTS = {
  'gpt-4o': {
    input: 0.0025,  // per 1K tokens
    output: 0.01    // per 1K tokens
  },
  'gpt-4o-mini': {
    input: 0.00015, // per 1K tokens  
    output: 0.0006  // per 1K tokens
  }
};

class CostOptimizer {
  calculateSavings(monthlyQueries: number): CostAnalysis {
    // Scenario: All GPT-4o vs Optimized Mix
    const avgTokensPerQuery = {
      evaluation: 400,    // Judge tasks
      generation: 800,    // Core responses
      improvement: 600    // Response enhancement
    };
    
    // All GPT-4o scenario
    const allGPT4oCost = monthlyQueries * (
      (avgTokensPerQuery.evaluation * MODEL_COSTS['gpt-4o'].input / 1000) +
      (avgTokensPerQuery.generation * MODEL_COSTS['gpt-4o'].output / 1000) +
      (avgTokensPerQuery.improvement * MODEL_COSTS['gpt-4o'].output / 1000) * 0.3 // 30% need improvement
    );
    
    // Optimized mix scenario  
    const optimizedCost = monthlyQueries * (
      (avgTokensPerQuery.evaluation * MODEL_COSTS['gpt-4o-mini'].input / 1000) + // Evaluation with mini
      (avgTokensPerQuery.generation * MODEL_COSTS['gpt-4o'].output / 1000) +    // Generation with 4o
      (avgTokensPerQuery.improvement * MODEL_COSTS['gpt-4o'].output / 1000) * 0.3 // Improvement with 4o
    );
    
    return {
      allGPT4oCost: allGPT4oCost.toFixed(2),
      optimizedCost: optimizedCost.toFixed(2),  
      monthlySavings: (allGPT4oCost - optimizedCost).toFixed(2),
      savingsPercentage: ((allGPT4oCost - optimizedCost) / allGPT4oCost * 100).toFixed(1)
    };
  }
}

// Example: 10,000 monthly queries
// All GPT-4o: ~$180/month
// Optimized Mix: ~$95/month  
// Savings: ~$85/month (47% reduction)
```

---

## 📊 **Performance Monitoring**

### **Model Usage Tracking**:

```typescript
// Database schema for model usage tracking
CREATE TABLE model_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  model_used VARCHAR(20) NOT NULL, -- 'gpt-4o' or 'gpt-4o-mini'
  task_type VARCHAR(50) NOT NULL,  -- 'response_generation', 'evaluation', etc.
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_cents INTEGER, -- Cost in cents
  response_time_ms INTEGER,
  quality_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

// Analytics queries
const getModelEfficiency = async (timeframe: string) => {
  const query = `
    SELECT 
      model_used,
      task_type,
      COUNT(*) as usage_count,
      AVG(quality_score) as avg_quality,
      AVG(response_time_ms) as avg_response_time,
      SUM(cost_cents) as total_cost_cents
    FROM model_usage_analytics 
    WHERE created_at >= NOW() - INTERVAL '${timeframe}'
    GROUP BY model_used, task_type
    ORDER BY usage_count DESC
  `;
  
  return await db.query(query);
};
```

---

## 🎯 **Implementation Guidelines**

### **Decision Matrix**:

| Task Type | Model | Reasoning |
|-----------|-------|-----------|
| **User Chat Response** | GPT-4o | High-quality, user-facing content |
| **Response Improvement** | GPT-4o | Complex reasoning to enhance quality |
| **Content Synthesis** | GPT-4o | Combining multiple sources coherently |
| **Quality Evaluation** | GPT-4o-mini | Structured evaluation, cost-effective |
| **Relevance Scoring** | GPT-4o-mini | Pattern recognition, fast processing |
| **Query Classification** | GPT-4o-mini | Simple categorization task |
| **Metadata Extraction** | GPT-4o-mini | Structured data extraction |

### **Feature Flags for Model Selection**:

```typescript
const MODEL_FEATURE_FLAGS = {
  USE_4O_FOR_CORE: process.env.USE_GPT4O_CORE !== 'false',
  USE_MINI_FOR_EVALUATION: process.env.USE_MINI_EVALUATION !== 'false',
  ENABLE_COST_OPTIMIZATION: process.env.ENABLE_COST_OPTIMIZATION === 'true'
};

export const selectModel = (taskType: string): string => {
  const coreModelTasks = [
    'chat_response',
    'response_improvement', 
    'content_synthesis',
    'complex_reasoning'
  ];
  
  const judgeModelTasks = [
    'response_evaluation',
    'relevance_scoring',
    'query_classification',
    'metadata_extraction'
  ];
  
  if (coreModelTasks.includes(taskType) && MODEL_FEATURE_FLAGS.USE_4O_FOR_CORE) {
    return 'gpt-4o';
  }
  
  if (judgeModelTasks.includes(taskType) && MODEL_FEATURE_FLAGS.USE_MINI_FOR_EVALUATION) {
    return 'gpt-4o-mini';
  }
  
  // Default fallback
  return 'gpt-4o-mini';
};
```

---

## 🚀 **Migration Strategy**

### **Gradual Implementation**:

1. **Phase 1**: Update current chat API to use GPT-4o (maintain quality)
2. **Phase 2**: Introduce GPT-4o-mini for evaluation tasks  
3. **Phase 3**: Implement advanced RAG with model-specific allocation
4. **Phase 4**: Monitor performance and optimize further

### **A/B Testing**:

```typescript
class ModelABTesting {
  async testModelPerformance(query: string, course: string): Promise<TestResult> {
    // Generate response with both models
    const [gpt4oResponse, miniResponse] = await Promise.all([
      this.generateWithModel(query, 'gpt-4o'),
      this.generateWithModel(query, 'gpt-4o-mini')
    ]);
    
    // Evaluate both (using mini for consistency)
    const [gpt4oEvaluation, miniEvaluation] = await Promise.all([
      this.evaluateResponse(query, gpt4oResponse, 'gpt-4o-mini'),
      this.evaluateResponse(query, miniResponse, 'gpt-4o-mini')
    ]);
    
    return {
      gpt4o: { response: gpt4oResponse, evaluation: gpt4oEvaluation },
      mini: { response: miniResponse, evaluation: miniEvaluation },
      recommendation: gpt4oEvaluation.overallScore > miniEvaluation.overallScore ? 'gpt-4o' : 'gpt-4o-mini'
    };
  }
}
```

This strategic model allocation ensures FlowMind delivers high-quality responses while maintaining cost efficiency through intelligent task distribution between GPT-4o and GPT-4o-mini.
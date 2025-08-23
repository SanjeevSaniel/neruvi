import { openai } from '@/lib/openai'

export interface QueryRewriteResult {
  originalQuery: string
  rewrittenQueries: string[]
  intent: 'concept_explanation' | 'code_example' | 'comparison' | 'troubleshooting' | 'best_practices'
  course: 'nodejs' | 'python' | 'both'
  confidence: number
}

export class QueryRewriter {
  async rewriteQuery(query: string): Promise<QueryRewriteResult> {
    const prompt = `
Analyze this learning query and generate multiple rewritten versions for better search:

Original Query: "${query}"

Tasks:
1. Generate 3-5 rewritten versions that capture different aspects
2. Determine the learning intent (concept_explanation, code_example, comparison, troubleshooting, best_practices)  
3. Identify the target course (nodejs, python, or both)
4. Rate confidence (0-1)

Format as JSON:
{
  "rewrittenQueries": ["query1", "query2", "query3"],
  "intent": "concept_explanation",
  "course": "nodejs",
  "confidence": 0.9
}
`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        originalQuery: query,
        rewrittenQueries: result.rewrittenQueries || [query],
        intent: result.intent || 'concept_explanation',
        course: result.course || 'both',
        confidence: result.confidence || 0.5
      }
    } catch (error) {
      console.error('Query rewriting failed:', error)
      return {
        originalQuery: query,
        rewrittenQueries: [query],
        intent: 'concept_explanation',
        course: 'both',
        confidence: 0.5
      }
    }
  }

  // Generate domain-specific rewrites
  async generateDomainRewrites(query: string, course: 'nodejs' | 'python'): Promise<string[]> {
    const domainContext = course === 'nodejs' 
      ? 'Node.js backend development, Express.js, async/await, modules, HTTP servers'
      : 'Python programming, functions, classes, data structures, decorators, generators'

    const prompt = `
Rewrite this query for ${course} course content: "${query}"

Context: ${domainContext}

Generate 3 variations that use ${course}-specific terminology and concepts.
Return as JSON array: ["query1", "query2", "query3"]
`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(response.choices[0].message.content || '[]')
      return result.queries || [query]
    } catch (error) {
      return [query]
    }
  }
}
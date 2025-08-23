import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { getSectionInfo } from './content-mapping';

dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface LocalVectorStore {
  [key: string]: {
    id: string;
    content: string;
    embedding: number[];
    metadata: {
      course: 'nodejs' | 'python';
      section: string;
      videoId: string;
      startTime: number;
      endTime: number;
      topics: string[];
    };
  };
}

export interface SearchResult {
  content: string;
  score: number;
  metadata: {
    course: 'nodejs' | 'python';
    section: string;
    videoId: string;
    startTime: number;
    endTime: number;
    topics: string[];
    timestamp: string;
  };
}

export class LocalRAGSystem {
  private vectorStore: LocalVectorStore = {};
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  private async _performInitialization(): Promise<void> {
    console.log('🚀 Initializing Local RAG System...');

    try {
      await this.processTranscriptSample('nodejs');
      await this.processTranscriptSample('python');

      this.isInitialized = true;
      console.log(
        `✅ Local RAG initialized with ${
          Object.keys(this.vectorStore).length
        } chunks`,
      );

      const stats = this.getStatus();
      console.log('📊 RAG Stats:', stats);
    } catch (error) {
      console.error('❌ Failed to initialize local RAG:', error);
      throw error;
    }
  }

  private async processTranscriptSample(
    course: 'nodejs' | 'python',
  ): Promise<void> {
    const transcriptsPath = path.join(
      process.cwd(),
      'src',
      'data',
      'transcripts',
      course,
    );

    console.log(`📁 Processing ${course} transcripts from: ${transcriptsPath}`);

    try {
      const folders = await fs.readdir(transcriptsPath, {
        withFileTypes: true,
      });
      console.log(`📂 Found ${folders.length} folders for ${course}`);

      // Process more folders for better coverage (3 instead of 1)
      for (const folder of folders.slice(0, 3)) {
        if (folder?.isDirectory()) {
          console.log(`📁 Processing folder: ${folder.name}`);
          const folderPath = path.join(transcriptsPath, folder.name);
          const sectionInfo = getSectionInfo(course, folder.name);

          const vttFiles = await fs.readdir(folderPath);
          console.log(`📄 Found ${vttFiles.length} files in ${folder.name}`);

          // Process more files (5 instead of 2)
          for (const vttFile of vttFiles.slice(0, 5)) {
            if (vttFile.endsWith('.vtt')) {
              console.log(`🎬 Processing VTT file: ${vttFile}`);
              await this.processVTTFile(
                path.join(folderPath, vttFile),
                course,
                vttFile,
                folder.name,
                sectionInfo?.name || folder.name,
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${course} transcripts:`, error);
    }
  }

  // Fixed: Added the missing processVTTFile method
  private async processVTTFile(
    filePath: string,
    course: 'nodejs' | 'python',
    fileName: string,
    sectionId: string,
    sectionName: string,
  ): Promise<void> {
    try {
      console.log(`📖 Reading file: ${filePath}`);
      const content = await fs.readFile(filePath, 'utf-8');
      console.log(`📝 File content length: ${content.length} chars`);

      const chunks = this.chunkVTTContent(content);
      console.log(`📦 Generated ${chunks.length} chunks`);

      const videoId = fileName.replace('.vtt', '');

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = `${course}_${sectionId}_${videoId}_${i}`; // Fixed: renamed 'id' to 'chunkId'

        // Skip very short chunks
        if (chunk.content.trim().length < 100) {
          console.log(
            `⏭️ Skipping short chunk: ${chunk.content.slice(0, 50)}...`,
          );
          continue;
        }

        console.log(
          `🔧 Processing chunk ${i + 1}/${chunks.length}: ${chunk.content.slice(
            0,
            100,
          )}...`,
        );

        // Create embedding with retry logic
        const embedding = await this.createEmbeddingWithRetry(chunk.content);

        if (!embedding || embedding.every((val) => val === 0)) {
          console.log(`⚠️ Warning: Failed to create embedding for chunk ${i}`);
          continue;
        }

        this.vectorStore[chunkId] = {
          id: chunkId,
          content: chunk.content,
          embedding,
          metadata: {
            course,
            section: sectionName,
            videoId,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            topics: this.extractSimpleTopics(chunk.content, course),
          },
        };

        console.log(`✅ Added chunk ${chunkId} to vector store`);

        // Reduced rate limiting
        await this.delay(100);
      }
    } catch (error) {
      console.error(`❌ Error processing VTT file ${fileName}:`, error);
    }
  }

  // Added the missing chunkVTTContent method
  private chunkVTTContent(vttContent: string) {
    const chunks = [];
    const lines = vttContent.split('\n');
    let currentChunk = { content: '', startTime: 0, endTime: 0 };
    let chunkSize = 0;
    const maxChunkSize = 1200; // Increased from 500 to 1200 characters

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map((s) => s.trim());
        const startTime = this.parseTimestamp(startStr);
        const endTime = this.parseTimestamp(endStr);

        if (currentChunk.content === '') {
          currentChunk.startTime = startTime;
        }
        currentChunk.endTime = endTime;

        i++;
        let text = '';
        while (i < lines.length && lines[i].trim() !== '') {
          text += lines[i].trim() + ' ';
          i++;
        }

        if (text.trim()) {
          currentChunk.content += text.trim() + ' ';
          chunkSize += text.length;

          if (chunkSize >= maxChunkSize) {
            chunks.push({ ...currentChunk });
            currentChunk = { content: '', startTime: 0, endTime: 0 };
            chunkSize = 0;
          }
        }
      }
    }

    if (currentChunk.content) {
      chunks.push(currentChunk);
    }

    return chunks.filter((chunk) => chunk.content.trim().length > 100);
  }

  // Added the missing parseTimestamp method
  private parseTimestamp(timestamp: string): number {
    const parts = timestamp.split(':');
    let seconds = 0;

    if (parts.length === 3) {
      seconds =
        parseInt(parts[0]) * 3600 +
        parseInt(parts[2]) * 60 +
        parseFloat(parts[3]);
    } else if (parts.length === 2) {
      seconds = parseInt(parts[0]) * 60 + parseFloat(parts[2]);
    }

    return seconds;
  }

  // Added the missing extractSimpleTopics method
  private extractSimpleTopics(
    text: string,
    course: 'nodejs' | 'python',
  ): string[] {
    const topics: string[] = [];
    const textLower = text.toLowerCase();

    const courseKeywords =
      course === 'nodejs'
        ? [
            'express',
            'async',
            'await',
            'promise',
            'module',
            'server',
            'middleware',
            'api',
            'http',
            'npm',
            'node',
            'javascript',
            'callback',
            'event',
            'stream',
          ]
        : [
            'function',
            'class',
            'decorator',
            'generator',
            'list',
            'dict',
            'loop',
            'import',
            'module',
            'exception',
            'python',
            'variable',
            'method',
            'object',
            'string',
          ];

    courseKeywords.forEach((keyword) => {
      if (textLower.includes(keyword)) {
        topics.push(keyword);
      }
    });

    return topics;
  }

  // Enhanced semantic search with better filtering
  async semanticSearch(
    query: string,
    limit: number = 5,
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      console.log('🔄 RAG not initialized, initializing now...');
      await this.initialize();
    }

    if (Object.keys(this.vectorStore).length === 0) {
      console.log('⚠️ No content in vector store');
      return [];
    }

    try {
      console.log(`🔍 Searching for: "${query}"`);

      const queryEmbedding = await this.createEmbeddingWithRetry(query);

      if (queryEmbedding.every((val) => val === 0)) {
        console.log('❌ Failed to create query embedding');
        return [];
      }

      const results: SearchResult[] = [];

      for (const [, item] of Object.entries(this.vectorStore)) {
        // Fixed: removed unused 'id' parameter
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          item.embedding,
        );

        if (similarity > 0.25) {
          // Improved threshold
          results.push({
            content: item.content,
            score: similarity,
            metadata: {
              ...item.metadata,
              timestamp: this.formatTimestamp(item.metadata.startTime),
            },
          });
        }
      }

      console.log(`📊 Found ${results.length} results above threshold`);

      const sortedResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      if (sortedResults.length > 0) {
        console.log(
          `✅ Top result score: ${sortedResults[0].score.toFixed(3)}`,
        );
        console.log(
          `📝 Top result preview: ${sortedResults[0].content.substring(
            0,
            100,
          )}...`,
        ); // Fixed: access content property correctly
      }

      return sortedResults;
    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      return [];
    }
  }

  // HyDE search implementation
  async hydeSearch(
    query: string,
    course?: 'nodejs' | 'python',
  ): Promise<SearchResult[]> {
    try {
      console.log(`🧠 Starting HyDE search for: "${query}"`);

      // Generate hypothetical document
      const hypotheticalDoc = await this.generateHypotheticalDocument(
        query,
        course,
      );
      console.log(
        `📝 Generated hypothetical doc: ${hypotheticalDoc.substring(
          0,
          100,
        )}...`,
      );

      // Search using the hypothetical document
      const hydeResults = await this.semanticSearch(hypotheticalDoc, 3);
      console.log(`🔍 HyDE search found ${hydeResults.length} results`);

      // Also search with original query
      const directResults = await this.semanticSearch(query, 3);
      console.log(`🔍 Direct search found ${directResults.length} results`);

      // Combine and deduplicate results
      const combined = [...hydeResults, ...directResults];
      const seen = new Set();
      const unique = combined.filter((result) => {
        const key = `${result.metadata.videoId}-${result.metadata.startTime}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const finalResults = unique.sort((a, b) => b.score - a.score).slice(0, 5);

      console.log(
        `✅ HyDE search returning ${finalResults.length} unique results`,
      );
      return finalResults;
    } catch (error) {
      console.error('❌ HyDE search failed:', error);
      return await this.semanticSearch(query);
    }
  }

  // Generate hypothetical document
  private async generateHypotheticalDocument(
    query: string,
    course?: 'nodejs' | 'python',
  ): Promise<string> {
    const courseContext =
      course === 'nodejs'
        ? 'Node.js backend development, Express.js framework, async/await patterns, modules, HTTP servers, middleware, JavaScript runtime'
        : course === 'python'
        ? 'Python programming fundamentals, functions, classes, decorators, generators, data structures, OOP concepts, Python syntax'
        : 'Programming concepts, software development, coding best practices';

    const prompt = `You are creating educational content that would answer this student question: "${query}"

Course Context: ${courseContext}

Write a comprehensive educational explanation that includes:
- Clear technical explanations appropriate for learning
- Practical code examples and snippets
- Common use cases and real-world applications
- Best practices and important concepts
- Step-by-step guidance where relevant

Write in the style of course transcript content - educational, detailed, and practical.
Length: 300-500 words.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 600,
      });

      const result = response.choices[0].message.content || query;
      console.log(`🎯 Generated hypothetical doc (${result.length} chars)`);
      return result;
    } catch (error) {
      console.error('❌ HyDE generation failed:', error);
      return query;
    }
  }

  // Query rewriting
  async rewriteQuery(query: string): Promise<string[]> {
    const prompt = `Rewrite this programming learning query into 3 different variations:

Original: "${query}"

Create variations that:
1. Use different technical terminology
2. Focus on different aspects (theory vs practice vs examples)
3. Include related concepts and synonyms

Return only a JSON object: {"variations": ["variation1", "variation2", "variation3"]}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(
        response.choices[0].message.content || '{"variations": []}',
      );
      return result.variations || [query];
    } catch (error) {
      console.error('❌ Query rewriting failed:', error);
      return [query];
    }
  }

  private async createEmbeddingWithRetry(
    text: string,
    retries: number = 3,
  ): Promise<number[]> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text.substring(0, 8000),
          dimensions: 1536,
        });

        const embedding = response.data[0].embedding;

        if (
          embedding &&
          embedding.length === 1536 &&
          !embedding.every((val) => val === 0)
        ) {
          return embedding;
        }

        console.log(`⚠️ Invalid embedding received, retry ${i + 1}/${retries}`);
      } catch (error) {
        console.error(
          `Embedding creation failed, attempt ${i + 1}/${retries}:`,
          error,
        );

        if (i < retries - 1) {
          await this.delay(1000 * (i + 1));
        }
      }
    }

    console.error('All embedding attempts failed');
    return new Array(1536).fill(0);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    const similarity = dotProduct / (magnitudeA * magnitudeB);
    return Math.max(0, Math.min(1, similarity));
  }

  private formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      totalChunks: Object.keys(this.vectorStore).length,
      courses: this.getCourseStats(),
      sampleContent: Object.keys(this.vectorStore).slice(0, 3),
    };
  }

  private getCourseStats() {
    const stats = { nodejs: 0, python: 0 };
    Object.values(this.vectorStore).forEach((item) => {
      stats[item.metadata.course]++;
    });
    return stats;
  }
}

export const localRAG = new LocalRAGSystem();

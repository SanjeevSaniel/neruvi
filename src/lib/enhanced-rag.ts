import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { getSectionInfo } from './content-mapping';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Enhanced interfaces with better metadata
export interface EnhancedChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    course: 'nodejs' | 'python';
    section: string;
    videoId: string;
    startTime: number;
    endTime: number;
    duration: number;
    topics: string[];
    keywords: string[];
    chunkIndex: number;
    overlapWith: string[];
    quality_score: number;
    content_hash: string;
  };
}

export interface FastSearchResult {
  content: string;
  score: number;
  metadata: EnhancedChunk['metadata'] & {
    timestamp: string;
    relevance_reason: string;
  };
}

export interface RAGCache {
  embeddings: Map<string, number[]>;
  chunks: Map<string, EnhancedChunk>;
  queryCache: Map<string, FastSearchResult[]>;
  indexedContent: Map<string, string[]>; // For keyword search
}

export class EnhancedRAGSystem {
  private cache: RAGCache;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private readonly CACHE_FILE = path.join(process.cwd(), 'rag_cache.json');
  private readonly EMBEDDING_BATCH_SIZE = 10;
  private readonly MAX_QUERY_CACHE = 1000;

  constructor() {
    this.cache = {
      embeddings: new Map(),
      chunks: new Map(),
      queryCache: new Map(),
      indexedContent: new Map(),
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._performInitialization();
    return this.initPromise;
  }

  private async _performInitialization(): Promise<void> {
    console.log('🚀 Initializing Enhanced RAG System...');
    const startTime = Date.now();

    try {
      // Try to load from cache first
      await this.loadCache();
      
      if (this.cache.chunks.size === 0) {
        console.log('📝 No cache found, processing content...');
        await this.processAllContent();
        await this.saveCache();
      } else {
        console.log(`📦 Loaded ${this.cache.chunks.size} chunks from cache`);
      }

      // Build search indexes
      await this.buildSearchIndexes();
      
      const endTime = Date.now();
      this.isInitialized = true;
      
      console.log(`✅ Enhanced RAG initialized in ${endTime - startTime}ms`);
      console.log(`📊 Total chunks: ${this.cache.chunks.size}`);
      console.log(`🔍 Cached embeddings: ${this.cache.embeddings.size}`);
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced RAG:', error);
      throw error;
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const cacheData = await fs.readFile(this.CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(cacheData);
      
      // Reconstruct Maps from serialized data
      this.cache.embeddings = new Map(parsed.embeddings || []);
      this.cache.chunks = new Map(parsed.chunks || []);
      this.cache.indexedContent = new Map(parsed.indexedContent || []);
      
      console.log('📦 Cache loaded successfully');
    } catch (error) {
      console.log('⚠️ No cache file found, will create new one');
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const cacheData = {
        embeddings: Array.from(this.cache.embeddings.entries()),
        chunks: Array.from(this.cache.chunks.entries()),
        indexedContent: Array.from(this.cache.indexedContent.entries()),
        timestamp: Date.now(),
      };
      
      await fs.writeFile(this.CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log('💾 Cache saved successfully');
    } catch (error) {
      console.error('❌ Failed to save cache:', error);
    }
  }

  private async processAllContent(): Promise<void> {
    const courses: Array<'nodejs' | 'python'> = ['nodejs', 'python'];
    const processingPromises: Promise<void>[] = [];

    for (const course of courses) {
      processingPromises.push(this.processCourseContent(course));
    }

    // Process courses in parallel
    await Promise.all(processingPromises);
  }

  private async processCourseContent(course: 'nodejs' | 'python'): Promise<void> {
    const transcriptsPath = path.join(process.cwd(), 'src', 'data', 'transcripts', course);
    
    try {
      const folders = await fs.readdir(transcriptsPath, { withFileTypes: true });
      const folderPromises: Promise<void>[] = [];

      // Process all folders (not just first 3)
      for (const folder of folders) {
        if (folder.isDirectory()) {
          folderPromises.push(this.processFolderContent(course, transcriptsPath, folder.name));
        }
      }

      await Promise.all(folderPromises);
    } catch (error) {
      console.error(`❌ Error processing ${course} content:`, error);
    }
  }

  private async processFolderContent(
    course: 'nodejs' | 'python',
    transcriptsPath: string,
    folderName: string
  ): Promise<void> {
    const folderPath = path.join(transcriptsPath, folderName);
    const sectionInfo = getSectionInfo(course, folderName);

    try {
      const vttFiles = await fs.readdir(folderPath);
      const filePromises: Promise<void>[] = [];

      // Process all VTT files (not just first 5)
      for (const vttFile of vttFiles) {
        if (vttFile.endsWith('.vtt')) {
          filePromises.push(
            this.processVTTFile(
              path.join(folderPath, vttFile),
              course,
              vttFile,
              folderName,
              sectionInfo?.name || folderName
            )
          );
        }
      }

      await Promise.all(filePromises);
    } catch (error) {
      console.error(`❌ Error processing folder ${folderName}:`, error);
    }
  }

  private async processVTTFile(
    filePath: string,
    course: 'nodejs' | 'python',
    fileName: string,
    sectionId: string,
    sectionName: string
  ): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const videoId = fileName.replace('.vtt', '');
      
      // Enhanced chunking with overlapping windows
      const chunks = this.createOverlappingChunks(content, videoId, course, sectionName);
      
      // Batch process embeddings for efficiency
      await this.batchProcessEmbeddings(chunks);
      
    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error);
    }
  }

  // Enhanced chunking with overlapping windows and quality scoring
  private createOverlappingChunks(
    vttContent: string,
    videoId: string,
    course: 'nodejs' | 'python',
    sectionName: string
  ): EnhancedChunk[] {
    const chunks: EnhancedChunk[] = [];
    const lines = vttContent.split('\n');
    
    const CHUNK_SIZE = 800; // Optimal size for embeddings
    const OVERLAP_SIZE = 200; // 25% overlap
    const MIN_CHUNK_SIZE = 300;
    
    const currentChunk = { content: '', startTime: 0, endTime: 0 };
    const chunkBuffer: { content: string; startTime: number; endTime: number }[] = [];
    
    // Parse VTT content into timestamped segments
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map(s => s.trim());
        const startTime = this.parseTimestamp(startStr);
        const endTime = this.parseTimestamp(endStr);
        
        i++;
        let text = '';
        while (i < lines.length && lines[i].trim() !== '') {
          text += lines[i].trim() + ' ';
          i++;
        }
        
        if (text.trim()) {
          chunkBuffer.push({
            content: text.trim(),
            startTime,
            endTime
          });
        }
      }
    }
    
    // Create overlapping chunks from buffer
    let chunkIndex = 0;
    let start = 0;
    
    while (start < chunkBuffer.length) {
      let currentSize = 0;
      let end = start;
      let chunkContent = '';
      const chunkStartTime = chunkBuffer[start].startTime;
      let chunkEndTime = chunkBuffer[start].endTime;
      
      // Build chunk up to target size
      while (end < chunkBuffer.length && currentSize < CHUNK_SIZE) {
        const segment = chunkBuffer[end];
        chunkContent += segment.content + ' ';
        chunkEndTime = segment.endTime;
        currentSize += segment.content.length;
        end++;
      }
      
      // Only create chunk if it meets minimum size
      if (chunkContent.trim().length >= MIN_CHUNK_SIZE) {
        const chunkId = `${course}_${sectionName}_${videoId}_${chunkIndex}`;
        const contentHash = createHash('md5').update(chunkContent).digest('hex');
        
        const chunk: EnhancedChunk = {
          id: chunkId,
          content: chunkContent.trim(),
          embedding: [], // Will be filled later
          metadata: {
            course,
            section: sectionName,
            videoId,
            startTime: chunkStartTime,
            endTime: chunkEndTime,
            duration: chunkEndTime - chunkStartTime,
            topics: this.extractTopics(chunkContent, course),
            keywords: this.extractKeywords(chunkContent),
            chunkIndex,
            overlapWith: [], // Will be calculated later
            quality_score: this.calculateQualityScore(chunkContent),
            content_hash: contentHash,
          }
        };
        
        chunks.push(chunk);
        chunkIndex++;
      }
      
      // Move start forward by chunk size minus overlap
      const advance = Math.max(1, Math.floor((end - start) * 0.75));
      start += advance;
    }
    
    // Calculate overlaps
    this.calculateChunkOverlaps(chunks);
    
    return chunks;
  }

  private calculateChunkOverlaps(chunks: EnhancedChunk[]): void {
    for (let i = 0; i < chunks.length; i++) {
      for (let j = i + 1; j < chunks.length; j++) {
        const chunk1 = chunks[i];
        const chunk2 = chunks[j];
        
        // Check for temporal overlap
        if (this.hasTimeOverlap(chunk1.metadata, chunk2.metadata)) {
          chunk1.metadata.overlapWith.push(chunk2.id);
          chunk2.metadata.overlapWith.push(chunk1.id);
        }
      }
    }
  }

  private hasTimeOverlap(meta1: EnhancedChunk['metadata'], meta2: EnhancedChunk['metadata']): boolean {
    return meta1.videoId === meta2.videoId &&
           Math.abs(meta1.startTime - meta2.startTime) < 60; // 1 minute overlap window
  }

  private async batchProcessEmbeddings(chunks: EnhancedChunk[]): Promise<void> {
    const batches: EnhancedChunk[][] = [];
    
    // Split into batches
    for (let i = 0; i < chunks.length; i += this.EMBEDDING_BATCH_SIZE) {
      batches.push(chunks.slice(i, i + this.EMBEDDING_BATCH_SIZE));
    }
    
    // Process batches in parallel (limited concurrency)
    const concurrencyLimit = 3;
    for (let i = 0; i < batches.length; i += concurrencyLimit) {
      const currentBatches = batches.slice(i, i + concurrencyLimit);
      await Promise.all(currentBatches.map(batch => this.processBatch(batch)));
    }
  }

  private async processBatch(chunks: EnhancedChunk[]): Promise<void> {
    const textsToEmbed: string[] = [];
    const chunkMap = new Map<number, EnhancedChunk>();
    
    chunks.forEach((chunk, index) => {
      // Check if embedding already cached
      const cachedEmbedding = this.cache.embeddings.get(chunk.metadata.content_hash);
      if (cachedEmbedding) {
        chunk.embedding = cachedEmbedding;
        this.cache.chunks.set(chunk.id, chunk);
      } else {
        textsToEmbed.push(chunk.content);
        chunkMap.set(textsToEmbed.length - 1, chunk);
      }
    });
    
    if (textsToEmbed.length === 0) return;
    
    try {
      // Create embeddings in batch
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: textsToEmbed,
        dimensions: 1536,
      });
      
      // Assign embeddings to chunks
      response.data.forEach((embeddingData, index) => {
        const chunk = chunkMap.get(index);
        if (chunk) {
          chunk.embedding = embeddingData.embedding;
          
          // Cache the embedding and chunk
          this.cache.embeddings.set(chunk.metadata.content_hash, chunk.embedding);
          this.cache.chunks.set(chunk.id, chunk);
        }
      });
      
    } catch (error) {
      console.error('❌ Batch embedding failed:', error);
      // Fallback to individual processing
      await this.processBatchIndividually(Array.from(chunkMap.values()));
    }
  }

  private async processBatchIndividually(chunks: EnhancedChunk[]): Promise<void> {
    for (const chunk of chunks) {
      try {
        const embedding = await this.createSingleEmbedding(chunk.content);
        chunk.embedding = embedding;
        
        this.cache.embeddings.set(chunk.metadata.content_hash, embedding);
        this.cache.chunks.set(chunk.id, chunk);
        
        // Rate limiting
        await this.delay(50);
      } catch (error) {
        console.error(`❌ Failed to create embedding for chunk ${chunk.id}:`, error);
      }
    }
  }

  private async createSingleEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000),
      dimensions: 1536,
    });
    
    return response.data[0].embedding;
  }

  private buildSearchIndexes(): void {
    console.log('🔍 Building search indexes...');
    
    for (const [chunkId, chunk] of this.cache.chunks) {
      // Build keyword index
      const keywords = [
        ...chunk.metadata.keywords,
        ...chunk.metadata.topics,
        chunk.metadata.course,
        chunk.metadata.section
      ];
      
      keywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase();
        if (!this.cache.indexedContent.has(normalizedKeyword)) {
          this.cache.indexedContent.set(normalizedKeyword, []);
        }
        this.cache.indexedContent.get(normalizedKeyword)!.push(chunkId);
      });
    }
    
    console.log(`🔍 Built indexes for ${this.cache.indexedContent.size} keywords`);
  }

  // Fast semantic search with caching
  async fastSearch(query: string, limit: number = 5): Promise<FastSearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Check query cache first
    const cacheKey = this.createQueryCacheKey(query, limit);
    const cached = this.cache.queryCache.get(cacheKey);
    if (cached) {
      console.log('⚡ Using cached query result');
      return cached;
    }
    
    try {
      const startTime = Date.now();
      
      // Create query embedding
      const queryEmbedding = await this.createSingleEmbedding(query);
      
      // Fast vector search
      const results: FastSearchResult[] = [];
      const threshold = 0.3; // Higher threshold for better precision
      
      for (const [chunkId, chunk] of this.cache.chunks) {
        const similarity = this.fastCosineSimilarity(queryEmbedding, chunk.embedding);
        
        if (similarity > threshold) {
          results.push({
            content: chunk.content,
            score: similarity,
            metadata: {
              ...chunk.metadata,
              timestamp: this.formatTimestamp(chunk.metadata.startTime),
              relevance_reason: this.generateRelevanceReason(query, chunk, similarity),
            }
          });
        }
      }
      
      // Sort and limit results
      const sortedResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      // Cache the result
      this.cacheQueryResult(cacheKey, sortedResults);
      
      const endTime = Date.now();
      console.log(`⚡ Fast search completed in ${endTime - startTime}ms, found ${sortedResults.length} results`);
      
      return sortedResults;
      
    } catch (error) {
      console.error('❌ Fast search failed:', error);
      return [];
    }
  }

  // Hybrid search combining semantic and keyword search
  async hybridSearch(query: string, limit: number = 5): Promise<FastSearchResult[]> {
    const [semanticResults, keywordResults] = await Promise.all([
      this.fastSearch(query, Math.ceil(limit * 0.7)),
      this.keywordSearch(query, Math.ceil(limit * 0.5))
    ]);
    
    // Merge and deduplicate
    const combined = new Map<string, FastSearchResult>();
    
    // Add semantic results with higher weight
    semanticResults.forEach(result => {
      const key = `${result.metadata.videoId}-${result.metadata.startTime}`;
      combined.set(key, { ...result, score: result.score * 1.2 });
    });
    
    // Add keyword results
    keywordResults.forEach(result => {
      const key = `${result.metadata.videoId}-${result.metadata.startTime}`;
      const existing = combined.get(key);
      if (existing) {
        // Boost score if found in both approaches
        existing.score = Math.max(existing.score, result.score) * 1.3;
      } else {
        combined.set(key, result);
      }
    });
    
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async keywordSearch(query: string, limit: number): Promise<FastSearchResult[]> {
    const queryWords = query.toLowerCase().split(/\s+/);
    const chunkScores = new Map<string, number>();
    
    // Score chunks based on keyword matches
    queryWords.forEach(word => {
      const matchingChunks = this.cache.indexedContent.get(word) || [];
      matchingChunks.forEach(chunkId => {
        chunkScores.set(chunkId, (chunkScores.get(chunkId) || 0) + 1);
      });
    });
    
    // Convert to results
    const results: FastSearchResult[] = [];
    for (const [chunkId, score] of chunkScores) {
      const chunk = this.cache.chunks.get(chunkId);
      if (chunk) {
        const normalizedScore = score / queryWords.length;
        results.push({
          content: chunk.content,
          score: normalizedScore,
          metadata: {
            ...chunk.metadata,
            timestamp: this.formatTimestamp(chunk.metadata.startTime),
            relevance_reason: `Keyword match: ${score}/${queryWords.length} terms`,
          }
        });
      }
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private fastCosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private extractTopics(content: string, course: 'nodejs' | 'python'): string[] {
    const topics: string[] = [];
    const contentLower = content.toLowerCase();
    
    const topicKeywords = course === 'nodejs' ? {
      'async-programming': ['async', 'await', 'promise', 'callback', 'asynchronous'],
      'express': ['express', 'middleware', 'router', 'app.get', 'app.post'],
      'modules': ['require', 'module.exports', 'import', 'export'],
      'http': ['http', 'server', 'request', 'response', 'api'],
      'events': ['event', 'emit', 'listener', 'eventemitter'],
      'streams': ['stream', 'readable', 'writable', 'pipe'],
      'error-handling': ['error', 'try', 'catch', 'throw'],
    } : {
      'functions': ['function', 'def', 'return', 'parameter', 'argument'],
      'classes': ['class', 'constructor', '__init__', 'method', 'inheritance'],
      'data-structures': ['list', 'dict', 'tuple', 'set', 'array'],
      'loops': ['for', 'while', 'iterate', 'loop', 'range'],
      'conditionals': ['if', 'else', 'elif', 'condition', 'boolean'],
      'modules': ['import', 'from', 'module', 'package'],
      'error-handling': ['try', 'except', 'finally', 'raise', 'exception'],
    };
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        topics.push(topic);
      }
    });
    
    return topics;
  }

  private extractKeywords(content: string): string[] {
    // Extract meaningful keywords (not just common words)
    const words = content.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];
    const commonWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']);
    
    const keywords = words
      .filter(word => word.length >= 4 && !commonWords.has(word))
      .reduce((acc: Map<string, number>, word) => {
        acc.set(word, (acc.get(word) || 0) + 1);
        return acc;
      }, new Map());
    
    // Return most frequent keywords
    return Array.from(keywords.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private calculateQualityScore(content: string): number {
    let score = 0.5; // Base score
    
    // Length score (optimal around 600-1000 chars)
    const length = content.length;
    if (length >= 400 && length <= 1200) score += 0.2;
    if (length >= 600 && length <= 1000) score += 0.1;
    
    // Code snippet bonus
    if (content.includes('(') && content.includes(')')) score += 0.1;
    if (content.includes('{') && content.includes('}')) score += 0.1;
    
    // Technical keyword density
    const technicalWords = (content.match(/\b(function|class|variable|method|return|import|export|async|await)\b/gi) || []).length;
    score += Math.min(0.2, technicalWords * 0.02);
    
    return Math.min(1.0, score);
  }

  private generateRelevanceReason(query: string, chunk: EnhancedChunk, score: number): string {
    const reasons: string[] = [];
    
    if (score > 0.8) reasons.push('High semantic similarity');
    else if (score > 0.6) reasons.push('Good semantic match');
    else reasons.push('Moderate relevance');
    
    // Check for exact matches
    const queryLower = query.toLowerCase();
    const contentLower = chunk.content.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    const matchingWords = queryWords.filter(word => contentLower.includes(word));
    
    if (matchingWords.length > 0) {
      reasons.push(`Keywords: ${matchingWords.slice(0, 3).join(', ')}`);
    }
    
    if (chunk.metadata.topics.length > 0) {
      reasons.push(`Topics: ${chunk.metadata.topics.slice(0, 2).join(', ')}`);
    }
    
    return reasons.join(' | ');
  }

  private createQueryCacheKey(query: string, limit: number): string {
    return `${createHash('md5').update(query.toLowerCase()).digest('hex')}_${limit}`;
  }

  private cacheQueryResult(key: string, results: FastSearchResult[]): void {
    // Implement LRU cache behavior
    if (this.cache.queryCache.size >= this.MAX_QUERY_CACHE) {
      const firstKey = this.cache.queryCache.keys().next().value;
      this.cache.queryCache.delete(firstKey);
    }
    
    this.cache.queryCache.set(key, results);
  }

  private parseTimestamp(timestamp: string): number {
    const parts = timestamp.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseFloat(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }

  private formatTimestamp(seconds: number): string {
    const totalMinutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public status methods
  getStatus() {
    return {
      initialized: this.isInitialized,
      totalChunks: this.cache.chunks.size,
      cachedEmbeddings: this.cache.embeddings.size,
      queryCache: this.cache.queryCache.size,
      indexedKeywords: this.cache.indexedContent.size,
      courses: this.getCourseStats(),
    };
  }

  private getCourseStats() {
    const stats = { nodejs: 0, python: 0 };
    this.cache.chunks.forEach(chunk => {
      stats[chunk.metadata.course]++;
    });
    return stats;
  }

  // Clear cache method for maintenance
  async clearCache(): Promise<void> {
    this.cache = {
      embeddings: new Map(),
      chunks: new Map(),
      queryCache: new Map(),
      indexedContent: new Map(),
    };
    
    try {
      await fs.unlink(this.CACHE_FILE);
      console.log('🗑️ Cache cleared successfully');
    } catch (error) {
      console.log('⚠️ No cache file to clear');
    }
    
    this.isInitialized = false;
    this.initPromise = null;
  }
}

export const enhancedRAG = new EnhancedRAGSystem();
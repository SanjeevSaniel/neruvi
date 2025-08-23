import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { qdrant, COLLECTIONS } from './qdrant';
import { QdrantSetup } from './qdrant-setup';
import { queryOptimizer } from './query-optimizer';
import { getSectionInfo } from './content-mapping';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface QdrantChunk {
  id: string;
  content: string;
  course: 'nodejs' | 'python';
  section: string;
  videoId: string;
  startTime: number;
  endTime: number;
  duration: number;
  chunkIndex: number;
  quality_score: number;
  topics: string[];
  keywords: string[];
}

export interface QdrantSearchResult {
  content: string;
  score: number;
  metadata: {
    course: 'nodejs' | 'python';
    section: string;
    videoId: string;
    startTime: number;
    endTime: number;
    duration: number;
    timestamp: string;
    chunkIndex: number;
    topics: string[];
    relevance_reason: string;
  };
}

export class QdrantRAGSystem {
  private qdrantSetup: QdrantSetup;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly MIN_CHUNK_SIZE = 200;
  private readonly CHUNK_SIZE = 600;
  private readonly OVERLAP_SIZE = 150;

  constructor() {
    this.qdrantSetup = new QdrantSetup();
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
    console.log('🚀 Initializing Qdrant RAG System...');
    const startTime = Date.now();

    try {
      // Test connection
      const connected = await this.qdrantSetup.testConnection();
      if (!connected) {
        throw new Error('Failed to connect to Qdrant');
      }

      // Initialize collections
      await this.qdrantSetup.initializeCollections();

      // Check if we have data, if not process content
      const hasData = await this.checkExistingData();
      if (!hasData) {
        console.log('📝 No data found, processing content...');
        await this.processAllContent();
      } else {
        console.log('✅ Found existing data in Qdrant');
      }

      const endTime = Date.now();
      this.isInitialized = true;
      
      console.log(`✅ Qdrant RAG initialized in ${endTime - startTime}ms`);
      // Only show collection info in development mode
      if (process.env.NODE_ENV === 'development') {
        await this.qdrantSetup.getCollectionInfo();
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Qdrant RAG:', error);
      throw error;
    }
  }

  private async checkExistingData(): Promise<boolean> {
    try {
      const nodejsInfo = await qdrant.getCollection(COLLECTIONS.NODEJS_TRANSCRIPTS);
      const pythonInfo = await qdrant.getCollection(COLLECTIONS.PYTHON_TRANSCRIPTS);
      
      const totalPoints = (nodejsInfo.points_count || 0) + (pythonInfo.points_count || 0);
      console.log(`📊 Found ${totalPoints} existing points in Qdrant`);
      
      return totalPoints > 100; // Consider initialized if we have reasonable amount of data
    } catch (error) {
      console.log('⚠️ Could not check existing data:', error);
      return false;
    }
  }

  private async processAllContent(): Promise<void> {
    const courses: Array<'nodejs' | 'python'> = ['nodejs', 'python'];
    
    for (const course of courses) {
      console.log(`📚 Processing ${course} content...`);
      await this.processCourseContent(course);
    }
  }

  private async processCourseContent(course: 'nodejs' | 'python'): Promise<void> {
    const transcriptsPath = path.join(process.cwd(), 'src', 'data', 'transcripts', course);
    
    try {
      const folders = await fs.readdir(transcriptsPath, { withFileTypes: true });
      
      // Process all folders
      for (const folder of folders) {
        if (folder.isDirectory()) {
          console.log(`📁 Processing ${course}/${folder.name}...`);
          await this.processFolderContent(course, transcriptsPath, folder.name);
        }
      }
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
      const chunks: QdrantChunk[] = [];

      // Process all VTT files in this folder
      for (const vttFile of vttFiles) {
        if (vttFile.endsWith('.vtt')) {
          console.log(`🎬 Processing ${vttFile}...`);
          const fileChunks = await this.processVTTFile(
            path.join(folderPath, vttFile),
            course,
            vttFile,
            folderName,
            sectionInfo?.name || folderName
          );
          chunks.push(...fileChunks);
        }
      }

      // Batch upload chunks to Qdrant
      if (chunks.length > 0) {
        await this.uploadChunksToQdrant(course, chunks);
      }
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
  ): Promise<QdrantChunk[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const videoId = fileName.replace('.vtt', '');
      
      // Create chunks with proper timestamp parsing
      return this.createTimestampedChunks(content, course, sectionName, videoId);
    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error);
      return [];
    }
  }

  // Fixed timestamp parsing and chunking
  private createTimestampedChunks(
    vttContent: string,
    course: 'nodejs' | 'python',
    sectionName: string,
    videoId: string
  ): QdrantChunk[] {
    const chunks: QdrantChunk[] = [];
    const lines = vttContent.split('\n');
    
    // Parse VTT content into timestamped segments
    const segments: Array<{ content: string; startTime: number; endTime: number }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map(s => s.trim());
        const startTime = this.parseVTTTimestamp(startStr);
        const endTime = this.parseVTTTimestamp(endStr);
        
        // Get the text content
        i++;
        let text = '';
        while (i < lines.length && lines[i].trim() !== '') {
          text += lines[i].trim() + ' ';
          i++;
        }
        
        if (text.trim() && startTime !== null && endTime !== null) {
          segments.push({
            content: text.trim(),
            startTime,
            endTime
          });
        }
      }
    }

    console.log(`📊 Parsed ${segments.length} segments from ${videoId}`);
    
    // Create overlapping chunks from segments
    let chunkIndex = 0;
    let start = 0;
    
    while (start < segments.length) {
      let currentSize = 0;
      let end = start;
      let chunkContent = '';
      let chunkStartTime = segments[start].startTime;
      let chunkEndTime = segments[start].endTime;
      
      // Build chunk up to target size
      while (end < segments.length && currentSize < this.CHUNK_SIZE) {
        const segment = segments[end];
        chunkContent += segment.content + ' ';
        chunkEndTime = segment.endTime;
        currentSize += segment.content.length;
        end++;
      }
      
      // Only create chunk if it meets minimum size
      if (chunkContent.trim().length >= this.MIN_CHUNK_SIZE) {
        const chunkId = `${course}_${sectionName.replace(/\s+/g, '_')}_${videoId}_${chunkIndex}`;
        
        const chunk: QdrantChunk = {
          id: chunkId,
          content: chunkContent.trim(),
          course,
          section: sectionName,
          videoId,
          startTime: chunkStartTime,
          endTime: chunkEndTime,
          duration: chunkEndTime - chunkStartTime,
          chunkIndex,
          quality_score: this.calculateQualityScore(chunkContent),
          topics: this.extractTopics(chunkContent, course),
          keywords: this.extractKeywords(chunkContent),
        };
        
        chunks.push(chunk);
        chunkIndex++;
      }
      
      // Move start forward with overlap
      const advance = Math.max(1, Math.floor((end - start) * 0.8)); // 20% overlap
      start += advance;
    }
    
    console.log(`✅ Created ${chunks.length} chunks from ${videoId}`);
    return chunks.filter(chunk => chunk.startTime > 0); // Filter out chunks with invalid timestamps
  }

  // Enhanced VTT timestamp parsing with better format handling
  private parseVTTTimestamp(timestamp: string): number {
    if (!timestamp) return 0;
    
    const cleanTimestamp = timestamp.replace(/[<>]/g, '').trim();
    
    // Handle multiple VTT timestamp formats
    // Format 1: HH:MM:SS.mmm
    // Format 2: MM:SS.mmm  
    // Format 3: SS.mmm
    // Format 4: HH:MM:SS (without milliseconds)
    const timeRegex = /^(?:(\d{1,2}):)?(?:(\d{1,2}):)?(\d{1,2})(?:\.(\d{1,3}))?$/;
    const match = cleanTimestamp.match(timeRegex);
    
    if (!match) {
      console.warn(`⚠️ Could not parse timestamp: "${timestamp}"`);
      return 1; // Return 1 instead of 0 to avoid filtering out
    }
    
    const [, hours, minutes, seconds, milliseconds] = match;
    
    const h = parseInt(hours || '0') || 0;
    const m = parseInt(minutes || '0') || 0;
    const s = parseInt(seconds) || 0;
    const ms = parseInt(milliseconds?.padEnd(3, '0') || '0') || 0;
    
    const totalSeconds = h * 3600 + m * 60 + s + ms / 1000;
    
    // Ensure minimum time to avoid filtering
    return Math.max(0.1, totalSeconds);
  }

  private async uploadChunksToQdrant(course: 'nodejs' | 'python', chunks: QdrantChunk[]): Promise<void> {
    console.log(`📤 Uploading ${chunks.length} chunks for ${course}...`);
    
    // Create embeddings in batches
    const points = [];
    
    for (let i = 0; i < chunks.length; i += this.BATCH_SIZE) {
      const batch = chunks.slice(i, i + this.BATCH_SIZE);
      
      try {
        // Create embeddings for this batch
        const texts = batch.map(chunk => chunk.content);
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: texts,
          dimensions: 1536,
        });
        
        // Prepare points for Qdrant
        const batchPoints = batch.map((chunk, idx) => ({
          id: createHash('md5').update(chunk.id).digest('hex'), // Use hash as ID
          vector: response.data[idx].embedding,
          payload: {
            content: chunk.content,
            course: chunk.course,
            section: chunk.section,
            videoId: chunk.videoId,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            duration: chunk.duration,
            chunkIndex: chunk.chunkIndex,
            quality_score: chunk.quality_score,
            topics: chunk.topics,
            keywords: chunk.keywords,
          }
        }));
        
        points.push(...batchPoints);
        
        console.log(`✅ Created embeddings for batch ${Math.floor(i / this.BATCH_SIZE) + 1}`);
        
        // Rate limiting
        await this.delay(100);
      } catch (error) {
        console.error(`❌ Failed to create embeddings for batch starting at ${i}:`, error);
      }
    }
    
    // Upload to Qdrant
    const collectionName = course === 'nodejs' ? COLLECTIONS.NODEJS_TRANSCRIPTS : COLLECTIONS.PYTHON_TRANSCRIPTS;
    await this.qdrantSetup.batchUpsertVectors(collectionName, points);
  }

  // Optimized search - only search user queries, not re-index VTT files
  async search(
    query: string, 
    limit: number = 5, 
    course: 'nodejs' | 'python' | 'both' = 'both',
    filters?: {
      difficulty?: string;
      topics?: string[];
      timeRange?: { start: number; end: number };
    }
  ): Promise<QdrantSearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // console.log(`🔍 Optimized Qdrant search for: "${query}" (course: ${course})`);
      const startTime = Date.now();
      
      // Only create embeddings for user query - VTT files already indexed
      const { queryOptimizer } = await import('./query-optimizer');
      const queryEmbedding = await queryOptimizer.getOptimizedEmbedding(query);
      
      // Use HYDE enhancement for better query understanding
      const { hydeEnhanced } = await import('./hyde-enhanced');
      const hydeResult = await hydeEnhanced.generateEnhancedHyde(query, course);
      const searchStrategy = await hydeEnhanced.createSearchStrategy(hydeResult);
      
      // Search only - no indexing of VTT files
      const collectionsToSearch = this.getCollectionsForCourse(course);
      
      // Execute searches with different strategies
      const searchPromises = collectionsToSearch.map(async (collectionName) => {
        const courseType = collectionName === COLLECTIONS.NODEJS_TRANSCRIPTS ? 'nodejs' : 'python';
        
        return Promise.all([
          // Primary search with original query
          this.searchCollection(
            collectionName, 
            queryEmbedding, 
            Math.ceil(limit * 0.6),
            filters,
            courseType
          ),
          // HYDE enhanced search
          this.searchCollection(
            collectionName,
            searchStrategy.primaryEmbedding,
            Math.ceil(limit * 0.4),
            filters,
            courseType
          )
        ]);
      });
      
      const allSearchResults = await Promise.all(searchPromises);
      
      // Combine and deduplicate results
      const combined = this.deduplicateResults(
        allSearchResults.flat().flat(),
        hydeResult.query.expectedTopics
      );
      
      // Apply advanced filtering
      const filtered = this.applyAdvancedFiltering(combined, hydeResult, filters);
      
      // Ensure unique references with proper timestamps
      const uniqueResults = this.ensureUniqueReferences(filtered);
      
      const results = uniqueResults
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(result => ({
          ...result,
          metadata: {
            ...result.metadata,
            timestamp: this.formatTimestamp(result.metadata.startTime),
            relevance_reason: this.generateEnhancedRelevanceReason(query, result, hydeResult),
          }
        }));
      
      const endTime = Date.now();
      // console.log(`⚡ Optimized search completed in ${endTime - startTime}ms, found ${results.length} unique results`);
      
      return results;
    } catch (error) {
      console.error('❌ Optimized search failed:', error);
      
      // Fallback to basic search
      return this.basicSearch(query, limit, course);
    }
  }

  private getCollectionsForCourse(course: 'nodejs' | 'python' | 'both'): string[] {
    if (course === 'nodejs') return [COLLECTIONS.NODEJS_TRANSCRIPTS];
    if (course === 'python') return [COLLECTIONS.PYTHON_TRANSCRIPTS];
    return [COLLECTIONS.NODEJS_TRANSCRIPTS, COLLECTIONS.PYTHON_TRANSCRIPTS];
  }

  // New method for deduplicating results and ensuring unique references
  private deduplicateResults(
    searchResults: QdrantSearchResult[],
    expectedTopics: string[]
  ): QdrantSearchResult[] {
    const unique = new Map<string, QdrantSearchResult>();
    
    searchResults.forEach((result) => {
      // Create unique key based on video and time range (allowing some overlap)
      const timeWindow = Math.floor(result.metadata.startTime / 30) * 30; // 30-second windows
      const key = `${result.metadata.videoId}-${timeWindow}`;
      
      if (unique.has(key)) {
        // Keep the result with higher score
        const existing = unique.get(key)!;
        if (result.score > existing.score) {
          // Apply topic relevance boost
          const topicBoost = this.calculateTopicRelevance(result, expectedTopics);
          unique.set(key, {
            ...result,
            score: result.score * (1 + topicBoost)
          });
        }
      } else {
        // Apply topic relevance boost
        const topicBoost = this.calculateTopicRelevance(result, expectedTopics);
        unique.set(key, {
          ...result,
          score: result.score * (1 + topicBoost)
        });
      }
    });
    
    return Array.from(unique.values());
  }

  private calculateTopicRelevance(result: QdrantSearchResult, expectedTopics: string[]): number {
    if (!expectedTopics.length) return 0;
    
    const resultTopics = [
      ...result.metadata.topics,
      result.metadata.course,
      result.metadata.section.toLowerCase(),
    ].map(t => t.toLowerCase());
    
    const matches = expectedTopics.filter(topic => 
      resultTopics.some(rt => rt.includes(topic.toLowerCase()))
    );
    
    return matches.length / expectedTopics.length * 0.3; // Max 30% boost
  }

  private applyAdvancedFiltering(
    results: QdrantSearchResult[],
    hydeResult: any,
    filters?: any
  ): QdrantSearchResult[] {
    let filtered = results;
    
    // Apply time range filter if specified
    if (filters?.timeRange) {
      filtered = filtered.filter(r => 
        r.metadata.startTime >= filters.timeRange.start &&
        r.metadata.endTime <= filters.timeRange.end
      );
    }
    
    // Apply topic filters if specified
    if (filters?.topics?.length) {
      filtered = filtered.filter(r => 
        filters.topics.some((topic: string) => 
          r.metadata.topics.some(rt => rt.toLowerCase().includes(topic.toLowerCase()))
        )
      );
    }
    
    // Quality score filtering
    filtered = filtered.filter(r => r.metadata.duration > 5); // At least 5 seconds
    
    return filtered;
  }

  private generateEnhancedRelevanceReason(
    query: string, 
    result: QdrantSearchResult, 
    hydeResult: any
  ): string {
    const reasons: string[] = [];
    
    // Score-based relevance
    if (result.score > 0.8) reasons.push('Excellent match');
    else if (result.score > 0.6) reasons.push('Strong relevance');
    else reasons.push('Good match');
    
    // HYDE-specific reasons
    if (hydeResult.query.queryType === 'implementation' && result.content.includes('function')) {
      reasons.push('Implementation example');
    }
    
    if (hydeResult.query.queryType === 'debugging' && result.content.includes('error')) {
      reasons.push('Error handling');
    }
    
    // Topic matches
    const topicMatches = result.metadata.topics.filter(topic =>
      hydeResult.query.expectedTopics.some((et: string) => 
        et.toLowerCase().includes(topic.toLowerCase())
      )
    );
    
    if (topicMatches.length > 0) {
      reasons.push(`Topics: ${topicMatches.slice(0, 2).join(', ')}`);
    }
    
    // Course relevance
    reasons.push(`${result.metadata.course.toUpperCase()} content`);
    
    return reasons.join(' | ');
  }

  private async basicSearch(
    query: string, 
    limit: number, 
    course: 'nodejs' | 'python' | 'both'
  ): Promise<QdrantSearchResult[]> {
    // console.log('⚡ Falling back to basic search');
    
    const { queryOptimizer } = await import('./query-optimizer');
    const queryEmbedding = await queryOptimizer.getOptimizedEmbedding(query);
    
    const collectionsToSearch = this.getCollectionsForCourse(course);
    const searchPromises = collectionsToSearch.map(collectionName =>
      this.searchCollection(collectionName, queryEmbedding, limit)
    );
    
    const results = await Promise.all(searchPromises);
    return results.flat().sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private async searchCollection(
    collectionName: string, 
    queryEmbedding: number[], 
    limit: number,
    filters?: any,
    courseType?: 'nodejs' | 'python'
  ): Promise<QdrantSearchResult[]> {
    try {
      const searchResult = await qdrant.search(collectionName, {
        vector: queryEmbedding,
        limit,
        score_threshold: 0.3, // Minimum similarity threshold
        with_payload: true,
      });
      
      return searchResult.map(point => ({
        content: point.payload?.content as string,
        score: point.score,
        metadata: {
          course: point.payload?.course as 'nodejs' | 'python',
          section: point.payload?.section as string,
          videoId: point.payload?.videoId as string,
          startTime: point.payload?.startTime as number,
          endTime: point.payload?.endTime as number,
          duration: point.payload?.duration as number,
          timestamp: '', // Will be filled later
          chunkIndex: point.payload?.chunkIndex as number,
          topics: point.payload?.topics as string[],
          relevance_reason: '', // Will be filled later
        }
      }));
    } catch (error) {
      console.error(`❌ Error searching collection ${collectionName}:`, error);
      return [];
    }
  }

  private filterByOptimization(results: QdrantSearchResult[], optimized: any): QdrantSearchResult[] {
    // Filter by course preference if specified
    if (optimized.course_preference !== 'both') {
      return results.filter(r => r.metadata.course === optimized.course_preference);
    }
    
    return results;
  }

  private generateRelevanceReason(query: string, result: QdrantSearchResult): string {
    const reasons: string[] = [];
    
    if (result.score > 0.8) reasons.push('High semantic similarity');
    else if (result.score > 0.6) reasons.push('Good semantic match');
    else reasons.push('Moderate relevance');
    
    // Check for keyword matches
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = result.content.toLowerCase();
    const matchingWords = queryWords.filter(word => contentWords.includes(word));
    
    if (matchingWords.length > 0) {
      reasons.push(`Keywords: ${matchingWords.slice(0, 3).join(', ')}`);
    }
    
    if (result.metadata.topics.length > 0) {
      reasons.push(`Topics: ${result.metadata.topics.slice(0, 2).join(', ')}`);
    }
    
    return reasons.join(' | ');
  }

  private extractTopics(content: string, course: 'nodejs' | 'python'): string[] {
    const topics: string[] = [];
    const contentLower = content.toLowerCase();
    
    const topicKeywords = course === 'nodejs' ? {
      'async-programming': ['async', 'await', 'promise', 'callback'],
      'express': ['express', 'middleware', 'router', 'app.get'],
      'modules': ['require', 'module.exports', 'import', 'export'],
      'http': ['http', 'server', 'request', 'response'],
      'events': ['event', 'emit', 'listener'],
    } : {
      'functions': ['function', 'def', 'return', 'parameter'],
      'classes': ['class', 'constructor', '__init__', 'method'],
      'data-structures': ['list', 'dict', 'tuple', 'set'],
      'loops': ['for', 'while', 'iterate', 'range'],
      'conditionals': ['if', 'else', 'elif', 'condition'],
    };
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        topics.push(topic);
      }
    });
    
    return topics;
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase().match(/\b[a-zA-Z]{4,}\b/g) || [];
    const commonWords = new Set(['that', 'this', 'with', 'have', 'will', 'from', 'they', 'been', 'have', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'what', 'about']);
    
    const keywords = words
      .filter(word => !commonWords.has(word))
      .reduce((acc: Map<string, number>, word) => {
        acc.set(word, (acc.get(word) || 0) + 1);
        return acc;
      }, new Map());
    
    return Array.from(keywords.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
  }

  private calculateQualityScore(content: string): number {
    let score = 0.5;
    
    const length = content.length;
    if (length >= 300 && length <= 800) score += 0.2;
    
    // Technical content bonus
    if (content.includes('(') && content.includes(')')) score += 0.1;
    if (/\b(function|class|method|variable|import|export)\b/i.test(content)) score += 0.2;
    
    return Math.min(1.0, score);
  }

  // Add method to ensure unique references
  private ensureUniqueReferences(results: QdrantSearchResult[]): QdrantSearchResult[] {
    const seenReferences = new Set<string>();
    const uniqueResults: QdrantSearchResult[] = [];
    
    for (const result of results) {
      // Create reference identifier
      const refId = `${result.metadata.videoId}-${Math.floor(result.metadata.startTime)}`;
      
      if (!seenReferences.has(refId)) {
        seenReferences.add(refId);
        uniqueResults.push(result);
      }
    }
    
    return uniqueResults;
  }

  // Fixed timestamp formatting to show proper values
  private formatTimestamp(seconds: number): string {
    if (!seconds || isNaN(seconds) || seconds <= 0) {
      return '0:00';
    }
    
    // Ensure we have a valid number
    const validSeconds = Math.max(0, Math.floor(seconds));
    const totalMinutes = Math.floor(validSeconds / 60);
    const remainingSeconds = validSeconds % 60;
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

  async getStatus() {
    try {
      const nodejsInfo = await qdrant.getCollection(COLLECTIONS.NODEJS_TRANSCRIPTS);
      const pythonInfo = await qdrant.getCollection(COLLECTIONS.PYTHON_TRANSCRIPTS);
      
      return {
        initialized: this.isInitialized,
        nodejs: {
          points: nodejsInfo.points_count || 0,
          vectors: nodejsInfo.vectors_count || 0,
        },
        python: {
          points: pythonInfo.points_count || 0,
          vectors: pythonInfo.vectors_count || 0,
        },
        total_points: (nodejsInfo.points_count || 0) + (pythonInfo.points_count || 0),
      };
    } catch (error) {
      return { initialized: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const qdrantRAG = new QdrantRAGSystem();
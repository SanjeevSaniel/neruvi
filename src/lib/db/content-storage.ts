import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export interface ContentStorageResult {
  content?: string;
  contentLarge?: string;
  contentCompressed?: string; // Base64 encoded compressed data
  contentExternalUrl?: string;
  compressionType?: string;
  characterCount: number;
  storageType: 'standard' | 'large' | 'compressed' | 'external' | 'chunked';
}

export interface MessageContent {
  content?: string;
  contentLarge?: string;
  contentCompressed?: string; // Base64 encoded compressed data
  compressionType?: string;
  characterCount: number;
}

export class ContentStorageManager {
  private readonly SMALL_CONTENT_LIMIT = 8 * 1024; // 8KB
  private readonly LARGE_CONTENT_LIMIT = 1024 * 1024; // 1MB
  private readonly CHUNK_SIZE = 32 * 1024; // 32KB per chunk
  
  /**
   * Store content using optimal storage strategy based on size
   */
  async storeContent(content: string): Promise<ContentStorageResult> {
    const characterCount = content.length;
    const byteSize = Buffer.byteLength(content, 'utf8');
    
    console.log(`📦 Storing content: ${characterCount} characters, ${byteSize} bytes`);
    
    // Strategy 1: Small content - store directly
    if (byteSize <= this.SMALL_CONTENT_LIMIT) {
      return {
        content,
        characterCount,
        storageType: 'standard'
      };
    }
    
    // Strategy 2: Medium content - store in large text field
    if (byteSize <= this.LARGE_CONTENT_LIMIT) {
      return {
        contentLarge: content,
        characterCount,
        storageType: 'large'
      };
    }
    
    // Strategy 3: Large content - try compression
    try {
      const compressed = await gzipAsync(Buffer.from(content, 'utf8'));
      
      // If compression saves significant space (at least 30%), use it
      if (compressed.length < byteSize * 0.7) {
        console.log(`🗜️ Content compressed: ${byteSize} → ${compressed.length} bytes (${Math.round((1 - compressed.length/byteSize) * 100)}% reduction)`);
        return {
          contentCompressed: compressed.toString('base64'),
          compressionType: 'gzip',
          characterCount,
          storageType: 'compressed'
        };
      } else {
        console.log(`⚠️ Compression not effective: ${byteSize} → ${compressed.length} bytes`);
      }
    } catch (error) {
      console.warn('⚠️ Compression failed:', error);
    }
    
    // Strategy 4: Very large content - use chunking
    console.log(`🔢 Content too large for single storage, will use chunking`);
    return {
      content: `[CHUNKED_CONTENT:${characterCount}]`, // Placeholder
      characterCount,
      storageType: 'chunked'
    };
  }
  
  /**
   * Retrieve content from various storage formats
   */
  async retrieveContent(
    messageData: MessageContent,
    messageChunks?: Array<{ chunkOrder: number; chunkContent: string }>
  ): Promise<string> {
    
    // Handle chunked content first
    if (messageData.content?.startsWith('[CHUNKED_CONTENT:')) {
      if (messageChunks && messageChunks.length > 0) {
        const reconstructed = messageChunks
          .sort((a, b) => a.chunkOrder - b.chunkOrder)
          .map(chunk => chunk.chunkContent)
          .join('');
        
        console.log(`🔗 Reconstructed chunked content: ${messageChunks.length} chunks → ${reconstructed.length} characters`);
        return reconstructed;
      } else {
        console.error('❌ Chunked content marker found but no chunks provided');
        return '[Error: Chunked content not available]';
      }
    }
    
    // Standard content
    if (messageData.content) {
      return messageData.content;
    }
    
    // Large content
    if (messageData.contentLarge) {
      return messageData.contentLarge;
    }
    
    // Compressed content
    if (messageData.contentCompressed) {
      try {
        const compressedBuffer = Buffer.from(messageData.contentCompressed, 'base64');
        const decompressed = await gunzipAsync(compressedBuffer);
        const result = decompressed.toString('utf8');
        console.log(`📂 Decompressed content: ${messageData.contentCompressed.length} → ${result.length} characters`);
        return result;
      } catch (error) {
        console.error('❌ Decompression failed:', error);
        return '[Error: Content decompression failed]';
      }
    }
    
    console.error('❌ No content found in any storage format');
    return '[Error: Content not found]';
  }
  
  /**
   * Break content into chunks for extremely large content
   */
  createChunks(content: string): Array<{ chunkOrder: number; chunkContent: string; chunkSize: number }> {
    const chunks = [];
    
    for (let i = 0; i < content.length; i += this.CHUNK_SIZE) {
      const chunkContent = content.slice(i, i + this.CHUNK_SIZE);
      chunks.push({
        chunkOrder: Math.floor(i / this.CHUNK_SIZE),
        chunkContent,
        chunkSize: chunkContent.length,
      });
    }
    
    console.log(`✂️ Created ${chunks.length} chunks from ${content.length} characters`);
    return chunks;
  }
  
  /**
   * Estimate storage efficiency for a given content
   */
  async estimateStorageInfo(content: string): Promise<{
    originalSize: number;
    characterCount: number;
    recommendedStrategy: string;
    estimatedSize: number;
    compressionRatio?: number;
  }> {
    const characterCount = content.length;
    const originalSize = Buffer.byteLength(content, 'utf8');
    
    if (originalSize <= this.SMALL_CONTENT_LIMIT) {
      return {
        originalSize,
        characterCount,
        recommendedStrategy: 'standard',
        estimatedSize: originalSize
      };
    }
    
    if (originalSize <= this.LARGE_CONTENT_LIMIT) {
      return {
        originalSize,
        characterCount,
        recommendedStrategy: 'large',
        estimatedSize: originalSize
      };
    }
    
    // Test compression
    try {
      const compressed = await gzipAsync(Buffer.from(content, 'utf8'));
      const compressionRatio = compressed.length / originalSize;
      
      if (compressionRatio < 0.7) {
        return {
          originalSize,
          characterCount,
          recommendedStrategy: 'compressed',
          estimatedSize: compressed.length,
          compressionRatio
        };
      }
    } catch (error) {
      console.warn('Compression estimation failed:', error);
    }
    
    const numChunks = Math.ceil(content.length / this.CHUNK_SIZE);
    return {
      originalSize,
      characterCount,
      recommendedStrategy: `chunked (${numChunks} chunks)`,
      estimatedSize: originalSize // Same size but in multiple records
    };
  }
  
  /**
   * Get storage statistics
   */
  getStorageLimits() {
    return {
      SMALL_CONTENT_LIMIT: this.SMALL_CONTENT_LIMIT,
      LARGE_CONTENT_LIMIT: this.LARGE_CONTENT_LIMIT,
      CHUNK_SIZE: this.CHUNK_SIZE,
      limits: {
        standard: `< ${this.SMALL_CONTENT_LIMIT / 1024}KB`,
        large: `${this.SMALL_CONTENT_LIMIT / 1024}KB - ${this.LARGE_CONTENT_LIMIT / 1024}KB`,
        compressed: `> ${this.LARGE_CONTENT_LIMIT / 1024}KB (with compression)`,
        chunked: `> ${this.LARGE_CONTENT_LIMIT / 1024}KB (multiple records)`
      }
    };
  }
}
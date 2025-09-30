/**
 * Simple in-memory query cache for RAG results
 * Reduces repeated Qdrant queries for common questions
 */

interface CacheEntry {
  results: any[];
  timestamp: number;
  course: string;
}

class QueryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_ENTRIES = 100;

  /**
   * Generate cache key from query and course
   */
  private getCacheKey(query: string, course: string): string {
    return `${course}:${query.toLowerCase().trim()}`;
  }

  /**
   * Get cached results if available and not expired
   */
  get(query: string, course: string): any[] | null {
    const key = this.getCacheKey(query, course);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache HIT for query: "${query}"`);
    return entry.results;
  }

  /**
   * Store query results in cache
   */
  set(query: string, course: string, results: any[]): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.MAX_ENTRIES) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this.getCacheKey(query, course);
    this.cache.set(key, {
      results,
      timestamp: Date.now(),
      course
    });

    console.log(`💾 Cached results for query: "${query}"`);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ Query cache cleared');
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Removed ${removedCount} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.MAX_ENTRIES,
      ttlMs: this.TTL
    };
  }
}

// Singleton instance
export const queryCache = new QueryCache();

// Clear expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    queryCache.clearExpired();
  }, 5 * 60 * 1000);
}
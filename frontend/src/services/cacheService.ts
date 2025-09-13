import { Book, Chapter, DictionaryTerm, UserPreferences } from '../types';

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number;
  enablePersistence?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hitRate: number;
  missRate: number;
  evictionCount: number;
  totalRequests: number;
}

/**
 * Advanced caching service with multiple cache layers and strategies
 * Implements LRU eviction, TTL expiration, and optional localStorage persistence
 */
class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private accessOrder: string[] = [];
  private stats: CacheStats = {
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
    totalRequests: 0
  };

  private readonly defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    enablePersistence: true
  };

  private cacheConfigs: Map<string, CacheConfig> = new Map([
    ['books', { ttl: 10 * 60 * 1000, maxSize: 50, enablePersistence: true }],
    ['chapters', { ttl: 15 * 60 * 1000, maxSize: 200, enablePersistence: true }],
    ['dictionary', { ttl: 60 * 60 * 1000, maxSize: 1000, enablePersistence: true }],
    ['preferences', { ttl: 24 * 60 * 60 * 1000, maxSize: 10, enablePersistence: true }],
    ['search', { ttl: 2 * 60 * 1000, maxSize: 30, enablePersistence: false }],
    ['spell-check', { ttl: 30 * 60 * 1000, maxSize: 500, enablePersistence: false }]
  ]);

  constructor() {
    this.loadFromPersistentStorage();
    this.startCleanupTimer();
    this.setupBeforeUnloadHandler();
  }

  /**
   * Get data from cache with automatic eviction and stats tracking
   */
  get<T>(key: string): T | null {
    this.stats.totalRequests++;
    const entry = this.memoryCache.get(key);

    if (!entry) {
      this.stats.missRate = this.stats.totalRequests > 0
        ? ((this.stats.totalRequests - this.getHitCount()) / this.stats.totalRequests) * 100
        : 0;
      return null;
    }

    // Check TTL expiration
    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.missRate = this.stats.totalRequests > 0
        ? ((this.stats.totalRequests - this.getHitCount()) / this.stats.totalRequests) * 100
        : 0;
      return null;
    }

    // Update access tracking for LRU
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);

    const hitCount = this.getHitCount() + 1;
    this.stats.hitRate = this.stats.totalRequests > 0
      ? (hitCount / this.stats.totalRequests) * 100
      : 0;

    return entry.data;
  }

  /**
   * Set data in cache with automatic eviction
   */
  set<T>(key: string, data: T, customTTL?: number): void {
    const cacheType = this.getCacheType(key);
    const config = this.cacheConfigs.get(cacheType) || this.defaultConfig;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: customTTL || config.ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    // Check if we need to evict entries
    if (this.memoryCache.size >= config.maxSize) {
      this.evictLeastRecentlyUsed(config.maxSize - 1);
    }

    this.memoryCache.set(key, entry);
    this.updateAccessOrder(key);

    // Persist to localStorage if enabled
    if (config.enablePersistence) {
      this.persistToStorage(key, entry);
    }
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): boolean {
    const deleted = this.memoryCache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
      this.removeFromPersistentStorage(key);
    }
    return deleted;
  }

  /**
   * Clear cache by type or completely
   */
  clear(cacheType?: string): void {
    if (cacheType) {
      const keysToDelete = Array.from(this.memoryCache.keys())
        .filter(key => key.startsWith(cacheType + ':'));

      keysToDelete.forEach(key => this.delete(key));
    } else {
      this.memoryCache.clear();
      this.accessOrder = [];
      this.clearPersistentStorage();
    }
  }

  /**
   * Cache API response with request deduplication
   */
  async cacheApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const result = await apiCall();
      this.set(key, result, customTTL);
      return result;
    } catch (error) {
      console.error(`Cache API call failed for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Batch operations for efficient multiple cache operations
   */
  batchSet<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    entries.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
  }

  batchGet<T>(keys: string[]): Array<{ key: string; data: T | null }> {
    return keys.map(key => ({
      key,
      data: this.get<T>(key)
    }));
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & {
    size: number;
    memoryUsage: number;
    topAccessedKeys: Array<{ key: string; accessCount: number }>;
  } {
    const topAccessed = Array.from(this.memoryCache.entries())
      .map(([key, entry]) => ({ key, accessCount: entry.accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      ...this.stats,
      size: this.memoryCache.size,
      memoryUsage: this.estimateMemoryUsage(),
      topAccessedKeys: topAccessed
    };
  }

  /**
   * Preload frequently accessed data
   */
  async preloadData(preloadConfig: Array<{
    key: string;
    loader: () => Promise<any>;
    priority: number;
  }>): Promise<void> {
    const sortedConfig = preloadConfig.sort((a, b) => b.priority - a.priority);

    const preloadPromises = sortedConfig.map(async ({ key, loader }) => {
      try {
        if (!this.get(key)) {
          const data = await loader();
          this.set(key, data);
        }
      } catch (error) {
        console.warn(`Preload failed for key: ${key}`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  // Private methods

  private getCacheType(key: string): string {
    const colonIndex = key.indexOf(':');
    return colonIndex > -1 ? key.substring(0, colonIndex) : 'default';
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private evictLeastRecentlyUsed(targetSize: number): void {
    while (this.memoryCache.size > targetSize && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.memoryCache.delete(lruKey);
        this.removeFromPersistentStorage(lruKey);
        this.stats.evictionCount++;
      }
    }
  }

  private getHitCount(): number {
    return Math.floor((this.stats.hitRate * this.stats.totalRequests) / 100);
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;
    this.memoryCache.forEach((entry, key) => {
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 32; // Approximate overhead for entry metadata
    });
    return totalSize;
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Run every minute
  }

  private cleanupExpiredEntries(): void {
    const keysToDelete: string[] = [];

    this.memoryCache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.delete(key));
  }

  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.saveToPersistentStorage();
    });
  }

  // Persistent storage methods

  private loadFromPersistentStorage(): void {
    try {
      const persistentCache = localStorage.getItem('app_cache');
      if (persistentCache) {
        const parsed = JSON.parse(persistentCache);
        Object.entries(parsed).forEach(([key, entry]: [string, any]) => {
          if (!this.isExpired(entry)) {
            this.memoryCache.set(key, entry);
            this.accessOrder.push(key);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from persistent storage:', error);
    }
  }

  private saveToPersistentStorage(): void {
    try {
      const persistentData: Record<string, CacheEntry<any>> = {};

      this.memoryCache.forEach((entry, key) => {
        const cacheType = this.getCacheType(key);
        const config = this.cacheConfigs.get(cacheType) || this.defaultConfig;

        if (config.enablePersistence && !this.isExpired(entry)) {
          persistentData[key] = entry;
        }
      });

      localStorage.setItem('app_cache', JSON.stringify(persistentData));
    } catch (error) {
      console.warn('Failed to save cache to persistent storage:', error);
    }
  }

  private persistToStorage(key: string, entry: CacheEntry<any>): void {
    try {
      const existingData = JSON.parse(localStorage.getItem('app_cache') || '{}');
      existingData[key] = entry;
      localStorage.setItem('app_cache', JSON.stringify(existingData));
    } catch (error) {
      console.warn(`Failed to persist cache entry: ${key}`, error);
    }
  }

  private removeFromPersistentStorage(key: string): void {
    try {
      const existingData = JSON.parse(localStorage.getItem('app_cache') || '{}');
      delete existingData[key];
      localStorage.setItem('app_cache', JSON.stringify(existingData));
    } catch (error) {
      console.warn(`Failed to remove cache entry from storage: ${key}`, error);
    }
  }

  private clearPersistentStorage(): void {
    try {
      localStorage.removeItem('app_cache');
    } catch (error) {
      console.warn('Failed to clear persistent cache storage:', error);
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService();
export default cacheService;
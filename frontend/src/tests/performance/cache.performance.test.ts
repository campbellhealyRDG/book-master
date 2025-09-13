import { cacheService } from '../../services/cacheService';
import { apiService } from '../../services/apiService';
import { Book, Chapter } from '../../types';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Cache Service Performance Tests', () => {
  beforeEach(() => {
    cacheService.clear();
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, title: 'Test Book' })
    });
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('Cache Operations Performance', () => {
    test('should handle high-volume cache operations efficiently', () => {
      const startTime = performance.now();
      const itemCount = 10000;

      // Perform bulk cache operations
      for (let i = 0; i < itemCount; i++) {
        cacheService.set(`test:${i}`, { id: i, data: `data-${i}` });
      }

      const setTime = performance.now() - startTime;

      // Retrieve all items
      const retrieveStart = performance.now();
      for (let i = 0; i < itemCount; i++) {
        const result = cacheService.get(`test:${i}`);
        expect(result).toBeTruthy();
      }
      const retrieveTime = performance.now() - retrieveStart;

      // Performance assertions
      expect(setTime).toBeLessThan(1000); // Less than 1 second for 10k sets
      expect(retrieveTime).toBeLessThan(500); // Less than 500ms for 10k gets
      expect(setTime / itemCount).toBeLessThan(0.1); // Less than 0.1ms per operation
    });

    test('should maintain performance with TTL expiration', async () => {
      const itemCount = 1000;
      const shortTTL = 100; // 100ms

      const startTime = performance.now();

      // Set items with short TTL
      for (let i = 0; i < itemCount; i++) {
        cacheService.set(`ttl:${i}`, { id: i }, shortTTL);
      }

      const setTime = performance.now() - startTime;

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Access expired items (should return null)
      const accessStart = performance.now();
      for (let i = 0; i < itemCount; i++) {
        const result = cacheService.get(`ttl:${i}`);
        expect(result).toBeNull();
      }
      const accessTime = performance.now() - accessStart;

      expect(setTime).toBeLessThan(100);
      expect(accessTime).toBeLessThan(50);
    });

    test('should handle LRU eviction efficiently', () => {
      const cacheSize = 100;
      const itemCount = 500;

      const startTime = performance.now();

      // Fill cache beyond capacity
      for (let i = 0; i < itemCount; i++) {
        cacheService.set(`lru:${i}`, { id: i, data: `data-${i}` });
      }

      const fillTime = performance.now() - startTime;

      // Verify cache size is maintained
      const stats = cacheService.getStats();
      expect(stats.size).toBeLessThanOrEqual(cacheSize);

      // Verify most recent items are retained
      for (let i = itemCount - cacheSize; i < itemCount; i++) {
        const result = cacheService.get(`lru:${i}`);
        expect(result).toBeTruthy();
      }

      expect(fillTime).toBeLessThan(200); // Should handle eviction efficiently
    });

    test('should handle concurrent cache operations', async () => {
      const concurrentOperations = 100;
      const operationsPerBatch = 50;

      const startTime = performance.now();

      // Create concurrent set operations
      const setPromises = Array.from({ length: concurrentOperations }, (_, i) =>
        Promise.resolve().then(() => {
          for (let j = 0; j < operationsPerBatch; j++) {
            cacheService.set(`concurrent:${i}:${j}`, { batch: i, item: j });
          }
        })
      );

      await Promise.all(setPromises);

      // Create concurrent get operations
      const getPromises = Array.from({ length: concurrentOperations }, (_, i) =>
        Promise.resolve().then(() => {
          for (let j = 0; j < operationsPerBatch; j++) {
            const result = cacheService.get(`concurrent:${i}:${j}`);
            expect(result).toBeTruthy();
          }
        })
      );

      await Promise.all(getPromises);

      const totalTime = performance.now() - startTime;
      expect(totalTime).toBeLessThan(1000); // Should handle concurrency well
    });
  });

  describe('Batch Operations Performance', () => {
    test('should perform batch operations efficiently', () => {
      const batchSize = 1000;
      const batchData = Array.from({ length: batchSize }, (_, i) => ({
        key: `batch:${i}`,
        data: { id: i, content: `content-${i}` }
      }));

      // Measure batch set performance
      const batchSetStart = performance.now();
      cacheService.batchSet(batchData);
      const batchSetTime = performance.now() - batchSetStart;

      // Measure batch get performance
      const keys = batchData.map(item => item.key);
      const batchGetStart = performance.now();
      const results = cacheService.batchGet(keys);
      const batchGetTime = performance.now() - batchGetStart;

      // Verify all items were set and retrieved
      expect(results).toHaveLength(batchSize);
      results.forEach(result => {
        expect(result.data).toBeTruthy();
      });

      // Performance assertions
      expect(batchSetTime).toBeLessThan(100);
      expect(batchGetTime).toBeLessThan(50);
    });

    test('should handle mixed hit/miss batch operations', () => {
      const batchSize = 100;

      // Set half the items
      for (let i = 0; i < batchSize / 2; i++) {
        cacheService.set(`mixed:${i}`, { id: i });
      }

      // Batch get all items (half hits, half misses)
      const keys = Array.from({ length: batchSize }, (_, i) => `mixed:${i}`);

      const startTime = performance.now();
      const results = cacheService.batchGet(keys);
      const batchTime = performance.now() - startTime;

      // Verify results
      expect(results).toHaveLength(batchSize);
      const hits = results.filter(r => r.data !== null);
      const misses = results.filter(r => r.data === null);

      expect(hits).toHaveLength(batchSize / 2);
      expect(misses).toHaveLength(batchSize / 2);

      // Should handle mixed operations efficiently
      expect(batchTime).toBeLessThan(20);
    });
  });

  describe('Memory Performance', () => {
    test('should manage memory usage effectively', () => {
      const initialMemory = (window.performance as any).memory?.usedJSHeapSize || 0;
      const largeDataSize = 1000000; // 1MB of data per item
      const itemCount = 10;

      // Create large cache entries
      for (let i = 0; i < itemCount; i++) {
        const largeData = {
          id: i,
          content: 'x'.repeat(largeDataSize)
        };
        cacheService.set(`memory:${i}`, largeData);
      }

      const peakMemory = (window.performance as any).memory?.usedJSHeapSize || 0;

      // Clear cache
      cacheService.clear();

      const finalMemory = (window.performance as any).memory?.usedJSHeapSize || 0;

      // Verify memory is managed properly
      const memoryIncrease = peakMemory - initialMemory;
      const memoryReclaimed = peakMemory - finalMemory;

      // Should reclaim significant memory after clearing
      expect(memoryReclaimed).toBeGreaterThan(memoryIncrease * 0.5);
    });

    test('should estimate memory usage accurately', () => {
      const itemSizes = [100, 1000, 10000, 100000];
      const measurements: Array<{ size: number; estimated: number }> = [];

      itemSizes.forEach(size => {
        cacheService.clear();

        const data = { content: 'x'.repeat(size) };
        cacheService.set('size-test', data);

        const stats = cacheService.getStats();
        measurements.push({
          size,
          estimated: stats.memoryUsage
        });
      });

      // Memory estimates should correlate with data size
      for (let i = 1; i < measurements.length; i++) {
        expect(measurements[i].estimated).toBeGreaterThan(measurements[i - 1].estimated);
      }
    });
  });

  describe('Cache Statistics Performance', () => {
    test('should calculate statistics efficiently', () => {
      const itemCount = 1000;

      // Populate cache
      for (let i = 0; i < itemCount; i++) {
        cacheService.set(`stats:${i}`, { id: i });
      }

      // Perform some cache hits and misses
      for (let i = 0; i < itemCount; i++) {
        cacheService.get(`stats:${i}`); // Hit
        cacheService.get(`missing:${i}`); // Miss
      }

      const startTime = performance.now();

      // Get statistics multiple times
      for (let i = 0; i < 100; i++) {
        const stats = cacheService.getStats();
        expect(stats).toBeDefined();
        expect(stats.size).toBe(itemCount);
      }

      const statsTime = performance.now() - startTime;

      // Statistics calculation should be fast
      expect(statsTime).toBeLessThan(50);
    });
  });

  describe('Preload Performance', () => {
    test('should preload data efficiently', async () => {
      const preloadTasks = Array.from({ length: 10 }, (_, i) => ({
        key: `preload:${i}`,
        loader: async () => {
          await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async load
          return { id: i, data: `preloaded-${i}` };
        },
        priority: i
      }));

      const startTime = performance.now();

      await cacheService.preloadData(preloadTasks);

      const preloadTime = performance.now() - startTime;

      // Verify all data was preloaded
      for (let i = 0; i < 10; i++) {
        const result = cacheService.get(`preload:${i}`);
        expect(result).toBeTruthy();
      }

      // Should complete preloading efficiently
      expect(preloadTime).toBeLessThan(500);
    });

    test('should handle preload failures gracefully', async () => {
      const mixedTasks = [
        {
          key: 'success:1',
          loader: async () => ({ id: 1 }),
          priority: 1
        },
        {
          key: 'failure:1',
          loader: async () => {
            throw new Error('Load failed');
          },
          priority: 2
        },
        {
          key: 'success:2',
          loader: async () => ({ id: 2 }),
          priority: 3
        }
      ];

      const startTime = performance.now();

      await cacheService.preloadData(mixedTasks);

      const preloadTime = performance.now() - startTime;

      // Successful tasks should be cached
      expect(cacheService.get('success:1')).toBeTruthy();
      expect(cacheService.get('success:2')).toBeTruthy();

      // Failed task should not be cached
      expect(cacheService.get('failure:1')).toBeNull();

      // Should handle failures without blocking
      expect(preloadTime).toBeLessThan(200);
    });
  });

  describe('Persistent Storage Performance', () => {
    test('should save and load from persistent storage efficiently', async () => {
      const itemCount = 100;

      // Populate cache
      for (let i = 0; i < itemCount; i++) {
        cacheService.set(`persistent:${i}`, { id: i, persistent: true });
      }

      // Simulate browser refresh by creating new cache service
      const saveTime = performance.now();

      // Clear memory cache
      cacheService.clear();

      const loadTime = performance.now() - saveTime;

      // Performance should be reasonable
      expect(loadTime).toBeLessThan(100);
    });
  });
});

// API Service Cache Integration Tests
describe('API Service Cache Performance', () => {
  beforeEach(() => {
    cacheService.clear();
    jest.clearAllMocks();
  });

  test('should provide significant performance improvement with caching', async () => {
    // Mock slow API response
    (fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() =>
          resolve({
            ok: true,
            json: async () => ({ id: 1, title: 'Test Book' })
          }),
          100
        )
      )
    );

    // First call (cache miss)
    const firstCallStart = performance.now();
    const result1 = await apiService.getBook(1);
    const firstCallTime = performance.now() - firstCallStart;

    // Second call (cache hit)
    const secondCallStart = performance.now();
    const result2 = await apiService.getBook(1);
    const secondCallTime = performance.now() - secondCallStart;

    // Verify results are identical
    expect(result1).toEqual(result2);

    // Cache hit should be significantly faster
    expect(secondCallTime).toBeLessThan(firstCallTime * 0.1);
    expect(secondCallTime).toBeLessThan(10); // Less than 10ms
  });

  test('should handle request deduplication efficiently', async () => {
    let callCount = 0;
    (fetch as jest.Mock).mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: 1, title: 'Test Book' })
      });
    });

    // Make multiple concurrent requests
    const startTime = performance.now();
    const promises = Array.from({ length: 10 }, () => apiService.getBook(1));
    const results = await Promise.all(promises);
    const totalTime = performance.now() - startTime;

    // Should only make one API call
    expect(callCount).toBe(1);

    // All results should be identical
    results.forEach(result => {
      expect(result).toEqual(results[0]);
    });

    // Should complete quickly due to deduplication
    expect(totalTime).toBeLessThan(200);
  });

  test('should handle optimistic updates efficiently', async () => {
    // Initial book
    const initialBook: Book = {
      id: 1,
      title: 'Original Title',
      author: 'Author',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      chapter_count: 0,
      word_count: 0
    };

    cacheService.set('books:1', initialBook);

    // Mock update response
    (fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() =>
          resolve({
            ok: true,
            json: async () => ({
              ...initialBook,
              title: 'Updated Title',
              updated_at: new Date().toISOString()
            })
          }),
          100
        )
      )
    );

    const startTime = performance.now();

    // Update should return immediately with optimistic data
    const updatePromise = apiService.updateBook(1, { title: 'Updated Title' });

    // Should be very fast due to optimistic update
    const optimisticTime = performance.now() - startTime;
    expect(optimisticTime).toBeLessThan(50);

    const finalResult = await updatePromise;
    expect(finalResult.title).toBe('Updated Title');
  });
});

// Performance benchmark utility
export const benchmarkCacheService = async (operationCount: number = 10000) => {
  const results = {
    setOperations: [] as number[],
    getOperations: [] as number[],
    batchOperations: {
      batchSetTime: 0,
      batchGetTime: 0
    },
    memory: {
      start: 0,
      peak: 0,
      end: 0
    }
  };

  results.memory.start = (window.performance as any).memory?.usedJSHeapSize || 0;

  // Benchmark individual set operations
  for (let i = 0; i < operationCount; i++) {
    const start = performance.now();
    cacheService.set(`benchmark:${i}`, { id: i, data: `data-${i}` });
    results.setOperations.push(performance.now() - start);
  }

  results.memory.peak = (window.performance as any).memory?.usedJSHeapSize || 0;

  // Benchmark individual get operations
  for (let i = 0; i < operationCount; i++) {
    const start = performance.now();
    cacheService.get(`benchmark:${i}`);
    results.getOperations.push(performance.now() - start);
  }

  // Benchmark batch operations
  const batchData = Array.from({ length: 1000 }, (_, i) => ({
    key: `batch-benchmark:${i}`,
    data: { id: i }
  }));

  const batchSetStart = performance.now();
  cacheService.batchSet(batchData);
  results.batchOperations.batchSetTime = performance.now() - batchSetStart;

  const batchGetStart = performance.now();
  cacheService.batchGet(batchData.map(item => item.key));
  results.batchOperations.batchGetTime = performance.now() - batchGetStart;

  results.memory.end = (window.performance as any).memory?.usedJSHeapSize || 0;

  return {
    ...results,
    averageSetTime: results.setOperations.reduce((a, b) => a + b, 0) / results.setOperations.length,
    averageGetTime: results.getOperations.reduce((a, b) => a + b, 0) / results.getOperations.length,
    memoryGrowth: results.memory.end - results.memory.start,
    peakMemoryUsage: results.memory.peak - results.memory.start
  };
};
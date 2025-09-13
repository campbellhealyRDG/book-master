import { renderHook, act } from '@testing-library/react-hooks';
import { useLazyContent } from '../../hooks/useLazyContent';
import { Chapter } from '../../types';

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
  },
  writable: true,
});

describe('Lazy Content Performance Tests', () => {
  // Generate test data
  const generateChapters = (count: number, contentLength: number): Chapter[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      book_id: 1,
      title: `Chapter ${i + 1}`,
      content: 'A'.repeat(contentLength),
      chapter_number: i + 1,
      word_count: Math.floor(contentLength / 5),
      character_count: contentLength,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Memory Performance', () => {
    test('should handle large number of chapters efficiently', async () => {
      const startTime = performance.now();
      const largeChapterSet = generateChapters(1000, 10000); // 1000 chapters, 10k chars each

      const { result } = renderHook(() =>
        useLazyContent(largeChapterSet, {
          previewLength: 150,
          cacheSize: 50
        })
      );

      const endTime = performance.now();
      const initializationTime = endTime - startTime;

      // Should initialize within reasonable time
      expect(initializationTime).toBeLessThan(1000); // Less than 1 second

      // Should create previews for all chapters
      expect(result.current.lazyChapters).toHaveLength(1000);

      // Should not load full content initially
      result.current.lazyChapters.forEach(chapter => {
        expect(chapter.content.length).toBeLessThanOrEqual(153); // 150 + '...'
      });
    });

    test('should manage cache size effectively', async () => {
      const chapters = generateChapters(20, 5000);
      const { result } = renderHook(() =>
        useLazyContent(chapters, { cacheSize: 5 })
      );

      // Load content for 10 chapters
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.loadFullContent(i + 1);
        });
      }

      // Cache should not exceed limit
      expect(result.current.getCacheSize()).toBeLessThanOrEqual(5);

      // Most recently accessed should still be cached
      const recentIds = result.current.getCachedChapterIds();
      expect(recentIds).toHaveLength(5);
      expect(recentIds).toContain(10); // Last loaded chapter
    });

    test('should handle memory pressure gracefully', async () => {
      const chapters = generateChapters(100, 50000); // Large content
      const { result } = renderHook(() =>
        useLazyContent(chapters, {
          cacheSize: 10,
          previewLength: 100
        })
      );

      const startMemory = (window.performance as any).memory?.usedJSHeapSize || 0;

      // Load and unload content repeatedly
      for (let cycle = 0; cycle < 5; cycle++) {
        for (let i = 0; i < 20; i++) {
          await act(async () => {
            await result.current.loadFullContent((cycle * 20 + i) % 100 + 1);
          });
        }
      }

      const endMemory = (window.performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = endMemory - startMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Loading Performance', () => {
    test('should load content within performance threshold', async () => {
      const chapters = generateChapters(10, 10000);
      const { result } = renderHook(() => useLazyContent(chapters));

      const startTime = performance.now();

      await act(async () => {
        await result.current.loadFullContent(1);
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load within 100ms
      expect(loadTime).toBeLessThan(100);
    });

    test('should handle concurrent loading requests', async () => {
      const chapters = generateChapters(10, 5000);
      const { result } = renderHook(() =>
        useLazyContent(chapters, { loadDelay: 50 })
      );

      const startTime = performance.now();

      // Trigger multiple concurrent loads
      const loadPromises = [1, 2, 3, 4, 5].map(id =>
        result.current.loadFullContent(id)
      );

      await act(async () => {
        await Promise.all(loadPromises);
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(300); // Less than 300ms for 5 concurrent requests
    });

    test('should debounce frequent requests', async () => {
      const chapters = generateChapters(5, 1000);
      let loadCallCount = 0;

      // Mock the actual loading to count calls
      const originalLoadContent = jest.fn().mockImplementation(() => {
        loadCallCount++;
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useLazyContent(chapters, { loadDelay: 100 })
      );

      // Trigger multiple rapid requests
      act(() => {
        result.current.loadFullContent(1);
        result.current.loadFullContent(1);
        result.current.loadFullContent(1);
      });

      // Wait for debounce to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Should only process one request due to debouncing
      expect(result.current.isLoading(1)).toBe(false);
    });
  });

  describe('Cache Performance', () => {
    test('should provide fast cache hits', async () => {
      const chapters = generateChapters(10, 5000);
      const { result } = renderHook(() => useLazyContent(chapters));

      // Load content once
      await act(async () => {
        await result.current.loadFullContent(1);
      });

      // Measure cache hit performance
      const startTime = performance.now();

      act(() => {
        const cachedChapter = result.current.lazyChapters.find(ch => ch.id === 1);
        expect(cachedChapter?.hasFullContent).toBe(true);
      });

      const endTime = performance.now();
      const cacheHitTime = endTime - startTime;

      // Cache hits should be nearly instantaneous
      expect(cacheHitTime).toBeLessThan(1);
    });

    test('should handle cache eviction efficiently', async () => {
      const chapters = generateChapters(20, 3000);
      const { result } = renderHook(() =>
        useLazyContent(chapters, { cacheSize: 3 })
      );

      // Fill cache beyond capacity
      for (let i = 1; i <= 5; i++) {
        await act(async () => {
          await result.current.loadFullContent(i);
        });
      }

      // Should maintain cache size limit
      expect(result.current.getCacheSize()).toBeLessThanOrEqual(3);

      // Most recent items should be cached
      const cachedIds = result.current.getCachedChapterIds();
      expect(cachedIds).toContain(5);
      expect(cachedIds).toContain(4);
      expect(cachedIds).toContain(3);
    });
  });

  describe('Search Performance', () => {
    test('should provide fast search in loaded content', async () => {
      const chapters = generateChapters(50, 2000);
      const { result } = renderHook(() => useLazyContent(chapters));

      // Load some content
      for (let i = 1; i <= 10; i++) {
        await act(async () => {
          await result.current.loadFullContent(i);
        });
      }

      const startTime = performance.now();

      // Perform searches on loaded content
      for (let i = 1; i <= 10; i++) {
        const searchableContent = result.current.getSearchableContent(i);
        expect(searchableContent.length).toBeGreaterThan(0);
      }

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Search should be fast
      expect(searchTime).toBeLessThan(50);
    });

    test('should handle search in mixed loaded/preview content', async () => {
      const chapters = generateChapters(20, 1000);
      const { result } = renderHook(() =>
        useLazyContent(chapters, { previewLength: 100 })
      );

      // Load full content for some chapters
      await act(async () => {
        await result.current.loadFullContent(1);
        await result.current.loadFullContent(5);
        await result.current.loadFullContent(10);
      });

      const startTime = performance.now();

      // Search all chapters
      const searchResults = chapters.map(chapter =>
        result.current.getSearchableContent(chapter.id)
      );

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Should return results for all chapters
      expect(searchResults).toHaveLength(20);

      // Loaded chapters should have full content
      expect(searchResults[0].length).toBe(1000); // Full content
      expect(searchResults[4].length).toBe(1000); // Full content
      expect(searchResults[9].length).toBe(1000); // Full content

      // Preview chapters should have limited content
      expect(searchResults[1].length).toBe(100); // Preview only

      // Search should be performant
      expect(searchTime).toBeLessThan(20);
    });
  });

  describe('Preloading Performance', () => {
    test('should preload visible chapters efficiently', async () => {
      const chapters = generateChapters(20, 2000);
      const { result } = renderHook(() => useLazyContent(chapters));

      const visibleChapterIds = [1, 2, 3, 4, 5];
      const startTime = performance.now();

      await act(async () => {
        result.current.preloadContent(visibleChapterIds);
      });

      const endTime = performance.now();
      const preloadTime = endTime - startTime;

      // Preloading should complete quickly
      expect(preloadTime).toBeLessThan(500);

      // All visible chapters should be loaded
      visibleChapterIds.forEach(id => {
        expect(result.current.isFullyLoaded(id)).toBe(true);
      });
    });

    test('should avoid duplicate preload requests', async () => {
      const chapters = generateChapters(10, 1000);
      const { result } = renderHook(() => useLazyContent(chapters));

      // Load some content first
      await act(async () => {
        await result.current.loadFullContent(1);
        await result.current.loadFullContent(2);
      });

      const initialCacheSize = result.current.getCacheSize();

      // Preload should skip already loaded chapters
      await act(async () => {
        result.current.preloadContent([1, 2, 3, 4]);
      });

      // Only new chapters should be loaded
      expect(result.current.getCacheSize()).toBe(Math.min(4, initialCacheSize + 2));
    });
  });

  describe('Cleanup Performance', () => {
    test('should cleanup resources efficiently', async () => {
      const chapters = generateChapters(10, 5000);
      const { result, unmount } = renderHook(() => useLazyContent(chapters));

      // Load some content and trigger timers
      await act(async () => {
        await result.current.loadFullContent(1);
        await result.current.loadFullContent(2);
      });

      const startTime = performance.now();

      // Unmount should cleanup timers and resources
      unmount();

      const endTime = performance.now();
      const cleanupTime = endTime - startTime;

      // Cleanup should be fast
      expect(cleanupTime).toBeLessThan(10);
    });
  });
});

// Performance benchmark utility
export const benchmarkLazyContent = async (
  chapterCount: number,
  contentLength: number,
  operations: number = 100
) => {
  const chapters = Array.from({ length: chapterCount }, (_, i) => ({
    id: i + 1,
    book_id: 1,
    title: `Chapter ${i + 1}`,
    content: 'A'.repeat(contentLength),
    chapter_number: i + 1,
    word_count: Math.floor(contentLength / 5),
    character_count: contentLength,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const results = {
    initialization: 0,
    loading: [] as number[],
    cacheHits: [] as number[],
    memory: {
      start: 0,
      end: 0,
      peak: 0
    }
  };

  // Measure initialization
  const initStart = performance.now();
  const { result } = renderHook(() => useLazyContent(chapters));
  results.initialization = performance.now() - initStart;

  results.memory.start = (window.performance as any).memory?.usedJSHeapSize || 0;

  // Measure loading operations
  for (let i = 0; i < Math.min(operations, chapterCount); i++) {
    const loadStart = performance.now();
    await act(async () => {
      await result.current.loadFullContent((i % chapterCount) + 1);
    });
    results.loading.push(performance.now() - loadStart);

    // Track peak memory
    const currentMemory = (window.performance as any).memory?.usedJSHeapSize || 0;
    results.memory.peak = Math.max(results.memory.peak, currentMemory);
  }

  // Measure cache hits
  for (let i = 0; i < Math.min(operations, chapterCount); i++) {
    const cacheStart = performance.now();
    const chapterId = (i % chapterCount) + 1;
    const isLoaded = result.current.isFullyLoaded(chapterId);
    if (isLoaded) {
      results.cacheHits.push(performance.now() - cacheStart);
    }
  }

  results.memory.end = (window.performance as any).memory?.usedJSHeapSize || 0;

  return {
    ...results,
    averageLoadTime: results.loading.reduce((a, b) => a + b, 0) / results.loading.length,
    averageCacheHitTime: results.cacheHits.reduce((a, b) => a + b, 0) / results.cacheHits.length,
    memoryGrowth: results.memory.end - results.memory.start,
    peakMemoryIncrease: results.memory.peak - results.memory.start
  };
};
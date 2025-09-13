import { memoryManager } from '../../services/memoryManager';
import { cacheService } from '../../services/cacheService';
import { spellCheckService } from '../../services/spellCheckService';

// Mock performance.memory API
Object.defineProperty(window.performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 500 * 1024 * 1024, // 500MB
  },
  writable: true,
});

describe('Memory Manager Performance Tests', () => {
  beforeEach(() => {
    // Reset memory manager state
    memoryManager.stopMonitoring();
    cacheService.clear();
    spellCheckService.clearCache();
  });

  afterEach(() => {
    memoryManager.stopMonitoring();
  });

  describe('Document Registration Performance', () => {
    test('should register large numbers of documents efficiently', () => {
      const documentCount = 1000;
      const largeContent = 'A'.repeat(100000); // 100k characters

      const startTime = performance.now();

      for (let i = 0; i < documentCount; i++) {
        memoryManager.registerDocument(
          `doc-${i}`,
          largeContent,
          100 // DOM elements
        );
      }

      const registrationTime = performance.now() - startTime;

      // Should register efficiently
      expect(registrationTime).toBeLessThan(1000); // Less than 1 second
      expect(registrationTime / documentCount).toBeLessThan(1); // Less than 1ms per document

      // Verify all documents are tracked
      const documentStates = memoryManager.getDocumentStates();
      expect(documentStates).toHaveLength(documentCount);
    });

    test('should handle document updates efficiently', () => {
      const documentCount = 100;

      // Register documents
      for (let i = 0; i < documentCount; i++) {
        memoryManager.registerDocument(`doc-${i}`, 'content', 50);
      }

      const startTime = performance.now();

      // Update access times
      for (let i = 0; i < documentCount; i++) {
        memoryManager.updateDocumentAccess(`doc-${i}`);
      }

      const updateTime = performance.now() - startTime;

      // Updates should be very fast
      expect(updateTime).toBeLessThan(50);
      expect(updateTime / documentCount).toBeLessThan(0.5);
    });

    test('should unregister documents with cleanup efficiently', () => {
      const documentCount = 100;
      const cleanupCallbacks = new Array(10).fill(0).map(() => jest.fn());

      // Register documents with cleanup callbacks
      for (let i = 0; i < documentCount; i++) {
        memoryManager.registerDocument(`doc-${i}`, 'content', 50);

        // Add multiple cleanup callbacks per document
        cleanupCallbacks.forEach(callback => {
          memoryManager.registerCleanupCallback(`doc-${i}`, callback);
        });
      }

      const startTime = performance.now();

      // Unregister all documents
      for (let i = 0; i < documentCount; i++) {
        memoryManager.unregisterDocument(`doc-${i}`);
      }

      const unregisterTime = performance.now() - startTime;

      // Should complete efficiently
      expect(unregisterTime).toBeLessThan(200);

      // All cleanup callbacks should have been called
      cleanupCallbacks.forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(documentCount);
      });
    });
  });

  describe('Memory Monitoring Performance', () => {
    test('should monitor memory usage efficiently', async () => {
      const monitoringCycles = 100;

      const startTime = performance.now();

      // Start monitoring
      memoryManager.startMonitoring();

      // Simulate memory pressure checks
      for (let i = 0; i < monitoringCycles; i++) {
        const memoryUsage = memoryManager.getMemoryUsage();
        expect(memoryUsage).toBeDefined();

        const needsCleanup = memoryManager.checkMemoryPressure();
        expect(typeof needsCleanup).toBe('boolean');
      }

      const monitoringTime = performance.now() - startTime;

      // Monitoring should be lightweight
      expect(monitoringTime).toBeLessThan(500);
      expect(monitoringTime / monitoringCycles).toBeLessThan(5); // Less than 5ms per check
    });

    test('should handle memory alerts efficiently', () => {
      // Mock high memory usage
      (window.performance as any).memory.usedJSHeapSize = 400 * 1024 * 1024; // 400MB

      const startTime = performance.now();

      // Trigger memory pressure multiple times
      for (let i = 0; i < 50; i++) {
        memoryManager.checkMemoryPressure();
      }

      const alertTime = performance.now() - startTime;

      // Should handle alert generation efficiently
      expect(alertTime).toBeLessThan(100);

      const alerts = memoryManager.getMemoryAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });

    test('should estimate memory usage accurately and quickly', () => {
      const estimationCount = 1000;

      const startTime = performance.now();

      for (let i = 0; i < estimationCount; i++) {
        const usage = memoryManager.getMemoryUsage();
        expect(usage.usedHeapSize).toBeGreaterThan(0);
        expect(usage.totalHeapSize).toBeGreaterThan(0);
        expect(usage.domNodes).toBeGreaterThan(0);
      }

      const estimationTime = performance.now() - startTime;

      // Memory estimation should be very fast
      expect(estimationTime).toBeLessThan(200);
      expect(estimationTime / estimationCount).toBeLessThan(0.2);
    });
  });

  describe('Cleanup Performance', () => {
    test('should perform adaptive cleanup efficiently', async () => {
      // Mock high memory usage to trigger cleanup
      (window.performance as any).memory.usedJSHeapSize = 300 * 1024 * 1024; // 300MB

      // Register documents with cache keys
      for (let i = 0; i < 20; i++) {
        memoryManager.registerDocument(`cleanup-doc-${i}`, 'content', 100);
        memoryManager.trackCacheKey(`cleanup-doc-${i}`, `cache-key-${i}`);

        // Add to cache
        cacheService.set(`cache-key-${i}`, { data: `data-${i}` });
      }

      const startTime = performance.now();

      // Force cleanup
      await memoryManager.forceCleanup();

      const cleanupTime = performance.now() - startTime;

      // Cleanup should complete quickly
      expect(cleanupTime).toBeLessThan(1000);
    });

    test('should handle cleanup callbacks efficiently', () => {
      const documentCount = 50;
      const callbacksPerDocument = 20;
      const allCallbacks: jest.Mock[] = [];

      // Register documents with many cleanup callbacks
      for (let i = 0; i < documentCount; i++) {
        memoryManager.registerDocument(`callback-doc-${i}`, 'content', 50);

        for (let j = 0; j < callbacksPerDocument; j++) {
          const callback = jest.fn();
          allCallbacks.push(callback);
          memoryManager.registerCleanupCallback(`callback-doc-${i}`, callback);
        }
      }

      const startTime = performance.now();

      // Unregister all documents (triggers all callbacks)
      for (let i = 0; i < documentCount; i++) {
        memoryManager.unregisterDocument(`callback-doc-${i}`);
      }

      const callbackTime = performance.now() - startTime;

      // Should handle many callbacks efficiently
      expect(callbackTime).toBeLessThan(500);

      // All callbacks should have been called
      allCallbacks.forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    test('should clean up cache efficiently during memory pressure', () => {
      // Fill cache with data
      for (let i = 0; i < 1000; i++) {
        cacheService.set(`pressure-cache-${i}`, {
          id: i,
          data: 'x'.repeat(1000) // 1KB per item
        });
      }

      const initialCacheSize = cacheService.getStats().size;
      expect(initialCacheSize).toBe(1000);

      // Mock high memory usage
      (window.performance as any).memory.usedJSHeapSize = 250 * 1024 * 1024; // 250MB

      const startTime = performance.now();

      // Trigger memory pressure cleanup
      const cleanupNeeded = memoryManager.checkMemoryPressure();

      const cleanupTime = performance.now() - startTime;

      // Should detect need for cleanup
      expect(cleanupNeeded).toBe(true);

      // Cleanup should be quick
      expect(cleanupTime).toBeLessThan(200);
    });
  });

  describe('Large Document Handling', () => {
    test('should handle very large documents efficiently', () => {
      const veryLargeContent = 'A'.repeat(1000000); // 1MB content
      const documentCount = 10;

      const startTime = performance.now();

      for (let i = 0; i < documentCount; i++) {
        memoryManager.registerDocument(
          `large-doc-${i}`,
          veryLargeContent,
          1000 // Many DOM elements
        );
      }

      const registrationTime = performance.now() - startTime;

      // Should handle large documents efficiently
      expect(registrationTime).toBeLessThan(1000);

      const documentStates = memoryManager.getDocumentStates();
      expect(documentStates).toHaveLength(documentCount);

      // Each document should track its size correctly
      documentStates.forEach(state => {
        expect(state.size).toBe(1000000);
        expect(state.domElementCount).toBe(1000);
      });
    });

    test('should prioritise cleanup of large inactive documents', async () => {
      const smallContent = 'A'.repeat(1000); // 1KB
      const largeContent = 'A'.repeat(500000); // 500KB

      // Register small active documents
      for (let i = 0; i < 5; i++) {
        memoryManager.registerDocument(`small-active-${i}`, smallContent, 10);
        memoryManager.updateDocumentAccess(`small-active-${i}`);
      }

      // Register large inactive documents
      for (let i = 0; i < 3; i++) {
        memoryManager.registerDocument(`large-inactive-${i}`, largeContent, 100);
        memoryManager.deactivateDocument(`large-inactive-${i}`);
      }

      const initialCount = memoryManager.getDocumentStates().length;
      expect(initialCount).toBe(8);

      // Mock high memory usage to trigger aggressive cleanup
      (window.performance as any).memory.usedJSHeapSize = 350 * 1024 * 1024; // 350MB

      const startTime = performance.now();

      await memoryManager.forceCleanup();

      const cleanupTime = performance.now() - startTime;

      // Cleanup should prioritise large inactive documents
      const remainingStates = memoryManager.getDocumentStates();

      // Should remove some documents, preferring large inactive ones
      expect(remainingStates.length).toBeLessThan(initialCount);

      // Active small documents should be preferred for retention
      const activeSmallRemaining = remainingStates.filter(state =>
        state.id.startsWith('small-active')
      );
      expect(activeSmallRemaining.length).toBeGreaterThan(0);

      expect(cleanupTime).toBeLessThan(500);
    });
  });

  describe('Memory Leak Detection', () => {
    test('should detect potential memory leaks', () => {
      const detectionRuns = 10;
      const memorySnapshots: number[] = [];

      // Simulate memory growth pattern
      for (let i = 0; i < detectionRuns; i++) {
        // Mock increasing memory usage
        (window.performance as any).memory.usedJSHeapSize = (50 + i * 10) * 1024 * 1024;

        const usage = memoryManager.getMemoryUsage();
        memorySnapshots.push(usage.usedHeapSize);

        // Register documents that might cause leaks
        memoryManager.registerDocument(`leak-test-${i}`, 'content', 100);
      }

      const startTime = performance.now();

      // Check for memory leak patterns
      let potentialLeaks = 0;
      for (let i = 1; i < memorySnapshots.length; i++) {
        if (memorySnapshots[i] > memorySnapshots[i - 1] * 1.2) {
          potentialLeaks++;
        }
      }

      const detectionTime = performance.now() - startTime;

      // Memory leak detection should be fast
      expect(detectionTime).toBeLessThan(50);

      // Should detect memory growth pattern
      expect(potentialLeaks).toBeGreaterThan(0);
    });

    test('should handle cleanup callback failures gracefully', () => {
      const documentCount = 10;
      const failingCallback = jest.fn(() => {
        throw new Error('Cleanup failed');
      });
      const successCallback = jest.fn();

      // Register documents with mixed callbacks
      for (let i = 0; i < documentCount; i++) {
        memoryManager.registerDocument(`mixed-cleanup-${i}`, 'content', 50);
        memoryManager.registerCleanupCallback(`mixed-cleanup-${i}`, failingCallback);
        memoryManager.registerCleanupCallback(`mixed-cleanup-${i}`, successCallback);
      }

      const startTime = performance.now();

      // Unregister documents (should handle failing callbacks)
      for (let i = 0; i < documentCount; i++) {
        expect(() => {
          memoryManager.unregisterDocument(`mixed-cleanup-${i}`);
        }).not.toThrow();
      }

      const cleanupTime = performance.now() - startTime;

      // Should complete despite callback failures
      expect(cleanupTime).toBeLessThan(200);

      // Both types of callbacks should have been called
      expect(failingCallback).toHaveBeenCalledTimes(documentCount);
      expect(successCallback).toHaveBeenCalledTimes(documentCount);
    });
  });

  describe('Configuration Performance', () => {
    test('should handle different memory thresholds efficiently', async () => {
      const configurations = [
        { maxHeapUsage: 50, cleanupThreshold: 50 },
        { maxHeapUsage: 75, cleanupThreshold: 100 },
        { maxHeapUsage: 90, cleanupThreshold: 200 }
      ];

      for (const config of configurations) {
        // Create new memory manager with different config
        const testManager = new (memoryManager.constructor as any)(config);

        // Register test documents
        for (let i = 0; i < 20; i++) {
          testManager.registerDocument(`config-test-${i}`, 'content', 50);
        }

        const startTime = performance.now();

        // Test memory pressure detection
        const needsCleanup = testManager.checkMemoryPressure();

        const checkTime = performance.now() - startTime;

        // Should handle different configurations efficiently
        expect(checkTime).toBeLessThan(50);
        expect(typeof needsCleanup).toBe('boolean');
      }
    });

    test('should adapt to low memory devices', () => {
      // Mock low memory device
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2, // 2GB device
        writable: true
      });

      const startTime = performance.now();

      // Create memory manager (should adapt to low memory)
      const lowMemoryManager = new (memoryManager.constructor as any)();

      const initTime = performance.now() - startTime;

      // Should initialize quickly even with adaptations
      expect(initTime).toBeLessThan(100);

      // Should have more aggressive settings for low memory devices
      const usage = lowMemoryManager.getMemoryUsage();
      expect(usage).toBeDefined();
    });
  });
});

// Memory benchmark utility
export const benchmarkMemoryManager = async (documentCount: number = 100, contentSize: number = 10000) => {
  const results = {
    registration: {
      totalTime: 0,
      averageTime: 0
    },
    updates: {
      totalTime: 0,
      averageTime: 0
    },
    cleanup: {
      totalTime: 0,
      averageTime: 0
    },
    monitoring: {
      checksPerSecond: 0,
      averageCheckTime: 0
    },
    memory: {
      start: 0,
      peak: 0,
      end: 0
    }
  };

  const content = 'A'.repeat(contentSize);
  results.memory.start = (window.performance as any).memory?.usedJSHeapSize || 0;

  // Benchmark registration
  const regStart = performance.now();
  for (let i = 0; i < documentCount; i++) {
    memoryManager.registerDocument(`benchmark-${i}`, content, 100);
  }
  results.registration.totalTime = performance.now() - regStart;
  results.registration.averageTime = results.registration.totalTime / documentCount;

  results.memory.peak = (window.performance as any).memory?.usedJSHeapSize || 0;

  // Benchmark updates
  const updateStart = performance.now();
  for (let i = 0; i < documentCount; i++) {
    memoryManager.updateDocumentAccess(`benchmark-${i}`);
  }
  results.updates.totalTime = performance.now() - updateStart;
  results.updates.averageTime = results.updates.totalTime / documentCount;

  // Benchmark monitoring
  const monitoringDuration = 1000; // 1 second
  const monitorStart = performance.now();
  let checks = 0;

  while (performance.now() - monitorStart < monitoringDuration) {
    memoryManager.checkMemoryPressure();
    checks++;
  }

  const monitorTime = performance.now() - monitorStart;
  results.monitoring.checksPerSecond = (checks / monitorTime) * 1000;
  results.monitoring.averageCheckTime = monitorTime / checks;

  // Benchmark cleanup
  const cleanupStart = performance.now();
  for (let i = 0; i < documentCount; i++) {
    memoryManager.unregisterDocument(`benchmark-${i}`);
  }
  results.cleanup.totalTime = performance.now() - cleanupStart;
  results.cleanup.averageTime = results.cleanup.totalTime / documentCount;

  results.memory.end = (window.performance as any).memory?.usedJSHeapSize || 0;

  return {
    ...results,
    memoryGrowth: results.memory.peak - results.memory.start,
    memoryReclaimed: results.memory.peak - results.memory.end
  };
};
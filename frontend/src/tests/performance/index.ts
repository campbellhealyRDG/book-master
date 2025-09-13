import { benchmarkLazyContent } from './lazyContent.performance.test';
import { benchmarkCacheService } from './cache.performance.test';
import { benchmarkMemoryManager } from './memory.performance.test';

export interface PerformanceBenchmarkResults {
  lazyContent: ReturnType<typeof benchmarkLazyContent>;
  cache: ReturnType<typeof benchmarkCacheService>;
  memory: ReturnType<typeof benchmarkMemoryManager>;
  overall: {
    testDuration: number;
    timestamp: string;
    environment: {
      userAgent: string;
      memory: any;
      hardware: {
        cores: number;
        deviceMemory: number;
      };
    };
    summary: {
      allTestsPassed: boolean;
      performanceScore: number;
      recommendations: string[];
    };
  };
}

/**
 * Performance test runner for the entire application
 * Runs all performance benchmarks and generates a comprehensive report
 */
export class PerformanceTestRunner {
  private results: Partial<PerformanceBenchmarkResults> = {};
  private startTime = 0;

  async runAllBenchmarks(): Promise<PerformanceBenchmarkResults> {
    console.log('Starting comprehensive performance benchmarks...');
    this.startTime = performance.now();

    try {
      // Run lazy content benchmarks
      console.log('Running lazy content benchmarks...');
      this.results.lazyContent = await benchmarkLazyContent(100, 5000, 50);

      // Run cache service benchmarks
      console.log('Running cache service benchmarks...');
      this.results.cache = await benchmarkCacheService(5000);

      // Run memory manager benchmarks
      console.log('Running memory manager benchmarks...');
      this.results.memory = await benchmarkMemoryManager(50, 10000);

      // Generate overall summary
      this.results.overall = this.generateOverallSummary();

      console.log('All performance benchmarks completed');
      return this.results as PerformanceBenchmarkResults;
    } catch (error) {
      console.error('Performance benchmarks failed:', error);
      throw error;
    }
  }

  private generateOverallSummary() {
    const endTime = performance.now();
    const testDuration = endTime - this.startTime;

    const environment = {
      userAgent: navigator.userAgent,
      memory: (window.performance as any).memory || null,
      hardware: {
        cores: navigator.hardwareConcurrency || 0,
        deviceMemory: (navigator as any).deviceMemory || 0
      }
    };

    // Calculate performance score (0-100)
    let score = 100;
    const recommendations: string[] = [];

    // Lazy content performance checks
    if (this.results.lazyContent) {
      if (this.results.lazyContent.averageLoadTime > 50) {
        score -= 10;
        recommendations.push('Lazy loading is slower than expected. Consider optimizing content loading.');
      }

      if (this.results.lazyContent.averageCacheHitTime > 1) {
        score -= 5;
        recommendations.push('Cache hit times are high. Consider cache optimization.');
      }

      if (this.results.lazyContent.memoryGrowth > 100 * 1024 * 1024) {
        score -= 15;
        recommendations.push('Memory growth is significant. Consider implementing more aggressive cleanup.');
      }
    }

    // Cache performance checks
    if (this.results.cache) {
      if (this.results.cache.averageSetTime > 1) {
        score -= 5;
        recommendations.push('Cache set operations are slow. Consider optimizing cache implementation.');
      }

      if (this.results.cache.averageGetTime > 0.5) {
        score -= 5;
        recommendations.push('Cache get operations are slow. Consider cache structure optimization.');
      }

      if (this.results.cache.memoryGrowth > 50 * 1024 * 1024) {
        score -= 10;
        recommendations.push('Cache memory usage is high. Consider implementing cache size limits.');
      }
    }

    // Memory management performance checks
    if (this.results.memory) {
      if (this.results.memory.registration.averageTime > 5) {
        score -= 5;
        recommendations.push('Document registration is slow. Consider optimizing registration process.');
      }

      if (this.results.memory.monitoring.checksPerSecond < 50) {
        score -= 5;
        recommendations.push('Memory monitoring frequency is low. Consider optimization.');
      }

      if (this.results.memory.memoryReclaimed < this.results.memory.memoryGrowth * 0.7) {
        score -= 10;
        recommendations.push('Memory cleanup is not effective enough. Consider more aggressive cleanup.');
      }
    }

    // Overall test duration check
    if (testDuration > 30000) { // 30 seconds
      score -= 10;
      recommendations.push('Overall test execution is slow. This may indicate performance issues.');
    }

    // Device-specific recommendations
    if (environment.hardware.deviceMemory > 0 && environment.hardware.deviceMemory <= 4) {
      recommendations.push('Running on a low-memory device. Consider enabling memory-optimized mode.');
    }

    if (environment.hardware.cores <= 2) {
      recommendations.push('Running on a low-core device. Consider reducing concurrent operations.');
    }

    return {
      testDuration,
      timestamp: new Date().toISOString(),
      environment,
      summary: {
        allTestsPassed: score > 70,
        performanceScore: Math.max(0, score),
        recommendations
      }
    };
  }

  generateReport(): string {
    if (!this.results.overall) {
      return 'No benchmark results available';
    }

    const results = this.results as PerformanceBenchmarkResults;

    let report = '\n=== PERFORMANCE BENCHMARK REPORT ===\n\n';

    // Overall Summary
    report += `Overall Performance Score: ${results.overall.summary.performanceScore}/100\n`;
    report += `Test Duration: ${(results.overall.testDuration / 1000).toFixed(2)}s\n`;
    report += `Timestamp: ${results.overall.timestamp}\n`;
    report += `Status: ${results.overall.summary.allTestsPassed ? 'PASS' : 'FAIL'}\n\n`;

    // Environment
    report += '=== ENVIRONMENT ===\n';
    report += `CPU Cores: ${results.overall.environment.hardware.cores}\n`;
    report += `Device Memory: ${results.overall.environment.hardware.deviceMemory}GB\n`;
    if (results.overall.environment.memory) {
      report += `Heap Size Limit: ${(results.overall.environment.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB\n`;
      report += `Used Heap Size: ${(results.overall.environment.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB\n`;
    }
    report += '\n';

    // Lazy Content Results
    if (results.lazyContent) {
      report += '=== LAZY CONTENT PERFORMANCE ===\n';
      report += `Initialization Time: ${results.lazyContent.initialization.toFixed(2)}ms\n`;
      report += `Average Load Time: ${results.lazyContent.averageLoadTime.toFixed(2)}ms\n`;
      report += `Average Cache Hit Time: ${results.lazyContent.averageCacheHitTime.toFixed(4)}ms\n`;
      report += `Memory Growth: ${(results.lazyContent.memoryGrowth / 1024 / 1024).toFixed(1)}MB\n`;
      report += `Peak Memory Increase: ${(results.lazyContent.peakMemoryIncrease / 1024 / 1024).toFixed(1)}MB\n\n`;
    }

    // Cache Results
    if (results.cache) {
      report += '=== CACHE PERFORMANCE ===\n';
      report += `Average Set Time: ${results.cache.averageSetTime.toFixed(4)}ms\n`;
      report += `Average Get Time: ${results.cache.averageGetTime.toFixed(4)}ms\n`;
      report += `Batch Set Time: ${results.cache.batchOperations.batchSetTime.toFixed(2)}ms\n`;
      report += `Batch Get Time: ${results.cache.batchOperations.batchGetTime.toFixed(2)}ms\n`;
      report += `Memory Growth: ${(results.cache.memoryGrowth / 1024 / 1024).toFixed(1)}MB\n`;
      report += `Peak Memory Usage: ${(results.cache.peakMemoryUsage / 1024 / 1024).toFixed(1)}MB\n\n`;
    }

    // Memory Management Results
    if (results.memory) {
      report += '=== MEMORY MANAGEMENT PERFORMANCE ===\n';
      report += `Average Registration Time: ${results.memory.registration.averageTime.toFixed(4)}ms\n`;
      report += `Average Update Time: ${results.memory.updates.averageTime.toFixed(4)}ms\n`;
      report += `Average Cleanup Time: ${results.memory.cleanup.averageTime.toFixed(4)}ms\n`;
      report += `Monitoring Checks/Second: ${results.memory.monitoring.checksPerSecond.toFixed(1)}\n`;
      report += `Memory Growth: ${(results.memory.memoryGrowth / 1024 / 1024).toFixed(1)}MB\n`;
      report += `Memory Reclaimed: ${(results.memory.memoryReclaimed / 1024 / 1024).toFixed(1)}MB\n\n`;
    }

    // Recommendations
    if (results.overall.summary.recommendations.length > 0) {
      report += '=== RECOMMENDATIONS ===\n';
      results.overall.summary.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
      report += '\n';
    }

    return report;
  }

  exportResults(filename?: string): void {
    const results = this.results as PerformanceBenchmarkResults;
    const exportData = {
      ...results,
      report: this.generateReport()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `performance-benchmark-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Utility functions for performance testing
export const runQuickPerformanceCheck = async (): Promise<{
  score: number;
  issues: string[];
}> => {
  const issues: string[] = [];
  let score = 100;

  // Quick cache test
  const cacheStart = performance.now();
  for (let i = 0; i < 100; i++) {
    const key = `quick-test-${i}`;
    // Mock cache service import
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify({ data: i }));
      JSON.parse(localStorage.getItem(key) || '{}');
    }
  }
  const cacheTime = performance.now() - cacheStart;

  if (cacheTime > 50) {
    score -= 20;
    issues.push('Cache operations are slow');
  }

  // Quick memory test
  const memoryStart = (window.performance as any).memory?.usedJSHeapSize || 0;
  const largeArray = new Array(100000).fill(0).map((_, i) => ({ id: i, data: 'test' }));
  const memoryEnd = (window.performance as any).memory?.usedJSHeapSize || 0;
  const memoryIncrease = memoryEnd - memoryStart;

  if (memoryIncrease > 50 * 1024 * 1024) { // 50MB
    score -= 15;
    issues.push('High memory usage detected');
  }

  // Clean up
  largeArray.length = 0;

  // Quick DOM test
  const domStart = performance.now();
  const testDiv = document.createElement('div');
  testDiv.innerHTML = '<span>'.repeat(1000) + '</span>'.repeat(1000);
  document.body.appendChild(testDiv);
  document.body.removeChild(testDiv);
  const domTime = performance.now() - domStart;

  if (domTime > 100) {
    score -= 10;
    issues.push('DOM operations are slow');
  }

  return { score, issues };
};

export default PerformanceTestRunner;
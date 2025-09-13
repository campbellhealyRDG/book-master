import { cacheService } from './cacheService';
import { spellCheckService } from './spellCheckService';

interface MemoryUsage {
  totalHeapSize: number;
  usedHeapSize: number;
  heapSizeLimit: number;
  cacheSize: number;
  domNodes: number;
  eventListeners: number;
}

interface MemoryConfig {
  maxHeapUsage: number; // Percentage of heap limit
  cleanupThreshold: number; // MB
  aggressiveCleanupThreshold: number; // MB
  monitoringInterval: number; // ms
  documentSizeThreshold: number; // characters
  maxCachedDocuments: number;
  enableAutoCleanup: boolean;
}

interface MemoryAlert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  timestamp: number;
  memoryUsage: number;
  threshold: number;
}

interface DocumentState {
  id: string;
  size: number;
  lastAccessed: number;
  domElementCount: number;
  cacheKeys: string[];
  isActive: boolean;
}

/**
 * Memory management service for handling large documents and preventing memory leaks
 * Monitors heap usage, manages DOM cleanup, and optimises cache usage
 */
class MemoryManager {
  private config: MemoryConfig = {
    maxHeapUsage: 85, // 85% of heap limit
    cleanupThreshold: 100, // 100MB
    aggressiveCleanupThreshold: 200, // 200MB
    monitoringInterval: 10000, // 10 seconds
    documentSizeThreshold: 100000, // 100k characters
    maxCachedDocuments: 5,
    enableAutoCleanup: true
  };

  private documentStates: Map<string, DocumentState> = new Map();
  private cleanupCallbacks: Map<string, (() => void)[]> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private memoryAlerts: MemoryAlert[] = [];
  private isMonitoring = false;
  private cleanupInProgress = false;

  // Cleanup strategies
  private cleanupStrategies = [
    { name: 'cache', priority: 1, action: () => this.cleanupCache() },
    { name: 'spell-check', priority: 2, action: () => this.cleanupSpellCheck() },
    { name: 'dom-cleanup', priority: 3, action: () => this.cleanupDOMElements() },
    { name: 'document-unload', priority: 4, action: () => this.unloadInactiveDocuments() },
    { name: 'force-gc', priority: 5, action: () => this.forceGarbageCollection() }
  ];

  constructor(customConfig?: Partial<MemoryConfig>) {
    this.config = { ...this.config, ...customConfig };
    this.initialize();
  }

  /**
   * Initialize memory monitoring and cleanup handlers
   */
  private initialize(): void {
    // Set up memory monitoring
    if (this.config.enableAutoCleanup) {
      this.startMonitoring();
    }

    // Set up page visibility change handler
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performMaintenanceCleanup();
      }
    });

    // Set up beforeunload handler
    window.addEventListener('beforeunload', () => {
      this.performFullCleanup();
    });

    // Set up memory pressure event listener (if supported)
    if ('deviceMemory' in navigator) {
      const deviceMemory = (navigator as any).deviceMemory;
      if (deviceMemory <= 4) {
        // Low memory device - use more aggressive settings
        this.config.maxHeapUsage = 70;
        this.config.cleanupThreshold = 50;
        this.config.maxCachedDocuments = 3;
      }
    }
  }

  /**
   * Register a document for memory management
   */
  registerDocument(
    documentId: string,
    content: string,
    domElementCount: number = 0
  ): void {
    const state: DocumentState = {
      id: documentId,
      size: content.length,
      lastAccessed: Date.now(),
      domElementCount,
      cacheKeys: [],
      isActive: true
    };

    this.documentStates.set(documentId, state);

    // Check if immediate cleanup is needed for large documents
    if (content.length > this.config.documentSizeThreshold) {
      this.checkMemoryPressure();
    }
  }

  /**
   * Update document access time and state
   */
  updateDocumentAccess(documentId: string): void {
    const state = this.documentStates.get(documentId);
    if (state) {
      state.lastAccessed = Date.now();
      state.isActive = true;
    }
  }

  /**
   * Mark document as inactive
   */
  deactivateDocument(documentId: string): void {
    const state = this.documentStates.get(documentId);
    if (state) {
      state.isActive = false;
    }
  }

  /**
   * Unregister document and cleanup associated resources
   */
  unregisterDocument(documentId: string): void {
    const state = this.documentStates.get(documentId);
    if (state) {
      // Execute cleanup callbacks
      const callbacks = this.cleanupCallbacks.get(documentId) || [];
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.warn(`Cleanup callback failed for document ${documentId}:`, error);
        }
      });

      // Clear cache entries associated with this document
      state.cacheKeys.forEach(key => cacheService.delete(key));

      // Remove from tracking
      this.documentStates.delete(documentId);
      this.cleanupCallbacks.delete(documentId);
    }
  }

  /**
   * Register cleanup callback for a document
   */
  registerCleanupCallback(documentId: string, callback: () => void): void {
    const callbacks = this.cleanupCallbacks.get(documentId) || [];
    callbacks.push(callback);
    this.cleanupCallbacks.set(documentId, callbacks);
  }

  /**
   * Track cache key for a document
   */
  trackCacheKey(documentId: string, cacheKey: string): void {
    const state = this.documentStates.get(documentId);
    if (state) {
      state.cacheKeys.push(cacheKey);
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryUsage {
    const performance = window.performance as any;
    const memory = performance.memory || {};

    const cacheStats = cacheService.getStats();

    return {
      totalHeapSize: memory.totalJSHeapSize || 0,
      usedHeapSize: memory.usedJSHeapSize || 0,
      heapSizeLimit: memory.jsHeapSizeLimit || 0,
      cacheSize: cacheStats.memoryUsage || 0,
      domNodes: document.querySelectorAll('*').length,
      eventListeners: this.estimateEventListeners()
    };
  }

  /**
   * Check if memory pressure cleanup is needed
   */
  checkMemoryPressure(): boolean {
    const usage = this.getMemoryUsage();
    const usageInMB = usage.usedHeapSize / (1024 * 1024);
    const heapUsagePercent = usage.heapSizeLimit > 0
      ? (usage.usedHeapSize / usage.heapSizeLimit) * 100
      : 0;

    const needsCleanup =
      usageInMB > this.config.cleanupThreshold ||
      heapUsagePercent > this.config.maxHeapUsage;

    if (needsCleanup && !this.cleanupInProgress) {
      this.performAdaptiveCleanup(usageInMB);
      return true;
    }

    return false;
  }

  /**
   * Perform adaptive cleanup based on memory pressure
   */
  private async performAdaptiveCleanup(usageInMB: number): Promise<void> {
    if (this.cleanupInProgress) return;

    this.cleanupInProgress = true;
    console.log(`Starting adaptive cleanup - Memory usage: ${usageInMB.toFixed(1)}MB`);

    try {
      const isAggressive = usageInMB > this.config.aggressiveCleanupThreshold;
      const strategiesToRun = isAggressive
        ? this.cleanupStrategies
        : this.cleanupStrategies.slice(0, 3);

      for (const strategy of strategiesToRun) {
        try {
          await strategy.action();

          // Check if cleanup was successful
          const newUsage = this.getMemoryUsage();
          const newUsageInMB = newUsage.usedHeapSize / (1024 * 1024);

          if (newUsageInMB < this.config.cleanupThreshold) {
            console.log(`Cleanup successful after ${strategy.name} - New usage: ${newUsageInMB.toFixed(1)}MB`);
            break;
          }
        } catch (error) {
          console.warn(`Cleanup strategy ${strategy.name} failed:`, error);
        }
      }
    } finally {
      this.cleanupInProgress = false;
    }
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryPressure();
      this.checkForMemoryAlerts();
    }, this.config.monitoringInterval);

    console.log('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Memory monitoring stopped');
  }

  /**
   * Get memory alerts
   */
  getMemoryAlerts(): MemoryAlert[] {
    return [...this.memoryAlerts];
  }

  /**
   * Clear memory alert
   */
  clearMemoryAlert(alertId: string): void {
    this.memoryAlerts = this.memoryAlerts.filter(alert => alert.id !== alertId);
  }

  /**
   * Get document states for debugging
   */
  getDocumentStates(): DocumentState[] {
    return Array.from(this.documentStates.values());
  }

  /**
   * Force immediate cleanup
   */
  async forceCleanup(): Promise<void> {
    await this.performAdaptiveCleanup(Infinity);
  }

  // Private cleanup methods

  private async cleanupCache(): Promise<void> {
    const cacheStats = cacheService.getStats();

    // Clear old cache entries
    if (cacheStats.size > 100) {
      cacheService.clear('search'); // Clear search cache first
      cacheService.clear('spell-check'); // Clear spell check cache
    }

    console.log('Cache cleanup completed');
  }

  private async cleanupSpellCheck(): Promise<void> {
    spellCheckService.clearCache();
    console.log('Spell check cleanup completed');
  }

  private async cleanupDOMElements(): Promise<void> {
    // Remove unused event listeners and clean up DOM references
    const unusedElements = document.querySelectorAll('[data-cleanup="true"]');
    unusedElements.forEach(element => {
      element.remove();
    });

    // Clear any accumulated DOM observers
    if ((window as any).domObservers) {
      (window as any).domObservers.forEach((observer: MutationObserver) => {
        observer.disconnect();
      });
      (window as any).domObservers = [];
    }

    console.log('DOM cleanup completed');
  }

  private async unloadInactiveDocuments(): Promise<void> {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    const documentsToUnload: string[] = [];

    this.documentStates.forEach((state, documentId) => {
      if (!state.isActive && (now - state.lastAccessed) > inactiveThreshold) {
        documentsToUnload.push(documentId);
      }
    });

    // Keep at least one document if all are inactive
    if (documentsToUnload.length === this.documentStates.size && documentsToUnload.length > 1) {
      documentsToUnload.pop();
    }

    documentsToUnload.forEach(documentId => {
      this.unregisterDocument(documentId);
    });

    console.log(`Unloaded ${documentsToUnload.length} inactive documents`);
  }

  private async forceGarbageCollection(): Promise<void> {
    // Force garbage collection if available (Chrome DevTools)
    if ((window as any).gc && typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log('Forced garbage collection');
    } else {
      // Trigger garbage collection indirectly
      const largeArray = new Array(1000000).fill(0);
      largeArray.length = 0;
      console.log('Triggered indirect garbage collection');
    }
  }

  private async performMaintenanceCleanup(): Promise<void> {
    // Light cleanup when page becomes hidden
    await this.cleanupCache();
    await this.cleanupSpellCheck();
  }

  private async performFullCleanup(): Promise<void> {
    // Full cleanup before page unload
    this.stopMonitoring();

    // Cleanup all documents
    const documentIds = Array.from(this.documentStates.keys());
    documentIds.forEach(id => this.unregisterDocument(id));

    // Clear all caches
    cacheService.clear();
    spellCheckService.dispose();
  }

  private checkForMemoryAlerts(): void {
    const usage = this.getMemoryUsage();
    const usageInMB = usage.usedHeapSize / (1024 * 1024);
    const heapUsagePercent = usage.heapSizeLimit > 0
      ? (usage.usedHeapSize / usage.heapSizeLimit) * 100
      : 0;

    // High memory usage alert
    if (usageInMB > this.config.cleanupThreshold) {
      this.addMemoryAlert({
        id: `high-memory-${Date.now()}`,
        type: usageInMB > this.config.aggressiveCleanupThreshold ? 'critical' : 'warning',
        message: `High memory usage: ${usageInMB.toFixed(1)}MB`,
        timestamp: Date.now(),
        memoryUsage: usageInMB,
        threshold: this.config.cleanupThreshold
      });
    }

    // High heap usage alert
    if (heapUsagePercent > this.config.maxHeapUsage) {
      this.addMemoryAlert({
        id: `high-heap-${Date.now()}`,
        type: 'warning',
        message: `High heap usage: ${heapUsagePercent.toFixed(1)}%`,
        timestamp: Date.now(),
        memoryUsage: heapUsagePercent,
        threshold: this.config.maxHeapUsage
      });
    }

    // Too many DOM nodes alert
    if (usage.domNodes > 10000) {
      this.addMemoryAlert({
        id: `high-dom-${Date.now()}`,
        type: 'warning',
        message: `High DOM node count: ${usage.domNodes}`,
        timestamp: Date.now(),
        memoryUsage: usage.domNodes,
        threshold: 10000
      });
    }
  }

  private addMemoryAlert(alert: MemoryAlert): void {
    // Avoid duplicate alerts
    const existingAlert = this.memoryAlerts.find(a =>
      a.type === alert.type &&
      Math.abs(a.timestamp - alert.timestamp) < 30000 // Within 30 seconds
    );

    if (!existingAlert) {
      this.memoryAlerts = [...this.memoryAlerts.slice(-9), alert]; // Keep last 10 alerts
    }
  }

  private estimateEventListeners(): number {
    // Estimate event listeners by checking common event types
    let count = 0;
    const eventTypes = ['click', 'scroll', 'resize', 'keydown', 'mouseup'];

    eventTypes.forEach(type => {
      const elements = document.querySelectorAll(`[on${type}]`);
      count += elements.length;
    });

    return count;
  }
}

// Create singleton instance
export const memoryManager = new MemoryManager();
export default memoryManager;
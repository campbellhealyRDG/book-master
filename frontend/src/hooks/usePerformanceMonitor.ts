import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';

interface PerformanceMetrics {
  // Cache metrics
  cacheHitRate: number;
  cacheMissRate: number;
  cacheSize: number;
  memoryUsage: number;

  // API metrics
  averageResponseTime: number;
  requestCount: number;
  errorRate: number;
  slowRequestCount: number;

  // UI metrics
  renderTime: number;
  largeRenderCount: number;
  memoryLeaks: number;

  // User interaction metrics
  userInteractions: number;
  averageInteractionDelay: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error';
  message: string;
  timestamp: number;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
}

interface PerformanceConfig {
  // Thresholds for alerts
  maxResponseTime: number;
  maxRenderTime: number;
  minCacheHitRate: number;
  maxErrorRate: number;
  maxMemoryUsage: number;

  // Monitoring intervals
  metricsUpdateInterval: number;
  alertCheckInterval: number;
  memoryCheckInterval: number;
}

/**
 * Hook for monitoring application performance metrics
 * Tracks cache performance, API response times, render performance, and memory usage
 */
export const usePerformanceMonitor = (config?: Partial<PerformanceConfig>) => {
  const defaultConfig: PerformanceConfig = {
    maxResponseTime: 1000,
    maxRenderTime: 100,
    minCacheHitRate: 80,
    maxErrorRate: 5,
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB

    metricsUpdateInterval: 10000, // 10 seconds
    alertCheckInterval: 5000, // 5 seconds
    memoryCheckInterval: 30000 // 30 seconds
  };

  const finalConfig = { ...defaultConfig, ...config };

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheHitRate: 0,
    cacheMissRate: 0,
    cacheSize: 0,
    memoryUsage: 0,
    averageResponseTime: 0,
    requestCount: 0,
    errorRate: 0,
    slowRequestCount: 0,
    renderTime: 0,
    largeRenderCount: 0,
    memoryLeaks: 0,
    userInteractions: 0,
    averageInteractionDelay: 0
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Performance tracking refs
  const apiRequestTimes = useRef<number[]>([]);
  const apiErrors = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const userInteractionTimes = useRef<number[]>([]);
  const memorySnapshots = useRef<number[]>([]);

  // Component render tracking
  const renderStartTime = useRef<number>(0);
  const componentMountTime = useRef<number>(Date.now());

  // Update metrics from various sources
  const updateMetrics = useCallback(() => {
    // Get cache stats from API service
    const cacheStats = apiService.getCacheStats();

    // Calculate API metrics
    const avgResponseTime = apiRequestTimes.current.length > 0
      ? apiRequestTimes.current.reduce((sum, time) => sum + time, 0) / apiRequestTimes.current.length
      : 0;

    const slowRequests = apiRequestTimes.current.filter(time => time > finalConfig.maxResponseTime).length;
    const errorRate = apiRequestTimes.current.length > 0
      ? (apiErrors.current / apiRequestTimes.current.length) * 100
      : 0;

    // Calculate render metrics
    const avgRenderTime = renderTimes.current.length > 0
      ? renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length
      : 0;

    const largeRenders = renderTimes.current.filter(time => time > finalConfig.maxRenderTime).length;

    // Calculate user interaction metrics
    const avgInteractionDelay = userInteractionTimes.current.length > 0
      ? userInteractionTimes.current.reduce((sum, time) => sum + time, 0) / userInteractionTimes.current.length
      : 0;

    // Memory usage estimation
    const currentMemory = cacheStats.memoryUsage + (window.performance as any)?.memory?.usedJSHeapSize || 0;

    setMetrics({
      // Cache metrics
      cacheHitRate: cacheStats.hitRate,
      cacheMissRate: cacheStats.missRate,
      cacheSize: cacheStats.size,
      memoryUsage: currentMemory,

      // API metrics
      averageResponseTime: Math.round(avgResponseTime),
      requestCount: apiRequestTimes.current.length,
      errorRate: Math.round(errorRate * 100) / 100,
      slowRequestCount: slowRequests,

      // UI metrics
      renderTime: Math.round(avgRenderTime * 100) / 100,
      largeRenderCount: largeRenders,
      memoryLeaks: memorySnapshots.current.filter((snapshot, index) =>
        index > 0 && snapshot > memorySnapshots.current[index - 1] * 1.2
      ).length,

      // User interaction metrics
      userInteractions: userInteractionTimes.current.length,
      averageInteractionDelay: Math.round(avgInteractionDelay)
    });
  }, [finalConfig]);

  // Check for performance alerts
  const checkAlerts = useCallback((currentMetrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    // Cache hit rate alert
    if (currentMetrics.cacheHitRate < finalConfig.minCacheHitRate && currentMetrics.requestCount > 10) {
      newAlerts.push({
        id: `cache-hit-rate-${Date.now()}`,
        type: 'warning',
        message: `Low cache hit rate: ${currentMetrics.cacheHitRate.toFixed(1)}%`,
        timestamp: Date.now(),
        metric: 'cacheHitRate',
        value: currentMetrics.cacheHitRate,
        threshold: finalConfig.minCacheHitRate
      });
    }

    // Response time alert
    if (currentMetrics.averageResponseTime > finalConfig.maxResponseTime) {
      newAlerts.push({
        id: `response-time-${Date.now()}`,
        type: 'error',
        message: `High average response time: ${currentMetrics.averageResponseTime}ms`,
        timestamp: Date.now(),
        metric: 'averageResponseTime',
        value: currentMetrics.averageResponseTime,
        threshold: finalConfig.maxResponseTime
      });
    }

    // Error rate alert
    if (currentMetrics.errorRate > finalConfig.maxErrorRate) {
      newAlerts.push({
        id: `error-rate-${Date.now()}`,
        type: 'error',
        message: `High error rate: ${currentMetrics.errorRate.toFixed(1)}%`,
        timestamp: Date.now(),
        metric: 'errorRate',
        value: currentMetrics.errorRate,
        threshold: finalConfig.maxErrorRate
      });
    }

    // Memory usage alert
    if (currentMetrics.memoryUsage > finalConfig.maxMemoryUsage) {
      newAlerts.push({
        id: `memory-usage-${Date.now()}`,
        type: 'warning',
        message: `High memory usage: ${Math.round(currentMetrics.memoryUsage / 1024 / 1024)}MB`,
        timestamp: Date.now(),
        metric: 'memoryUsage',
        value: currentMetrics.memoryUsage,
        threshold: finalConfig.maxMemoryUsage
      });
    }

    // Render time alert
    if (currentMetrics.renderTime > finalConfig.maxRenderTime) {
      newAlerts.push({
        id: `render-time-${Date.now()}`,
        type: 'warning',
        message: `Slow render time: ${currentMetrics.renderTime.toFixed(1)}ms`,
        timestamp: Date.now(),
        metric: 'renderTime',
        value: currentMetrics.renderTime,
        threshold: finalConfig.maxRenderTime
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev.slice(-9), ...newAlerts]); // Keep last 10 alerts
    }
  }, [finalConfig]);

  // Track API request performance
  const trackApiRequest = useCallback((duration: number, success: boolean) => {
    apiRequestTimes.current = [...apiRequestTimes.current.slice(-99), duration]; // Keep last 100 requests

    if (!success) {
      apiErrors.current++;
    }
  }, []);

  // Track render performance
  const trackRenderStart = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const trackRenderEnd = useCallback(() => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      renderTimes.current = [...renderTimes.current.slice(-99), renderTime]; // Keep last 100 renders
      renderStartTime.current = 0;
    }
  }, []);

  // Track user interactions
  const trackUserInteraction = useCallback((startTime: number, endTime: number) => {
    const delay = endTime - startTime;
    userInteractionTimes.current = [...userInteractionTimes.current.slice(-99), delay];
  }, []);

  // Memory monitoring
  const trackMemoryUsage = useCallback(() => {
    if ((window.performance as any)?.memory) {
      const memoryInfo = (window.performance as any).memory;
      const currentUsage = memoryInfo.usedJSHeapSize;
      memorySnapshots.current = [...memorySnapshots.current.slice(-19), currentUsage]; // Keep last 20 snapshots
    }
  }, []);

  // Performance optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];

    if (metrics.cacheHitRate < 70) {
      suggestions.push('Consider increasing cache TTL or preloading frequently accessed data');
    }

    if (metrics.averageResponseTime > 800) {
      suggestions.push('Consider implementing request debouncing or pagination');
    }

    if (metrics.largeRenderCount > metrics.requestCount * 0.1) {
      suggestions.push('Consider using React.memo() or useMemo() for expensive components');
    }

    if (metrics.memoryUsage > finalConfig.maxMemoryUsage * 0.8) {
      suggestions.push('Consider clearing unused cache entries or implementing more aggressive garbage collection');
    }

    if (metrics.slowRequestCount > 5) {
      suggestions.push('Consider implementing progressive loading or request prioritisation');
    }

    return suggestions;
  }, [metrics, finalConfig]);

  // Clear alerts
  const clearAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    apiRequestTimes.current = [];
    apiErrors.current = 0;
    renderTimes.current = [];
    userInteractionTimes.current = [];
    memorySnapshots.current = [];
    setAlerts([]);
    setMetrics({
      cacheHitRate: 0,
      cacheMissRate: 0,
      cacheSize: 0,
      memoryUsage: 0,
      averageResponseTime: 0,
      requestCount: 0,
      errorRate: 0,
      slowRequestCount: 0,
      renderTime: 0,
      largeRenderCount: 0,
      memoryLeaks: 0,
      userInteractions: 0,
      averageInteractionDelay: 0
    });
  }, []);

  // Export metrics for analysis
  const exportMetrics = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics,
      alerts: alerts.slice(), // Clone alerts
      config: finalConfig,
      rawData: {
        apiRequestTimes: apiRequestTimes.current.slice(),
        renderTimes: renderTimes.current.slice(),
        userInteractionTimes: userInteractionTimes.current.slice(),
        memorySnapshots: memorySnapshots.current.slice()
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [metrics, alerts, finalConfig]);

  // Start/stop monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Set up monitoring intervals
  useEffect(() => {
    if (!isMonitoring) return;

    const metricsInterval = setInterval(updateMetrics, finalConfig.metricsUpdateInterval);
    const alertInterval = setInterval(() => checkAlerts(metrics), finalConfig.alertCheckInterval);
    const memoryInterval = setInterval(trackMemoryUsage, finalConfig.memoryCheckInterval);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(alertInterval);
      clearInterval(memoryInterval);
    };
  }, [isMonitoring, updateMetrics, checkAlerts, trackMemoryUsage, metrics, finalConfig]);

  // Initial setup
  useEffect(() => {
    startMonitoring();
    trackMemoryUsage(); // Initial memory snapshot

    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring, trackMemoryUsage]);

  return {
    // Metrics and alerts
    metrics,
    alerts,
    isMonitoring,

    // Tracking functions
    trackApiRequest,
    trackRenderStart,
    trackRenderEnd,
    trackUserInteraction,

    // Management functions
    clearAlert,
    clearAllAlerts,
    resetMetrics,
    exportMetrics,

    // Control functions
    startMonitoring,
    stopMonitoring,

    // Analysis functions
    getOptimizationSuggestions
  };
};

export default usePerformanceMonitor;
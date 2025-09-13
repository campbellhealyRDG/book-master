import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestsPerSecond: number;
  concurrentUsers: number;
  testDuration: number;
  memoryUsage: number[];
  errorRates: Record<string, number>;
}

interface UserScenario {
  name: string;
  weight: number; // Percentage of users following this scenario
  actions: Array<{
    action: string;
    target?: string;
    data?: any;
    expectedTime?: number;
  }>;
}

// Define user scenarios for load testing
const userScenarios: UserScenario[] = [
  {
    name: 'Book Creator',
    weight: 30,
    actions: [
      { action: 'navigate', target: 'home' },
      { action: 'click', target: 'button:text("Create New Book")' },
      { action: 'fill', target: 'input[name="title"]', data: 'Load Test Book' },
      { action: 'fill', target: 'input[name="author"]', data: 'Load Test Author' },
      { action: 'click', target: 'button:text("Create Book")' },
      { action: 'wait', target: 'h2:text("Load Test Book")' }
    ]
  },
  {
    name: 'Chapter Editor',
    weight: 40,
    actions: [
      { action: 'navigate', target: 'home' },
      { action: 'click', target: 'text=Test Book' },
      { action: 'click', target: 'button:text("Add Chapter")' },
      { action: 'fill', target: 'input[name="chapterTitle"]', data: 'Load Test Chapter' },
      { action: 'click', target: 'button:text("Create Chapter")' },
      { action: 'click', target: 'text=Load Test Chapter' },
      { action: 'click', target: 'button:text("Edit")' },
      { action: 'fill', target: 'textarea[name="content"]', data: 'This is load test content.' },
      { action: 'click', target: 'button:text("Save Changes")' },
      { action: 'wait', target: 'text=Saved' }
    ]
  },
  {
    name: 'Content Reader',
    weight: 20,
    actions: [
      { action: 'navigate', target: 'home' },
      { action: 'click', target: 'text=Test Book' },
      { action: 'click', target: 'text=Chapter 1' },
      { action: 'wait', target: 'div.chapter-content', expectedTime: 500 },
      { action: 'click', target: 'button:text("Next Chapter")' },
      { action: 'wait', target: 'div.chapter-content', expectedTime: 500 },
      { action: 'click', target: 'button:text("Previous Chapter")' },
      { action: 'wait', target: 'div.chapter-content', expectedTime: 500 }
    ]
  },
  {
    name: 'Search User',
    weight: 10,
    actions: [
      { action: 'navigate', target: 'home' },
      { action: 'fill', target: 'input[placeholder*="Search"]', data: 'test content' },
      { action: 'press', target: 'input[placeholder*="Search"]', data: 'Enter' },
      { action: 'wait', target: 'text=Search Results', expectedTime: 1000 },
      { action: 'click', target: '.search-result:first-child' },
      { action: 'wait', target: 'div.chapter-content', expectedTime: 500 }
    ]
  }
];

class LoadTestRunner {
  private browser: Browser;
  private metrics: LoadTestMetrics;
  private startTime: number = 0;
  private contexts: BrowserContext[] = [];
  private pages: Page[] = [];

  constructor(browser: Browser) {
    this.browser = browser;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      requestsPerSecond: 0,
      concurrentUsers: 0,
      testDuration: 0,
      memoryUsage: [],
      errorRates: {}
    };
  }

  async runLoadTest(
    concurrentUsers: number,
    testDuration: number,
    rampUpTime: number = 30000
  ): Promise<LoadTestMetrics> {
    console.log(`Starting load test: ${concurrentUsers} users, ${testDuration}ms duration`);

    this.startTime = Date.now();
    this.metrics.concurrentUsers = concurrentUsers;

    // Create user contexts and pages
    for (let i = 0; i < concurrentUsers; i++) {
      const context = await this.browser.newContext();
      const page = await context.newPage();

      // Track network requests for metrics
      page.on('response', response => this.trackResponse(response));
      page.on('requestfailed', request => this.trackFailedRequest(request));

      this.contexts.push(context);
      this.pages.push(page);
    }

    // Start user sessions with ramp-up
    const userPromises: Promise<void>[] = [];
    const rampUpDelay = rampUpTime / concurrentUsers;

    for (let i = 0; i < concurrentUsers; i++) {
      const userPromise = this.runUserSession(
        this.pages[i],
        i * rampUpDelay,
        testDuration
      );
      userPromises.push(userPromise);
    }

    // Monitor system resources during test
    const monitoringPromise = this.monitorSystemResources(testDuration);

    // Wait for all users to complete
    await Promise.allSettled([...userPromises, monitoringPromise]);

    // Calculate final metrics
    this.calculateFinalMetrics();

    // Cleanup
    await this.cleanup();

    return this.metrics;
  }

  private async runUserSession(
    page: Page,
    startDelay: number,
    duration: number
  ): Promise<void> {
    // Wait for ramp-up delay
    if (startDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, startDelay));
    }

    const sessionStart = Date.now();
    const sessionEnd = sessionStart + duration - startDelay;

    try {
      // Select user scenario based on weights
      const scenario = this.selectUserScenario();

      while (Date.now() < sessionEnd) {
        await this.executeUserScenario(page, scenario);

        // Think time between scenarios (1-3 seconds)
        const thinkTime = Math.random() * 2000 + 1000;
        await new Promise(resolve => setTimeout(resolve, thinkTime));
      }
    } catch (error) {
      console.error('User session error:', error);
      this.metrics.failedRequests++;
    }
  }

  private selectUserScenario(): UserScenario {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const scenario of userScenarios) {
      cumulative += scenario.weight;
      if (random <= cumulative) {
        return scenario;
      }
    }

    return userScenarios[0]; // Fallback
  }

  private async executeUserScenario(page: Page, scenario: UserScenario): Promise<void> {
    try {
      for (const step of scenario.actions) {
        const stepStart = Date.now();

        switch (step.action) {
          case 'navigate':
            if (step.target === 'home') {
              await page.goto('http://localhost:5173');
              await page.waitForLoadState('networkidle');
            }
            break;

          case 'click':
            await page.click(step.target!, { timeout: 5000 });
            break;

          case 'fill':
            await page.fill(step.target!, step.data, { timeout: 5000 });
            break;

          case 'press':
            await page.press(step.target!, step.data, { timeout: 5000 });
            break;

          case 'wait':
            await page.waitForSelector(step.target!, { timeout: 10000 });
            break;

          default:
            console.warn(`Unknown action: ${step.action}`);
        }

        const stepTime = Date.now() - stepStart;

        // Check if step exceeded expected time
        if (step.expectedTime && stepTime > step.expectedTime * 2) {
          console.warn(`Step '${step.action}' took ${stepTime}ms, expected ${step.expectedTime}ms`);
        }
      }
    } catch (error) {
      console.error(`Scenario '${scenario.name}' failed:`, error);
      throw error;
    }
  }

  private trackResponse(response: any): void {
    const responseTime = Date.now() - (response.request()?.timestamp() || 0);

    this.metrics.totalRequests++;

    if (response.ok()) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;

      const status = response.status();
      this.metrics.errorRates[status] = (this.metrics.errorRates[status] || 0) + 1;
    }

    // Update response time metrics
    this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, responseTime);
    this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, responseTime);
  }

  private trackFailedRequest(request: any): void {
    this.metrics.failedRequests++;
    this.metrics.totalRequests++;

    const failureReason = request.failure()?.errorText || 'Unknown';
    this.metrics.errorRates[failureReason] = (this.metrics.errorRates[failureReason] || 0) + 1;
  }

  private async monitorSystemResources(duration: number): Promise<void> {
    const monitoringInterval = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      // Sample memory usage from first page
      if (this.pages.length > 0) {
        try {
          const memoryUsage = await this.pages[0].evaluate(() => {
            return (performance as any).memory?.usedJSHeapSize || 0;
          });
          this.metrics.memoryUsage.push(memoryUsage);
        } catch (error) {
          // Memory API not available
        }
      }

      await new Promise(resolve => setTimeout(resolve, monitoringInterval));
    }
  }

  private calculateFinalMetrics(): void {
    this.metrics.testDuration = Date.now() - this.startTime;

    // Calculate average response time
    if (this.metrics.totalRequests > 0) {
      this.metrics.averageResponseTime =
        (this.metrics.maxResponseTime + this.metrics.minResponseTime) / 2;

      this.metrics.requestsPerSecond =
        (this.metrics.totalRequests / this.metrics.testDuration) * 1000;
    }

    if (this.metrics.minResponseTime === Infinity) {
      this.metrics.minResponseTime = 0;
    }
  }

  private async cleanup(): Promise<void> {
    for (const context of this.contexts) {
      await context.close();
    }
    this.contexts = [];
    this.pages = [];
  }
}

test.describe('Load Testing - Concurrent Usage', () => {
  test('should handle 10 concurrent users for 2 minutes', async ({ browser }) => {
    const loadTester = new LoadTestRunner(browser);
    const metrics = await loadTester.runLoadTest(10, 120000, 30000);

    console.log('Load Test Results (10 users):', metrics);

    // Performance assertions
    expect(metrics.averageResponseTime).toBeLessThan(2000); // Less than 2 seconds
    expect(metrics.requestsPerSecond).toBeGreaterThan(1); // At least 1 RPS
    expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.95); // 95% success rate

    // Memory assertions
    if (metrics.memoryUsage.length > 0) {
      const maxMemory = Math.max(...metrics.memoryUsage);
      const minMemory = Math.min(...metrics.memoryUsage);
      const memoryGrowth = maxMemory - minMemory;

      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth
    }

    // Error rate assertions
    const totalErrors = Object.values(metrics.errorRates).reduce((sum, count) => sum + count, 0);
    const errorRate = (totalErrors / metrics.totalRequests) * 100;
    expect(errorRate).toBeLessThan(5); // Less than 5% error rate
  });

  test('should handle 25 concurrent users for 3 minutes', async ({ browser }) => {
    const loadTester = new LoadTestRunner(browser);
    const metrics = await loadTester.runLoadTest(25, 180000, 45000);

    console.log('Load Test Results (25 users):', metrics);

    // More relaxed performance criteria for higher load
    expect(metrics.averageResponseTime).toBeLessThan(5000); // Less than 5 seconds
    expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.90); // 90% success rate

    // Check for performance degradation patterns
    const errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;

    if (errorRate > 10) {
      console.warn('High error rate detected:', errorRate + '%');
      console.warn('Error breakdown:', metrics.errorRates);
    }

    expect(errorRate).toBeLessThan(15); // Less than 15% error rate under high load
  });

  test('should handle 50 concurrent users stress test', async ({ browser }) => {
    const loadTester = new LoadTestRunner(browser);
    const metrics = await loadTester.runLoadTest(50, 300000, 60000); // 5 minutes

    console.log('Stress Test Results (50 users):', metrics);

    // Stress test - verify system doesn't crash
    expect(metrics.totalRequests).toBeGreaterThan(0); // System is still responding

    const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    console.log(`Success rate under stress: ${successRate.toFixed(2)}%`);

    // System should maintain at least basic functionality
    expect(successRate).toBeGreaterThan(50); // At least 50% success rate

    // Memory should not grow excessively
    if (metrics.memoryUsage.length > 0) {
      const memoryGrowthRate = (Math.max(...metrics.memoryUsage) - Math.min(...metrics.memoryUsage))
        / metrics.testDuration * 1000; // Growth per second

      console.log(`Memory growth rate: ${(memoryGrowthRate / 1024 / 1024).toFixed(2)} MB/s`);
      expect(memoryGrowthRate).toBeLessThan(10 * 1024 * 1024); // Less than 10MB/s growth
    }
  });

  test('should handle spike in concurrent users', async ({ browser }) => {
    // Simulate sudden spike in users
    const loadTester = new LoadTestRunner(browser);

    // Start with 5 users
    console.log('Starting with baseline load...');
    const baselineMetrics = await loadTester.runLoadTest(5, 60000, 10000);

    console.log('Baseline Results:', baselineMetrics);

    // Spike to 30 users
    console.log('Simulating user spike...');
    const spikeMetrics = await loadTester.runLoadTest(30, 120000, 10000); // Quick ramp-up

    console.log('Spike Test Results:', spikeMetrics);

    // Compare performance degradation
    const performanceDegradation =
      (spikeMetrics.averageResponseTime - baselineMetrics.averageResponseTime) /
      baselineMetrics.averageResponseTime * 100;

    console.log(`Performance degradation: ${performanceDegradation.toFixed(2)}%`);

    // System should handle spike gracefully
    expect(performanceDegradation).toBeLessThan(300); // Less than 300% degradation
    expect(spikeMetrics.successfulRequests / spikeMetrics.totalRequests).toBeGreaterThan(0.75); // 75% success rate
  });

  test('should maintain performance during long-running session', async ({ browser }) => {
    const loadTester = new LoadTestRunner(browser);

    // 15-minute endurance test
    const metrics = await loadTester.runLoadTest(15, 900000, 60000);

    console.log('Endurance Test Results:', metrics);

    // Check for memory leaks and performance degradation over time
    if (metrics.memoryUsage.length >= 10) {
      const earlyMemory = metrics.memoryUsage.slice(0, 5);
      const lateMemory = metrics.memoryUsage.slice(-5);

      const earlyAvg = earlyMemory.reduce((a, b) => a + b, 0) / earlyMemory.length;
      const lateAvg = lateMemory.reduce((a, b) => a + b, 0) / lateMemory.length;

      const memoryIncrease = (lateAvg - earlyAvg) / earlyAvg * 100;
      console.log(`Memory increase over time: ${memoryIncrease.toFixed(2)}%`);

      // Memory should not increase more than 50% over 15 minutes
      expect(memoryIncrease).toBeLessThan(50);
    }

    // System should maintain reasonable performance throughout
    expect(metrics.averageResponseTime).toBeLessThan(3000); // Less than 3 seconds
    expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.85); // 85% success rate
  });

  test('should recover from temporary backend overload', async ({ browser }) => {
    const loadTester = new LoadTestRunner(browser);

    // Start normal load test
    const normalTestPromise = loadTester.runLoadTest(20, 180000, 30000);

    // Simulate backend overload after 1 minute
    setTimeout(async () => {
      console.log('Simulating backend overload...');

      // Add artificial delays to all requests
      const contexts = await browser.contexts();
      for (const context of contexts) {
        for (const page of context.pages()) {
          await page.route('**/api/**', async route => {
            // Delay requests by 3-10 seconds
            await new Promise(resolve => setTimeout(resolve, Math.random() * 7000 + 3000));
            route.continue();
          });
        }
      }

      // Remove delays after 30 seconds
      setTimeout(async () => {
        console.log('Removing backend overload...');
        for (const context of contexts) {
          for (const page of context.pages()) {
            await page.unroute('**/api/**');
          }
        }
      }, 30000);
    }, 60000);

    const metrics = await normalTestPromise;

    console.log('Recovery Test Results:', metrics);

    // System should recover after overload period
    expect(metrics.totalRequests).toBeGreaterThan(0);

    const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    console.log(`Overall success rate: ${successRate.toFixed(2)}%`);

    // Even with temporary overload, should maintain reasonable success rate
    expect(successRate).toBeGreaterThan(70); // 70% success rate
  });
});

// Utility function to generate load test report
export const generateLoadTestReport = (results: LoadTestMetrics[]): string => {
  let report = '\n=== LOAD TEST REPORT ===\n\n';

  results.forEach((result, index) => {
    report += `Test ${index + 1}: ${result.concurrentUsers} concurrent users\n`;
    report += `Duration: ${(result.testDuration / 1000 / 60).toFixed(2)} minutes\n`;
    report += `Total Requests: ${result.totalRequests}\n`;
    report += `Successful: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%)\n`;
    report += `Failed: ${result.failedRequests} (${((result.failedRequests / result.totalRequests) * 100).toFixed(2)}%)\n`;
    report += `Average Response Time: ${result.averageResponseTime.toFixed(2)}ms\n`;
    report += `Max Response Time: ${result.maxResponseTime.toFixed(2)}ms\n`;
    report += `Min Response Time: ${result.minResponseTime.toFixed(2)}ms\n`;
    report += `Requests/Second: ${result.requestsPerSecond.toFixed(2)}\n`;

    if (result.memoryUsage.length > 0) {
      const maxMemory = Math.max(...result.memoryUsage);
      const minMemory = Math.min(...result.memoryUsage);
      report += `Memory Usage: ${(minMemory / 1024 / 1024).toFixed(1)}MB - ${(maxMemory / 1024 / 1024).toFixed(1)}MB\n`;
    }

    if (Object.keys(result.errorRates).length > 0) {
      report += 'Error Breakdown:\n';
      Object.entries(result.errorRates).forEach(([error, count]) => {
        report += `  ${error}: ${count}\n`;
      });
    }

    report += '\n';
  });

  return report;
};
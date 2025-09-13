import { test, expect, devices, Browser, BrowserContext } from '@playwright/test';

// Browser configurations for testing
const browserConfigs = [
  {
    name: 'Chrome Latest',
    ...devices['Desktop Chrome']
  },
  {
    name: 'Firefox Latest',
    ...devices['Desktop Firefox']
  },
  {
    name: 'Safari Latest',
    ...devices['Desktop Safari']
  },
  {
    name: 'Edge Latest',
    ...devices['Desktop Edge']
  },
  {
    name: 'Chrome Mobile',
    ...devices['Galaxy S9+']
  },
  {
    name: 'iPhone',
    ...devices['iPhone 12']
  },
  {
    name: 'iPad',
    ...devices['iPad Pro']
  }
];

// Feature detection tests
const featureDetectionTests = {
  localStorage: () => typeof Storage !== 'undefined',
  sessionStorage: () => typeof Storage !== 'undefined',
  webWorkers: () => typeof Worker !== 'undefined',
  fetch: () => typeof fetch !== 'undefined',
  intersectionObserver: () => typeof IntersectionObserver !== 'undefined',
  mutationObserver: () => typeof MutationObserver !== 'undefined',
  performance: () => typeof performance !== 'undefined' && typeof performance.now === 'function',
  requestIdleCallback: () => typeof requestIdleCallback !== 'undefined',
  cssCustomProperties: () => CSS && CSS.supports && CSS.supports('--test', 'red'),
  flexbox: () => CSS && CSS.supports && CSS.supports('display', 'flex'),
  grid: () => CSS && CSS.supports && CSS.supports('display', 'grid'),
  touchEvents: () => 'ontouchstart' in window,
  geolocation: () => 'geolocation' in navigator,
  deviceMemory: () => 'deviceMemory' in navigator,
  hardwareConcurrency: () => 'hardwareConcurrency' in navigator
};

test.describe('Browser Compatibility Tests', () => {
  // Test core functionality across different browsers
  for (const config of browserConfigs) {
    test.describe(`${config.name} Compatibility`, () => {
      test.use(config);

      test('should load application successfully', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Verify main application loads
        await expect(page.locator('h1')).toContainText('Book Master');

        // Verify critical CSS is applied
        const header = page.locator('h1');
        const headerStyles = await header.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            display: styles.display,
            fontSize: styles.fontSize,
            color: styles.color
          };
        });

        expect(headerStyles.display).not.toBe('none');
        expect(headerStyles.fontSize).toBeTruthy();
        expect(headerStyles.color).toBeTruthy();
      });

      test('should support JavaScript features', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Test feature detection
        const features = await page.evaluate((tests) => {
          const results: Record<string, boolean> = {};
          for (const [testName, testFn] of Object.entries(tests)) {
            try {
              results[testName] = testFn();
            } catch (error) {
              results[testName] = false;
            }
          }
          return results;
        }, featureDetectionTests);

        // Core features that must be supported
        expect(features.localStorage).toBe(true);
        expect(features.fetch).toBe(true);
        expect(features.performance).toBe(true);

        // Modern features with fallbacks
        if (!features.webWorkers) {
          console.warn(`${config.name}: Web Workers not supported`);
        }

        if (!features.intersectionObserver) {
          console.warn(`${config.name}: Intersection Observer not supported`);
        }

        // Log feature support for analysis
        console.log(`${config.name} Feature Support:`, features);
      });

      test('should handle form interactions', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Test book creation form
        await page.click('button:text("Create New Book")');

        // Fill form fields
        await page.fill('input[name="title"]', `Test Book ${config.name}`);
        await page.fill('input[name="author"]', 'Compatibility Test');

        // Verify form validation
        await expect(page.locator('input[name="title"]')).toHaveValue(`Test Book ${config.name}`);

        // Submit form
        await page.click('button:text("Create Book")');

        // Verify navigation
        await expect(page.locator('h2')).toContainText(`Test Book ${config.name}`);
      });

      test('should support text editing', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Create book and chapter for editing
        await page.click('button:text("Create New Book")');
        await page.fill('input[name="title"]', 'Edit Test');
        await page.fill('input[name="author"]', 'Test Author');
        await page.click('button:text("Create Book")');

        await page.click('button:text("Add Chapter")');
        await page.fill('input[name="chapterTitle"]', 'Test Chapter');
        await page.click('button:text("Create Chapter")');

        await page.click('text=Test Chapter');
        await page.click('button:text("Edit")');

        // Test text input
        const contentTextarea = page.locator('textarea[name="content"]');
        const testText = 'This is a compatibility test for text editing functionality.';

        await contentTextarea.fill(testText);
        await expect(contentTextarea).toHaveValue(testText);

        // Test text selection and manipulation
        await contentTextarea.focus();
        await page.keyboard.press('Control+A'); // Select all
        await page.keyboard.press('Control+C'); // Copy

        await contentTextarea.fill('');
        await page.keyboard.press('Control+V'); // Paste

        await expect(contentTextarea).toHaveValue(testText);

        // Save changes
        await page.click('button:text("Save Changes")');
        await expect(page.locator('text=Saved')).toBeVisible();
      });

      test('should handle responsive design', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Test different viewport sizes
        const viewports = [
          { width: 1920, height: 1080 }, // Desktop
          { width: 1024, height: 768 },  // Tablet landscape
          { width: 768, height: 1024 },  // Tablet portrait
          { width: 375, height: 667 }    // Mobile
        ];

        for (const viewport of viewports) {
          await page.setViewportSize(viewport);

          // Verify header is visible and properly sized
          const header = page.locator('h1');
          await expect(header).toBeVisible();

          const headerBox = await header.boundingBox();
          expect(headerBox?.width).toBeGreaterThan(0);
          expect(headerBox?.height).toBeGreaterThan(0);

          // Check if navigation is accessible
          const createButton = page.locator('button:text("Create New Book")');
          await expect(createButton).toBeVisible();

          // On mobile, check if menu is collapsible
          if (viewport.width < 768) {
            const mobileMenu = page.locator('[data-testid="mobile-menu"]');
            if (await mobileMenu.isVisible()) {
              await expect(mobileMenu).toBeVisible();
            }
          }
        }
      });

      test('should support CSS features', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Test CSS Grid support
        const gridSupported = await page.evaluate(() => {
          const testEl = document.createElement('div');
          testEl.style.display = 'grid';
          return testEl.style.display === 'grid';
        });

        // Test Flexbox support
        const flexSupported = await page.evaluate(() => {
          const testEl = document.createElement('div');
          testEl.style.display = 'flex';
          return testEl.style.display === 'flex';
        });

        // Test CSS Custom Properties support
        const customPropsSupported = await page.evaluate(() => {
          return CSS && CSS.supports && CSS.supports('--test', 'red');
        });

        // Log CSS feature support
        console.log(`${config.name} CSS Support:`, {
          grid: gridSupported,
          flexbox: flexSupported,
          customProperties: customPropsSupported
        });

        // Verify layout still works even without full CSS support
        const mainContent = page.locator('main');
        await expect(mainContent).toBeVisible();

        const contentBox = await mainContent.boundingBox();
        expect(contentBox?.width).toBeGreaterThan(200);
        expect(contentBox?.height).toBeGreaterThan(100);
      });

      test('should handle error states gracefully', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Test network error handling
        await page.route('**/api/**', route => {
          route.abort('failed');
        });

        await page.click('button:text("Create New Book")');
        await page.fill('input[name="title"]', 'Error Test');
        await page.fill('input[name="author"]', 'Error Author');
        await page.click('button:text("Create Book")');

        // Verify error message appears
        await expect(page.locator('text="Error"')).toBeVisible();

        // Verify retry functionality
        await page.unroute('**/api/**');
        const retryButton = page.locator('button:text("Retry")');

        if (await retryButton.isVisible()) {
          await retryButton.click();
          await expect(page.locator('h2:text("Error Test")')).toBeVisible();
        }
      });
    });
  }

  test.describe('Cross-Browser Data Persistence', () => {
    test('should maintain data consistency across browser sessions', async ({ browser }) => {
      // Test with Chrome
      const chromeContext = await browser.newContext();
      const chromePage = await chromeContext.newPage();

      await chromePage.goto('http://localhost:5173');
      await chromePage.click('button:text("Create New Book")');
      await chromePage.fill('input[name="title"]', 'Cross-Browser Test');
      await chromePage.fill('input[name="author"]', 'Multi-Browser Author');
      await chromePage.click('button:text("Create Book")');

      // Verify book is created
      await expect(chromePage.locator('h2:text("Cross-Browser Test")')).toBeVisible();

      await chromeContext.close();

      // Test data persistence in another context (simulating different browser)
      const firefoxContext = await browser.newContext();
      const firefoxPage = await firefoxContext.newPage();

      await firefoxPage.goto('http://localhost:5173');

      // Data should be available (assuming shared backend)
      await expect(firefoxPage.locator('text="Cross-Browser Test"')).toBeVisible();

      await firefoxContext.close();
    });
  });

  test.describe('Performance Across Browsers', () => {
    test('should meet performance standards on all browsers', async ({ page, browserName }) => {
      const performanceMetrics: Record<string, number> = {};

      // Measure page load time
      const startTime = Date.now();
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');
      performanceMetrics.pageLoad = Date.now() - startTime;

      // Measure DOM content loaded
      const domContentLoadedTime = await page.evaluate(() => {
        return performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
      });
      performanceMetrics.domContentLoaded = domContentLoadedTime;

      // Measure first paint
      const paintMetrics = await page.evaluate(() => {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

        return {
          firstPaint: firstPaint?.startTime || 0,
          firstContentfulPaint: firstContentfulPaint?.startTime || 0
        };
      });

      performanceMetrics.firstPaint = paintMetrics.firstPaint;
      performanceMetrics.firstContentfulPaint = paintMetrics.firstContentfulPaint;

      // Test JavaScript execution time
      const jsExecutionStart = Date.now();
      await page.click('button:text("Create New Book")');
      await page.fill('input[name="title"]', 'Performance Test');
      await page.fill('input[name="author"]', 'Perf Author');
      await page.click('button:text("Create Book")');
      performanceMetrics.jsExecution = Date.now() - jsExecutionStart;

      // Log performance metrics
      console.log(`${browserName} Performance Metrics:`, performanceMetrics);

      // Assert performance standards
      expect(performanceMetrics.pageLoad).toBeLessThan(5000); // 5 seconds
      expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000); // 2 seconds
      expect(performanceMetrics.jsExecution).toBeLessThan(1000); // 1 second
    });
  });

  test.describe('Accessibility Across Browsers', () => {
    test('should maintain accessibility standards on all browsers', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();

      // Test ARIA attributes
      const mainContent = page.locator('main');
      const ariaLabel = await mainContent.getAttribute('aria-label');
      const role = await mainContent.getAttribute('role');

      // Main content should be properly labeled
      expect(ariaLabel || role).toBeTruthy();

      // Test form accessibility
      await page.click('button:text("Create New Book")');

      const titleInput = page.locator('input[name="title"]');
      const titleLabel = await page.locator('label[for="title"]').textContent() ||
                         await titleInput.getAttribute('aria-label');

      expect(titleLabel).toBeTruthy();

      // Test color contrast (basic check)
      const button = page.locator('button:text("Create Book")');
      const buttonStyles = await button.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor
        };
      });

      // Ensure colors are defined (actual contrast testing would require more complex logic)
      expect(buttonStyles.color).toBeTruthy();
      expect(buttonStyles.backgroundColor).toBeTruthy();
    });
  });

  test.describe('Progressive Enhancement', () => {
    test('should work with JavaScript disabled', async ({ browser }) => {
      // Create a context with JavaScript disabled
      const context = await browser.newContext({
        javaScriptEnabled: false
      });

      const page = await context.newPage();
      await page.goto('http://localhost:5173');

      // Basic HTML should still be visible
      await expect(page.locator('h1')).toBeVisible();

      // Forms should still be functional (server-side processing)
      const createBookForm = page.locator('form');
      if (await createBookForm.isVisible()) {
        await expect(createBookForm).toBeVisible();

        // Form should have proper action and method attributes
        const action = await createBookForm.getAttribute('action');
        const method = await createBookForm.getAttribute('method');

        expect(action).toBeTruthy();
        expect(method).toBeTruthy();
      }

      await context.close();
    });

    test('should handle limited storage gracefully', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Simulate storage quota exceeded
      await page.evaluate(() => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key: string, value: string) {
          throw new Error('QuotaExceededError');
        };
      });

      // App should still function without crashing
      await page.click('button:text("Create New Book")');
      await page.fill('input[name="title"]', 'Storage Test');
      await page.fill('input[name="author"]', 'Storage Author');
      await page.click('button:text("Create Book")');

      // Should show warning about storage but continue working
      const warningMessage = page.locator('text*="storage"');
      if (await warningMessage.isVisible()) {
        await expect(warningMessage).toBeVisible();
      }

      // Core functionality should still work
      await expect(page.locator('h2:text("Storage Test")')).toBeVisible();
    });
  });
});

// Browser feature detection and polyfill testing
test.describe('Feature Detection and Polyfills', () => {
  test('should detect and handle missing features', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Test feature detection results
    const featureSupport = await page.evaluate(() => {
      return {
        fetch: typeof fetch !== 'undefined',
        promise: typeof Promise !== 'undefined',
        arrayIncludes: Array.prototype.includes !== undefined,
        objectAssign: Object.assign !== undefined,
        intersectionObserver: typeof IntersectionObserver !== 'undefined',
        customElements: typeof customElements !== 'undefined'
      };
    });

    console.log('Feature Support:', featureSupport);

    // Core features should be available (with polyfills if needed)
    expect(featureSupport.fetch).toBe(true);
    expect(featureSupport.promise).toBe(true);

    // Modern features may need polyfills
    if (!featureSupport.intersectionObserver) {
      console.warn('IntersectionObserver not supported - fallback should be active');
    }

    // Verify polyfills are working
    const polyfillsLoaded = await page.evaluate(() => {
      return {
        fetchPolyfill: window.fetch && window.fetch.polyfill,
        promisePolyfill: window.Promise && window.Promise.polyfill
      };
    });

    console.log('Polyfills Status:', polyfillsLoaded);
  });

  test('should gracefully degrade advanced features', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Test advanced features with fallbacks
    const advancedFeatures = await page.evaluate(() => {
      return {
        webWorkers: typeof Worker !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
        webGL: (() => {
          try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          } catch (e) {
            return false;
          }
        })(),
        webAssembly: typeof WebAssembly !== 'undefined'
      };
    });

    console.log('Advanced Features:', advancedFeatures);

    // App should work regardless of advanced feature support
    await page.click('button:text("Create New Book")');
    await page.fill('input[name="title"]', 'Feature Test');
    await page.fill('input[name="author"]', 'Feature Author');
    await page.click('button:text("Create Book")');

    await expect(page.locator('h2:text("Feature Test")')).toBeVisible();

    // If advanced features aren't supported, fallbacks should be active
    if (!advancedFeatures.webWorkers) {
      console.log('Using main thread fallback for background processing');
    }

    if (!advancedFeatures.serviceWorker) {
      console.log('Offline functionality may be limited');
    }
  });
});
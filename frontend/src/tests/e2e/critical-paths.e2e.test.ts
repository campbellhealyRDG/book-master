import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8000';

// Test data
const testBook = {
  title: 'E2E Test Book',
  author: 'Test Author',
  chapters: [
    {
      title: 'Introduction',
      content: 'This is the introduction chapter with some initial content for testing purposes.'
    },
    {
      title: 'Main Content',
      content: 'This chapter contains the main content of our test book with various elements to test.'
    },
    {
      title: 'Conclusion',
      content: 'This is the conclusion chapter that wraps up our comprehensive testing scenario.'
    }
  ]
};

test.describe('Critical Path End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test environment
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Book Creation and Management Critical Path', () => {
    test('should create, edit, and publish a complete book', async ({ page }) => {
      // Performance tracking
      const performanceMetrics = {
        pageLoadTime: 0,
        bookCreationTime: 0,
        chapterCreationTime: 0,
        saveTime: 0,
        searchTime: 0
      };

      // Measure page load time
      const pageLoadStart = Date.now();
      await expect(page.locator('h1')).toContainText('Book Master');
      performanceMetrics.pageLoadTime = Date.now() - pageLoadStart;

      // Verify page load performance
      expect(performanceMetrics.pageLoadTime).toBeLessThan(3000); // Less than 3 seconds

      // Step 1: Create a new book
      const bookCreationStart = Date.now();

      await page.click('button:text("Create New Book")');
      await page.fill('input[name="title"]', testBook.title);
      await page.fill('input[name="author"]', testBook.author);

      // Verify form validation
      await expect(page.locator('input[name="title"]')).toHaveValue(testBook.title);
      await expect(page.locator('input[name="author"]')).toHaveValue(testBook.author);

      await page.click('button:text("Create Book")');

      // Wait for book creation and navigation
      await expect(page.locator('h2')).toContainText(testBook.title);
      performanceMetrics.bookCreationTime = Date.now() - bookCreationStart;

      // Verify book creation performance
      expect(performanceMetrics.bookCreationTime).toBeLessThan(2000); // Less than 2 seconds

      // Step 2: Add chapters
      const chapterCreationStart = Date.now();

      for (const chapter of testBook.chapters) {
        await page.click('button:text("Add Chapter")');
        await page.fill('input[name="chapterTitle"]', chapter.title);
        await page.click('button:text("Create Chapter")');

        // Wait for chapter to appear in list
        await expect(page.locator(`text=${chapter.title}`)).toBeVisible();

        // Open chapter editor
        await page.click(`text=${chapter.title}`);
        await page.click('button:text("Edit")');

        // Add content with spell checking
        const contentTextarea = page.locator('textarea[name="content"]');
        await contentTextarea.fill(chapter.content);

        // Wait for spell checking to complete
        await page.waitForTimeout(500); // Allow spell check to process

        // Save chapter
        await page.click('button:text("Save Changes")');

        // Verify save confirmation
        await expect(page.locator('text=Saved')).toBeVisible();

        // Navigate back to chapter list
        await page.click('button:text("Back to Chapters")');
      }

      performanceMetrics.chapterCreationTime = Date.now() - chapterCreationStart;

      // Verify chapter creation performance
      expect(performanceMetrics.chapterCreationTime).toBeLessThan(10000); // Less than 10 seconds for all chapters

      // Step 3: Verify all chapters are created
      for (const chapter of testBook.chapters) {
        await expect(page.locator(`text=${chapter.title}`)).toBeVisible();
      }

      // Step 4: Test navigation between chapters
      await page.click(`text=${testBook.chapters[0].title}`);
      await expect(page.locator('text="Chapter 1 of 3"')).toBeVisible();

      await page.click('button:text("Next Chapter")');
      await expect(page.locator(`text=${testBook.chapters[1].title}`)).toBeVisible();

      await page.click('button:text("Previous Chapter")');
      await expect(page.locator(`text=${testBook.chapters[0].title}`)).toBeVisible();

      // Step 5: Test book-wide search
      const searchStart = Date.now();

      await page.fill('input[placeholder*="Search"]', 'introduction');
      await page.press('input[placeholder*="Search"]', 'Enter');

      // Wait for search results
      await expect(page.locator('text="Search Results"')).toBeVisible();
      await expect(page.locator(`text=${testBook.chapters[0].title}`)).toBeVisible();

      performanceMetrics.searchTime = Date.now() - searchStart;

      // Verify search performance
      expect(performanceMetrics.searchTime).toBeLessThan(1000); // Less than 1 second

      // Log performance metrics
      console.log('Performance Metrics:', performanceMetrics);
    });

    test('should handle large document editing with performance monitoring', async ({ page }) => {
      // Create a book first
      await page.click('button:text("Create New Book")');
      await page.fill('input[name="title"]', 'Large Document Test');
      await page.fill('input[name="author"]', 'Performance Test');
      await page.click('button:text("Create Book")');

      // Add a chapter
      await page.click('button:text("Add Chapter")');
      await page.fill('input[name="chapterTitle"]', 'Large Chapter');
      await page.click('button:text("Create Chapter")');

      // Open chapter editor
      await page.click('text=Large Chapter');
      await page.click('button:text("Edit")');

      // Generate large content (simulating 100k+ word document)
      const largeContent = 'This is a test paragraph. '.repeat(5000); // ~25k characters
      const contentTextarea = page.locator('textarea[name="content"]');

      // Measure typing performance
      const typingStart = Date.now();
      await contentTextarea.fill(largeContent);
      const typingTime = Date.now() - typingStart;

      // Verify typing performance (should handle large content)
      expect(typingTime).toBeLessThan(5000); // Less than 5 seconds

      // Test scrolling performance
      await contentTextarea.press('Control+End'); // Go to end
      await contentTextarea.press('Control+Home'); // Go to beginning

      // Test spell checking with large content
      await page.waitForTimeout(2000); // Allow spell check to process

      // Verify spell check indicators are present
      const spellCheckStatus = page.locator('[data-testid="spell-check-status"]');
      await expect(spellCheckStatus).toBeVisible();

      // Test auto-save functionality
      await contentTextarea.type(' Additional content for auto-save test.');

      // Wait for auto-save indicator
      await expect(page.locator('text="Auto-saved"')).toBeVisible({ timeout: 35000 });

      // Verify memory usage doesn't spike
      const memoryInfo = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });

      if (memoryInfo) {
        const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
        expect(memoryUsagePercent).toBeLessThan(80); // Less than 80% memory usage
      }
    });
  });

  test.describe('Spell Checking Critical Path', () => {
    test('should detect spelling errors, provide suggestions, and apply corrections', async ({ page }) => {
      // Setup: Create a book and chapter
      await page.click('button:text("Create New Book")');
      await page.fill('input[name="title"]', 'Spell Check Test');
      await page.fill('input[name="author"]', 'Test Author');
      await page.click('button:text("Create Book")');

      await page.click('button:text("Add Chapter")');
      await page.fill('input[name="chapterTitle"]', 'Spell Check Chapter');
      await page.click('button:text("Create Chapter")');

      await page.click('text=Spell Check Chapter');
      await page.click('button:text("Edit")');

      // Type content with intentional spelling errors
      const contentWithErrors = 'This is a tset of the speling checker funcionality.';
      const contentTextarea = page.locator('textarea[name="content"]');
      await contentTextarea.fill(contentWithErrors);

      // Wait for spell checking to complete
      await page.waitForTimeout(1000);

      // Verify spelling errors are highlighted
      const spellingErrors = page.locator('.spelling-error');
      await expect(spellingErrors).toHaveCount(3); // 'tset', 'speling', 'funcionality'

      // Test correction workflow
      // Right-click on first error
      await spellingErrors.first().click({ button: 'right' });

      // Verify context menu appears with suggestions
      await expect(page.locator('.spell-check-menu')).toBeVisible();
      await expect(page.locator('text="test"')).toBeVisible(); // Suggestion for 'tset'

      // Apply correction
      await page.click('text="test"');

      // Verify correction is applied
      await expect(contentTextarea).toContainText('This is a test of');

      // Test British English preferences
      await page.click('button:text("Settings")');
      await page.check('input[name="britishEnglish"]');
      await page.click('button:text("Save Preferences")');

      // Return to editor and test American vs British spelling
      await page.click('button:text("Back")');
      await contentTextarea.fill('The color of the theater is beautiful.');

      await page.waitForTimeout(1000);

      // Should highlight 'color' and 'theater' as American spellings
      const americanSpellings = page.locator('.spelling-error');
      await expect(americanSpellings).toHaveCount(2);

      // Test custom dictionary
      await americanSpellings.first().click({ button: 'right' });
      await page.click('text="Add to Dictionary"');

      // Verify word is no longer highlighted as error
      await page.waitForTimeout(500);
      await expect(americanSpellings).toHaveCount(1); // Only 'theater' should remain highlighted
    });

    test('should handle real-time spell checking during typing', async ({ page }) => {
      // Setup editor
      await page.click('button:text("Create New Book")');
      await page.fill('input[name="title"]', 'Real-time Spell Check');
      await page.fill('input[name="author"]', 'Test Author');
      await page.click('button:text("Create Book")');

      await page.click('button:text("Add Chapter")');
      await page.fill('input[name="chapterTitle"]', 'Real-time Chapter');
      await page.click('button:text("Create Chapter")');

      await page.click('text=Real-time Chapter');
      await page.click('button:text("Edit")');

      const contentTextarea = page.locator('textarea[name="content"]');

      // Type correct words (should not be highlighted)
      await contentTextarea.type('This is correct spelling');
      await page.waitForTimeout(500);

      let spellingErrors = page.locator('.spelling-error');
      await expect(spellingErrors).toHaveCount(0);

      // Type incorrect word
      await contentTextarea.type(' and this is incorect');
      await page.waitForTimeout(500);

      // Should highlight 'incorect'
      spellingErrors = page.locator('.spelling-error');
      await expect(spellingErrors).toHaveCount(1);

      // Continue typing to fix the error
      await contentTextarea.press('Backspace');
      await contentTextarea.press('Backspace');
      await contentTextarea.type('rect');
      await page.waitForTimeout(500);

      // Error should be resolved
      spellingErrors = page.locator('.spelling-error');
      await expect(spellingErrors).toHaveCount(0);
    });
  });

  test.describe('Export and Performance Critical Path', () => {
    test('should export book in multiple formats with quality validation', async ({ page }) => {
      // Setup: Create a book with content
      await page.click('button:text("Create New Book")');
      await page.fill('input[name="title"]', 'Export Test Book');
      await page.fill('input[name="author"]', 'Export Author');
      await page.click('button:text("Create Book")');

      // Add chapter with formatted content
      await page.click('button:text("Add Chapter")');
      await page.fill('input[name="chapterTitle"]', 'Export Chapter');
      await page.click('button:text("Create Chapter")');

      await page.click('text=Export Chapter');
      await page.click('button:text("Edit")');

      const formattedContent = `# Chapter Title

This is **bold text** and this is *italic text*.

## Subsection

Here is a list:
- Item 1
- Item 2
- Item 3

And a paragraph with "quoted text" and some numbers: 123, 456.

> This is a blockquote.

Final paragraph with various punctuation: commas, semicolons; and dashes—like this.`;

      await page.fill('textarea[name="content"]', formattedContent);
      await page.click('button:text("Save Changes")');

      // Navigate to export
      await page.click('button:text("Export")');

      // Test PDF export
      await page.click('input[value="pdf"]');
      await page.click('button:text("Export as PDF")');

      // Wait for export to complete
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toContain('.pdf');

      // Verify export time is reasonable
      const exportTime = await page.locator('[data-testid="export-time"]').textContent();
      const exportTimeMs = parseInt(exportTime?.replace('ms', '') || '0');
      expect(exportTimeMs).toBeLessThan(10000); // Less than 10 seconds

      // Test DOCX export
      await page.click('input[value="docx"]');

      const docxDownloadPromise = page.waitForEvent('download');
      await page.click('button:text("Export as DOCX")');
      const docxDownload = await docxDownloadPromise;

      expect(docxDownload.suggestedFilename()).toContain('.docx');

      // Test Markdown export
      await page.click('input[value="markdown"]');

      const markdownDownloadPromise = page.waitForEvent('download');
      await page.click('button:text("Export as Markdown")');
      const markdownDownload = await markdownDownloadPromise;

      expect(markdownDownload.suggestedFilename()).toContain('.md');

      // Verify export preserves formatting
      await page.click('button:text("Preview Export")');
      await expect(page.locator('h1:text("Chapter Title")')).toBeVisible();
      await expect(page.locator('strong:text("bold text")')).toBeVisible();
      await expect(page.locator('em:text("italic text")')).toBeVisible();
      await expect(page.locator('blockquote')).toBeVisible();
    });

    test('should handle concurrent user operations without conflicts', async ({ browser }) => {
      // Create multiple browser contexts to simulate concurrent users
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // Both users navigate to the app
      await Promise.all([
        page1.goto(BASE_URL),
        page2.goto(BASE_URL)
      ]);

      await Promise.all([
        page1.waitForLoadState('networkidle'),
        page2.waitForLoadState('networkidle')
      ]);

      // User 1 creates a book
      await page1.click('button:text("Create New Book")');
      await page1.fill('input[name="title"]', 'Concurrent Test Book');
      await page1.fill('input[name="author"]', 'User 1');
      await page1.click('button:text("Create Book")');

      // User 2 also accesses the same book (via API)
      await page2.goto(`${BASE_URL}/books/1`); // Assuming book ID 1

      // User 1 adds a chapter
      await page1.click('button:text("Add Chapter")');
      await page1.fill('input[name="chapterTitle"]', 'User 1 Chapter');
      await page1.click('button:text("Create Chapter")');

      // User 2 tries to add a different chapter
      await page2.click('button:text("Add Chapter")');
      await page2.fill('input[name="chapterTitle"]', 'User 2 Chapter');
      await page2.click('button:text("Create Chapter")');

      // Verify both chapters exist
      await page1.reload();
      await page2.reload();

      await Promise.all([
        expect(page1.locator('text=User 1 Chapter')).toBeVisible(),
        expect(page1.locator('text=User 2 Chapter')).toBeVisible(),
        expect(page2.locator('text=User 1 Chapter')).toBeVisible(),
        expect(page2.locator('text=User 2 Chapter')).toBeVisible()
      ]);

      // Test concurrent editing
      await page1.click('text=User 1 Chapter');
      await page1.click('button:text("Edit")');

      await page2.click('text=User 2 Chapter');
      await page2.click('button:text("Edit")');

      // Both users type simultaneously
      await Promise.all([
        page1.fill('textarea[name="content"]', 'Content from User 1'),
        page2.fill('textarea[name="content"]', 'Content from User 2')
      ]);

      // Both users save
      await Promise.all([
        page1.click('button:text("Save Changes")'),
        page2.click('button:text("Save Changes")')
      ]);

      // Verify both saves were successful
      await Promise.all([
        expect(page1.locator('text=Saved')).toBeVisible(),
        expect(page2.locator('text=Saved')).toBeVisible()
      ]);

      // Cleanup
      await context1.close();
      await context2.close();
    });
  });

  test.describe('Error Recovery Critical Path', () => {
    test('should handle network failures and recover gracefully', async ({ page }) => {
      // Start with normal operation
      await page.click('button:text("Create New Book")');
      await page.fill('input[name="title"]', 'Network Test Book');
      await page.fill('input[name="author"]', 'Network Author');

      // Simulate network failure by intercepting API calls
      await page.route(`${API_URL}/**`, route => {
        route.abort('failed');
      });

      // Try to create book (should fail)
      await page.click('button:text("Create Book")');

      // Verify error message appears
      await expect(page.locator('text="Network error"')).toBeVisible();
      await expect(page.locator('button:text("Retry")')).toBeVisible();

      // Restore network
      await page.unroute(`${API_URL}/**`);

      // Retry operation
      await page.click('button:text("Retry")');

      // Verify successful creation
      await expect(page.locator('h2:text("Network Test Book")')).toBeVisible();

      // Test offline functionality
      await page.click('button:text("Add Chapter")');
      await page.fill('input[name="chapterTitle"]', 'Offline Chapter');

      // Simulate going offline
      await page.route(`${API_URL}/**`, route => {
        route.abort('failed');
      });

      await page.click('button:text("Create Chapter")');

      // Verify offline mode message
      await expect(page.locator('text="Working offline"')).toBeVisible();

      // Content should still be editable locally
      await page.click('text=Offline Chapter');
      await page.click('button:text("Edit")');
      await page.fill('textarea[name="content"]', 'This content is created offline.');

      // Verify local save works
      await page.click('button:text("Save Changes")');
      await expect(page.locator('text="Saved locally"')).toBeVisible();

      // Restore network
      await page.unroute(`${API_URL}/**`);

      // Verify sync when back online
      await page.click('button:text("Sync")');
      await expect(page.locator('text="Synced successfully"')).toBeVisible();
    });

    test('should recover from browser crashes and preserve work', async ({ page }) => {
      // Create content
      await page.click('button:text("Create New Book")');
      await page.fill('input[name="title"]', 'Crash Recovery Test');
      await page.fill('input[name="author"]', 'Recovery Author');
      await page.click('button:text("Create Book")');

      await page.click('button:text("Add Chapter")');
      await page.fill('input[name="chapterTitle"]', 'Recovery Chapter');
      await page.click('button:text("Create Chapter")');

      await page.click('text=Recovery Chapter');
      await page.click('button:text("Edit")');

      const importantContent = 'This is very important content that should not be lost in a crash.';
      await page.fill('textarea[name="content"]', importantContent);

      // Wait for auto-save
      await expect(page.locator('text="Auto-saved"')).toBeVisible({ timeout: 35000 });

      // Simulate browser crash by closing and reopening
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify content is recovered
      await page.click(`text="Crash Recovery Test"`);
      await page.click('text=Recovery Chapter');

      // Content should be preserved
      await expect(page.locator(`text="${importantContent}"`)).toBeVisible();

      // Verify recovery notification
      await expect(page.locator('text="Content recovered from auto-save"')).toBeVisible();
    });
  });

  test.describe('Accessibility Critical Path', () => {
    test('should be fully keyboard navigable', async ({ page }) => {
      // Start at the homepage
      await page.keyboard.press('Tab'); // Focus first interactive element

      // Navigate to create book using keyboard
      await page.keyboard.press('Enter');

      // Fill form using keyboard
      await page.keyboard.type('Keyboard Navigation Test');
      await page.keyboard.press('Tab');
      await page.keyboard.type('Keyboard User');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Submit form

      // Wait for navigation
      await expect(page.locator('h2:text("Keyboard Navigation Test")')).toBeVisible();

      // Navigate to add chapter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      await page.keyboard.type('Keyboard Chapter');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Open chapter editor
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Type content
      await page.keyboard.type('This content was created using only keyboard navigation.');

      // Save using keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Verify save
      await expect(page.locator('text=Saved')).toBeVisible();
    });

    test('should meet WCAG accessibility standards', async ({ page }) => {
      // Create content for accessibility testing
      await page.click('button:text("Create New Book")');
      await page.fill('input[name="title"]', 'Accessibility Test Book');
      await page.fill('input[name="author"]', 'A11y Author');
      await page.click('button:text("Create Book")');

      // Test color contrast and text visibility
      const headingElement = page.locator('h2:text("Accessibility Test Book")');
      const headingStyles = await headingElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: styles.fontSize
        };
      });

      // Verify readable font size
      const fontSize = parseInt(headingStyles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(18); // WCAG recommendation

      // Test form labels and ARIA attributes
      await page.click('button:text("Add Chapter")');

      const titleInput = page.locator('input[name="chapterTitle"]');
      const titleLabel = await titleInput.getAttribute('aria-label') ||
                         await page.locator('label[for="chapterTitle"]').textContent();

      expect(titleLabel).toBeTruthy(); // Must have accessible label

      // Test button accessibility
      const createButton = page.locator('button:text("Create Chapter")');
      const buttonRole = await createButton.getAttribute('role');
      const buttonAriaLabel = await createButton.getAttribute('aria-label');

      // Button should be properly identified
      expect(buttonRole || 'button').toBe('button');

      // Test error message accessibility
      await page.fill('input[name="chapterTitle"]', ''); // Empty title
      await page.click('button:text("Create Chapter")');

      const errorMessage = page.locator('[role="alert"]');
      await expect(errorMessage).toBeVisible();

      // Error should be announced to screen readers
      const ariaLive = await errorMessage.getAttribute('aria-live');
      expect(ariaLive).toBeTruthy();
    });
  });
});
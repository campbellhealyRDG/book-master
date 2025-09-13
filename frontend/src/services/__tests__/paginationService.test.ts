import { describe, test, expect, beforeEach } from 'vitest';
import { paginationService, DocumentPage } from '../paginationService';

describe('PaginationService', () => {
  let sampleContent: string;
  let longContent: string;

  beforeEach(() => {
    sampleContent = `This is the first paragraph. It contains some sample text to demonstrate the pagination functionality. Each paragraph should be handled properly when splitting occurs.

This is the second paragraph. It has more content and should also be considered when determining optimal split points for pagination.

The third paragraph continues the text. Paragraphs are important natural breaking points for document pagination.

This is paragraph four with additional content.`;

    // Generate long content (~10000 words)
    const paragraph = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ';
    longContent = Array(150).fill(paragraph).join('\n\n');
  });

  describe('paginateDocument', () => {
    test('handles empty content', () => {
      const pages = paginationService.paginateDocument('');

      expect(pages).toHaveLength(1);
      expect(pages[0]).toMatchObject({
        id: 'page-1',
        content: '',
        startIndex: 0,
        endIndex: 0,
        wordCount: 0,
        characterCount: 0,
        pageNumber: 1
      });
    });

    test('handles short content in single page', () => {
      const pages = paginationService.paginateDocument(sampleContent);

      expect(pages).toHaveLength(1);
      expect(pages[0].content).toBe(sampleContent);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[0].startIndex).toBe(0);
      expect(pages[0].endIndex).toBe(sampleContent.length);
    });

    test('creates multiple pages for long content', () => {
      const pages = paginationService.paginateDocument(longContent);

      expect(pages.length).toBeGreaterThan(1);

      // Check page sequencing
      pages.forEach((page, index) => {
        expect(page.pageNumber).toBe(index + 1);
        expect(page.id).toBe(`page-${index + 1}`);
      });
    });

    test('respects word count limits per page', () => {
      const pages = paginationService.paginateDocument(longContent);

      // Most pages should be under 2400 words (20% buffer)
      pages.slice(0, -1).forEach(page => {
        expect(page.wordCount).toBeLessThanOrEqual(2400);
      });
    });

    test('respects character count limits per page', () => {
      const pages = paginationService.paginateDocument(longContent);

      // Most pages should be under 9600 characters (20% buffer)
      pages.slice(0, -1).forEach(page => {
        expect(page.characterCount).toBeLessThanOrEqual(9600);
      });
    });

    test('maintains proper indices across pages', () => {
      const pages = paginationService.paginateDocument(longContent);

      for (let i = 0; i < pages.length - 1; i++) {
        expect(pages[i].endIndex).toBe(pages[i + 1].startIndex);
      }

      expect(pages[0].startIndex).toBe(0);
      expect(pages[pages.length - 1].endIndex).toBe(longContent.length);
    });

    test('splits at paragraph boundaries when possible', () => {
      const textWithParagraphs = `First paragraph with enough content to potentially trigger pagination. This paragraph has many words and should be long enough to test boundary detection.

Second paragraph also with substantial content to continue testing the pagination logic and boundary detection capabilities.

Third paragraph continues the pattern with more text content for comprehensive testing.`;

      const pages = paginationService.paginateDocument(textWithParagraphs);

      if (pages.length > 1) {
        // Check that splits occur at reasonable boundaries (not mid-word)
        pages.slice(0, -1).forEach(page => {
          const lastChar = page.content.slice(-1);
          expect(lastChar).not.toMatch(/[a-zA-Z]/); // Should not end mid-word
        });
      }
    });

    test('calculates correct word counts', () => {
      const pages = paginationService.paginateDocument(sampleContent);
      const expectedWordCount = sampleContent.trim().split(/\s+/).length;

      expect(pages[0].wordCount).toBe(expectedWordCount);
    });

    test('calculates correct character counts', () => {
      const pages = paginationService.paginateDocument(sampleContent);

      expect(pages[0].characterCount).toBe(sampleContent.length);
    });
  });

  describe('getPageWindow', () => {
    let pages: DocumentPage[];

    beforeEach(() => {
      pages = paginationService.paginateDocument(longContent);
    });

    test('returns all pages if total is within limit', () => {
      const shortPages = paginationService.paginateDocument(sampleContent);
      const window = paginationService.getPageWindow(shortPages, 0);

      expect(window).toEqual(shortPages);
    });

    test('returns correct window for first page', () => {
      const window = paginationService.getPageWindow(pages, 0);

      expect(window).toHaveLength(3);
      expect(window[0].pageNumber).toBe(1);
      expect(window[2].pageNumber).toBe(3);
    });

    test('returns correct window for middle page', () => {
      if (pages.length >= 5) {
        const window = paginationService.getPageWindow(pages, 2); // Third page (index 2)

        expect(window).toHaveLength(3);
        expect(window[0].pageNumber).toBe(2);
        expect(window[2].pageNumber).toBe(4);
      }
    });

    test('returns correct window for last page', () => {
      const lastPageIndex = pages.length - 1;
      const window = paginationService.getPageWindow(pages, lastPageIndex);

      expect(window).toHaveLength(3);
      expect(window[window.length - 1].pageNumber).toBe(pages.length);
    });
  });

  describe('getDocumentStats', () => {
    test('calculates correct statistics', () => {
      const pages = paginationService.paginateDocument(longContent);
      const stats = paginationService.getDocumentStats(pages);

      expect(stats.totalPages).toBe(pages.length);

      const expectedWords = pages.reduce((sum, page) => sum + page.wordCount, 0);
      const expectedChars = pages.reduce((sum, page) => sum + page.characterCount, 0);

      expect(stats.totalWords).toBe(expectedWords);
      expect(stats.totalCharacters).toBe(expectedChars);
    });
  });

  describe('reconstructDocument', () => {
    test('reconstructs document correctly', () => {
      const pages = paginationService.paginateDocument(sampleContent);
      const reconstructed = paginationService.reconstructDocument(pages);

      expect(reconstructed).toBe(sampleContent);
    });

    test('handles multiple pages reconstruction', () => {
      const pages = paginationService.paginateDocument(longContent);
      const reconstructed = paginationService.reconstructDocument(pages);

      expect(reconstructed).toBe(longContent);
    });

    test('handles out-of-order pages', () => {
      const pages = paginationService.paginateDocument(longContent);

      if (pages.length > 2) {
        // Shuffle pages
        const shuffled = [pages[2], pages[0], pages[1], ...pages.slice(3)];
        const reconstructed = paginationService.reconstructDocument(shuffled);

        expect(reconstructed).toBe(longContent);
      }
    });
  });

  describe('updatePage', () => {
    test('updates specific page content', () => {
      const pages = paginationService.paginateDocument(longContent);
      const newContent = 'Updated page content';

      const updatedPages = paginationService.updatePage(pages, 1, newContent);

      expect(updatedPages[0].content).toBe(newContent);
      expect(updatedPages[0].wordCount).toBe(3);
      expect(updatedPages[0].characterCount).toBe(newContent.length);

      // Other pages should remain unchanged
      for (let i = 1; i < pages.length; i++) {
        expect(updatedPages[i].content).toBe(pages[i].content);
      }
    });

    test('returns original pages if page not found', () => {
      const pages = paginationService.paginateDocument(sampleContent);
      const updatedPages = paginationService.updatePage(pages, 999, 'New content');

      expect(updatedPages).toEqual(pages);
    });
  });

  describe('needsRepagination', () => {
    test('identifies pages that need repagination', () => {
      const oversizedPage: DocumentPage = {
        id: 'page-1',
        content: 'x'.repeat(10000), // Much longer than limit
        startIndex: 0,
        endIndex: 10000,
        wordCount: 3000, // Over word limit
        characterCount: 10000, // Over character limit
        pageNumber: 1
      };

      expect(paginationService.needsRepagination(oversizedPage)).toBe(true);
    });

    test('identifies pages that do not need repagination', () => {
      const normalPage: DocumentPage = {
        id: 'page-1',
        content: 'Normal content',
        startIndex: 0,
        endIndex: 14,
        wordCount: 2,
        characterCount: 14,
        pageNumber: 1
      };

      expect(paginationService.needsRepagination(normalPage)).toBe(false);
    });
  });

  describe('smartRepaginate', () => {
    test('repaginates from specified page onwards', () => {
      const initialPages = paginationService.paginateDocument(longContent);

      if (initialPages.length > 2) {
        // Modify the content and repaginate from page 2
        const modifiedContent = longContent + '\n\nAdditional content that changes pagination.';
        const repaginated = paginationService.smartRepaginate(initialPages, 2, modifiedContent);

        // First page should remain unchanged
        expect(repaginated[0].content).toBe(initialPages[0].content);

        // Total content should match modified content
        const reconstructed = paginationService.reconstructDocument(repaginated);
        expect(reconstructed).toBe(modifiedContent);
      }
    });

    test('handles repagination from first page', () => {
      const initialPages = paginationService.paginateDocument(sampleContent);
      const modifiedContent = sampleContent + '\n\nExtra content.';

      const repaginated = paginationService.smartRepaginate(initialPages, 1, modifiedContent);
      const reconstructed = paginationService.reconstructDocument(repaginated);

      expect(reconstructed).toBe(modifiedContent);
    });
  });

  describe('edge cases', () => {
    test('handles single character content', () => {
      const pages = paginationService.paginateDocument('a');

      expect(pages).toHaveLength(1);
      expect(pages[0].content).toBe('a');
      expect(pages[0].wordCount).toBe(1);
      expect(pages[0].characterCount).toBe(1);
    });

    test('handles content with only whitespace', () => {
      const pages = paginationService.paginateDocument('   \n\n  \t  ');

      expect(pages).toHaveLength(1);
      expect(pages[0].wordCount).toBe(0);
    });

    test('handles content with special characters', () => {
      const specialContent = 'Hello! How are you? I\'m fine. It\'s 50% off today—what a deal!';
      const pages = paginationService.paginateDocument(specialContent);

      expect(pages).toHaveLength(1);
      expect(pages[0].content).toBe(specialContent);
      expect(pages[0].wordCount).toBeGreaterThan(0);
    });

    test('handles very long single word', () => {
      const longWord = 'a'.repeat(10000);
      const pages = paginationService.paginateDocument(longWord);

      expect(pages).toHaveLength(1);
      expect(pages[0].wordCount).toBe(1);
      expect(pages[0].characterCount).toBe(10000);
    });
  });
});
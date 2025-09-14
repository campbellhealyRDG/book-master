export interface DocumentPage {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
  characterCount: number;
  pageNumber: number;
}

export interface PaginationResult {
  pages: DocumentPage[];
  currentPage: number;
  totalPages: number;
  totalWords: number;
  totalCharacters: number;
}

class PaginationService {
  private readonly WORDS_PER_PAGE = 1000;
  private readonly CHARS_PER_PAGE = 8000;
  private readonly MAX_PAGES_IN_MEMORY = 3;

  /**
   * Split document content into pages based on word count and smart paragraph boundaries
   */
  public paginateDocument(content: string): DocumentPage[] {
    if (!content.trim()) {
      return [{
        id: 'page-1',
        content: '',
        startIndex: 0,
        endIndex: 0,
        wordCount: 0,
        characterCount: 0,
        pageNumber: 1
      }];
    }

    const pages: DocumentPage[] = [];
    let currentIndex = 0;
    let pageNumber = 1;

    while (currentIndex < content.length) {
      const page = this.createPage(content, currentIndex, pageNumber);
      pages.push(page);
      currentIndex = page.endIndex;
      pageNumber++;
    }

    return pages;
  }

  /**
   * Create a single page from the document starting at the given index
   */
  private createPage(content: string, startIndex: number, pageNumber: number): DocumentPage {
    const remainingContent = content.substring(startIndex);

    // If remaining content is small, include all of it
    if (remainingContent.length <= this.CHARS_PER_PAGE) {
      const wordCount = this.countWords(remainingContent);
      return {
        id: `page-${pageNumber}`,
        content: remainingContent,
        startIndex,
        endIndex: content.length,
        wordCount,
        characterCount: remainingContent.length,
        pageNumber
      };
    }

    // Find the optimal split point
    const splitPoint = this.findOptimalSplitPoint(remainingContent);
    const pageContent = remainingContent.substring(0, splitPoint);
    const wordCount = this.countWords(pageContent);

    return {
      id: `page-${pageNumber}`,
      content: pageContent,
      startIndex,
      endIndex: startIndex + splitPoint,
      wordCount,
      characterCount: pageContent.length,
      pageNumber
    };
  }

  /**
   * Find the optimal point to split the document, preferring paragraph boundaries
   */
  private findOptimalSplitPoint(content: string): number {
    const words = content.split(/\s+/);
    let currentLength = 0;
    let lastGoodSplit = 0;

    // First pass: find approximate split point by word count
    for (let i = 0; i < words.length && i < this.WORDS_PER_PAGE; i++) {
      const wordLength = words[i].length + 1; // +1 for space

      if (currentLength + wordLength > this.CHARS_PER_PAGE) {
        break;
      }

      currentLength += wordLength;
      lastGoodSplit = currentLength;
    }

    // If we're under the limits, include more words up to the character limit
    if (lastGoodSplit < this.CHARS_PER_PAGE) {
      let additionalLength = 0;
      for (let i = Math.min(this.WORDS_PER_PAGE, words.length); i < words.length; i++) {
        const wordLength = words[i].length + 1;

        if (lastGoodSplit + additionalLength + wordLength > this.CHARS_PER_PAGE) {
          break;
        }

        additionalLength += wordLength;
      }
      lastGoodSplit += additionalLength;
    }

    // Second pass: find the best paragraph boundary near the split point
    const searchStart = Math.max(0, lastGoodSplit - 500); // Look back up to 500 chars
    const searchEnd = Math.min(content.length, lastGoodSplit + 200); // Look forward up to 200 chars
    const searchText = content.substring(searchStart, searchEnd);

    // Look for paragraph breaks (double newlines)
    const paragraphBreaks = this.findParagraphBreaks(searchText);
    if (paragraphBreaks.length > 0) {
      // Find the paragraph break closest to our target split point
      const targetRelative = lastGoodSplit - searchStart;
      const bestBreak = paragraphBreaks.reduce((best, current) => {
        return Math.abs(current - targetRelative) < Math.abs(best - targetRelative) ? current : best;
      });

      return searchStart + bestBreak;
    }

    // Third pass: find sentence boundaries
    const sentenceBreaks = this.findSentenceBreaks(searchText);
    if (sentenceBreaks.length > 0) {
      const targetRelative = lastGoodSplit - searchStart;
      const bestBreak = sentenceBreaks.reduce((best, current) => {
        return Math.abs(current - targetRelative) < Math.abs(best - targetRelative) ? current : best;
      });

      return searchStart + bestBreak;
    }

    // Fallback: use word boundary
    return this.findWordBoundary(content, lastGoodSplit);
  }

  /**
   * Find paragraph breaks (double newlines or similar patterns)
   */
  private findParagraphBreaks(text: string): number[] {
    const breaks: number[] = [];
    const patterns = [
      /\n\s*\n/g,           // Double newlines with possible whitespace
      /\.\s*\n\s*[A-Z]/g,   // Period followed by newline and capital letter
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        breaks.push(match.index + match[0].length);
      }
    });

    return breaks.sort((a, b) => a - b);
  }

  /**
   * Find sentence breaks (periods, exclamation marks, question marks)
   */
  private findSentenceBreaks(text: string): number[] {
    const breaks: number[] = [];
    const pattern = /[.!?]\s+[A-Z]/g;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Position after the punctuation and space, before the capital letter
      breaks.push(match.index + match[0].length - 1);
    }

    return breaks;
  }

  /**
   * Find the nearest word boundary to the given position
   */
  private findWordBoundary(text: string, position: number): number {
    // Look backwards for a word boundary
    for (let i = position; i >= 0; i--) {
      if (/\s/.test(text[i])) {
        return i + 1;
      }
    }

    // If no word boundary found backwards, look forwards
    for (let i = position; i < text.length; i++) {
      if (/\s/.test(text[i])) {
        return i;
      }
    }

    return position;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }

  /**
   * Get a subset of pages for memory efficiency (keep only 3 pages in memory)
   */
  public getPageWindow(pages: DocumentPage[], currentPage: number): DocumentPage[] {
    const totalPages = pages.length;
    const maxPages = this.MAX_PAGES_IN_MEMORY;

    if (totalPages <= maxPages) {
      return pages;
    }

    // Calculate the window range
    const startPage = Math.max(0, currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(totalPages, startPage + maxPages);

    // Adjust start if we're near the end
    const adjustedStart = Math.max(0, endPage - maxPages);

    return pages.slice(adjustedStart, endPage);
  }

  /**
   * Get total statistics for the document
   */
  public getDocumentStats(pages: DocumentPage[]): {
    totalPages: number;
    totalWords: number;
    totalCharacters: number;
  } {
    return {
      totalPages: pages.length,
      totalWords: pages.reduce((sum, page) => sum + page.wordCount, 0),
      totalCharacters: pages.reduce((sum, page) => sum + page.characterCount, 0)
    };
  }

  /**
   * Reconstruct the full document from pages
   */
  public reconstructDocument(pages: DocumentPage[]): string {
    return pages
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map(page => page.content)
      .join('');
  }

  /**
   * Update a specific page and recalculate statistics
   */
  public updatePage(pages: DocumentPage[], pageNumber: number, newContent: string): DocumentPage[] {
    const pageIndex = pages.findIndex(page => page.pageNumber === pageNumber);
    if (pageIndex === -1) return pages;

    const updatedPages = [...pages];
    const page = updatedPages[pageIndex];

    updatedPages[pageIndex] = {
      ...page,
      content: newContent,
      wordCount: this.countWords(newContent),
      characterCount: newContent.length
    };

    return updatedPages;
  }

  /**
   * Check if document needs repagination based on page size
   */
  public needsRepagination(page: DocumentPage): boolean {
    return page.wordCount > this.WORDS_PER_PAGE * 1.2 || // 20% over word limit
           page.characterCount > this.CHARS_PER_PAGE * 1.2; // 20% over character limit
  }

  /**
   * Smart repagination - only repaginate from the changed page onwards
   */
  public smartRepaginate(pages: DocumentPage[], fromPage: number, fullContent: string): DocumentPage[] {
    // Keep pages before the change point
    const unchangedPages = pages.slice(0, fromPage - 1);

    // Get the starting index for repagination
    const startIndex = unchangedPages.length > 0
      ? unchangedPages[unchangedPages.length - 1].endIndex
      : 0;

    // Repaginate from the change point
    const remainingContent = fullContent.substring(startIndex);
    const newPages = this.paginateDocument(remainingContent);

    // Update page numbers and indices
    const adjustedNewPages = newPages.map((page, index) => ({
      ...page,
      id: `page-${unchangedPages.length + index + 1}`,
      pageNumber: unchangedPages.length + index + 1,
      startIndex: startIndex + page.startIndex,
      endIndex: startIndex + page.endIndex
    }));

    return [...unchangedPages, ...adjustedNewPages];
  }
}

export const paginationService = new PaginationService();
/**
 * Utility functions for chapter pagination
 */

export interface PageInfo {
  pageNumber: number;
  content: string;
  wordCount: number;
}

export interface PaginationState {
  pages: PageInfo[];
  currentPage: number;
  totalPages: number;
  loadedPages: Set<number>;
}

export const WORDS_PER_PAGE = 2000;

/**
 * Split chapter content into pages based on word count and paragraph boundaries
 */
export const splitContentIntoPages = (content: string, wordsPerPage: number = WORDS_PER_PAGE): PageInfo[] => {
  if (!content || content.trim().length === 0) {
    return [{ pageNumber: 1, content: '', wordCount: 0 }];
  }

  const paragraphs = content.split(/\n\s*\n/);
  const pages: PageInfo[] = [];
  let currentPageContent = '';
  let currentWordCount = 0;
  let pageNumber = 1;

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  for (const paragraph of paragraphs) {
    const paragraphWordCount = countWords(paragraph);

    // Check if adding this paragraph would exceed the word limit
    if (currentWordCount + paragraphWordCount > wordsPerPage && currentPageContent) {
      // Save current page and start new one
      pages.push({
        pageNumber,
        content: currentPageContent.trim(),
        wordCount: currentWordCount
      });

      pageNumber++;
      currentPageContent = paragraph;
      currentWordCount = paragraphWordCount;
    } else {
      // Add paragraph to current page
      if (currentPageContent) {
        currentPageContent += '\n\n' + paragraph;
      } else {
        currentPageContent = paragraph;
      }
      currentWordCount += paragraphWordCount;
    }
  }

  // Add the last page if it has content
  if (currentPageContent.trim()) {
    pages.push({
      pageNumber,
      content: currentPageContent.trim(),
      wordCount: currentWordCount
    });
  }

  return pages.length > 0 ? pages : [{ pageNumber: 1, content: '', wordCount: 0 }];
};

/**
 * Get the pages that should be loaded in memory (current + adjacent)
 */
export const getPagesToLoad = (currentPage: number, totalPages: number): number[] => {
  const pagesToLoad: number[] = [];

  // Always load the current page
  pagesToLoad.push(currentPage);

  // Load previous page if it exists
  if (currentPage > 1) {
    pagesToLoad.push(currentPage - 1);
  }

  // Load next page if it exists
  if (currentPage < totalPages) {
    pagesToLoad.push(currentPage + 1);
  }

  return pagesToLoad.sort((a, b) => a - b);
};

/**
 * Create a pagination state from chapter content
 */
export const createPaginationState = (content: string, initialPage: number = 1): PaginationState => {
  const pages = splitContentIntoPages(content);
  const currentPage = Math.max(1, Math.min(initialPage, pages.length));
  const pagesToLoad = getPagesToLoad(currentPage, pages.length);

  return {
    pages,
    currentPage,
    totalPages: pages.length,
    loadedPages: new Set(pagesToLoad)
  };
};

/**
 * Update pagination state when navigating to a new page
 */
export const updatePaginationForPage = (
  state: PaginationState,
  newPage: number
): PaginationState => {
  const currentPage = Math.max(1, Math.min(newPage, state.totalPages));
  const pagesToLoad = getPagesToLoad(currentPage, state.totalPages);

  // Keep existing loaded pages plus new adjacent pages
  const newLoadedPages = new Set([...state.loadedPages]);
  pagesToLoad.forEach(page => newLoadedPages.add(page));

  // Remove pages that are more than 2 steps away from current page to save memory
  const pagesToRemove: number[] = [];
  newLoadedPages.forEach(page => {
    if (Math.abs(page - currentPage) > 1) {
      pagesToRemove.push(page);
    }
  });
  pagesToRemove.forEach(page => newLoadedPages.delete(page));

  return {
    ...state,
    currentPage,
    loadedPages: newLoadedPages
  };
};

/**
 * Get the content for a specific page, handling lazy loading
 */
export const getPageContent = (state: PaginationState, pageNumber: number): string => {
  if (!state.loadedPages.has(pageNumber)) {
    return ''; // Page not loaded yet
  }

  const page = state.pages.find(p => p.pageNumber === pageNumber);
  return page?.content || '';
};

/**
 * Reconstruct full content from all pages (for saving)
 */
export const reconstructFullContent = (pages: PageInfo[]): string => {
  return pages
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map(page => page.content)
    .join('\n\n');
};
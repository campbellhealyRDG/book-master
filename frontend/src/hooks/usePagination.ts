import { useState, useCallback, useEffect } from 'react';
import {
  PaginationState,
  createPaginationState,
  updatePaginationForPage,
  getPageContent,
  reconstructFullContent,
  PageInfo
} from '../utils/pagination';

export interface UsePaginationOptions {
  content: string;
  initialPage?: number;
  onContentChange?: (content: string) => void;
  autoSave?: boolean;
}

export interface UsePaginationReturn {
  // Pagination state
  currentPage: number;
  totalPages: number;
  loadedPages: Set<number>;

  // Current page content
  currentContent: string;

  // Navigation
  goToPage: (page: number) => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;

  // Content management
  updateCurrentPageContent: (content: string) => void;
  getFullContent: () => string;
  isPageLoaded: (page: number) => boolean;

  // Page info
  getCurrentPageInfo: () => PageInfo | null;
  getAllPages: () => PageInfo[];
}

export const usePagination = ({
  content,
  initialPage = 1,
  onContentChange,
  autoSave = false
}: UsePaginationOptions): UsePaginationReturn => {
  const [paginationState, setPaginationState] = useState<PaginationState>(() =>
    createPaginationState(content, initialPage)
  );

  // Update pagination when content changes from external source
  useEffect(() => {
    const newState = createPaginationState(content, paginationState.currentPage);
    setPaginationState(newState);
  }, [content]);

  const goToPage = useCallback((page: number) => {
    setPaginationState(prevState => {
      const newState = updatePaginationForPage(prevState, page);
      return newState;
    });
  }, []);

  const goToPreviousPage = useCallback(() => {
    goToPage(paginationState.currentPage - 1);
  }, [paginationState.currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    goToPage(paginationState.currentPage + 1);
  }, [paginationState.currentPage, goToPage]);

  const updateCurrentPageContent = useCallback((newContent: string) => {
    setPaginationState(prevState => {
      const updatedPages = prevState.pages.map(page => {
        if (page.pageNumber === prevState.currentPage) {
          // Count words for the updated content
          const wordCount = newContent.trim().split(/\s+/).filter(word => word.length > 0).length;
          return {
            ...page,
            content: newContent,
            wordCount
          };
        }
        return page;
      });

      const newState = {
        ...prevState,
        pages: updatedPages
      };

      // Trigger content change callback if provided
      if (onContentChange) {
        const fullContent = reconstructFullContent(updatedPages);
        onContentChange(fullContent);
      }

      return newState;
    });
  }, [onContentChange]);

  const getFullContent = useCallback(() => {
    return reconstructFullContent(paginationState.pages);
  }, [paginationState.pages]);

  const isPageLoaded = useCallback((page: number) => {
    return paginationState.loadedPages.has(page);
  }, [paginationState.loadedPages]);

  const getCurrentPageInfo = useCallback(() => {
    return paginationState.pages.find(page => page.pageNumber === paginationState.currentPage) || null;
  }, [paginationState.pages, paginationState.currentPage]);

  const getAllPages = useCallback(() => {
    return paginationState.pages;
  }, [paginationState.pages]);

  // Get current page content
  const currentContent = getPageContent(paginationState, paginationState.currentPage);

  return {
    // Pagination state
    currentPage: paginationState.currentPage,
    totalPages: paginationState.totalPages,
    loadedPages: paginationState.loadedPages,

    // Current page content
    currentContent,

    // Navigation
    goToPage,
    goToPreviousPage,
    goToNextPage,
    canGoNext: paginationState.currentPage < paginationState.totalPages,
    canGoPrevious: paginationState.currentPage > 1,

    // Content management
    updateCurrentPageContent,
    getFullContent,
    isPageLoaded,

    // Page info
    getCurrentPageInfo,
    getAllPages
  };
};
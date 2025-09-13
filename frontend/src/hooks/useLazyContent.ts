import { useState, useEffect, useCallback, useMemo } from 'react';
import { Chapter } from '../types';

interface LazyContentConfig {
  previewLength?: number;
  loadDelay?: number;
  cacheSize?: number;
}

interface LazyChapterContent {
  id: number;
  preview: string;
  fullContent: string | null;
  isLoading: boolean;
  isFullyLoaded: boolean;
}

/**
 * Hook for managing lazy loading of chapter content
 * Provides preview content immediately and loads full content on demand
 */
export const useLazyContent = (
  chapters: Chapter[],
  config: LazyContentConfig = {}
) => {
  const {
    previewLength = 150,
    loadDelay = 300,
    cacheSize = 10
  } = config;

  const [contentCache, setContentCache] = useState<Map<number, LazyChapterContent>>(new Map());
  const [loadingTimeouts, setLoadingTimeouts] = useState<Map<number, NodeJS.Timeout>>(new Map());

  // Initialize lazy content from chapters
  const lazyChapters = useMemo(() => {
    return chapters.map(chapter => {
      const cached = contentCache.get(chapter.id);

      if (cached) {
        return {
          ...chapter,
          content: cached.isFullyLoaded ? cached.fullContent : cached.preview,
          isLazyLoading: cached.isLoading,
          hasFullContent: cached.isFullyLoaded
        };
      }

      // Create preview from content
      const preview = chapter.content
        ? chapter.content.length > previewLength
          ? chapter.content.substring(0, previewLength) + '...'
          : chapter.content
        : '';

      return {
        ...chapter,
        content: preview,
        isLazyLoading: false,
        hasFullContent: chapter.content ? chapter.content.length <= previewLength : true
      };
    });
  }, [chapters, contentCache, previewLength]);

  // Load full content for a specific chapter
  const loadFullContent = useCallback(async (chapterId: number) => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    // Check if already cached
    const cached = contentCache.get(chapterId);
    if (cached?.isFullyLoaded) return;

    // Set loading state
    setContentCache(prev => new Map(prev).set(chapterId, {
      id: chapterId,
      preview: chapter.content?.substring(0, previewLength) + '...' || '',
      fullContent: null,
      isLoading: true,
      isFullyLoaded: false
    }));

    // Clear any existing timeout
    const existingTimeout = loadingTimeouts.get(chapterId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Load with delay to prevent excessive requests
    const timeout = setTimeout(async () => {
      try {
        // In a real implementation, this might fetch from API
        // For now, we'll simulate async loading of existing content
        await new Promise(resolve => setTimeout(resolve, 100));

        setContentCache(prev => {
          const newCache = new Map(prev);

          // Implement LRU cache eviction
          if (newCache.size >= cacheSize) {
            const firstKey = newCache.keys().next().value;
            newCache.delete(firstKey);
          }

          newCache.set(chapterId, {
            id: chapterId,
            preview: chapter.content?.substring(0, previewLength) + '...' || '',
            fullContent: chapter.content || '',
            isLoading: false,
            isFullyLoaded: true
          });

          return newCache;
        });

        // Clean up timeout
        setLoadingTimeouts(prev => {
          const newTimeouts = new Map(prev);
          newTimeouts.delete(chapterId);
          return newTimeouts;
        });

      } catch (error) {
        console.error('Failed to load chapter content:', error);

        setContentCache(prev => new Map(prev).set(chapterId, {
          id: chapterId,
          preview: chapter.content?.substring(0, previewLength) + '...' || '',
          fullContent: null,
          isLoading: false,
          isFullyLoaded: false
        }));
      }
    }, loadDelay);

    setLoadingTimeouts(prev => new Map(prev).set(chapterId, timeout));
  }, [chapters, previewLength, loadDelay, cacheSize, contentCache, loadingTimeouts]);

  // Preload content for visible chapters
  const preloadContent = useCallback((chapterIds: number[]) => {
    chapterIds.forEach(id => {
      const cached = contentCache.get(id);
      if (!cached?.isFullyLoaded && !cached?.isLoading) {
        loadFullContent(id);
      }
    });
  }, [loadFullContent, contentCache]);

  // Get content for search (only searches loaded content + previews)
  const getSearchableContent = useCallback((chapterId: number): string => {
    const cached = contentCache.get(chapterId);
    if (cached?.isFullyLoaded && cached.fullContent) {
      return cached.fullContent;
    }

    const chapter = chapters.find(ch => ch.id === chapterId);
    return chapter?.content?.substring(0, previewLength) || '';
  }, [chapters, contentCache, previewLength]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      loadingTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [loadingTimeouts]);

  // Cache management
  const clearCache = useCallback(() => {
    setContentCache(new Map());
    loadingTimeouts.forEach(timeout => clearTimeout(timeout));
    setLoadingTimeouts(new Map());
  }, [loadingTimeouts]);

  const getCacheSize = useCallback(() => {
    return contentCache.size;
  }, [contentCache]);

  const getCachedChapterIds = useCallback(() => {
    return Array.from(contentCache.keys()).filter(id =>
      contentCache.get(id)?.isFullyLoaded
    );
  }, [contentCache]);

  return {
    lazyChapters,
    loadFullContent,
    preloadContent,
    getSearchableContent,
    clearCache,
    getCacheSize,
    getCachedChapterIds,
    isLoading: (chapterId: number) => contentCache.get(chapterId)?.isLoading || false,
    isFullyLoaded: (chapterId: number) => contentCache.get(chapterId)?.isFullyLoaded || false
  };
};

export default useLazyContent;
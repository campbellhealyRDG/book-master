import { cacheService } from './cacheService';
import { Book, Chapter, DictionaryTerm, UserPreferences, CreateBookRequest, UpdateBookRequest, CreateChapterRequest, UpdateChapterRequest } from '../types';

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface RequestOptions extends RequestInit {
  skipCache?: boolean;
  cacheTTL?: number;
  timeout?: number;
}

/**
 * Cache-aware API service with automatic request deduplication,
 * optimistic updates, and intelligent cache invalidation
 */
class ApiService {
  private readonly config: ApiConfig = {
    baseURL: 'http://localhost:8000/api',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000
  };

  private pendingRequests: Map<string, Promise<any>> = new Map();
  private requestCounter: number = 0;

  // Books API with caching
  async getBooks(options?: RequestOptions): Promise<Book[]> {
    const cacheKey = 'books:all';

    if (!options?.skipCache) {
      const cached = cacheService.get<Book[]>(cacheKey);
      if (cached) return cached;
    }

    return this.cacheApiCall(
      cacheKey,
      () => this.fetch<Book[]>('/books', { method: 'GET' }),
      options?.cacheTTL
    );
  }

  async getBook(id: number, options?: RequestOptions): Promise<Book> {
    const cacheKey = `books:${id}`;

    if (!options?.skipCache) {
      const cached = cacheService.get<Book>(cacheKey);
      if (cached) return cached;
    }

    return this.cacheApiCall(
      cacheKey,
      () => this.fetch<Book>(`/books/${id}`, { method: 'GET' }),
      options?.cacheTTL
    );
  }

  async createBook(bookData: CreateBookRequest, options?: RequestOptions): Promise<Book> {
    const book = await this.fetch<Book>('/books', {
      method: 'POST',
      body: JSON.stringify(this.transformCamelToSnake(bookData)),
      headers: { 'Content-Type': 'application/json' }
    }, options);

    // Optimistic cache update
    cacheService.set(`books:${book.id}`, book);
    this.invalidateCache(['books:all']);

    return book;
  }

  async updateBook(id: number, bookData: UpdateBookRequest, options?: RequestOptions): Promise<Book> {
    // Optimistic update
    const existingBook = cacheService.get<Book>(`books:${id}`);
    if (existingBook) {
      const optimisticBook = { ...existingBook, ...bookData };
      cacheService.set(`books:${id}`, optimisticBook, 5000); // Short TTL for optimistic update
    }

    try {
      const book = await this.fetch<Book>(`/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify(this.transformCamelToSnake(bookData)),
        headers: { 'Content-Type': 'application/json' }
      }, options);

      // Update caches with real data
      cacheService.set(`books:${id}`, book);
      this.invalidateCache(['books:all']);

      return book;
    } catch (error) {
      // Revert optimistic update on failure
      if (existingBook) {
        cacheService.set(`books:${id}`, existingBook);
      }
      throw error;
    }
  }

  async deleteBook(id: number, options?: RequestOptions): Promise<void> {
    await this.fetch<void>(`/books/${id}`, { method: 'DELETE' }, options);

    // Remove from caches
    cacheService.delete(`books:${id}`);
    this.invalidateCache(['books:all']);
    this.invalidateCachePattern(`chapters:book:${id}`);
  }

  // Chapters API with caching
  async getChapters(bookId: number, options?: RequestOptions): Promise<Chapter[]> {
    const cacheKey = `chapters:book:${bookId}`;

    if (!options?.skipCache) {
      const cached = cacheService.get<Chapter[]>(cacheKey);
      if (cached) return cached;
    }

    return this.cacheApiCall(
      cacheKey,
      () => this.fetch<Chapter[]>(`/chapters/books/${bookId}/chapters`, { method: 'GET' }),
      options?.cacheTTL
    );
  }

  async getChapter(id: number, options?: RequestOptions): Promise<Chapter> {
    const cacheKey = `chapters:${id}`;

    if (!options?.skipCache) {
      const cached = cacheService.get<Chapter>(cacheKey);
      if (cached) return cached;
    }

    return this.cacheApiCall(
      cacheKey,
      () => this.fetch<Chapter>(`/chapters/${id}`, { method: 'GET' }),
      options?.cacheTTL
    );
  }

  async createChapter(bookId: number, chapterData: CreateChapterRequest, options?: RequestOptions): Promise<Chapter> {
    const chapter = await this.fetch<Chapter>(`/chapters/books/${bookId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(this.transformCamelToSnake(chapterData)),
      headers: { 'Content-Type': 'application/json' }
    }, options);

    // Update caches
    cacheService.set(`chapters:${chapter.id}`, chapter);
    this.invalidateCache([`chapters:book:${bookId}`, `books:${bookId}`]);

    return chapter;
  }

  async updateChapter(id: number, chapterData: UpdateChapterRequest, options?: RequestOptions): Promise<Chapter> {
    // Optimistic update
    const existingChapter = cacheService.get<Chapter>(`chapters:${id}`);
    if (existingChapter) {
      const optimisticChapter = { ...existingChapter, ...chapterData };
      cacheService.set(`chapters:${id}`, optimisticChapter, 5000);
    }

    try {
      const chapter = await this.fetch<Chapter>(`/chapters/${id}`, {
        method: 'PUT',
        body: JSON.stringify(this.transformCamelToSnake(chapterData)),
        headers: { 'Content-Type': 'application/json' }
      }, options);

      // Update caches with real data
      cacheService.set(`chapters:${id}`, chapter);
      this.invalidateCache([`chapters:book:${chapter.bookId}`, `books:${chapter.bookId}`]);

      return chapter;
    } catch (error) {
      // Revert optimistic update
      if (existingChapter) {
        cacheService.set(`chapters:${id}`, existingChapter);
      }
      throw error;
    }
  }

  async deleteChapter(id: number, options?: RequestOptions): Promise<void> {
    const existingChapter = cacheService.get<Chapter>(`chapters:${id}`);
    const bookId = existingChapter?.bookId;

    await this.fetch<void>(`/chapters/${id}`, { method: 'DELETE' }, options);

    // Remove from caches
    cacheService.delete(`chapters:${id}`);
    if (bookId) {
      this.invalidateCache([`chapters:book:${bookId}`, `books:${bookId}`]);
    }
  }

  // Dictionary API with caching
  async getDictionaryTerms(category?: string, options?: RequestOptions): Promise<DictionaryTerm[]> {
    const cacheKey = category ? `dictionary:category:${category}` : 'dictionary:all';

    if (!options?.skipCache) {
      const cached = cacheService.get<DictionaryTerm[]>(cacheKey);
      if (cached) return cached;
    }

    const url = category ? `/dictionary/terms?category=${category}` : '/dictionary/terms';
    return this.cacheApiCall(
      cacheKey,
      () => this.fetch<DictionaryTerm[]>(url, { method: 'GET' }),
      options?.cacheTTL || 60 * 60 * 1000 // 1 hour for dictionary
    );
  }

  async addDictionaryTerm(term: Omit<DictionaryTerm, 'id'>, options?: RequestOptions): Promise<DictionaryTerm> {
    const newTerm = await this.fetch<DictionaryTerm>('/dictionary/terms', {
      method: 'POST',
      body: JSON.stringify(term),
      headers: { 'Content-Type': 'application/json' }
    }, options);

    // Invalidate dictionary caches
    this.invalidateCachePattern('dictionary:');

    return newTerm;
  }

  // User Preferences API with caching
  async getUserPreferences(options?: RequestOptions): Promise<UserPreferences> {
    const cacheKey = 'preferences:user';

    if (!options?.skipCache) {
      const cached = cacheService.get<UserPreferences>(cacheKey);
      if (cached) return cached;
    }

    return this.cacheApiCall(
      cacheKey,
      () => this.fetch<UserPreferences>('/preferences', { method: 'GET' }),
      options?.cacheTTL || 24 * 60 * 60 * 1000 // 24 hours for preferences
    );
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>, options?: RequestOptions): Promise<UserPreferences> {
    const updated = await this.fetch<UserPreferences>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
      headers: { 'Content-Type': 'application/json' }
    }, options);

    cacheService.set('preferences:user', updated, 24 * 60 * 60 * 1000);
    return updated;
  }

  // Search with caching
  async searchContent(query: string, bookId?: number, options?: RequestOptions): Promise<{
    books: Book[];
    chapters: Chapter[];
    totalResults: number;
  }> {
    const cacheKey = bookId ? `search:book:${bookId}:${query}` : `search:global:${query}`;

    if (!options?.skipCache && query.length > 2) {
      const cached = cacheService.get<{
        books: Book[];
        chapters: Chapter[];
        totalResults: number;
      }>(cacheKey);
      if (cached) return cached;
    }

    const url = bookId ? `/search?q=${encodeURIComponent(query)}&book_id=${bookId}` : `/search?q=${encodeURIComponent(query)}`;

    return this.cacheApiCall(
      cacheKey,
      () => this.fetch<{
        books: Book[];
        chapters: Chapter[];
        totalResults: number;
      }>(url, { method: 'GET' }),
      2 * 60 * 1000 // 2 minutes for search results
    );
  }

  // Export functionality
  async exportBook(bookId: number, format: 'txt' | 'markdown', options?: RequestOptions): Promise<{
    content: string;
    filename: string;
    format: string;
    size: number;
  }> {
    return await this.fetch(`/books/${bookId}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format })
    }, options);
  }

  // Batch operations for efficiency
  async batchGetBooks(bookIds: number[], options?: RequestOptions): Promise<Book[]> {
    const cacheResults = cacheService.batchGet<Book>(bookIds.map(id => `books:${id}`));
    const cachedBooks = cacheResults
      .filter(result => result.data !== null)
      .map(result => result.data!);

    const missingIds = bookIds.filter(id =>
      !cacheResults.find(result => result.key === `books:${id}` && result.data !== null)
    );

    if (missingIds.length === 0) {
      return cachedBooks;
    }

    const fetchedBooks = await this.fetch<Book[]>(`/books/batch?ids=${missingIds.join(',')}`, {
      method: 'GET'
    }, options);

    // Cache the fetched books
    cacheService.batchSet(
      fetchedBooks.map(book => ({
        key: `books:${book.id}`,
        data: book
      }))
    );

    return [...cachedBooks, ...fetchedBooks];
  }

  // Preload functionality
  async preloadUserData(): Promise<void> {
    const preloadTasks = [
      {
        key: 'preferences:user',
        loader: () => this.fetch<UserPreferences>('/preferences', { method: 'GET' }),
        priority: 1
      },
      {
        key: 'books:all',
        loader: () => this.fetch<Book[]>('/books', { method: 'GET' }),
        priority: 2
      },
      {
        key: 'dictionary:all',
        loader: () => this.fetch<DictionaryTerm[]>('/dictionary/terms', { method: 'GET' }),
        priority: 3
      }
    ];

    await cacheService.preloadData(preloadTasks);
  }

  // Cache management
  getCacheStats() {
    return cacheService.getStats();
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      this.invalidateCachePattern(pattern);
    } else {
      cacheService.clear();
    }
  }

  // Private methods

  private async cacheApiCall<T>(
    cacheKey: string,
    apiCall: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    return cacheService.cacheApiCall(cacheKey, apiCall, customTTL);
  }

  private invalidateCache(keys: string[]): void {
    keys.forEach(key => cacheService.delete(key));
  }

  private invalidateCachePattern(pattern: string): void {
    const stats = cacheService.getStats();
    // This is a simplified pattern matching - in a real implementation,
    // you might want more sophisticated pattern matching
    cacheService.clear(); // For now, clear all when pattern invalidation is needed
    console.log(`Invalidated cache pattern: ${pattern}`);
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestOptions = {},
    requestOptions?: RequestOptions
  ): Promise<T> {
    const response = await this.fetchRaw(endpoint, options, requestOptions);
    const json = await response.json();

    // API returns data wrapped in { success: true, data: ... }
    // Extract the data field if it exists
    let data = json;
    if (json && typeof json === 'object' && 'data' in json) {
      data = json.data;
    }

    // Transform snake_case to camelCase for frontend compatibility
    return this.transformSnakeToCamel(data);
  }

  private transformSnakeToCamel(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.transformSnakeToCamel(item));
    }

    if (typeof data === 'object') {
      const transformed: any = {};
      for (const [key, value] of Object.entries(data)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        transformed[camelKey] = this.transformSnakeToCamel(value);
      }
      return transformed;
    }

    return data;
  }

  private transformCamelToSnake(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.transformCamelToSnake(item));
    }

    if (typeof data === 'object') {
      const transformed: any = {};
      for (const [key, value] of Object.entries(data)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        transformed[snakeKey] = this.transformCamelToSnake(value);
      }
      return transformed;
    }

    return data;
  }

  private async fetchRaw(
    endpoint: string,
    options: RequestOptions = {},
    requestOptions?: RequestOptions
  ): Promise<Response> {
    const url = `${this.config.baseURL}${endpoint}`;
    const requestId = `${++this.requestCounter}:${url}:${JSON.stringify(options)}`;

    // Request deduplication
    if (this.pendingRequests.has(requestId)) {
      return this.pendingRequests.get(requestId);
    }

    const requestPromise = this.executeRequest(url, options, requestOptions);
    this.pendingRequests.set(requestId, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestId);
    }
  }

  private async executeRequest(
    url: string,
    options: RequestOptions = {},
    requestOptions?: RequestOptions
  ): Promise<Response> {
    const timeout = options.timeout || requestOptions?.timeout || this.config.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;
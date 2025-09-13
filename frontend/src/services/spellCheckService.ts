import { cacheService } from './cacheService';

interface SpellCheckResult {
  errors: SpellCheckError[];
  suggestions: Map<string, string[]>;
  processingTime: number;
  wordCount: number;
}

interface SpellCheckError {
  word: string;
  position: number;
  length: number;
  suggestions: string[];
  type: 'spelling' | 'grammar' | 'style';
  severity: 'low' | 'medium' | 'high';
}

interface SpellCheckConfig {
  debounceDelay: number;
  chunkSize: number;
  maxCachedResults: number;
  enableWorkerThreads: boolean;
  britishEnglishOnly: boolean;
  customDictionary: Set<string>;
}

interface ProcessingStats {
  totalWords: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  workerUtilization: number;
}

/**
 * High-performance spell checking service optimised for British English
 * Features debounced checking, worker threads, intelligent caching, and batch processing
 */
class SpellCheckService {
  private config: SpellCheckConfig = {
    debounceDelay: 300,
    chunkSize: 1000,
    maxCachedResults: 500,
    enableWorkerThreads: true,
    britishEnglishOnly: true,
    customDictionary: new Set()
  };

  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private processingQueue: Map<string, Promise<SpellCheckResult>> = new Map();
  private workers: Worker[] = [];
  private workerPool: Worker[] = [];
  private isInitialized = false;
  private stats: ProcessingStats = {
    totalWords: 0,
    averageProcessingTime: 0,
    cacheHitRate: 0,
    workerUtilization: 0
  };

  // British English word patterns and common corrections
  private readonly britishPatterns = new Map([
    ['color', 'colour'],
    ['flavor', 'flavour'],
    ['honor', 'honour'],
    ['labor', 'labour'],
    ['neighbor', 'neighbour'],
    ['rumor', 'rumour'],
    ['vapor', 'vapour'],
    ['organize', 'organise'],
    ['realize', 'realise'],
    ['analyze', 'analyse'],
    ['recognize', 'recognise'],
    ['criticize', 'criticise'],
    ['center', 'centre'],
    ['theater', 'theatre'],
    ['meter', 'metre'],
    ['liter', 'litre'],
    ['defense', 'defence'],
    ['offense', 'offence'],
    ['license', 'licence'], // as noun
    ['practice', 'practise'], // as verb
    ['traveled', 'travelled'],
    ['canceled', 'cancelled'],
    ['modeling', 'modelling'],
    ['leveling', 'levelling']
  ]);

  private readonly commonMisspellings = new Map([
    ['recieve', 'receive'],
    ['seperate', 'separate'],
    ['occured', 'occurred'],
    ['occurence', 'occurrence'],
    ['existance', 'existence'],
    ['definately', 'definitely'],
    ['begining', 'beginning'],
    ['untill', 'until'],
    ['sucessful', 'successful'],
    ['necesary', 'necessary'],
    ['tommorrow', 'tomorrow'],
    ['accomodate', 'accommodate'],
    ['embarass', 'embarrass'],
    ['independant', 'independent'],
    ['maintainance', 'maintenance'],
    ['achievment', 'achievement']
  ]);

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load custom dictionary from API
      await this.loadCustomDictionary();

      // Initialize worker pool if enabled
      if (this.config.enableWorkerThreads && typeof Worker !== 'undefined') {
        await this.initializeWorkers();
      }

      // Preload common word cache
      await this.preloadCommonWords();

      this.isInitialized = true;
      console.log('Spell checking service initialized');
    } catch (error) {
      console.warn('Failed to initialize spell checking service:', error);
      // Continue with basic functionality
      this.isInitialized = true;
    }
  }

  /**
   * Main spell checking function with debouncing and caching
   */
  async checkSpelling(
    text: string,
    contextId: string = 'default',
    options?: Partial<SpellCheckConfig>
  ): Promise<SpellCheckResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const effectiveConfig = { ...this.config, ...options };

    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(contextId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        try {
          const result = await this.performSpellCheck(text, effectiveConfig);
          this.debounceTimers.delete(contextId);
          resolve(result);
        } catch (error) {
          console.error('Spell check failed:', error);
          resolve({
            errors: [],
            suggestions: new Map(),
            processingTime: 0,
            wordCount: 0
          });
        }
      }, effectiveConfig.debounceDelay);

      this.debounceTimers.set(contextId, timer);
    });
  }

  /**
   * Immediate spell checking without debouncing (for final checks)
   */
  async checkSpellingImmediate(text: string): Promise<SpellCheckResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.performSpellCheck(text, this.config);
  }

  /**
   * Check specific word with caching
   */
  async checkWord(word: string): Promise<{
    isCorrect: boolean;
    suggestions: string[];
    correction?: string;
  }> {
    const cacheKey = `spell-check:word:${word.toLowerCase()}`;
    const cached = cacheService.get<{
      isCorrect: boolean;
      suggestions: string[];
      correction?: string;
    }>(cacheKey);

    if (cached) return cached;

    const result = await this.performWordCheck(word);
    cacheService.set(cacheKey, result, 30 * 60 * 1000); // 30 minutes cache

    return result;
  }

  /**
   * Add word to custom dictionary
   */
  async addToCustomDictionary(word: string, category: string = 'user'): Promise<void> {
    this.config.customDictionary.add(word.toLowerCase());

    // Cache as correct word
    const cacheKey = `spell-check:word:${word.toLowerCase()}`;
    cacheService.set(cacheKey, {
      isCorrect: true,
      suggestions: [],
      correction: undefined
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Persist to backend
    try {
      const response = await fetch('/api/dictionary/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: word,
          category,
          is_user_added: true,
          is_active: true
        })
      });

      if (!response.ok) {
        console.warn('Failed to persist custom dictionary word');
      }
    } catch (error) {
      console.warn('Failed to save custom dictionary word:', error);
    }
  }

  /**
   * Get spelling suggestions for a word
   */
  async getSuggestions(word: string, limit: number = 5): Promise<string[]> {
    const cacheKey = `spell-check:suggestions:${word.toLowerCase()}`;
    const cached = cacheService.get<string[]>(cacheKey);

    if (cached) return cached.slice(0, limit);

    const suggestions = await this.generateSuggestions(word, limit);
    cacheService.set(cacheKey, suggestions, 15 * 60 * 1000); // 15 minutes cache

    return suggestions;
  }

  /**
   * Batch spell checking for multiple texts
   */
  async batchCheckSpelling(
    texts: Array<{ id: string; text: string }>,
    options?: Partial<SpellCheckConfig>
  ): Promise<Map<string, SpellCheckResult>> {
    const results = new Map<string, SpellCheckResult>();
    const effectiveConfig = { ...this.config, ...options };

    // Process in parallel chunks
    const chunkSize = 5;
    const chunks = [];

    for (let i = 0; i < texts.length; i += chunkSize) {
      chunks.push(texts.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async ({ id, text }) => {
        const result = await this.performSpellCheck(text, effectiveConfig);
        results.set(id, result);
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Get performance statistics
   */
  getStats(): ProcessingStats & {
    queueLength: number;
    cacheSize: number;
    workerCount: number;
  } {
    return {
      ...this.stats,
      queueLength: this.processingQueue.size,
      cacheSize: cacheService.getCacheSize(),
      workerCount: this.workers.length
    };
  }

  /**
   * Clear spell check cache
   */
  clearCache(): void {
    cacheService.clear('spell-check');
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Terminate workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.workerPool = [];

    // Clear processing queue
    this.processingQueue.clear();

    this.isInitialized = false;
  }

  // Private methods

  private async performSpellCheck(
    text: string,
    config: SpellCheckConfig
  ): Promise<SpellCheckResult> {
    const startTime = performance.now();
    const cacheKey = `spell-check:text:${this.hashText(text)}`;

    // Check cache first
    const cached = cacheService.get<SpellCheckResult>(cacheKey);
    if (cached) {
      this.updateStats(cached.wordCount, cached.processingTime, true);
      return cached;
    }

    // Check if already processing
    const existingProcess = this.processingQueue.get(cacheKey);
    if (existingProcess) {
      return existingProcess;
    }

    // Start processing
    const processPromise = this.processText(text, config);
    this.processingQueue.set(cacheKey, processPromise);

    try {
      const result = await processPromise;
      const processingTime = performance.now() - startTime;

      const finalResult: SpellCheckResult = {
        ...result,
        processingTime
      };

      // Cache result
      cacheService.set(cacheKey, finalResult, 10 * 60 * 1000); // 10 minutes
      this.updateStats(result.wordCount, processingTime, false);

      return finalResult;
    } finally {
      this.processingQueue.delete(cacheKey);
    }
  }

  private async processText(
    text: string,
    config: SpellCheckConfig
  ): Promise<Omit<SpellCheckResult, 'processingTime'>> {
    const words = this.tokenizeText(text);
    const errors: SpellCheckError[] = [];
    const suggestions = new Map<string, string[]>();

    // Use worker threads for large texts
    if (config.enableWorkerThreads && words.length > config.chunkSize && this.workers.length > 0) {
      return this.processWithWorkers(text, words, config);
    }

    // Process synchronously for smaller texts
    let position = 0;
    for (const word of words) {
      const wordIndex = text.indexOf(word, position);
      if (wordIndex === -1) continue;

      const checkResult = await this.performWordCheck(word);

      if (!checkResult.isCorrect) {
        errors.push({
          word,
          position: wordIndex,
          length: word.length,
          suggestions: checkResult.suggestions,
          type: 'spelling',
          severity: this.getSeverity(word, checkResult.suggestions)
        });

        if (checkResult.suggestions.length > 0) {
          suggestions.set(word, checkResult.suggestions);
        }
      }

      position = wordIndex + word.length;
    }

    return {
      errors,
      suggestions,
      wordCount: words.length
    };
  }

  private async processWithWorkers(
    text: string,
    words: string[],
    config: SpellCheckConfig
  ): Promise<Omit<SpellCheckResult, 'processingTime'>> {
    // Split work among available workers
    const chunkSize = Math.ceil(words.length / this.workers.length);
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push({
        words: words.slice(i, i + chunkSize),
        startIndex: i
      });
    }

    const workerPromises = chunks.map((chunk, index) => {
      const worker = this.workers[index % this.workers.length];
      return this.processChunkWithWorker(worker, chunk.words, text, chunk.startIndex);
    });

    const results = await Promise.all(workerPromises);

    // Combine results
    const errors: SpellCheckError[] = [];
    const suggestions = new Map<string, string[]>();

    results.forEach(result => {
      errors.push(...result.errors);
      result.suggestions.forEach((suggs, word) => {
        suggestions.set(word, suggs);
      });
    });

    return {
      errors,
      suggestions,
      wordCount: words.length
    };
  }

  private async processChunkWithWorker(
    worker: Worker,
    words: string[],
    fullText: string,
    startIndex: number
  ): Promise<{
    errors: SpellCheckError[];
    suggestions: Map<string, string[]>;
  }> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout'));
      }, 10000);

      worker.onmessage = (event) => {
        clearTimeout(timeout);
        resolve(event.data);
      };

      worker.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      worker.postMessage({
        words,
        fullText,
        startIndex,
        britishPatterns: Array.from(this.britishPatterns.entries()),
        commonMisspellings: Array.from(this.commonMisspellings.entries()),
        customDictionary: Array.from(this.config.customDictionary)
      });
    });
  }

  private async performWordCheck(word: string): Promise<{
    isCorrect: boolean;
    suggestions: string[];
    correction?: string;
  }> {
    const cleanWord = word.toLowerCase().replace(/[^\w']/g, '');

    // Skip empty words, numbers, and very short words
    if (!cleanWord || /^\d+$/.test(cleanWord) || cleanWord.length < 2) {
      return { isCorrect: true, suggestions: [] };
    }

    // Check custom dictionary first
    if (this.config.customDictionary.has(cleanWord)) {
      return { isCorrect: true, suggestions: [] };
    }

    // Check for common misspellings
    if (this.commonMisspellings.has(cleanWord)) {
      const correction = this.commonMisspellings.get(cleanWord)!;
      return {
        isCorrect: false,
        suggestions: [correction],
        correction
      };
    }

    // Check for American to British conversions
    if (this.britishPatterns.has(cleanWord)) {
      const correction = this.britishPatterns.get(cleanWord)!;
      return {
        isCorrect: this.config.britishEnglishOnly ? false : true,
        suggestions: [correction],
        correction: this.config.britishEnglishOnly ? correction : undefined
      };
    }

    // Use basic dictionary check (in real implementation, use typo.js or similar)
    const isCorrect = await this.checkAgainstDictionary(cleanWord);

    if (!isCorrect) {
      const suggestions = await this.generateSuggestions(cleanWord, 3);
      return { isCorrect: false, suggestions };
    }

    return { isCorrect: true, suggestions: [] };
  }

  private async checkAgainstDictionary(word: string): Promise<boolean> {
    // Mock implementation - in real app, integrate with typo.js or API
    // For now, check against common English words
    const commonWords = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
      'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
      'but', 'his', 'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my',
      'one', 'all', 'would', 'there', 'their', 'we', 'him', 'been', 'has',
      'when', 'who', 'oil', 'use', 'her', 'than', 'now', 'find', 'head',
      'up', 'day', 'get', 'own', 'say', 'she', 'may', 'its', 'our', 'out',
      'two', 'way', 'look', 'how', 'long', 'little', 'very', 'after', 'words',
      'called', 'just', 'where', 'most', 'know', 'take', 'water', 'good'
    ];

    return commonWords.includes(word) || word.length > 15; // Assume very long words are correct
  }

  private async generateSuggestions(word: string, limit: number): Promise<string[]> {
    const suggestions: string[] = [];

    // Check common misspellings first
    if (this.commonMisspellings.has(word)) {
      suggestions.push(this.commonMisspellings.get(word)!);
    }

    // Check American to British conversions
    if (this.britishPatterns.has(word)) {
      suggestions.push(this.britishPatterns.get(word)!);
    }

    // Generate edit distance suggestions (simplified)
    const candidates = this.generateEditDistanceCandidates(word);
    for (const candidate of candidates) {
      if (suggestions.length >= limit) break;

      if (await this.checkAgainstDictionary(candidate) && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
      }
    }

    return suggestions.slice(0, limit);
  }

  private generateEditDistanceCandidates(word: string): string[] {
    const candidates: string[] = [];
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';

    // Deletions
    for (let i = 0; i < word.length; i++) {
      candidates.push(word.slice(0, i) + word.slice(i + 1));
    }

    // Transpositions
    for (let i = 0; i < word.length - 1; i++) {
      candidates.push(
        word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2)
      );
    }

    // Replacements
    for (let i = 0; i < word.length; i++) {
      for (const char of alphabet) {
        candidates.push(word.slice(0, i) + char + word.slice(i + 1));
      }
    }

    // Insertions
    for (let i = 0; i <= word.length; i++) {
      for (const char of alphabet) {
        candidates.push(word.slice(0, i) + char + word.slice(i));
      }
    }

    return candidates;
  }

  private tokenizeText(text: string): string[] {
    return text.match(/\b\w+(?:'\w+)?\b/g) || [];
  }

  private getSeverity(
    word: string,
    suggestions: string[]
  ): 'low' | 'medium' | 'high' {
    if (this.commonMisspellings.has(word.toLowerCase())) {
      return 'high';
    }

    if (suggestions.length === 0) {
      return 'medium';
    }

    return 'low';
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private updateStats(wordCount: number, processingTime: number, cacheHit: boolean): void {
    const totalRequests = this.stats.totalWords + wordCount;

    this.stats.averageProcessingTime =
      (this.stats.averageProcessingTime * this.stats.totalWords + processingTime * wordCount) / totalRequests;

    this.stats.totalWords = totalRequests;

    if (cacheHit) {
      const currentHits = (this.stats.cacheHitRate / 100) * (totalRequests - wordCount);
      this.stats.cacheHitRate = ((currentHits + wordCount) / totalRequests) * 100;
    }
  }

  private async loadCustomDictionary(): Promise<void> {
    try {
      const response = await fetch('/api/dictionary/terms');
      if (response.ok) {
        const terms = await response.json();
        terms.forEach((term: any) => {
          if (term.is_active) {
            this.config.customDictionary.add(term.term.toLowerCase());
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load custom dictionary:', error);
    }
  }

  private async initializeWorkers(): Promise<void> {
    // In a real implementation, you would create separate worker files
    // For now, we'll simulate worker initialization
    const workerCount = Math.min(navigator.hardwareConcurrency || 2, 4);

    for (let i = 0; i < workerCount; i++) {
      // Mock worker - in real implementation, create actual Worker instances
      this.workers.push({} as Worker);
    }
  }

  private async preloadCommonWords(): Promise<void> {
    // Preload cache with common words to improve performance
    const commonWords = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
      'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this'
    ];

    const preloadTasks = commonWords.map(word => ({
      key: `spell-check:word:${word}`,
      data: { isCorrect: true, suggestions: [] },
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    }));

    cacheService.batchSet(preloadTasks);
  }
}

// Create singleton instance
export const spellCheckService = new SpellCheckService();
export default spellCheckService;
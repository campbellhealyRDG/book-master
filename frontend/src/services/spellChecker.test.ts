import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spellCheckService } from './spellChecker';

// Mock typo-js
const mockCheck = vi.fn();
const mockSuggest = vi.fn();

vi.mock('typo-js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      check: mockCheck,
      suggest: mockSuggest
    }))
  };
});

// Mock fetch for dictionary files
global.fetch = vi.fn();

describe('SpellCheckService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spellCheckService.clearIgnoreList();
    spellCheckService.clearCustomDictionary();

    // Mock successful dictionary loading
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('mock-dic-data')
    }).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('mock-aff-data')
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('initializes successfully with dictionary files', async () => {
      const result = await spellCheckService.initialize();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/dictionaries/en_GB.dic');
      expect(global.fetch).toHaveBeenCalledWith('/dictionaries/en_GB.aff');
      expect(spellCheckService.isInitialized()).toBe(true);
    });

    it('handles initialization failure gracefully', async () => {
      (global.fetch as any).mockReset().mockRejectedValueOnce(new Error('Network error'));

      const result = await spellCheckService.initialize();

      expect(result).toBe(false);
      expect(spellCheckService.isInitialized()).toBe(false);
    });

    it('does not reinitialize if already initialized', async () => {
      await spellCheckService.initialize();
      vi.clearAllMocks();

      const result = await spellCheckService.initialize();

      expect(result).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Word checking', () => {
    beforeEach(async () => {
      await spellCheckService.initialize();
    });

    it('checks words correctly', () => {
      mockCheck.mockReturnValue(true);

      const result = spellCheckService.checkWord('hello');

      expect(result).toBe(true);
      expect(mockCheck).toHaveBeenCalledWith('hello');
    });

    it('handles misspelled words', () => {
      mockCheck.mockReturnValue(false);

      const result = spellCheckService.checkWord('helllo');

      expect(result).toBe(false);
      expect(mockCheck).toHaveBeenCalledWith('helllo');
    });

    it('ignores punctuation in words', () => {
      mockCheck.mockReturnValue(true);

      const result = spellCheckService.checkWord('hello!');

      expect(result).toBe(true);
      expect(mockCheck).toHaveBeenCalledWith('hello');
    });

    it('respects ignored words', () => {
      spellCheckService.addToIgnoreList('customword');
      mockCheck.mockReturnValue(false);

      const result = spellCheckService.checkWord('customword');

      expect(result).toBe(true);
      expect(mockCheck).not.toHaveBeenCalled();
    });

    it('respects custom dictionary', () => {
      spellCheckService.addToCustomDictionary('technicalterm');
      mockCheck.mockReturnValue(false);

      const result = spellCheckService.checkWord('technicalterm');

      expect(result).toBe(true);
      expect(mockCheck).not.toHaveBeenCalled();
    });
  });

  describe('Suggestions', () => {
    beforeEach(async () => {
      await spellCheckService.initialize();
    });

    it('provides spelling suggestions', () => {
      mockSuggest.mockReturnValue(['hello', 'yellow', 'fellow']);

      const suggestions = spellCheckService.getSuggestions('helllo');

      expect(suggestions).toEqual(['hello', 'yellow', 'fellow']);
      expect(mockSuggest).toHaveBeenCalledWith('helllo');
    });

    it('limits suggestions to 5', () => {
      mockSuggest.mockReturnValue(['a', 'b', 'c', 'd', 'e', 'f', 'g']);

      const suggestions = spellCheckService.getSuggestions('word');

      expect(suggestions).toHaveLength(5);
      expect(suggestions).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('handles null suggestions from typo', () => {
      mockSuggest.mockReturnValue(null);

      const suggestions = spellCheckService.getSuggestions('unknownword');

      expect(suggestions).toEqual([]);
    });

    it('preserves capitalisation in suggestions', () => {
      mockSuggest.mockReturnValue(['hello', 'yellow']);

      const suggestions = spellCheckService.getSuggestions('Hello');

      expect(suggestions).toEqual(['Hello', 'Yellow']);
    });

    it('handles all caps words', () => {
      mockSuggest.mockReturnValue(['hello', 'yellow']);

      const suggestions = spellCheckService.getSuggestions('HELLO');

      expect(suggestions).toEqual(['HELLO', 'YELLOW']);
    });

    it('adds US to UK conversion as first suggestion', () => {
      mockSuggest.mockReturnValue(['colo', 'colon']);

      const suggestions = spellCheckService.getSuggestions('color');

      expect(suggestions[0]).toBe('colour');
      expect(suggestions).toEqual(['colour', 'colo', 'colon']);
    });
  });

  describe('Text checking', () => {
    beforeEach(async () => {
      await spellCheckService.initialize();
    });

    it('finds misspellings in text', () => {
      mockCheck.mockImplementation((word: string) => word !== 'helllo');

      const result = spellCheckService.checkText('This is helllo world');

      expect(result.misspellings).toHaveLength(1);
      expect(result.misspellings[0]).toEqual({
        word: 'helllo',
        suggestions: [],
        position: { start: 8, end: 14 }
      });
    });

    it('handles text with no misspellings', () => {
      mockCheck.mockReturnValue(true);

      const result = spellCheckService.checkText('This is correct text');

      expect(result.misspellings).toHaveLength(0);
    });

    it('handles contractions correctly', () => {
      mockCheck.mockReturnValue(true);

      const result = spellCheckService.checkText("Don't you think it's good?");

      // Should extract "Don't", "you", "think", "it's", "good" as words
      expect(mockCheck).toHaveBeenCalledWith("Don't");
      expect(mockCheck).toHaveBeenCalledWith("it's");
    });

    it('extracts word positions correctly', () => {
      mockCheck.mockImplementation((word: string) => word !== 'second');

      const result = spellCheckService.checkText('First second third');

      expect(result.misspellings[0].position).toEqual({ start: 6, end: 12 });
    });
  });

  describe('US to UK conversion', () => {
    it('converts common US spellings to UK', () => {
      const conversions = [
        ['color', 'colour'],
        ['realize', 'realise'],
        ['center', 'centre'],
        ['defense', 'defence'],
        ['gray', 'grey'],
        ['mom', 'mum'],
        ['tire', 'tyre']
      ];

      conversions.forEach(([us, uk]) => {
        expect(spellCheckService.convertUSToUK(us)).toBe(uk);
      });
    });

    it('preserves capitalisation in conversions', () => {
      expect(spellCheckService.convertUSToUK('Color')).toBe('Colour');
      expect(spellCheckService.convertUSToUK('COLOR')).toBe('COLOUR');
    });

    it('converts multiple words in text', () => {
      const usText = 'The color of the tire in the center was gray.';
      const ukText = 'The colour of the tyre in the centre was grey.';

      expect(spellCheckService.convertUSToUK(usText)).toBe(ukText);
    });

    it('handles word boundaries correctly', () => {
      // Should not convert "color" in "colorful" or "discolor"
      const text = 'The colorful color and discolor';
      const result = spellCheckService.convertUSToUK(text);

      expect(result).toBe('The colorful colour and discolor');
    });
  });

  describe('Dictionary management', () => {
    it('manages ignore list correctly', () => {
      expect(spellCheckService.getIgnoredWords()).toEqual([]);

      spellCheckService.addToIgnoreList('Word1');
      spellCheckService.addToIgnoreList('Word2');

      expect(spellCheckService.getIgnoredWords()).toEqual(['word1', 'word2']);

      spellCheckService.clearIgnoreList();
      expect(spellCheckService.getIgnoredWords()).toEqual([]);
    });

    it('manages custom dictionary correctly', () => {
      expect(spellCheckService.getCustomDictionary()).toEqual([]);

      spellCheckService.addToCustomDictionary('TechnicalTerm');
      spellCheckService.addToCustomDictionary('AnotherTerm');

      expect(spellCheckService.getCustomDictionary()).toEqual(['technicalterm', 'anotherterm']);

      spellCheckService.clearCustomDictionary();
      expect(spellCheckService.getCustomDictionary()).toEqual([]);
    });

    it('stores words in lowercase for case-insensitive matching', () => {
      spellCheckService.addToIgnoreList('MixedCase');
      spellCheckService.addToCustomDictionary('AnotherMixed');

      expect(spellCheckService.getIgnoredWords()).toContain('mixedcase');
      expect(spellCheckService.getCustomDictionary()).toContain('anothermixed');
    });
  });

  describe('Edge cases', () => {
    beforeEach(async () => {
      await spellCheckService.initialize();
    });

    it('handles empty text', () => {
      const result = spellCheckService.checkText('');
      expect(result.misspellings).toEqual([]);
    });

    it('handles text with only punctuation', () => {
      const result = spellCheckService.checkText('!@#$%^&*()');
      expect(result.misspellings).toEqual([]);
    });

    it('handles text with only whitespace', () => {
      const result = spellCheckService.checkText('   \n\t  ');
      expect(result.misspellings).toEqual([]);
    });

    it('handles very long words', () => {
      const longWord = 'a'.repeat(1000);
      mockCheck.mockReturnValue(false);

      const result = spellCheckService.checkText(longWord);
      expect(result.misspellings).toHaveLength(1);
    });

    it('returns empty suggestions when service not initialized', () => {
      const uninitializedService = Object.create(spellCheckService);
      uninitializedService.typo = null;

      const suggestions = uninitializedService.getSuggestions('word');
      expect(suggestions).toEqual([]);
    });

    it('returns true for all words when service not initialized', () => {
      const uninitializedService = Object.create(spellCheckService);
      uninitializedService.typo = null;

      const result = uninitializedService.checkWord('anyword');
      expect(result).toBe(true);
    });
  });
});
import Typo from 'typo-js';
import { dictionaryService } from './dictionaryService';

export interface SpellCheckSuggestion {
  word: string;
  suggestions: string[];
  position: {
    start: number;
    end: number;
  };
}

export interface SpellCheckResult {
  misspellings: SpellCheckSuggestion[];
  correctedText?: string;
}

// US to UK spelling conversions
const US_TO_UK_CONVERSIONS: Record<string, string> = {
  // -ize to -ise endings
  'realize': 'realise',
  'organize': 'organise',
  'recognize': 'recognise',
  'analyze': 'analyse',
  'criticize': 'criticise',
  'emphasize': 'emphasise',
  'modernize': 'modernise',
  'normalize': 'normalise',
  'optimize': 'optimise',
  'prioritize': 'prioritise',
  'standardize': 'standardise',
  'summarize': 'summarise',
  'synchronize': 'synchronise',
  'visualize': 'visualise',

  // -or to -our endings
  'color': 'colour',
  'honor': 'honour',
  'favor': 'favour',
  'neighbor': 'neighbour',
  'rumor': 'rumour',
  'humor': 'humour',
  'labor': 'labour',
  'vapor': 'vapour',
  'behavior': 'behaviour',

  // -er to -re endings
  'center': 'centre',
  'theater': 'theatre',
  'meter': 'metre',
  'fiber': 'fibre',
  'caliber': 'calibre',
  'saber': 'sabre',

  // -ense to -ence endings
  'defense': 'defence',
  'offense': 'offence',
  'license': 'licence', // as noun

  // Other common differences
  'gray': 'grey',
  'program': 'programme', // in certain contexts
  'tire': 'tyre', // car tyre
  'curb': 'kerb', // pavement kerb
  'mom': 'mum',
  'airplane': 'aeroplane',
  'diapers': 'nappies',
  'elevator': 'lift',
  'garbage': 'rubbish',
  'gasoline': 'petrol',
  'vacation': 'holiday',
  'apartment': 'flat',
  'cookie': 'biscuit',
  'candy': 'sweets',
  'truck': 'lorry',
  'hood': 'bonnet', // car bonnet
  'trunk': 'boot', // car boot
};

class SpellCheckService {
  private typo: Typo | null = null;
  private isLoading = false;
  private ignoredWords = new Set<string>();
  private customDictionary = new Set<string>();
  private serverDictionaryTerms = new Set<string>();

  async initialize(): Promise<boolean> {
    if (this.typo || this.isLoading) {
      return !!this.typo;
    }

    this.isLoading = true;

    try {
      // Load dictionary files and server terms in parallel
      const [dicResponse, affResponse] = await Promise.all([
        fetch('/dictionaries/en_GB.dic'),
        fetch('/dictionaries/en_GB.aff'),
        this.loadServerDictionaryTerms()
      ]);

      if (!dicResponse.ok || !affResponse.ok) {
        throw new Error('Failed to load dictionary files');
      }

      const dicData = await dicResponse.text();
      const affData = await affResponse.text();

      // Initialize Typo with British English dictionary
      this.typo = new Typo('en_GB', affData, dicData);

      // Server terms are already loaded by the promise above
      return true;
    } catch (error) {
      console.error('Failed to initialize spell checker:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  private async loadServerDictionaryTerms(): Promise<void> {
    try {
      const terms = await dictionaryService.getSpellCheckTerms();
      this.serverDictionaryTerms = new Set(terms.map(term => term.toLowerCase()));
    } catch (error) {
      console.warn('Failed to load server dictionary terms:', error);
      // Continue without server terms - not critical for spell checking to work
    }
  }

  async refreshCustomDictionary(): Promise<void> {
    try {
      const terms = await dictionaryService.getSpellCheckTerms();
      this.serverDictionaryTerms = new Set(terms.map(term => term.toLowerCase()));
    } catch (error) {
      console.warn('Failed to refresh server dictionary terms:', error);
    }
  }

  isInitialized(): boolean {
    return !!this.typo;
  }

  checkWord(word: string): boolean {
    if (!this.typo) return true;

    // Remove punctuation and check if ignored
    const cleanWord = word.replace(/[^\w]/g, '');
    const lowerCleanWord = cleanWord.toLowerCase();

    if (this.ignoredWords.has(lowerCleanWord) ||
        this.customDictionary.has(lowerCleanWord) ||
        this.serverDictionaryTerms.has(lowerCleanWord)) {
      return true;
    }

    return this.typo.check(cleanWord);
  }

  getSuggestions(word: string): string[] {
    if (!this.typo) return [];

    const cleanWord = word.replace(/[^\w]/g, '');
    let suggestions = this.typo.suggest(cleanWord) || [];

    // Add US to UK conversion suggestions
    const lowerWord = cleanWord.toLowerCase();
    if (US_TO_UK_CONVERSIONS[lowerWord]) {
      const ukVersion = US_TO_UK_CONVERSIONS[lowerWord];
      // Preserve original capitalisation
      const convertedWord = this.preserveCapitalisation(cleanWord, ukVersion);
      suggestions.unshift(convertedWord);
    }

    // Limit to top 5 suggestions and preserve original capitalisation
    return suggestions.slice(0, 5).map(suggestion =>
      this.preserveCapitalisation(cleanWord, suggestion)
    );
  }

  private preserveCapitalisation(original: string, suggestion: string): string {
    if (original.length === 0) return suggestion;

    let result = suggestion.toLowerCase();

    // Handle all caps
    if (original === original.toUpperCase()) {
      return result.toUpperCase();
    }

    // Handle first letter capitalisation
    if (original[0] === original[0].toUpperCase()) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    return result;
  }

  checkText(text: string): SpellCheckResult {
    if (!this.typo) {
      return { misspellings: [] };
    }

    const misspellings: SpellCheckSuggestion[] = [];
    const words = this.extractWords(text);

    for (const wordInfo of words) {
      if (!this.checkWord(wordInfo.word)) {
        misspellings.push({
          word: wordInfo.word,
          suggestions: this.getSuggestions(wordInfo.word),
          position: wordInfo.position
        });
      }
    }

    return { misspellings };
  }

  private extractWords(text: string): Array<{ word: string; position: { start: number; end: number } }> {
    const words: Array<{ word: string; position: { start: number; end: number } }> = [];
    const wordRegex = /\b[a-zA-Z]+(?:[''][a-zA-Z]+)?\b/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      words.push({
        word: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }

    return words;
  }

  addToIgnoreList(word: string): void {
    this.ignoredWords.add(word.toLowerCase());
  }

  addToCustomDictionary(word: string): void {
    this.customDictionary.add(word.toLowerCase());
  }

  clearIgnoreList(): void {
    this.ignoredWords.clear();
  }

  clearCustomDictionary(): void {
    this.customDictionary.clear();
  }

  getIgnoredWords(): string[] {
    return Array.from(this.ignoredWords);
  }

  getCustomDictionary(): string[] {
    return Array.from(this.customDictionary);
  }

  // Convert US spellings to UK spellings in text
  convertUSToUK(text: string): string {
    let convertedText = text;

    for (const [usWord, ukWord] of Object.entries(US_TO_UK_CONVERSIONS)) {
      // Handle different capitalisations
      const patterns = [
        { pattern: new RegExp(`\\b${usWord}\\b`, 'g'), replacement: ukWord },
        { pattern: new RegExp(`\\b${usWord.charAt(0).toUpperCase() + usWord.slice(1)}\\b`, 'g'),
          replacement: ukWord.charAt(0).toUpperCase() + ukWord.slice(1) },
        { pattern: new RegExp(`\\b${usWord.toUpperCase()}\\b`, 'g'), replacement: ukWord.toUpperCase() }
      ];

      for (const { pattern, replacement } of patterns) {
        convertedText = convertedText.replace(pattern, replacement);
      }
    }

    return convertedText;
  }
}

// Export singleton instance
export const spellCheckService = new SpellCheckService();
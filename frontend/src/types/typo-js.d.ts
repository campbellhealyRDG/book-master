declare module 'typo-js' {
  class Typo {
    constructor(dictionary: string, affData: string, dicData: string, settings?: any);

    check(word: string): boolean;
    suggest(word: string, limit?: number): string[] | null;
  }

  export = Typo;
}
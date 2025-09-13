import db from '../config/database.js';

export interface ChapterData {
  id?: number;
  book_id: number;
  title: string;
  content?: string;
  chapter_number: number;
  word_count?: number;
  character_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export class Chapter {
  public id?: number;
  public book_id: number;
  public title: string;
  public content: string;
  public chapter_number: number;
  public word_count: number;
  public character_count: number;
  public created_at?: Date;
  public updated_at?: Date;

  constructor(data: ChapterData) {
    this.id = data.id;
    this.book_id = data.book_id;
    this.title = data.title;
    this.content = data.content || '';
    this.chapter_number = data.chapter_number;
    this.word_count = data.word_count || 0;
    this.character_count = data.character_count || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    this.validate();
    this.updateCounts();
  }

  private validate(): void {
    if (!this.book_id || this.book_id <= 0) {
      throw new Error('Chapter must belong to a valid book');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Chapter title is required and cannot be empty');
    }

    if (this.title.length > 255) {
      throw new Error('Chapter title must not exceed 255 characters');
    }

    if (this.chapter_number < 1) {
      throw new Error('Chapter number must be greater than 0');
    }

    if (this.content && this.content.length > 1000000) { // 1MB limit
      throw new Error('Chapter content must not exceed 1,000,000 characters');
    }
  }

  private updateCounts(): void {
    if (!this.content) {
      this.word_count = 0;
      this.character_count = 0;
      return;
    }

    // Count characters (excluding line breaks for consistency)
    this.character_count = this.content.replace(/\r?\n/g, '').length;

    // Count words (split by whitespace and filter empty strings)
    const words = this.content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    this.word_count = words.length;
  }

  public updateContent(content: string): void {
    this.content = content;
    this.updateCounts();
  }

  public toJSON(): ChapterData {
    return {
      id: this.id,
      book_id: this.book_id,
      title: this.title,
      content: this.content,
      chapter_number: this.chapter_number,
      word_count: this.word_count,
      character_count: this.character_count,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Static methods for database operations
  public static async create(chapterData: Omit<ChapterData, 'id' | 'created_at' | 'updated_at'>): Promise<Chapter> {
    // Check if book exists
    const bookExists = await db('books').where('id', chapterData.book_id).first();
    if (!bookExists) {
      throw new Error('Cannot create chapter for non-existent book');
    }

    // Auto-assign chapter number if not provided
    let chapterNumber = chapterData.chapter_number;
    if (!chapterNumber) {
      const lastChapter = await db('chapters')
        .where('book_id', chapterData.book_id)
        .orderBy('chapter_number', 'desc')
        .first();
      chapterNumber = (lastChapter?.chapter_number || 0) + 1;
    }

    // Check if chapter number already exists for this book
    const existingChapter = await db('chapters')
      .where('book_id', chapterData.book_id)
      .where('chapter_number', chapterNumber)
      .first();
    
    if (existingChapter) {
      throw new Error(`Chapter ${chapterNumber} already exists for this book`);
    }

    const chapter = new Chapter({ ...chapterData, chapter_number: chapterNumber });
    
    const [id] = await db('chapters').insert({
      book_id: chapter.book_id,
      title: chapter.title,
      content: chapter.content,
      chapter_number: chapter.chapter_number,
      word_count: chapter.word_count,
      character_count: chapter.character_count,
    });

    chapter.id = id;
    const created = await Chapter.findById(id);
    if (!created) {
      throw new Error('Failed to create chapter');
    }

    // Update book's computed fields
    await Chapter.updateBookComputedFields(chapter.book_id);
    
    return created;
  }

  public static async findById(id: number): Promise<Chapter | null> {
    const result = await db('chapters').where('id', id).first();
    if (!result) {
      return null;
    }
    return new Chapter(result);
  }

  public static async findByBookId(bookId: number): Promise<Chapter[]> {
    const results = await db('chapters')
      .where('book_id', bookId)
      .orderBy('chapter_number', 'asc');
    return results.map(result => new Chapter(result));
  }

  public static async findByBookIdAndNumber(bookId: number, chapterNumber: number): Promise<Chapter | null> {
    const result = await db('chapters')
      .where('book_id', bookId)
      .where('chapter_number', chapterNumber)
      .first();
    
    if (!result) {
      return null;
    }
    return new Chapter(result);
  }

  public async update(updates: Partial<Omit<ChapterData, 'id' | 'book_id' | 'created_at' | 'updated_at'>>): Promise<Chapter> {
    if (!this.id) {
      throw new Error('Cannot update chapter without ID');
    }

    // Create a new instance with updated data to validate
    const updatedData = { ...this.toJSON(), ...updates };
    const validatedChapter = new Chapter(updatedData);

    // Check if chapter number conflict exists (if changing chapter number)
    if (updates.chapter_number && updates.chapter_number !== this.chapter_number) {
      const existingChapter = await db('chapters')
        .where('book_id', this.book_id)
        .where('chapter_number', updates.chapter_number)
        .where('id', '!=', this.id)
        .first();
      
      if (existingChapter) {
        throw new Error(`Chapter ${updates.chapter_number} already exists for this book`);
      }
    }

    await db('chapters')
      .where('id', this.id)
      .update({
        title: validatedChapter.title,
        content: validatedChapter.content,
        chapter_number: validatedChapter.chapter_number,
        word_count: validatedChapter.word_count,
        character_count: validatedChapter.character_count,
        updated_at: db.fn.now(),
      });

    const updated = await Chapter.findById(this.id);
    if (!updated) {
      throw new Error('Failed to update chapter');
    }

    // Update book's computed fields
    await Chapter.updateBookComputedFields(this.book_id);
    
    return updated;
  }

  public async delete(): Promise<void> {
    if (!this.id) {
      throw new Error('Cannot delete chapter without ID');
    }

    const bookId = this.book_id;
    await db('chapters').where('id', this.id).delete();

    // Update book's computed fields
    await Chapter.updateBookComputedFields(bookId);
  }

  public async reorder(newChapterNumber: number): Promise<Chapter> {
    if (!this.id) {
      throw new Error('Cannot reorder chapter without ID');
    }

    if (newChapterNumber < 1) {
      throw new Error('Chapter number must be greater than 0');
    }

    if (newChapterNumber === this.chapter_number) {
      return this; // No change needed
    }

    await db.transaction(async (trx) => {
      const chapters = await trx('chapters')
        .where('book_id', this.book_id)
        .orderBy('chapter_number', 'asc');

      // Remove current chapter from array
      const currentChapterIndex = chapters.findIndex(c => c.id === this.id);
      if (currentChapterIndex === -1) {
        throw new Error('Chapter not found');
      }

      const currentChapter = chapters.splice(currentChapterIndex, 1)[0];
      
      // Insert at new position (array is 0-indexed, chapter numbers are 1-indexed)
      chapters.splice(newChapterNumber - 1, 0, currentChapter);

      // Update all chapter numbers
      for (let i = 0; i < chapters.length; i++) {
        await trx('chapters')
          .where('id', chapters[i].id)
          .update({ 
            chapter_number: i + 1,
            updated_at: trx.fn.now(),
          });
      }
    });

    return Chapter.findById(this.id) as Promise<Chapter>;
  }

  private static async updateBookComputedFields(bookId: number): Promise<void> {
    const { Book } = await import('./Book.js');
    const book = await Book.findById(bookId);
    if (book) {
      await book.updateComputedFields();
    }
  }

  // Utility methods for pagination and text handling
  public static countWords(text: string): number {
    if (!text || text.trim().length === 0) {
      return 0;
    }
    
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  public static countCharacters(text: string): number {
    if (!text) {
      return 0;
    }
    
    return text.replace(/\r?\n/g, '').length;
  }

  public static splitIntoPages(content: string, wordsPerPage: number = 2000): string[] {
    if (!content || content.trim().length === 0) {
      return [''];
    }

    const paragraphs = content.split(/\n\s*\n/);
    const pages: string[] = [];
    let currentPage = '';
    let currentWordCount = 0;

    for (const paragraph of paragraphs) {
      const paragraphWordCount = Chapter.countWords(paragraph);
      
      if (currentWordCount + paragraphWordCount > wordsPerPage && currentPage) {
        // Current page would exceed limit, start new page
        pages.push(currentPage.trim());
        currentPage = paragraph;
        currentWordCount = paragraphWordCount;
      } else {
        // Add paragraph to current page
        if (currentPage) {
          currentPage += '\n\n' + paragraph;
        } else {
          currentPage = paragraph;
        }
        currentWordCount += paragraphWordCount;
      }
    }

    // Add the last page if it has content
    if (currentPage.trim()) {
      pages.push(currentPage.trim());
    }

    return pages.length > 0 ? pages : [''];
  }
}
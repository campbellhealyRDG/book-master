import db from '../config/database.js';
import { Chapter } from './Chapter.js';

export interface BookData {
  id?: number;
  title: string;
  author: string;
  description?: string;
  chapter_count?: number;
  word_count?: number;
  character_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface BookWithChapters extends BookData {
  chapters?: Chapter[];
}

export class Book {
  public id?: number;
  public title: string;
  public author: string;
  public description?: string;
  public chapter_count: number;
  public word_count: number;
  public character_count: number;
  public created_at?: Date;
  public updated_at?: Date;

  constructor(data: BookData) {
    this.id = data.id;
    this.title = data.title;
    this.author = data.author;
    this.description = data.description;
    this.chapter_count = data.chapter_count || 0;
    this.word_count = data.word_count || 0;
    this.character_count = data.character_count || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Book title is required and cannot be empty');
    }

    if (this.title.length > 255) {
      throw new Error('Book title must not exceed 255 characters');
    }

    if (!this.author || this.author.trim().length === 0) {
      throw new Error('Book author is required and cannot be empty');
    }

    if (this.author.length > 255) {
      throw new Error('Book author must not exceed 255 characters');
    }

    if (this.description && this.description.length > 10000) {
      throw new Error('Book description must not exceed 10,000 characters');
    }

    if (this.chapter_count < 0) {
      throw new Error('Chapter count cannot be negative');
    }

    if (this.word_count < 0) {
      throw new Error('Word count cannot be negative');
    }

    if (this.character_count < 0) {
      throw new Error('Character count cannot be negative');
    }
  }

  public toJSON(): BookData {
    return {
      id: this.id,
      title: this.title,
      author: this.author,
      description: this.description,
      chapter_count: this.chapter_count,
      word_count: this.word_count,
      character_count: this.character_count,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Static methods for database operations
  public static async create(bookData: Omit<BookData, 'id' | 'created_at' | 'updated_at'>): Promise<Book> {
    const book = new Book(bookData);
    
    const [id] = await db('books').insert({
      title: book.title,
      author: book.author,
      description: book.description,
      chapter_count: book.chapter_count,
      word_count: book.word_count,
      character_count: book.character_count,
    });

    book.id = id;
    const created = await Book.findById(id);
    if (!created) {
      throw new Error('Failed to create book');
    }
    
    return created;
  }

  public static async findById(id: number): Promise<Book | null> {
    const result = await db('books').where('id', id).first();
    if (!result) {
      return null;
    }
    return new Book(result);
  }

  public static async findAll(): Promise<Book[]> {
    const results = await db('books').orderBy('updated_at', 'desc');
    return results.map(result => new Book(result));
  }

  public static async findByAuthor(author: string): Promise<Book[]> {
    const results = await db('books')
      .where('author', 'like', `%${author}%`)
      .orderBy('updated_at', 'desc');
    return results.map(result => new Book(result));
  }

  public async update(updates: Partial<Omit<BookData, 'id' | 'created_at' | 'updated_at'>>): Promise<Book> {
    if (!this.id) {
      throw new Error('Cannot update book without ID');
    }

    // Create a new instance with updated data to validate
    const updatedData = { ...this.toJSON(), ...updates };
    const validatedBook = new Book(updatedData);

    await db('books')
      .where('id', this.id)
      .update({
        title: validatedBook.title,
        author: validatedBook.author,
        description: validatedBook.description,
        chapter_count: validatedBook.chapter_count,
        word_count: validatedBook.word_count,
        character_count: validatedBook.character_count,
        updated_at: db.fn.now(),
      });

    const updated = await Book.findById(this.id);
    if (!updated) {
      throw new Error('Failed to update book');
    }
    
    return updated;
  }

  public async delete(): Promise<void> {
    if (!this.id) {
      throw new Error('Cannot delete book without ID');
    }

    await db('books').where('id', this.id).delete();
  }

  public async updateComputedFields(): Promise<Book> {
    if (!this.id) {
      throw new Error('Cannot update computed fields without book ID');
    }

    // Get all chapters for this book
    const chapters = await db('chapters')
      .where('book_id', this.id)
      .select('word_count', 'character_count');

    const totalWordCount = chapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
    const totalCharacterCount = chapters.reduce((sum, chapter) => sum + (chapter.character_count || 0), 0);
    const chapterCount = chapters.length;

    return this.update({
      chapter_count: chapterCount,
      word_count: totalWordCount,
      character_count: totalCharacterCount,
    });
  }

  public async getChapters(): Promise<Chapter[]> {
    if (!this.id) {
      return [];
    }

    const { Chapter } = await import('./Chapter.js');
    return Chapter.findByBookId(this.id);
  }
}
import { describe, test, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { Book } from '../models/Book.js';
import { Chapter } from '../models/Chapter.js';
import { exportBook, isValidExportFormat, getFileExtension, getMimeType } from '../utils/exportService.js';
import { Database } from 'sqlite3';
import path from 'path';

describe('Export Service', () => {
  let db: Database;

  beforeAll(async () => {
    // Use test database
    const dbPath = path.join(__dirname, '../../test.db');
    db = new Database(dbPath);

    // Initialize database tables
    await new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        // Create books table
        db.run(`CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          description TEXT,
          chapter_count INTEGER DEFAULT 0,
          word_count INTEGER DEFAULT 0,
          character_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) reject(err);
        });

        // Create chapters table
        db.run(`CREATE TABLE IF NOT EXISTS chapters (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT DEFAULT '',
          chapter_number INTEGER NOT NULL,
          word_count INTEGER DEFAULT 0,
          character_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
          UNIQUE (book_id, chapter_number)
        )`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  });

  afterAll(async () => {
    if (db) {
      await new Promise<void>((resolve) => {
        db.close((err) => {
          if (err) console.error('Error closing database:', err);
          resolve();
        });
      });
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await new Promise<void>((resolve) => {
      db.serialize(() => {
        db.run('DELETE FROM chapters');
        db.run('DELETE FROM books', () => resolve());
      });
    });
  });

  describe('exportBook function', () => {
    test('should export book in TXT format', async () => {
      // Create test book
      const book = await Book.create({
        title: 'Test Book',
        author: 'Test Author',
        description: 'A test book for export testing'
      });

      // Create test chapters
      const chapter1 = await Chapter.create({
        book_id: book.id!,
        title: 'Chapter One',
        content: 'This is the content of chapter one. It has multiple sentences.',
        chapter_number: 1
      });

      const chapter2 = await Chapter.create({
        book_id: book.id!,
        title: 'Chapter Two',
        content: 'This is chapter two content. It also has multiple sentences.',
        chapter_number: 2
      });

      const chapters = [chapter1, chapter2];

      const result = await exportBook(book, chapters, 'txt');

      expect(result.format).toBe('txt');
      expect(result.mimeType).toBe('text/plain');
      expect(result.filename).toMatch(/test_book_by_test_author_\d{4}-\d{2}-\d{2}\.txt/);

      // Check content structure
      expect(result.content).toContain('TEST BOOK');
      expect(result.content).toContain('by Test Author');
      expect(result.content).toContain('DESCRIPTION:');
      expect(result.content).toContain('A test book for export testing');
      expect(result.content).toContain('BOOK INFORMATION:');
      expect(result.content).toContain('Total Chapters:');
      expect(result.content).toContain('Total Words:');
      expect(result.content).toContain('CHAPTER 1: CHAPTER ONE');
      expect(result.content).toContain('CHAPTER 2: CHAPTER TWO');
      expect(result.content).toContain('This is the content of chapter one');
      expect(result.content).toContain('This is chapter two content');
      expect(result.content).toContain('End of "Test Book" by Test Author');
    });

    test('should export book in Markdown format', async () => {
      const book = await Book.create({
        title: 'Markdown Book',
        author: 'MD Author',
        description: 'Testing markdown export functionality'
      });

      const chapter = await Chapter.create({
        book_id: book.id!,
        title: 'Introduction',
        content: 'Welcome to this markdown book. **Bold text** and *italic text*.',
        chapter_number: 1
      });

      const result = await exportBook(book, [chapter], 'markdown');

      expect(result.format).toBe('markdown');
      expect(result.mimeType).toBe('text/markdown');
      expect(result.filename).toMatch(/markdown_book_by_md_author_\d{4}-\d{2}-\d{2}\.md/);

      // Check markdown structure
      expect(result.content).toContain('# Markdown Book');
      expect(result.content).toContain('**by MD Author**');
      expect(result.content).toContain('## Description');
      expect(result.content).toContain('Testing markdown export functionality');
      expect(result.content).toContain('## Book Information');
      expect(result.content).toContain('| Field | Value |');
      expect(result.content).toContain('| Total Chapters |');
      expect(result.content).toContain('| Total Words |');
      expect(result.content).toContain('## Chapter 1: Introduction');
      expect(result.content).toContain('Welcome to this markdown book');
      expect(result.content).toContain('*End of "Markdown Book" by MD Author*');
    });

    test('should handle book with no chapters', async () => {
      const book = await Book.create({
        title: 'Empty Book',
        author: 'Empty Author'
      });

      const result = await exportBook(book, [], 'txt');

      expect(result.content).toContain('EMPTY BOOK');
      expect(result.content).toContain('by Empty Author');
      expect(result.content).toContain('Total Chapters: 0');
    });

    test('should handle chapters with empty content', async () => {
      const book = await Book.create({
        title: 'Sparse Book',
        author: 'Sparse Author'
      });

      const chapter = await Chapter.create({
        book_id: book.id!,
        title: 'Empty Chapter',
        content: '',
        chapter_number: 1
      });

      const result = await exportBook(book, [chapter], 'txt');

      expect(result.content).toContain('CHAPTER 1: EMPTY CHAPTER');
      expect(result.content).toContain('(No content)');
    });

    test('should sort chapters by chapter number', async () => {
      const book = await Book.create({
        title: 'Sorting Test',
        author: 'Sort Author'
      });

      // Create chapters out of order
      const chapter3 = await Chapter.create({
        book_id: book.id!,
        title: 'Chapter Three',
        content: 'Third chapter content',
        chapter_number: 3
      });

      const chapter1 = await Chapter.create({
        book_id: book.id!,
        title: 'Chapter One',
        content: 'First chapter content',
        chapter_number: 1
      });

      const chapter2 = await Chapter.create({
        book_id: book.id!,
        title: 'Chapter Two',
        content: 'Second chapter content',
        chapter_number: 2
      });

      const chapters = [chapter3, chapter1, chapter2]; // Out of order
      const result = await exportBook(book, chapters, 'txt');

      const content = result.content;
      const chapter1Index = content.indexOf('CHAPTER 1: CHAPTER ONE');
      const chapter2Index = content.indexOf('CHAPTER 2: CHAPTER TWO');
      const chapter3Index = content.indexOf('CHAPTER 3: CHAPTER THREE');

      expect(chapter1Index).toBeLessThan(chapter2Index);
      expect(chapter2Index).toBeLessThan(chapter3Index);
    });

    test('should sanitize filename properly', async () => {
      const book = await Book.create({
        title: 'A Book with "Special" Characters & Symbols!',
        author: 'An Author with / Slashes \\ and More'
      });

      const result = await exportBook(book, [], 'txt');

      expect(result.filename).toMatch(/a_book_with_special_characters_symbols_by_an_author_with_slashes_and_more_\d{4}-\d{2}-\d{2}\.txt/);
    });

    test('should throw error for unsupported format', async () => {
      const book = await Book.create({
        title: 'Test Book',
        author: 'Test Author'
      });

      await expect(exportBook(book, [], 'pdf' as any)).rejects.toThrow('Unsupported export format: pdf');
    });
  });

  describe('Utility functions', () => {
    test('isValidExportFormat should validate formats correctly', () => {
      expect(isValidExportFormat('txt')).toBe(true);
      expect(isValidExportFormat('markdown')).toBe(true);
      expect(isValidExportFormat('pdf')).toBe(false);
      expect(isValidExportFormat('')).toBe(false);
      expect(isValidExportFormat('TXT')).toBe(false); // Case sensitive
    });

    test('getFileExtension should return correct extensions', () => {
      expect(getFileExtension('txt')).toBe('txt');
      expect(getFileExtension('markdown')).toBe('md');
      expect(() => getFileExtension('pdf' as any)).toThrow('Unknown format: pdf');
    });

    test('getMimeType should return correct MIME types', () => {
      expect(getMimeType('txt')).toBe('text/plain');
      expect(getMimeType('markdown')).toBe('text/markdown');
      expect(() => getMimeType('pdf' as any)).toThrow('Unknown format: pdf');
    });
  });
});

describe('Export API Endpoints', () => {
  let testBook: Book;
  let testChapter: Chapter;

  beforeEach(async () => {
    // Create test book and chapter for API tests
    testBook = await Book.create({
      title: 'API Test Book',
      author: 'API Author',
      description: 'Testing the export API endpoints'
    });

    testChapter = await Chapter.create({
      book_id: testBook.id!,
      title: 'API Test Chapter',
      content: 'This is test content for the API export functionality.',
      chapter_number: 1
    });
  });

  test('POST /api/books/:id/export should export book in TXT format', async () => {
    const response = await request(app)
      .post(`/api/books/${testBook.id}/export`)
      .send({ format: 'txt' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.format).toBe('txt');
    expect(response.body.data.filename).toMatch(/api_test_book_by_api_author_\d{4}-\d{2}-\d{2}\.txt/);
    expect(response.body.data.content).toContain('API TEST BOOK');
    expect(response.body.data.content).toContain('by API Author');
    expect(response.body.data.content).toContain('CHAPTER 1: API TEST CHAPTER');
    expect(response.body.data.size).toBeGreaterThan(0);
    expect(response.body.message).toContain('exported successfully as TXT');

    // Check headers
    expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(response.headers['content-disposition']).toContain('attachment');
  });

  test('POST /api/books/:id/export should export book in Markdown format', async () => {
    const response = await request(app)
      .post(`/api/books/${testBook.id}/export`)
      .send({ format: 'markdown' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.format).toBe('markdown');
    expect(response.body.data.filename).toMatch(/api_test_book_by_api_author_\d{4}-\d{2}-\d{2}\.md/);
    expect(response.body.data.content).toContain('# API Test Book');
    expect(response.body.data.content).toContain('**by API Author**');
    expect(response.body.data.content).toContain('## Chapter 1: API Test Chapter');
    expect(response.body.message).toContain('exported successfully as MARKDOWN');

    // Check headers
    expect(response.headers['content-type']).toBe('text/markdown; charset=utf-8');
  });

  test('POST /api/books/:id/export should return 404 for non-existent book', async () => {
    const response = await request(app)
      .post('/api/books/999/export')
      .send({ format: 'txt' })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Book with ID 999 not found');
  });

  test('POST /api/books/:id/export should return 400 for invalid format', async () => {
    const response = await request(app)
      .post(`/api/books/${testBook.id}/export`)
      .send({ format: 'pdf' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
  });

  test('POST /api/books/:id/export should return 400 for missing format', async () => {
    const response = await request(app)
      .post(`/api/books/${testBook.id}/export`)
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test('POST /api/books/:id/export should return 400 for invalid book ID', async () => {
    const response = await request(app)
      .post('/api/books/invalid/export')
      .send({ format: 'txt' })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test('POST /api/books/:id/export should handle book with no chapters', async () => {
    const emptyBook = await Book.create({
      title: 'Empty Export Book',
      author: 'Empty Author'
    });

    const response = await request(app)
      .post(`/api/books/${emptyBook.id}/export`)
      .send({ format: 'txt' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toContain('EMPTY EXPORT BOOK');
    expect(response.body.data.content).toContain('Total Chapters: 0');
  });

  test('POST /api/books/:id/export should include British date formatting', async () => {
    const response = await request(app)
      .post(`/api/books/${testBook.id}/export`)
      .send({ format: 'txt' })
      .expect(200);

    const content = response.body.data.content;

    // Check for British date format (DD/MM/YYYY)
    expect(content).toMatch(/Created: \d{2}\/\d{2}\/\d{4}/);
    expect(content).toMatch(/Last Modified: \d{2}\/\d{2}\/\d{4}/);
    expect(content).toMatch(/Exported: \d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}/);
  });

  test('POST /api/books/:id/export should handle multiple chapters correctly', async () => {
    // Add more chapters
    await Chapter.create({
      book_id: testBook.id!,
      title: 'Second Chapter',
      content: 'Content of the second chapter with different text.',
      chapter_number: 2
    });

    await Chapter.create({
      book_id: testBook.id!,
      title: 'Third Chapter',
      content: 'Final chapter content to test multiple chapter export.',
      chapter_number: 3
    });

    const response = await request(app)
      .post(`/api/books/${testBook.id}/export`)
      .send({ format: 'markdown' })
      .expect(200);

    const content = response.body.data.content;

    expect(content).toContain('## Chapter 1: API Test Chapter');
    expect(content).toContain('## Chapter 2: Second Chapter');
    expect(content).toContain('## Chapter 3: Third Chapter');

    // Check Table of Contents is included
    expect(content).toContain('## Table of Contents');
    expect(content).toContain('1. [API Test Chapter]');
    expect(content).toContain('2. [Second Chapter]');
    expect(content).toContain('3. [Third Chapter]');
  });
});
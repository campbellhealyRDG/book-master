import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { Book } from '../models/Book.js';
import { Chapter } from '../models/Chapter.js';
import './setup.js';

describe('Chapters API', () => {
  let testBook: Book;
  let testChapter: Chapter;

  beforeEach(async () => {
    testBook = await Book.create({
      title: 'Test Book',
      author: 'Test Author',
    });

    testChapter = await Chapter.create({
      book_id: testBook.id!,
      title: 'Test Chapter',
      content: 'This is test content for the chapter with multiple words.',
      chapter_number: 1,
    });
  });

  describe('GET /api/books/:bookId/chapters', () => {
    it('should return all chapters for a book', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook.id}/chapters`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Chapter');
      expect(response.body.book.title).toBe('Test Book');
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .get('/api/books/999/chapters')
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
    });
  });

  describe('POST /api/books/:bookId/chapters', () => {
    it('should create a new chapter', async () => {
      const chapterData = {
        title: 'Chapter 2',
        content: 'Content for second chapter',
        chapter_number: 2,
      };

      const response = await request(app)
        .post(`/api/books/${testBook.id}/chapters`)
        .send(chapterData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(chapterData.title);
      expect(response.body.data.chapter_number).toBe(2);
      expect(response.body.data.word_count).toBeGreaterThan(0);
    });

    it('should auto-assign chapter number if not provided', async () => {
      const chapterData = {
        title: 'Auto Chapter',
        content: 'Auto-numbered chapter',
      };

      const response = await request(app)
        .post(`/api/books/${testBook.id}/chapters`)
        .send(chapterData)
        .expect(201);

      expect(response.body.data.chapter_number).toBe(2); // Should be next after existing chapter 1
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .post('/api/books/999/chapters')
        .send({ title: 'Test Chapter' })
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
    });

    it('should return 400 for invalid chapter data', async () => {
      const response = await request(app)
        .post(`/api/books/${testBook.id}/chapters`)
        .send({ title: '' }) // Empty title
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/chapters/:id', () => {
    it('should return a specific chapter', async () => {
      const response = await request(app)
        .get(`/api/chapters/${testChapter.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Chapter');
      expect(response.body.data.content).toBe(testChapter.content);
    });

    it('should return 404 for non-existent chapter', async () => {
      const response = await request(app)
        .get('/api/chapters/999')
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
    });
  });

  describe('PUT /api/chapters/:id', () => {
    it('should update a chapter', async () => {
      const updates = {
        title: 'Updated Chapter Title',
        content: 'Updated chapter content with more words for testing',
      };

      const response = await request(app)
        .put(`/api/chapters/${testChapter.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updates.title);
      expect(response.body.data.content).toBe(updates.content);
      expect(response.body.data.word_count).toBeGreaterThan(0);
    });

    it('should update chapter number', async () => {
      // Create another chapter first
      await Chapter.create({
        book_id: testBook.id!,
        title: 'Chapter 2',
        content: 'Second chapter',
        chapter_number: 2,
      });

      const response = await request(app)
        .put(`/api/chapters/${testChapter.id}`)
        .send({ chapter_number: 3 })
        .expect(200);

      expect(response.body.data.chapter_number).toBe(3);
    });

    it('should return 404 for non-existent chapter', async () => {
      const response = await request(app)
        .put('/api/chapters/999')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
    });
  });

  describe('DELETE /api/chapters/:id', () => {
    it('should delete a chapter', async () => {
      const response = await request(app)
        .delete(`/api/chapters/${testChapter.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify chapter is deleted
      const deletedChapter = await Chapter.findById(testChapter.id!);
      expect(deletedChapter).toBeNull();
    });

    it('should return 404 for non-existent chapter', async () => {
      const response = await request(app)
        .delete('/api/chapters/999')
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
    });
  });

  describe('PUT /api/chapters/:id/reorder', () => {
    beforeEach(async () => {
      // Create additional chapters for reordering tests
      await Chapter.create({
        book_id: testBook.id!,
        title: 'Chapter 2',
        content: 'Second chapter',
        chapter_number: 2,
      });
      
      await Chapter.create({
        book_id: testBook.id!,
        title: 'Chapter 3',
        content: 'Third chapter',
        chapter_number: 3,
      });
    });

    it('should reorder a chapter', async () => {
      const response = await request(app)
        .put(`/api/chapters/${testChapter.id}/reorder`)
        .send({ new_chapter_number: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chapter_number).toBe(2);
    });

    it('should return 400 for invalid chapter number', async () => {
      const response = await request(app)
        .put(`/api/chapters/${testChapter.id}/reorder`)
        .send({ new_chapter_number: 0 })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/chapters/:id/pages', () => {
    it('should return paginated content', async () => {
      // Create a chapter with long content
      const longChapter = await Chapter.create({
        book_id: testBook.id!,
        title: 'Long Chapter',
        content: 'word '.repeat(3000), // 3000 words
        chapter_number: 2,
      });

      const response = await request(app)
        .get(`/api/chapters/${longChapter.id}/pages?words_per_page=1000`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.total_pages).toBeGreaterThan(1);
      expect(response.body.data.pagination.pages).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/chapters/:id/statistics', () => {
    it('should return chapter statistics', async () => {
      const response = await request(app)
        .get(`/api/chapters/${testChapter.id}/statistics`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('word_count');
      expect(response.body.data).toHaveProperty('character_count');
      expect(response.body.data).toHaveProperty('paragraph_count');
      expect(response.body.data).toHaveProperty('estimated_reading_time_minutes');
    });
  });

  describe('GET /api/books/:bookId/chapters/:chapterNumber', () => {
    it('should return chapter by book and number', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook.id}/chapters/1`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chapter_number).toBe(1);
      expect(response.body.book.title).toBe('Test Book');
    });

    it('should return 404 for non-existent chapter number', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook.id}/chapters/99`)
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
    });
  });
});
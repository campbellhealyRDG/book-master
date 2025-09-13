import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { Book } from '../models/Book.js';
import './setup.js';

describe('Books API', () => {
  let testBook: Book;

  beforeEach(async () => {
    // Create a test book for each test
    testBook = await Book.create({
      title: 'Test Book',
      author: 'Test Author',
      description: 'A test book for API testing',
    });
  });

  describe('GET /api/books', () => {
    it('should return all books', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Book');
      expect(response.body.count).toBe(1);
    });

    it('should filter books by author', async () => {
      await Book.create({
        title: 'Another Book',
        author: 'Different Author',
      });

      const response = await request(app)
        .get('/api/books?author=Test')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].author).toBe('Test Author');
    });

    it('should search books by title and description', async () => {
      const response = await request(app)
        .get('/api/books?search=test')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Book');
    });
  });

  describe('GET /api/books/:id', () => {
    it('should return a specific book', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Book');
      expect(response.body.data.id).toBe(testBook.id);
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .get('/api/books/999')
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid book ID', async () => {
      const response = await request(app)
        .get('/api/books/invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/books', () => {
    it('should create a new book', async () => {
      const bookData = {
        title: 'New Book',
        author: 'New Author',
        description: 'A brand new book',
      };

      const response = await request(app)
        .post('/api/books')
        .send(bookData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(bookData.title);
      expect(response.body.data.author).toBe(bookData.author);
      expect(response.body.data.description).toBe(bookData.description);
      expect(response.body.message).toContain('created successfully');
    });

    it('should create a book without description', async () => {
      const bookData = {
        title: 'Minimal Book',
        author: 'Minimal Author',
      };

      const response = await request(app)
        .post('/api/books')
        .send(bookData)
        .expect(201);

      expect(response.body.data.title).toBe(bookData.title);
      expect(response.body.data.description).toBeNull();
    });

    it('should return 400 for missing title', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({ author: 'Author Only' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({ field: 'title' })
      );
    });

    it('should return 400 for title too long', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({
          title: 'a'.repeat(256),
          author: 'Test Author',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should update a book', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/books/${testBook.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updates.title);
      expect(response.body.data.description).toBe(updates.description);
      expect(response.body.data.author).toBe('Test Author'); // Unchanged
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .put('/api/books/999')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should delete a book', async () => {
      const response = await request(app)
        .delete(`/api/books/${testBook.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify book is deleted
      const deletedBook = await Book.findById(testBook.id!);
      expect(deletedBook).toBeNull();
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .delete('/api/books/999')
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
    });
  });

  describe('GET /api/books/:id/statistics', () => {
    it('should return book statistics', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook.id}/statistics`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalChapters');
      expect(response.body.data).toHaveProperty('totalWords');
      expect(response.body.data).toHaveProperty('totalCharacters');
      expect(response.body.data.chapters).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/books/:id/with-chapters', () => {
    it('should return book with chapters', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook.id}/with-chapters`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('chapters');
      expect(response.body.data.chapters).toBeInstanceOf(Array);
    });
  });
});
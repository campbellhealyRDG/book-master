import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { DictionaryTerm } from '../models/DictionaryTerm.js';
import './setup.js';

describe('Dictionary API', () => {
  let testTerm: DictionaryTerm;

  beforeEach(async () => {
    testTerm = await DictionaryTerm.create({
      term: 'test word',
      category: 'custom',
      is_active: true,
    });
  });

  describe('GET /api/dictionary/terms', () => {
    it('should return all dictionary terms', async () => {
      const response = await request(app)
        .get('/api/dictionary/terms')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].term).toBe('test word');
      expect(response.body.pagination.total).toBe(1);
    });

    it('should filter terms by category', async () => {
      await DictionaryTerm.create({
        term: 'proper name',
        category: 'proper_noun',
      });

      const response = await request(app)
        .get('/api/dictionary/terms?category=proper_noun')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('proper_noun');
    });

    it('should filter terms by active status', async () => {
      await DictionaryTerm.create({
        term: 'inactive term',
        category: 'custom',
        is_active: false,
      });

      const response = await request(app)
        .get('/api/dictionary/terms?active=true')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].is_active).toBe(1); // SQLite returns 1 for true
    });

    it('should search terms', async () => {
      await DictionaryTerm.create({
        term: 'another word',
        category: 'custom',
      });

      const response = await request(app)
        .get('/api/dictionary/terms?search=test')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].term).toBe('test word');
    });

    it('should handle pagination', async () => {
      // Create multiple terms
      for (let i = 1; i <= 55; i++) {
        await DictionaryTerm.create({
          term: `term ${i}`,
          category: 'custom',
        });
      }

      const response = await request(app)
        .get('/api/dictionary/terms?limit=10&offset=50')
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.offset).toBe(50);
      expect(response.body.pagination.has_more).toBe(true);
    });
  });

  describe('GET /api/dictionary/terms/:id', () => {
    it('should return a specific term', async () => {
      const response = await request(app)
        .get(`/api/dictionary/terms/${testTerm.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.term).toBe('test word');
    });

    it('should return 404 for non-existent term', async () => {
      const response = await request(app)
        .get('/api/dictionary/terms/999')
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
    });
  });

  describe('POST /api/dictionary/terms', () => {
    it('should create a new term', async () => {
      const termData = {
        term: 'new word',
        category: 'technical_term',
        is_active: true,
      };

      const response = await request(app)
        .post('/api/dictionary/terms')
        .send(termData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.term).toBe('new word');
      expect(response.body.data.category).toBe('technical_term');
    });

    it('should create a term with default values', async () => {
      const response = await request(app)
        .post('/api/dictionary/terms')
        .send({ term: 'simple word' })
        .expect(201);

      expect(response.body.data.category).toBe('custom');
      expect(response.body.data.is_active).toBe(1);
    });

    it('should return 400 for invalid term', async () => {
      const response = await request(app)
        .post('/api/dictionary/terms')
        .send({ term: 'invalid@term!' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for duplicate term', async () => {
      const response = await request(app)
        .post('/api/dictionary/terms')
        .send({ term: 'test word' })
        .expect(409);

      expect(response.body.error).toBe('ConflictError');
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(app)
        .post('/api/dictionary/terms')
        .send({
          term: 'valid word',
          category: 'invalid_category',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/dictionary/terms/:id', () => {
    it('should update a term', async () => {
      const updates = {
        term: 'updated word',
        category: 'character_name',
        is_active: false,
      };

      const response = await request(app)
        .put(`/api/dictionary/terms/${testTerm.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.term).toBe('updated word');
      expect(response.body.data.category).toBe('character_name');
      expect(response.body.data.is_active).toBe(0);
    });

    it('should return 404 for non-existent term', async () => {
      const response = await request(app)
        .put('/api/dictionary/terms/999')
        .send({ term: 'updated' })
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
    });
  });

  describe('DELETE /api/dictionary/terms/:id', () => {
    it('should delete a term', async () => {
      const response = await request(app)
        .delete(`/api/dictionary/terms/${testTerm.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 for non-existent term', async () => {
      const response = await request(app)
        .delete('/api/dictionary/terms/999')
        .expect(404);

      expect(response.body.error).toBe('NotFoundError');
    });
  });

  describe('POST /api/dictionary/terms/bulk', () => {
    it('should create multiple terms', async () => {
      const terms = [
        { term: 'bulk word 1', category: 'custom' },
        { term: 'bulk word 2', category: 'technical_term' },
        { term: 'bulk word 3', category: 'proper_noun' },
      ];

      const response = await request(app)
        .post('/api/dictionary/terms/bulk')
        .send({ terms })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.message).toContain('3 dictionary terms created');
    });

    it('should skip duplicates when requested', async () => {
      const terms = [
        { term: 'test word', category: 'custom' }, // Duplicate
        { term: 'new bulk word', category: 'custom' },
      ];

      const response = await request(app)
        .post('/api/dictionary/terms/bulk')
        .send({ terms, skip_duplicates: true })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].term).toBe('new bulk word');
    });
  });

  describe('PUT /api/dictionary/terms/:id/toggle', () => {
    it('should toggle term active status', async () => {
      const response = await request(app)
        .put(`/api/dictionary/terms/${testTerm.id}/toggle`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_active).toBe(0); // Should be deactivated
      expect(response.body.message).toContain('deactivated');
    });
  });

  describe('GET /api/dictionary/statistics', () => {
    it('should return dictionary statistics', async () => {
      await DictionaryTerm.create({
        term: 'inactive term',
        category: 'proper_noun',
        is_active: false,
        is_user_added: false,
      });

      const response = await request(app)
        .get('/api/dictionary/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('active');
      expect(response.body.data).toHaveProperty('inactive');
      expect(response.body.data).toHaveProperty('byCategory');
      expect(response.body.data.total).toBe(2);
    });
  });

  describe('GET /api/dictionary/categories', () => {
    it('should return valid categories', async () => {
      const response = await request(app)
        .get('/api/dictionary/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toContain('proper_noun');
      expect(response.body.data).toContain('technical_term');
      expect(response.body.data).toContain('character_name');
      expect(response.body.data).toContain('place_name');
      expect(response.body.data).toContain('custom');
    });
  });

  describe('GET /api/dictionary/spell-check-terms', () => {
    it('should return active terms for spell checking', async () => {
      await DictionaryTerm.create({
        term: 'inactive term',
        category: 'custom',
        is_active: false,
      });

      const response = await request(app)
        .get('/api/dictionary/spell-check-terms')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toBe('test word');
    });
  });
});
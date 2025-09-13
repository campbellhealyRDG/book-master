import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import './setup.js';

describe('Scratchpad API', () => {
  describe('GET /api/scratchpad', () => {
    it('should return empty scratchpad initially', async () => {
      const response = await request(app)
        .get('/api/scratchpad')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('');
      expect(response.body.data.word_count).toBe(0);
      expect(response.body.data.character_count).toBe(0);
    });
  });

  describe('PUT /api/scratchpad', () => {
    it('should update scratchpad content', async () => {
      const content = 'This is test content for the scratchpad';

      const response = await request(app)
        .put('/api/scratchpad')
        .send({ content })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(content);
      expect(response.body.data.word_count).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const response = await request(app)
        .put('/api/scratchpad')
        .send({ content: '' })
        .expect(200);

      expect(response.body.data.content).toBe('');
      expect(response.body.data.word_count).toBe(0);
    });
  });

  describe('POST /api/scratchpad/append', () => {
    it('should append content to scratchpad', async () => {
      // First, add some initial content
      await request(app)
        .put('/api/scratchpad')
        .send({ content: 'Initial content' });

      const response = await request(app)
        .post('/api/scratchpad/append')
        .send({ content: 'Appended content' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toContain('Initial content');
      expect(response.body.data.content).toContain('Appended content');
    });
  });

  describe('POST /api/scratchpad/prepend', () => {
    it('should prepend content to scratchpad', async () => {
      // First, add some initial content
      await request(app)
        .put('/api/scratchpad')
        .send({ content: 'Initial content' });

      const response = await request(app)
        .post('/api/scratchpad/prepend')
        .send({ content: 'Prepended content' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toMatch(/^Prepended content/);
      expect(response.body.data.content).toContain('Initial content');
    });
  });

  describe('POST /api/scratchpad/add-note', () => {
    it('should add a timestamped note', async () => {
      const response = await request(app)
        .post('/api/scratchpad/add-note')
        .send({ note: 'This is a test note', add_timestamp: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toContain('This is a test note');
      expect(response.body.data.content).toMatch(/\[\d{2}\/\d{2}\/\d{4}/); // Date pattern
    });

    it('should add a note without timestamp', async () => {
      const response = await request(app)
        .post('/api/scratchpad/add-note')
        .send({ note: 'Plain note', add_timestamp: false })
        .expect(200);

      expect(response.body.data.content).toBe('Plain note');
    });
  });

  describe('POST /api/scratchpad/add-separator', () => {
    it('should add a separator line', async () => {
      const response = await request(app)
        .post('/api/scratchpad/add-separator')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toContain('---');
    });
  });

  describe('POST /api/scratchpad/clear', () => {
    it('should clear scratchpad content', async () => {
      // First add some content
      await request(app)
        .put('/api/scratchpad')
        .send({ content: 'Content to be cleared' });

      const response = await request(app)
        .post('/api/scratchpad/clear')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('');
      expect(response.body.data.word_count).toBe(0);
    });
  });

  describe('GET /api/scratchpad/search', () => {
    it('should search scratchpad content', async () => {
      // Add content to search
      await request(app)
        .put('/api/scratchpad')
        .send({ content: 'This is searchable content with test words' });

      const response = await request(app)
        .get('/api/scratchpad/search?query=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.found).toBe(true);
      expect(response.body.data.matches).toBeGreaterThan(0);
      expect(response.body.data.lines).toHaveLength(1);
    });

    it('should handle case sensitive search', async () => {
      await request(app)
        .put('/api/scratchpad')
        .send({ content: 'Test content with Test words' });

      const response = await request(app)
        .get('/api/scratchpad/search?query=test&case_sensitive=true')
        .expect(200);

      expect(response.body.data.matches).toBe(1); // Only lowercase 'test'
    });
  });

  describe('GET /api/scratchpad/statistics', () => {
    it('should return scratchpad statistics', async () => {
      await request(app)
        .put('/api/scratchpad')
        .send({ content: 'Line 1\n\nLine 2 with more words\n\nLine 3' });

      const response = await request(app)
        .get('/api/scratchpad/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalWords');
      expect(response.body.data).toHaveProperty('totalCharacters');
      expect(response.body.data).toHaveProperty('totalLines');
      expect(response.body.data).toHaveProperty('totalParagraphs');
      expect(response.body.data.isEmpty).toBe(false);
    });
  });

  describe('GET /api/scratchpad/export', () => {
    it('should export scratchpad as text', async () => {
      await request(app)
        .put('/api/scratchpad')
        .send({ content: 'Content to export' });

      const response = await request(app)
        .get('/api/scratchpad/export?format=txt')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="scratchpad-\d{4}-\d{2}-\d{2}\.txt"/);
      expect(response.text).toContain('Content to export');
    });

    it('should export scratchpad as markdown', async () => {
      await request(app)
        .put('/api/scratchpad')
        .send({ content: 'Markdown content' });

      const response = await request(app)
        .get('/api/scratchpad/export?format=markdown')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/markdown; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="scratchpad-\d{4}-\d{2}-\d{2}\.md"/);
      expect(response.text).toContain('# Scratchpad Notes');
    });
  });

  describe('POST /api/scratchpad/load-template', () => {
    it('should load daily notes template', async () => {
      const response = await request(app)
        .post('/api/scratchpad/load-template')
        .send({ template: 'daily-notes' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toContain('Daily Notes');
      expect(response.body.data.content).toContain('Morning Planning');
    });

    it('should load meeting notes template', async () => {
      const response = await request(app)
        .post('/api/scratchpad/load-template')
        .send({ template: 'meeting-notes' })
        .expect(200);

      expect(response.body.data.content).toContain('Meeting Notes');
      expect(response.body.data.content).toContain('Attendees');
    });

    it('should return 400 for invalid template', async () => {
      const response = await request(app)
        .post('/api/scratchpad/load-template')
        .send({ template: 'invalid-template' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });
});
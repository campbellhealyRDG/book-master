import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import './setup.js';

describe('Preferences API', () => {
  describe('POST /api/preferences/initialize', () => {
    it('should initialize default preferences', async () => {
      const response = await request(app)
        .post('/api/preferences/initialize')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('font');
      expect(response.body.data).toHaveProperty('editor');
      expect(response.body.data).toHaveProperty('app');
    });
  });

  describe('GET /api/preferences', () => {
    it('should return all preferences', async () => {
      // Initialize preferences first
      await request(app).post('/api/preferences/initialize');

      const response = await request(app)
        .get('/api/preferences')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('font');
      expect(response.body.data.font).toHaveProperty('fontFamily');
      expect(response.body.data.font).toHaveProperty('fontSize');
    });
  });

  describe('GET /api/preferences/:key', () => {
    it('should return a specific preference', async () => {
      await request(app).post('/api/preferences/initialize');

      const response = await request(app)
        .get('/api/preferences/font')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('font');
      expect(response.body.data.value).toHaveProperty('fontFamily');
    });

    it('should return 404 for non-existent preference', async () => {
      const response = await request(app)
        .get('/api/preferences/nonexistent')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/preferences/font', () => {
    it('should update font preferences', async () => {
      const fontPrefs = {
        fontFamily: 'Arial',
        fontSize: 18,
        lineHeight: 1.8,
      };

      const response = await request(app)
        .put('/api/preferences/font')
        .send(fontPrefs)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fontFamily).toBe('Arial');
      expect(response.body.data.fontSize).toBe(18);
    });

    it('should return 400 for invalid font preferences', async () => {
      const response = await request(app)
        .put('/api/preferences/font')
        .send({
          fontFamily: '',
          fontSize: 100, // Too large
          lineHeight: 0.5, // Too small
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/preferences/editor', () => {
    it('should update editor preferences', async () => {
      const editorPrefs = {
        theme: 'dark',
        showLineNumbers: true,
        wordWrap: false,
        spellCheckEnabled: true,
        autoSaveInterval: 60,
      };

      const response = await request(app)
        .put('/api/preferences/editor')
        .send(editorPrefs)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.theme).toBe('dark');
      expect(response.body.data.autoSaveInterval).toBe(60);
    });
  });

  describe('POST /api/preferences/recent-files/:bookId', () => {
    it('should add book to recent files', async () => {
      const response = await request(app)
        .post('/api/preferences/recent-files/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toContain(1);
    });
  });
});
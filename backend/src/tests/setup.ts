import { beforeEach, afterEach } from 'vitest';
import db from '../config/database.js';

// Set up test environment
beforeEach(async () => {
  // Run migrations
  await db.migrate.latest();
});

afterEach(async () => {
  // Clean up database after each test
  await db('chapters').del();
  await db('books').del();
  await db('dictionary_terms').del();
  await db('user_preferences').del();
  await db('scratchpad').del();
});

// Global teardown
export const teardown = async () => {
  await db.destroy();
};
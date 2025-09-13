import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { Chapter } from '../models/Chapter.js';
import { Book } from '../models/Book.js';
import { validateRequest, asyncHandler } from '../middleware/validation.js';
import { createCustomError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const chapterValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Chapter title must be between 1 and 255 characters'),
  body('content')
    .optional()
    .isLength({ max: 1000000 })
    .withMessage('Chapter content must not exceed 1,000,000 characters'),
  body('chapter_number')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Chapter number must be a positive integer'),
];

const chapterUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Chapter title must be between 1 and 255 characters'),
  body('content')
    .optional()
    .isLength({ max: 1000000 })
    .withMessage('Chapter content must not exceed 1,000,000 characters'),
  body('chapter_number')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Chapter number must be a positive integer'),
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Chapter ID must be a positive integer'),
];

const bookIdValidation = [
  param('bookId')
    .isInt({ min: 1 })
    .withMessage('Book ID must be a positive integer'),
];

// GET /api/books/:bookId/chapters - Get all chapters for a book
router.get('/books/:bookId/chapters',
  validateRequest(bookIdValidation),
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.bookId);
    
    // Verify book exists
    const book = await Book.findById(bookId);
    if (!book) {
      throw createCustomError(`Book with ID ${bookId} not found`, 404);
    }
    
    const chapters = await Chapter.findByBookId(bookId);
    
    res.json({
      success: true,
      data: chapters.map(chapter => chapter.toJSON()),
      count: chapters.length,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/books/:bookId/chapters - Create a new chapter
router.post('/books/:bookId/chapters',
  validateRequest([...bookIdValidation, ...chapterValidation]),
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.bookId);
    const { title, content, chapter_number } = req.body;
    
    // Verify book exists
    const book = await Book.findById(bookId);
    if (!book) {
      throw createCustomError(`Book with ID ${bookId} not found`, 404);
    }
    
    const chapter = await Chapter.create({
      book_id: bookId,
      title,
      content: content || '',
      chapter_number,
    });
    
    res.status(201).json({
      success: true,
      data: chapter.toJSON(),
      message: `Chapter "${title}" created successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/chapters/:id - Get a specific chapter
router.get('/:id',
  validateRequest(idValidation),
  asyncHandler(async (req, res) => {
    const chapterId = parseInt(req.params.id);
    const chapter = await Chapter.findById(chapterId);
    
    if (!chapter) {
      throw createCustomError(`Chapter with ID ${chapterId} not found`, 404);
    }
    
    res.json({
      success: true,
      data: chapter.toJSON(),
      timestamp: new Date().toISOString(),
    });
  })
);

// PUT /api/chapters/:id - Update a chapter
router.put('/:id',
  validateRequest([...idValidation, ...chapterUpdateValidation]),
  asyncHandler(async (req, res) => {
    const chapterId = parseInt(req.params.id);
    const updates = req.body;
    
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      throw createCustomError(`Chapter with ID ${chapterId} not found`, 404);
    }
    
    const updatedChapter = await chapter.update(updates);
    
    res.json({
      success: true,
      data: updatedChapter.toJSON(),
      message: `Chapter "${updatedChapter.title}" updated successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// DELETE /api/chapters/:id - Delete a chapter
router.delete('/:id',
  validateRequest(idValidation),
  asyncHandler(async (req, res) => {
    const chapterId = parseInt(req.params.id);
    
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      throw createCustomError(`Chapter with ID ${chapterId} not found`, 404);
    }
    
    const chapterTitle = chapter.title;
    await chapter.delete();
    
    res.json({
      success: true,
      message: `Chapter "${chapterTitle}" deleted successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// PUT /api/chapters/:id/reorder - Reorder a chapter
router.put('/:id/reorder',
  validateRequest([
    ...idValidation,
    body('new_chapter_number')
      .isInt({ min: 1 })
      .withMessage('New chapter number must be a positive integer'),
  ]),
  asyncHandler(async (req, res) => {
    const chapterId = parseInt(req.params.id);
    const { new_chapter_number } = req.body;
    
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      throw createCustomError(`Chapter with ID ${chapterId} not found`, 404);
    }
    
    const reorderedChapter = await chapter.reorder(new_chapter_number);
    
    res.json({
      success: true,
      data: reorderedChapter.toJSON(),
      message: `Chapter "${reorderedChapter.title}" reordered to position ${new_chapter_number}`,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/chapters/:id/pages - Get paginated content for a chapter
router.get('/:id/pages',
  validateRequest([
    ...idValidation,
    query('words_per_page')
      .optional()
      .isInt({ min: 500, max: 5000 })
      .withMessage('Words per page must be between 500 and 5000'),
  ]),
  asyncHandler(async (req, res) => {
    const chapterId = parseInt(req.params.id);
    const wordsPerPage = parseInt(req.query.words_per_page as string) || 2000;
    
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      throw createCustomError(`Chapter with ID ${chapterId} not found`, 404);
    }
    
    const pages = Chapter.splitIntoPages(chapter.content, wordsPerPage);
    
    res.json({
      success: true,
      data: {
        chapter: {
          id: chapter.id,
          title: chapter.title,
          chapter_number: chapter.chapter_number,
          total_words: chapter.word_count,
          total_characters: chapter.character_count,
        },
        pagination: {
          total_pages: pages.length,
          words_per_page: wordsPerPage,
          pages: pages.map((content, index) => ({
            page_number: index + 1,
            content,
            word_count: Chapter.countWords(content),
            character_count: Chapter.countCharacters(content),
          })),
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/chapters/:id/statistics - Get chapter statistics
router.get('/:id/statistics',
  validateRequest(idValidation),
  asyncHandler(async (req, res) => {
    const chapterId = parseInt(req.params.id);
    
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      throw createCustomError(`Chapter with ID ${chapterId} not found`, 404);
    }
    
    const paragraphs = chapter.content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const sentences = chapter.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    res.json({
      success: true,
      data: {
        id: chapter.id,
        title: chapter.title,
        chapter_number: chapter.chapter_number,
        word_count: chapter.word_count,
        character_count: chapter.character_count,
        paragraph_count: paragraphs.length,
        sentence_count: sentences.length,
        average_words_per_paragraph: paragraphs.length > 0 ? Math.round(chapter.word_count / paragraphs.length) : 0,
        average_words_per_sentence: sentences.length > 0 ? Math.round(chapter.word_count / sentences.length) : 0,
        estimated_reading_time_minutes: Math.ceil(chapter.word_count / 200), // Average 200 words per minute
        pages_at_2000_words: Math.ceil(chapter.word_count / 2000),
        created: chapter.created_at,
        last_modified: chapter.updated_at,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/books/:bookId/chapters/:chapterNumber - Get chapter by book and number
router.get('/books/:bookId/chapters/:chapterNumber',
  validateRequest([
    ...bookIdValidation,
    param('chapterNumber')
      .isInt({ min: 1 })
      .withMessage('Chapter number must be a positive integer'),
  ]),
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.bookId);
    const chapterNumber = parseInt(req.params.chapterNumber);
    
    // Verify book exists
    const book = await Book.findById(bookId);
    if (!book) {
      throw createCustomError(`Book with ID ${bookId} not found`, 404);
    }
    
    const chapter = await Chapter.findByBookIdAndNumber(bookId, chapterNumber);
    if (!chapter) {
      throw createCustomError(`Chapter ${chapterNumber} not found in book "${book.title}"`, 404);
    }
    
    res.json({
      success: true,
      data: chapter.toJSON(),
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
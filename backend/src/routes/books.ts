import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { Book } from '../models/Book.js';
import { validateRequest, asyncHandler } from '../middleware/validation.js';
import { createCustomError } from '../middleware/errorHandler.js';
import { exportBook, ExportFormat } from '../utils/exportService.js';

const router = Router();

// Validation schemas
const bookValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('author')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Author must be between 1 and 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Description must not exceed 10,000 characters'),
];

const bookUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Author must be between 1 and 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Description must not exceed 10,000 characters'),
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Book ID must be a positive integer'),
];

const exportValidation = [
  body('format')
    .isIn(['txt', 'markdown'])
    .withMessage('Format must be either "txt" or "markdown"'),
];

// GET /api/books - List all books
router.get('/', 
  query('author').optional().trim(),
  query('search').optional().trim(),
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const { author, search } = req.query;
    
    let books: Book[];
    
    if (author) {
      books = await Book.findByAuthor(author as string);
    } else {
      books = await Book.findAll();
    }
    
    // Simple search implementation
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      books = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        (book.description && book.description.toLowerCase().includes(searchTerm))
      );
    }
    
    res.json({
      success: true,
      data: books.map(book => book.toJSON()),
      count: books.length,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/books/:id - Get a specific book
router.get('/:id',
  validateRequest(idValidation),
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    const book = await Book.findById(bookId);
    
    if (!book) {
      throw createCustomError(`Book with ID ${bookId} not found`, 404);
    }
    
    res.json({
      success: true,
      data: book.toJSON(),
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/books/:id/with-chapters - Get a book with its chapters
router.get('/:id/with-chapters',
  validateRequest(idValidation),
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    const book = await Book.findById(bookId);
    
    if (!book) {
      throw createCustomError(`Book with ID ${bookId} not found`, 404);
    }
    
    const chapters = await book.getChapters();
    
    res.json({
      success: true,
      data: {
        ...book.toJSON(),
        chapters: chapters.map(chapter => chapter.toJSON()),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/books - Create a new book
router.post('/',
  validateRequest(bookValidation),
  asyncHandler(async (req, res) => {
    const { title, author, description } = req.body;
    
    const book = await Book.create({
      title,
      author,
      description,
    });
    
    res.status(201).json({
      success: true,
      data: book.toJSON(),
      message: `Book "${title}" created successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// PUT /api/books/:id - Update a book
router.put('/:id',
  validateRequest([...idValidation, ...bookUpdateValidation]),
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    const updates = req.body;
    
    const book = await Book.findById(bookId);
    if (!book) {
      throw createCustomError(`Book with ID ${bookId} not found`, 404);
    }
    
    const updatedBook = await book.update(updates);
    
    res.json({
      success: true,
      data: updatedBook.toJSON(),
      message: `Book "${updatedBook.title}" updated successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// DELETE /api/books/:id - Delete a book
router.delete('/:id',
  validateRequest(idValidation),
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    
    const book = await Book.findById(bookId);
    if (!book) {
      throw createCustomError(`Book with ID ${bookId} not found`, 404);
    }
    
    const bookTitle = book.title;
    await book.delete();
    
    res.json({
      success: true,
      message: `Book "${bookTitle}" deleted successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/books/:id/statistics - Get book statistics
router.get('/:id/statistics',
  validateRequest(idValidation),
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    
    const book = await Book.findById(bookId);
    if (!book) {
      throw createCustomError(`Book with ID ${bookId} not found`, 404);
    }
    
    const chapters = await book.getChapters();
    
    res.json({
      success: true,
      data: {
        id: book.id,
        title: book.title,
        author: book.author,
        totalChapters: book.chapter_count,
        totalWords: book.word_count,
        totalCharacters: book.character_count,
        averageWordsPerChapter: chapters.length > 0 ? Math.round(book.word_count / chapters.length) : 0,
        chapters: chapters.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          chapterNumber: chapter.chapter_number,
          wordCount: chapter.word_count,
          characterCount: chapter.character_count,
        })),
        created: book.created_at,
        lastModified: book.updated_at,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/books/:id/export - Export a book
router.post('/:id/export',
  validateRequest([...idValidation, ...exportValidation]),
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    const { format } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      throw createCustomError(`Book with ID ${bookId} not found`, 404);
    }

    const chapters = await book.getChapters();

    const exportResult = await exportBook(book, chapters, format as ExportFormat);

    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Type', exportResult.mimeType);

    res.json({
      success: true,
      data: {
        filename: exportResult.filename,
        content: exportResult.content,
        format: exportResult.format,
        size: exportResult.content.length,
      },
      message: `Book "${book.title}" exported successfully as ${format.toUpperCase()}`,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { DictionaryTerm, DictionaryCategory } from '../models/DictionaryTerm.js';
import { validateRequest, asyncHandler } from '../middleware/validation.js';
import { createCustomError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const termValidation = [
  body('term')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Term must be between 1 and 255 characters')
    .matches(/^[a-zA-Z0-9\s\-']+$/)
    .withMessage('Term can only contain letters, numbers, spaces, hyphens, and apostrophes'),
  body('category')
    .optional()
    .isIn(['proper_noun', 'technical_term', 'character_name', 'place_name', 'custom'])
    .withMessage('Category must be one of: proper_noun, technical_term, character_name, place_name, custom'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
];

const termUpdateValidation = [
  body('term')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Term must be between 1 and 255 characters')
    .matches(/^[a-zA-Z0-9\s\-']+$/)
    .withMessage('Term can only contain letters, numbers, spaces, hyphens, and apostrophes'),
  body('category')
    .optional()
    .isIn(['proper_noun', 'technical_term', 'character_name', 'place_name', 'custom'])
    .withMessage('Category must be one of: proper_noun, technical_term, character_name, place_name, custom'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Term ID must be a positive integer'),
];

// GET /api/dictionary/terms - Get dictionary terms with filtering
router.get('/terms',
  query('category').optional().isIn(['proper_noun', 'technical_term', 'character_name', 'place_name', 'custom']),
  query('active').optional().isBoolean(),
  query('user_added').optional().isBoolean(),
  query('search').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('offset').optional().isInt({ min: 0 }),
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const {
      category,
      active,
      user_added,
      search,
      limit = 50,
      offset = 0,
    } = req.query;

    const options: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (category) options.category = category as DictionaryCategory;
    if (active !== undefined) options.isActive = active === 'true';
    if (user_added !== undefined) options.isUserAdded = user_added === 'true';
    if (search) options.search = search as string;

    const [terms, total] = await Promise.all([
      DictionaryTerm.findAll(options),
      DictionaryTerm.countAll(options),
    ]);

    res.json({
      success: true,
      data: terms.map(term => term.toJSON()),
      pagination: {
        total,
        limit: options.limit,
        offset: options.offset,
        has_more: total > options.offset + options.limit,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/dictionary/terms/:id - Get a specific term
router.get('/terms/:id',
  validateRequest(idValidation),
  asyncHandler(async (req, res) => {
    const termId = parseInt(req.params.id);
    const term = await DictionaryTerm.findById(termId);
    
    if (!term) {
      throw createCustomError(`Dictionary term with ID ${termId} not found`, 404);
    }
    
    res.json({
      success: true,
      data: term.toJSON(),
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/dictionary/terms - Create a new term
router.post('/terms',
  validateRequest(termValidation),
  asyncHandler(async (req, res) => {
    const { term, category, is_active } = req.body;
    
    const dictionaryTerm = await DictionaryTerm.create({
      term,
      category: category || 'custom',
      is_active: is_active !== undefined ? is_active : true,
    });
    
    res.status(201).json({
      success: true,
      data: dictionaryTerm.toJSON(),
      message: `Dictionary term "${term}" created successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// PUT /api/dictionary/terms/:id - Update a term
router.put('/terms/:id',
  validateRequest([...idValidation, ...termUpdateValidation]),
  asyncHandler(async (req, res) => {
    const termId = parseInt(req.params.id);
    const updates = req.body;
    
    const term = await DictionaryTerm.findById(termId);
    if (!term) {
      throw createCustomError(`Dictionary term with ID ${termId} not found`, 404);
    }
    
    const updatedTerm = await term.update(updates);
    
    res.json({
      success: true,
      data: updatedTerm.toJSON(),
      message: `Dictionary term "${updatedTerm.term}" updated successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// DELETE /api/dictionary/terms/:id - Delete a term
router.delete('/terms/:id',
  validateRequest(idValidation),
  asyncHandler(async (req, res) => {
    const termId = parseInt(req.params.id);
    
    const term = await DictionaryTerm.findById(termId);
    if (!term) {
      throw createCustomError(`Dictionary term with ID ${termId} not found`, 404);
    }
    
    const termText = term.term;
    await term.delete();
    
    res.json({
      success: true,
      message: `Dictionary term "${termText}" deleted successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/dictionary/terms/bulk - Create multiple terms
router.post('/terms/bulk',
  body('terms').isArray({ min: 1 }).withMessage('Terms must be a non-empty array'),
  body('terms.*.term')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Each term must be between 1 and 255 characters'),
  body('skip_duplicates').optional().isBoolean(),
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const { terms, skip_duplicates = true } = req.body;
    
    const results = await DictionaryTerm.addBulkTerms(terms, skip_duplicates);
    
    res.json({
      success: true,
      data: results.map(term => term.toJSON()),
      message: `${results.length} dictionary terms created successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// PUT /api/dictionary/terms/:id/toggle - Toggle term active status
router.put('/terms/:id/toggle',
  validateRequest(idValidation),
  asyncHandler(async (req, res) => {
    const termId = parseInt(req.params.id);
    
    const term = await DictionaryTerm.findById(termId);
    if (!term) {
      throw createCustomError(`Dictionary term with ID ${termId} not found`, 404);
    }
    
    const updatedTerm = await term.toggleActive();
    
    res.json({
      success: true,
      data: updatedTerm.toJSON(),
      message: `Dictionary term "${updatedTerm.term}" ${updatedTerm.is_active ? 'activated' : 'deactivated'}`,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/dictionary/statistics - Get dictionary statistics
router.get('/statistics',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const stats = await DictionaryTerm.getStatistics();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/dictionary/categories - Get valid categories
router.get('/categories',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const categories = DictionaryTerm.getValidCategories();
    
    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/dictionary/spell-check-terms - Get active terms for spell checking
router.get('/spell-check-terms',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const terms = await DictionaryTerm.getActiveTermsForSpellCheck();
    
    res.json({
      success: true,
      data: terms,
      count: terms.length,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
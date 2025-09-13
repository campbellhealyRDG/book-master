import { Router } from 'express';
import { body, param } from 'express-validator';
import { UserPreferences } from '../models/UserPreferences.js';
import { validateRequest, asyncHandler } from '../middleware/validation.js';
import { createCustomError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const preferenceKeyValidation = [
  param('key')
    .isIn(['font', 'editor', 'app', 'lastOpenBook', 'lastOpenChapter', 'customDictionaryEnabled', 'recentFiles'])
    .withMessage('Invalid preference key'),
];

const setPreferenceValidation = [
  body('value')
    .notEmpty()
    .withMessage('Preference value is required'),
];

// GET /api/preferences - Get all preferences
router.get('/',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const preferences = await UserPreferences.getAll();
    
    res.json({
      success: true,
      data: preferences,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/preferences/:key - Get a specific preference
router.get('/:key',
  validateRequest(preferenceKeyValidation),
  asyncHandler(async (req, res) => {
    const key = req.params.key;
    const value = await UserPreferences.get(key);
    
    if (value === null) {
      throw createCustomError(`Preference "${key}" not found`, 404);
    }
    
    res.json({
      success: true,
      data: {
        key,
        value,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// PUT /api/preferences/:key - Set a preference
router.put('/:key',
  validateRequest([...preferenceKeyValidation, ...setPreferenceValidation]),
  asyncHandler(async (req, res) => {
    const key = req.params.key;
    const { value } = req.body;
    
    const preference = await UserPreferences.set(key, value);
    
    res.json({
      success: true,
      data: {
        key,
        value: preference.getParsedValue(),
      },
      message: `Preference "${key}" updated successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// DELETE /api/preferences/:key - Delete a preference
router.delete('/:key',
  validateRequest(preferenceKeyValidation),
  asyncHandler(async (req, res) => {
    const key = req.params.key;
    
    // Check if preference exists
    const value = await UserPreferences.get(key);
    if (value === null) {
      throw createCustomError(`Preference "${key}" not found`, 404);
    }
    
    await UserPreferences.delete(key);
    
    res.json({
      success: true,
      message: `Preference "${key}" deleted successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/preferences/initialize - Initialize default preferences
router.post('/initialize',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    await UserPreferences.initializeDefaults();
    const preferences = await UserPreferences.getAll();
    
    res.json({
      success: true,
      data: preferences,
      message: 'Default preferences initialized successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Convenience endpoints for specific preference types

// GET /api/preferences/font - Get font preferences
router.get('/font',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const fontPrefs = await UserPreferences.getFontPreferences();
    
    res.json({
      success: true,
      data: fontPrefs,
      timestamp: new Date().toISOString(),
    });
  })
);

// PUT /api/preferences/font - Set font preferences
router.put('/font',
  body('fontFamily').isString().isLength({ min: 1 }).withMessage('Font family is required'),
  body('fontSize').isInt({ min: 8, max: 72 }).withMessage('Font size must be between 8 and 72'),
  body('lineHeight').isFloat({ min: 1, max: 3 }).withMessage('Line height must be between 1 and 3'),
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const fontPrefs = req.body;
    await UserPreferences.setFontPreferences(fontPrefs);
    
    res.json({
      success: true,
      data: fontPrefs,
      message: 'Font preferences updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/preferences/editor - Get editor preferences
router.get('/editor',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const editorPrefs = await UserPreferences.getEditorPreferences();
    
    res.json({
      success: true,
      data: editorPrefs,
      timestamp: new Date().toISOString(),
    });
  })
);

// PUT /api/preferences/editor - Set editor preferences
router.put('/editor',
  body('theme').isIn(['light', 'dark']).withMessage('Theme must be light or dark'),
  body('showLineNumbers').isBoolean().withMessage('Show line numbers must be a boolean'),
  body('wordWrap').isBoolean().withMessage('Word wrap must be a boolean'),
  body('spellCheckEnabled').isBoolean().withMessage('Spell check enabled must be a boolean'),
  body('autoSaveInterval').isInt({ min: 10, max: 300 }).withMessage('Auto save interval must be between 10 and 300 seconds'),
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const editorPrefs = req.body;
    await UserPreferences.setEditorPreferences(editorPrefs);
    
    res.json({
      success: true,
      data: editorPrefs,
      message: 'Editor preferences updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/preferences/app - Get app preferences
router.get('/app',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const appPrefs = await UserPreferences.getAppPreferences();
    
    res.json({
      success: true,
      data: appPrefs,
      timestamp: new Date().toISOString(),
    });
  })
);

// PUT /api/preferences/app - Set app preferences
router.put('/app',
  body('sidebarCollapsed').isBoolean().withMessage('Sidebar collapsed must be a boolean'),
  body('defaultExportFormat').isIn(['txt', 'markdown']).withMessage('Default export format must be txt or markdown'),
  body('confirmDeleteActions').isBoolean().withMessage('Confirm delete actions must be a boolean'),
  body('showWordCount').isBoolean().withMessage('Show word count must be a boolean'),
  body('showCharacterCount').isBoolean().withMessage('Show character count must be a boolean'),
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const appPrefs = req.body;
    await UserPreferences.setAppPreferences(appPrefs);
    
    res.json({
      success: true,
      data: appPrefs,
      message: 'App preferences updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/preferences/recent-files/:bookId - Add book to recent files
router.post('/recent-files/:bookId',
  param('bookId').isInt({ min: 1 }).withMessage('Book ID must be a positive integer'),
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.bookId);
    
    await UserPreferences.addRecentFile(bookId);
    const recentFiles = await UserPreferences.getRecentFiles();
    
    res.json({
      success: true,
      data: recentFiles,
      message: 'Recent files updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/preferences/recent-files - Get recent files
router.get('/recent-files',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const recentFiles = await UserPreferences.getRecentFiles();
    
    res.json({
      success: true,
      data: recentFiles,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
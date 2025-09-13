import { Router } from 'express';
import { body, query } from 'express-validator';
import { Scratchpad } from '../models/Scratchpad.js';
import { validateRequest, asyncHandler } from '../middleware/validation.js';

const router = Router();

// Validation schemas
const contentValidation = [
  body('content')
    .isLength({ max: 1000000 })
    .withMessage('Content must not exceed 1,000,000 characters'),
];

const searchValidation = [
  query('query')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query is required'),
  query('case_sensitive')
    .optional()
    .isBoolean()
    .withMessage('Case sensitive must be a boolean'),
];

// GET /api/scratchpad - Get scratchpad content
router.get('/',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const scratchpad = await Scratchpad.get();
    
    res.json({
      success: true,
      data: scratchpad.toJSONWithStats(),
      timestamp: new Date().toISOString(),
    });
  })
);

// PUT /api/scratchpad - Update scratchpad content
router.put('/',
  validateRequest(contentValidation),
  asyncHandler(async (req, res) => {
    const { content } = req.body;
    
    const scratchpad = await Scratchpad.update(content || '');
    
    res.json({
      success: true,
      data: scratchpad.toJSONWithStats(),
      message: 'Scratchpad updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/scratchpad/clear - Clear scratchpad content
router.post('/clear',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const scratchpad = await Scratchpad.clear();
    
    res.json({
      success: true,
      data: scratchpad.toJSONWithStats(),
      message: 'Scratchpad cleared successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/scratchpad/append - Append text to scratchpad
router.post('/append',
  validateRequest(contentValidation.map(validation => 
    validation.withMessage('Appended content must not exceed 1,000,000 characters')
  )),
  asyncHandler(async (req, res) => {
    const { content } = req.body;
    
    const scratchpad = await Scratchpad.append(content || '');
    
    res.json({
      success: true,
      data: scratchpad.toJSONWithStats(),
      message: 'Content appended to scratchpad successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/scratchpad/prepend - Prepend text to scratchpad
router.post('/prepend',
  validateRequest(contentValidation.map(validation => 
    validation.withMessage('Prepended content must not exceed 1,000,000 characters')
  )),
  asyncHandler(async (req, res) => {
    const { content } = req.body;
    
    const scratchpad = await Scratchpad.prepend(content || '');
    
    res.json({
      success: true,
      data: scratchpad.toJSONWithStats(),
      message: 'Content prepended to scratchpad successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/scratchpad/add-note - Add a timestamped note
router.post('/add-note',
  body('note').trim().isLength({ min: 1 }).withMessage('Note content is required'),
  body('add_timestamp').optional().isBoolean().withMessage('Add timestamp must be a boolean'),
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const { note, add_timestamp = true } = req.body;
    
    const scratchpad = await Scratchpad.addNote(note, add_timestamp);
    
    res.json({
      success: true,
      data: scratchpad.toJSONWithStats(),
      message: 'Note added to scratchpad successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/scratchpad/add-separator - Add a separator line
router.post('/add-separator',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const scratchpad = await Scratchpad.addSeparator();
    
    res.json({
      success: true,
      data: scratchpad.toJSONWithStats(),
      message: 'Separator added to scratchpad successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/scratchpad/search - Search scratchpad content
router.get('/search',
  validateRequest(searchValidation),
  asyncHandler(async (req, res) => {
    const { query, case_sensitive = false } = req.query;
    
    const results = await Scratchpad.search(
      query as string, 
      case_sensitive === 'true'
    );
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/scratchpad/statistics - Get scratchpad statistics
router.get('/statistics',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const stats = await Scratchpad.getStatistics();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/scratchpad/backup - Create a backup of scratchpad content
router.get('/backup',
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const backupContent = await Scratchpad.backup();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="scratchpad-backup-${timestamp}.txt"`);
    res.send(backupContent);
  })
);

// POST /api/scratchpad/restore - Restore scratchpad from backup
router.post('/restore',
  body('backup_content').isString().withMessage('Backup content must be a string'),
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const { backup_content } = req.body;
    
    const scratchpad = await Scratchpad.restore(backup_content);
    
    res.json({
      success: true,
      data: scratchpad.toJSONWithStats(),
      message: 'Scratchpad restored from backup successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/scratchpad/export - Export scratchpad content
router.get('/export',
  query('format').optional().isIn(['txt', 'markdown']).withMessage('Format must be txt or markdown'),
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const format = (req.query.format as 'txt' | 'markdown') || 'txt';
    
    const exportData = await Scratchpad.exportContent(format);
    
    res.setHeader('Content-Type', exportData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.content);
  })
);

// POST /api/scratchpad/load-template - Load a template
router.post('/load-template',
  body('template').isIn(['daily-notes', 'meeting-notes', 'ideas', 'todo']).withMessage('Invalid template'),
  validateRequest([]),
  asyncHandler(async (req, res) => {
    const { template } = req.body;
    
    const scratchpad = await Scratchpad.loadTemplate(template);
    
    res.json({
      success: true,
      data: scratchpad.toJSONWithStats(),
      message: `Template "${template}" loaded successfully`,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
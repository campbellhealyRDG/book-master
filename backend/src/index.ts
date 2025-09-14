import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import booksRouter from './routes/books.js';
import chaptersRouter from './routes/chapters.js';
import dictionaryRouter from './routes/dictionary.js';
import preferencesRouter from './routes/preferences.js';
import scratchpadRouter from './routes/scratchpad.js';

// Initialize environment variables
dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '8000');
const HOST = process.env.HOST || '0.0.0.0';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Health check endpoint (outside rate limiting)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API documentation endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Book Master API',
    version: '1.0.0',
    description: 'Professional British English book editing application API',
    endpoints: {
      books: {
        description: 'Book management endpoints',
        routes: [
          'GET /api/books - List all books',
          'GET /api/books/:id - Get specific book',
          'GET /api/books/:id/with-chapters - Get book with chapters',
          'POST /api/books - Create new book',
          'PUT /api/books/:id - Update book',
          'DELETE /api/books/:id - Delete book',
          'GET /api/books/:id/statistics - Get book statistics',
        ],
      },
      chapters: {
        description: 'Chapter management endpoints',
        routes: [
          'GET /api/books/:bookId/chapters - Get chapters for book',
          'POST /api/books/:bookId/chapters - Create new chapter',
          'GET /api/chapters/:id - Get specific chapter',
          'PUT /api/chapters/:id - Update chapter',
          'DELETE /api/chapters/:id - Delete chapter',
          'PUT /api/chapters/:id/reorder - Reorder chapter',
          'GET /api/chapters/:id/pages - Get paginated content',
          'GET /api/chapters/:id/statistics - Get chapter statistics',
        ],
      },
      dictionary: {
        description: 'Dictionary management endpoints',
        routes: [
          'GET /api/dictionary/terms - List dictionary terms',
          'POST /api/dictionary/terms - Create new term',
          'GET /api/dictionary/terms/:id - Get specific term',
          'PUT /api/dictionary/terms/:id - Update term',
          'DELETE /api/dictionary/terms/:id - Delete term',
          'POST /api/dictionary/terms/bulk - Create multiple terms',
          'GET /api/dictionary/statistics - Get dictionary statistics',
        ],
      },
      preferences: {
        description: 'User preferences management',
        routes: [
          'GET /api/preferences - Get all preferences',
          'GET /api/preferences/:key - Get specific preference',
          'PUT /api/preferences/:key - Set preference',
          'DELETE /api/preferences/:key - Delete preference',
          'POST /api/preferences/initialize - Initialize defaults',
        ],
      },
      scratchpad: {
        description: 'Global scratchpad functionality',
        routes: [
          'GET /api/scratchpad - Get scratchpad content',
          'PUT /api/scratchpad - Update scratchpad',
          'POST /api/scratchpad/clear - Clear scratchpad',
          'POST /api/scratchpad/append - Append content',
          'GET /api/scratchpad/search - Search content',
          'GET /api/scratchpad/export - Export content',
        ],
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/books', booksRouter);
app.use('/api/chapters', chaptersRouter);
app.use('/api/dictionary', dictionaryRouter);
app.use('/api/preferences', preferencesRouter);
app.use('/api/scratchpad', scratchpadRouter);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Book Master API server running at http://${HOST}:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 Health check: http://${HOST}:${PORT}/health`);
  console.log(`📖 API docs: http://${HOST}:${PORT}/api`);
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default app;
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes placeholder
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Book Master API',
    version: '1.0.0',
    endpoints: {
      books: '/api/books',
      chapters: '/api/chapters',
      dictionary: '/api/dictionary',
      preferences: '/api/preferences',
      scratchpad: '/api/scratchpad'
    }
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Book Master API server running at http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
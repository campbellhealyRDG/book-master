# Backend API Infrastructure

**Feature Status**: ✅ Completed  
**Implementation Date**: September 2025  
**Version**: 1.0.0  
**Category**: Core Infrastructure  

## Overview

The Backend API Infrastructure provides a comprehensive RESTful API server for the Book Master application, implementing secure, scalable endpoints for book and manuscript management with British English language processing capabilities. Built with Express.js and TypeScript, the system offers robust data validation, error handling, and security features suitable for professional editorial workflows.

## Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 4.18.2
- **Database**: SQLite with better-sqlite3 driver
- **Validation**: express-validator with custom British English rules
- **Security**: Helmet.js, CORS, rate limiting
- **Testing**: Vitest with comprehensive test coverage
- **Build Tools**: TypeScript compiler, ESLint

### Project Structure
```
backend/
├── src/
│   ├── controllers/        # Business logic controllers
│   ├── middleware/         # Custom middleware (validation, error handling)
│   ├── routes/            # API route definitions
│   ├── database/          # Database models and migrations
│   ├── utils/             # Utility functions
│   ├── tests/             # Comprehensive test suites
│   └── index.ts          # Application entry point
├── database/              # SQLite database files
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── vitest.config.ts      # Test configuration
```

## Core Features

### 3.1 Express Server with Middleware

#### Security Implementation
The server implements enterprise-grade security measures:

**Helmet.js Configuration**:
- Content Security Policy (CSP) with restricted directives
- XSS protection and MIME type sniffing prevention
- DNS prefetch control and frameguard protection

**CORS Configuration**:
- Origin validation with environment-specific settings
- Credential support for authenticated requests
- Method and header restrictions for security

**Rate Limiting**:
- Configurable request limits (default: 100 requests per 15 minutes)
- IP-based throttling with standardised headers
- Graceful degradation with informative error messages

#### Request Processing
- **Body Parsing**: JSON and URL-encoded with 10MB limits
- **Compression**: Gzip compression for response optimisation
- **Logging**: Morgan middleware with environment-specific formats
- **Validation**: Express-validator integration with custom error handling

#### Health Monitoring
```http
GET /health
```
Returns comprehensive system status including:
- Server uptime and memory usage
- Environment configuration
- Timestamp for monitoring integration

### 3.2 Book Management API Endpoints

#### Book CRUD Operations

**List Books with Search and Filtering**
```http
GET /api/books?author=Smith&search=novel&sortBy=title&sortOrder=asc&page=1&limit=10
```
- Supports author filtering and full-text search
- Configurable sorting (title, author, created_at, updated_at)
- Pagination with metadata (total count, page info)

**Retrieve Specific Book**
```http
GET /api/books/{id}
```
- Returns complete book details with computed statistics
- Includes word count, character count, and chapter count

**Create New Book**
```http
POST /api/books
Content-Type: application/json

{
  "title": "The Canterbury Tales",
  "author": "Geoffrey Chaucer",
  "description": "Classic English literature collection"
}
```
- Validation: Title and author required (1-255 characters)
- Optional description (max 10,000 characters)
- Automatic timestamp generation

**Update Book**
```http
PUT /api/books/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Revised description"
}
```
- Partial updates supported
- Validation on provided fields only
- Automatic `updated_at` timestamp

**Delete Book**
```http
DELETE /api/books/{id}
```
- Cascade deletion of associated chapters
- Returns confirmation with deleted book details

#### Advanced Book Operations

**Book with Chapters**
```http
GET /api/books/{id}/with-chapters
```
- Returns book with all associated chapters
- Ordered by chapter number
- Includes chapter statistics

**Book Statistics**
```http
GET /api/books/{id}/statistics
```
- Comprehensive word and character counts
- Chapter count and average chapter length
- Reading time estimates

### 3.3 Chapter Management API Endpoints

#### Chapter CRUD Operations

**List Chapters for Book**
```http
GET /api/books/{bookId}/chapters?page=1&limit=10
```
- Pagination support with metadata
- Ordered by chapter number
- Includes individual chapter statistics

**Create New Chapter**
```http
POST /api/books/{bookId}/chapters
Content-Type: application/json

{
  "title": "Chapter One: The Beginning",
  "content": "It was the best of times, it was the worst of times..."
}
```
- Automatic chapter numbering
- British English content validation
- Word and character count calculation

**Update Chapter**
```http
PUT /api/chapters/{id}
Content-Type: application/json

{
  "content": "Revised chapter content with proper British spelling."
}
```
- Real-time word count updates
- Content validation for British English
- Automatic timestamp management

**Reorder Chapters**
```http
PUT /api/chapters/{id}/reorder
Content-Type: application/json

{
  "newPosition": 3
}
```
- Intelligent chapter renumbering
- Maintains sequential order
- Updates all affected chapters

#### Advanced Chapter Features

**Paginated Content Retrieval**
```http
GET /api/chapters/{id}/pages?page=1&wordsPerPage=2000
```
- Memory-efficient content pagination
- Configurable words per page (default: 2000)
- Smart paragraph boundary detection

**Chapter Statistics**
```http
GET /api/chapters/{id}/statistics
```
- Word and character counts
- Paragraph and sentence statistics
- Reading time estimates

### 3.4 Additional API Services

#### Dictionary Management
Comprehensive British English dictionary system:

```http
GET /api/dictionary/terms?category=spelling&isActive=true
POST /api/dictionary/terms/bulk
GET /api/dictionary/statistics
```
- Category-based term organisation
- Bulk import/export capabilities
- Usage statistics and analytics

#### User Preferences
Persistent user configuration management:

```http
GET /api/preferences
PUT /api/preferences/editorTheme
POST /api/preferences/initialise
```
- Typed preference validation
- Default value management
- Theme and editor configuration

#### Scratchpad Functionality
Global notes and template system:

```http
GET /api/scratchpad
PUT /api/scratchpad
POST /api/scratchpad/append
GET /api/scratchpad/search?query=notes
```
- Template-based content creation
- Search functionality with highlighting
- Export capabilities (Markdown, plain text)

## Security Considerations

### Input Validation and Sanitisation
- **Express-validator**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterised queries via better-sqlite3
- **XSS Protection**: Content sanitisation and CSP headers
- **Data Type Validation**: TypeScript interfaces with runtime checking

### Authentication and Authorisation
While the current implementation focuses on single-user local deployment, the architecture supports:
- Session-based authentication middleware
- Role-based access control
- API key validation for external integrations

### Data Protection
- **Local Storage**: All data remains on local Raspberry Pi
- **Encryption**: Database encryption support for sensitive content
- **Backup Security**: Secure backup and recovery procedures

## Performance Optimisations

### Response Time Targets
- **Standard Operations**: < 500ms response time
- **Search Operations**: < 1000ms for complex queries
- **Bulk Operations**: < 5000ms for batch processing

### Memory Management
- **Pagination**: Efficient handling of large manuscripts
- **Connection Pooling**: SQLite connection optimisation
- **Response Compression**: Gzip compression for large responses

### Caching Strategy
- **Query Result Caching**: For frequently accessed data
- **Static Content**: Efficient serving of documentation and assets
- **Database Indexing**: Optimised indexes for search operations

## Testing Infrastructure

### Test Coverage
Comprehensive test suites covering:
- **Unit Tests**: Individual endpoint functionality
- **Integration Tests**: Complete request-response cycles
- **Validation Tests**: Input sanitisation and error handling
- **Performance Tests**: Response time and memory usage

### Test Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/tests/setup.ts']
  }
});
```

### Database Testing
- **Test Isolation**: Separate database instances per test
- **Data Fixtures**: Consistent test data setup
- **Transaction Rollback**: Clean state between tests

## Deployment Configuration

### Environment Variables
```bash
# Server Configuration
PORT=8000
HOST=0.0.0.0
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database
DATABASE_PATH=./database/bookmaster.db
```

### Raspberry Pi Deployment
Optimised for Raspberry Pi 5 deployment:
- **Memory Usage**: < 256MB RAM under normal load
- **CPU Usage**: Efficient event-loop utilisation
- **Storage**: SQLite for minimal disk footprint

## API Response Formats

### Standard Response Structure
```typescript
// Success Response
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully",
  "timestamp": "2025-09-13T10:30:00.000Z"
}

// Error Response
{
  "success": false,
  "error": "ValidationError",
  "message": "Title must be between 1 and 255 characters",
  "details": {...},
  "timestamp": "2025-09-13T10:30:00.000Z"
}
```

### Pagination Format
```typescript
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Integration Guidelines

### Frontend Integration
The API is designed for seamless integration with the React frontend:
- **TypeScript Types**: Shared interfaces for type safety
- **Error Handling**: Consistent error formats for UI feedback
- **Real-time Updates**: WebSocket ready architecture

### External Tool Integration
Support for integration with:
- **Grammar Checkers**: API endpoints for content analysis
- **Publishing Platforms**: Export functionality with standard formats
- **Backup Services**: Automated backup integration points

## Monitoring and Logging

### Application Logging
- **Morgan Middleware**: HTTP request logging
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Response time and memory monitoring

### Health Monitoring
```http
GET /health
Response: {
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "used": 145678912,
    "total": 268435456
  },
  "environment": "production"
}
```

## Future Enhancements

### Planned Features
- **WebSocket Integration**: Real-time collaborative editing
- **Advanced Search**: Full-text search with relevance ranking
- **Export Formats**: PDF, EPUB, and Word document generation
- **Analytics Dashboard**: Usage statistics and performance metrics

### Scalability Considerations
- **Database Migration**: PostgreSQL support for multi-user scenarios
- **Microservices**: Service decomposition for horizontal scaling
- **API Versioning**: Backward compatibility for future updates

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Check process using port 8000
lsof -i :8000
# Kill process if necessary
kill -9 [PID]
```

**Database Connection Issues**
```bash
# Verify database permissions
ls -la database/
# Recreate database if corrupted
npm run migrate
```

**Memory Issues on Raspberry Pi**
```bash
# Monitor memory usage
htop
# Restart API service if needed
sudo systemctl restart bookmaster-api
```

### Performance Debugging
- **Response Time Analysis**: Use `/health` endpoint for metrics
- **Database Query Performance**: Enable SQLite query logging
- **Memory Leaks**: Monitor with Node.js built-in profiler

---

**Last Updated**: September 2025  
**Maintained By**: Development Team  
**Review Schedule**: Quarterly technical review  
**Support Contact**: [Internal documentation system]
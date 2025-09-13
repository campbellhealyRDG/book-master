# Project Structure and Core Infrastructure

## Feature Overview

The "Project Structure and Core Infrastructure" feature establishes the foundational architecture for the Book Master application - a professional British English book editing application designed for authors, publishers, and editorial professionals. This feature implements the complete development environment, database foundation, and basic application structure required for subsequent feature development.

## Feature Scope

This infrastructure feature encompasses:

- **Complete project directory structure** for frontend and backend components
- **Development environment configuration** with modern tooling and TypeScript support
- **Database architecture** with SQLite and comprehensive migration system
- **Build tools and development workflow** setup
- **Chrome green professional theme** foundation
- **Git repository structure** with appropriate ignore patterns
- **Environment configuration** for development and production deployment

## Technical Implementation

### Directory Structure

The project follows a clean three-tier architecture with separate frontend and backend components:

```
booker/
├── .claude/                 # Claude Code documentation and commands
│   ├── commands/           # Development automation commands
│   ├── docs/              # Feature documentation
│   └── specs/             # Project specifications
├── frontend/              # React TypeScript frontend application
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── dist/              # Build output
├── backend/               # Express TypeScript backend API
│   ├── src/               # Source code
│   ├── database/          # SQLite database files
│   └── dist/              # Build output
├── .env                   # Environment variables
├── .gitignore            # Git ignore patterns
└── README.md             # Project documentation
```

### Frontend Infrastructure

**Technology Stack:**
- **Framework:** React 18.2.0 with TypeScript
- **Build Tool:** Vite 5.0.8 for fast development and optimised builds
- **Styling:** TailwindCSS 3.3.6 with custom chrome green theme
- **State Management:** Zustand 4.4.7 for lightweight state management
- **HTTP Client:** Axios 1.6.2 for API communication
- **Query Management:** TanStack Query 5.13.4 for server state management
- **Testing:** Vitest with React Testing Library

**Key Configuration Features:**
- TypeScript strict mode enabled for type safety
- Path aliases configured (`@/` maps to `./src/`)
- Development server on port 5173 with API proxy to backend
- ESLint with React-specific rules and TypeScript support
- Chrome green colour palette with 10 shades (50-900)

**Chrome Green Theme Configuration:**
```javascript
colors: {
  'chrome-green': {
    50: '#f0fdf4',   // Lightest shade
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Primary shade
    600: '#16a34a',  // Header background
    700: '#15803d',
    800: '#166534',
    900: '#14532d',  // Darkest shade
  }
}
```

### Backend Infrastructure

**Technology Stack:**
- **Framework:** Express 4.18.2 with TypeScript
- **Database:** SQLite with better-sqlite3 9.2.2 driver
- **ORM:** Knex.js 3.1.0 for query building and migrations
- **Security:** Helmet, CORS, rate limiting
- **Development:** tsx for TypeScript execution and hot reload
- **Testing:** Vitest with Supertest for API testing

**Middleware Configuration:**
- **Security:** Helmet for security headers
- **CORS:** Configured for frontend communication (localhost:5173)
- **Compression:** gzip compression for responses
- **Rate Limiting:** 100 requests per 15-minute window
- **Logging:** Morgan for HTTP request logging
- **Body Parsing:** JSON and URL-encoded with 10MB limit

**Server Configuration:**
- Host: 0.0.0.0 (configurable via environment)
- Port: 8000 (configurable via environment)
- Health check endpoint at `/health`
- API discovery endpoint at `/api`

### Database Architecture

**Database Engine:** SQLite with better-sqlite3 driver for improved performance and reliability.

**Migration System:** Knex.js migration system with TypeScript support enables version-controlled database schema changes.

**Database Schema:**

#### Books Table
```sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  description TEXT,
  chapter_count INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  character_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Chapters Table
```sql
CREATE TABLE chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  chapter_number INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  character_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  UNIQUE(book_id, chapter_number)
);
```

#### Dictionary Terms Table
```sql
CREATE TABLE dictionary_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term VARCHAR(255) NOT NULL UNIQUE,
  category ENUM('proper_noun', 'technical_term', 'character_name', 'place_name', 'custom') DEFAULT 'custom',
  is_active BOOLEAN DEFAULT TRUE,
  is_user_added BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### User Preferences Table
```sql
CREATE TABLE user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preference_key VARCHAR(100) NOT NULL UNIQUE,
  preference_value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Scratchpad Table
```sql
CREATE TABLE scratchpad (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Development Workflow

**Package Management:**
- Both frontend and backend use npm with package-lock.json for dependency locking
- Development dependencies clearly separated from production dependencies
- Scripts configured for development, testing, building, and deployment

**TypeScript Configuration:**
- Strict TypeScript configuration with modern ES2022 target
- Path mapping configured for cleaner imports
- Source maps enabled for debugging
- Declaration files generated for type checking

**Development Scripts:**

**Frontend:**
```json
{
  "dev": "vite",                    // Development server
  "build": "tsc && vite build",     // Production build
  "preview": "vite preview",        // Preview production build
  "test": "vitest",                 // Run tests
  "lint": "eslint . --ext ts,tsx"   // Code linting
}
```

**Backend:**
```json
{
  "dev": "tsx watch src/index.ts",  // Development server with hot reload
  "build": "tsc",                   // Compile TypeScript
  "start": "node dist/index.js",    // Production server
  "migrate": "tsx src/database/migrate.ts", // Run database migrations
  "test": "vitest"                  // Run tests
}
```

### Environment Configuration

**Development Environment Variables:**
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Backend server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)
- `DATABASE_PATH`: SQLite database file path
- `CORS_ORIGIN`: Allowed CORS origin (default: http://localhost:5173)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

### Git Repository Structure

**Git Ignore Configuration:**
- Node.js dependencies and build artifacts
- Environment files and local configurations
- Database files and temporary files
- Editor-specific files
- Claude Code artifacts (except specifications)

**Branch Strategy Foundation:**
- Main branch for stable code
- Feature branches with `feature-` prefix
- Infrastructure supports merge/pull request workflow

## Integration Points

### Frontend-Backend Communication

**API Proxy Configuration:** Vite development server configured with proxy to backend API:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

**CORS Configuration:** Backend configured to accept requests from frontend development server:
```javascript
cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
})
```

### Database Integration

**Connection Configuration:** Knex.js configured with better-sqlite3 for optimal SQLite performance:
```javascript
const config: Knex.Config = {
  client: 'better-sqlite3',
  connection: {
    filename: absoluteDbPath,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, '../database/migrations'),
    extension: 'ts',
  },
};
```

### Testing Infrastructure

**Frontend Testing:**
- Vitest with jsdom environment for browser simulation
- React Testing Library for component testing
- Jest DOM matchers for enhanced assertions

**Backend Testing:**
- Vitest for unit testing
- Supertest for HTTP endpoint testing
- Coverage reporting configured

## Dependencies Overview

### Frontend Dependencies

**Core Framework:**
- `react`: ^18.2.0 - React framework
- `react-dom`: ^18.2.0 - React DOM rendering
- `react-router-dom`: ^6.20.1 - Client-side routing

**State and Data Management:**
- `zustand`: ^4.4.7 - Lightweight state management
- `@tanstack/react-query`: ^5.13.4 - Server state management
- `axios`: ^1.6.2 - HTTP client

**Styling and UI:**
- `tailwindcss`: ^3.3.6 - Utility-first CSS framework
- `clsx`: ^2.0.0 - Conditional class name utility

**Specialised Libraries:**
- `typo-js`: ^1.2.3 - British English spell checking
- `marked`: ^11.1.0 - Markdown parsing and rendering

### Backend Dependencies

**Core Framework:**
- `express`: ^4.18.2 - Web application framework
- `cors`: ^2.8.5 - Cross-origin resource sharing
- `helmet`: ^7.1.0 - Security middleware
- `compression`: ^1.7.4 - Response compression

**Database:**
- `better-sqlite3`: ^9.2.2 - SQLite database driver
- `knex`: ^3.1.0 - SQL query builder and migration tool

**Utilities:**
- `dotenv`: ^16.3.1 - Environment variable loading
- `morgan`: ^1.10.0 - HTTP request logging
- `express-rate-limit`: ^7.1.5 - Rate limiting middleware

## Setup Instructions

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd booker
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd ../backend
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   # Copy example environment files
   cp .env.example .env
   cd ../backend
   cp .env.example .env
   ```

5. **Run database migrations:**
   ```bash
   npm run migrate
   ```

6. **Start development servers:**
   ```bash
   # Terminal 1 - Backend API
   cd backend
   npm run dev

   # Terminal 2 - Frontend application
   cd frontend
   npm run dev
   ```

7. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Health check: http://localhost:8000/health

### Development Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature-<feature-name>
   ```

2. **Make changes and test:**
   ```bash
   # Run tests
   npm test

   # Check linting
   npm run lint

   # Build for production
   npm run build
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature-<feature-name>
   ```

## Quality Assurance

### Code Quality

- **TypeScript:** Strict type checking enabled across both frontend and backend
- **ESLint:** Configured with TypeScript and React-specific rules
- **Consistent formatting:** EditorConfig and ESLint rules ensure consistent code style

### Testing Strategy

- **Unit tests:** Individual component and function testing
- **Integration tests:** API endpoint testing with Supertest
- **Type checking:** TypeScript compiler ensures type safety
- **Build verification:** Production builds tested before deployment

### Performance Considerations

- **Vite build optimisation:** Tree shaking and code splitting
- **Compression middleware:** gzip compression for API responses
- **Rate limiting:** Protection against abuse and overload
- **SQLite optimisation:** better-sqlite3 driver for improved performance

## Deployment Readiness

### Production Configuration

- **Environment-based configuration:** All settings configurable via environment variables
- **Security headers:** Helmet middleware for production security
- **Error handling:** Comprehensive error handling with appropriate logging
- **Health checks:** Built-in health check endpoint for monitoring

### Raspberry Pi 5 Considerations

- **Cross-platform compatibility:** Configuration supports ARM architecture
- **Resource efficiency:** SQLite for minimal resource usage
- **Network configuration:** Configurable host and port settings
- **Service management:** Scripts compatible with systemd service management

## Supporting Documentation

### File Locations

- **Project specifications:** `.claude/specs/book-master/`
- **Requirements:** `.claude/specs/book-master/requirements.md`
- **Design documentation:** `.claude/specs/book-master/design.md`
- **Task tracking:** `.claude/specs/book-master/tasks.md`

### Development Commands

- **Feature documentation:** `.claude/commands/documentation/feature-documenter.md`
- **Code analysis:** `.claude/commands/development/analysis/`
- **Implementation support:** `.claude/commands/development/implementation/`

## Future Considerations

### Scalability

The infrastructure supports future enhancements including:
- Additional database tables through the migration system
- New API endpoints through the Express framework
- Frontend components through the React structure
- Third-party service integrations

### Maintenance

- **Database migrations:** Version-controlled schema changes
- **Dependency updates:** Regular security and feature updates
- **Performance monitoring:** Health check and logging infrastructure
- **Backup strategy:** SQLite database backup considerations

## British English Standards

All documentation, code comments, and user-facing text follow British English conventions as specified in the project requirements. This includes spelling (colour not color, organised not organized), terminology, and formatting standards appropriate for the target audience of British authors and publishers.

---

**Feature Status:** ✅ Complete  
**Implementation Date:** September 2025  
**Next Phase:** Database schema and data models implementation  
**Dependencies:** None (foundational feature)  
**Testing Status:** Infrastructure testing complete, ready for feature development
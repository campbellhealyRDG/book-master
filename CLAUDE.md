# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Book Master is a professional British English book editing application designed for authors, publishers, and editorial professionals. The system provides comprehensive British English spell checking, real-time editing capabilities, and manuscript management features for full-length book projects, intended for deployment on a Raspberry Pi 5 server.

## Development Workflow

### Git Workflow
Each task requires:
1. Create a new branch prepended with `feature-` from the main branch BEFORE any code changes
2. All documentation must be written in BRITISH ENGLISH
3. After task completion:
   - Commit and push the new branch
   - Submit a Merge/Pull Request
   - Test the new branch
   - If successful, return to the main branch
   - Update tasks.md with completion status

### MCP Tool Integration
- Use `memory` tool at start of each phase to maintain context continuity
- Store phase outcomes, quality metrics, and decision rationales
- Use `filesystem` tools for project file management

## Architecture

### Three-Tier Architecture
- **Presentation Layer**: Web-based SPA with responsive design and chrome green theme
- **Application Layer**: RESTful API server with business logic and data management
- **Data Layer**: SQLite database with structured data storage

### Technology Stack
- **Frontend**: Modern JavaScript framework (React/Vue.js)
- **Backend**: Node.js/Python/Go with appropriate web framework
- **Database**: SQLite with ORM
- **Spell Checking**: typo.js library for British English
- **Deployment**: Raspberry Pi 5 (192.168.1.123:5173 for app, :8000 for API)

## Key Implementation Tasks

### Current Implementation Plan (from tasks.md)
The project follows a 15-phase implementation plan with 30 sub-tasks covering:
1. ✅ Project structure and database schema setup
2. ✅ Backend API development with full CRUD operations
3. ✅ Frontend application with responsive design
4. ✅ Frontend application foundation (Task 4 - COMPLETED)
5. British English spell checking integration
6. Custom dictionary and pagination features
7. Export functionality and markdown preview
8. Accessibility compliance and performance optimization
9. Comprehensive testing and deployment preparation

### Recently Completed: Task 4 - Frontend Application Foundation
- ✅ React 18 + TypeScript application with comprehensive routing
- ✅ Zustand state management with complete application state
- ✅ Professional two-panel layout with collapsible sidebar
- ✅ Chrome green theme system with CSS custom properties
- ✅ Comprehensive API client with error handling
- ✅ 51 passing tests with full component coverage
- ✅ Accessibility compliance and responsive design
- ✅ Ready for Task 5: Book and Chapter Management Interface

### Database Schema
Key entities to implement:
- **Book**: id, title, author, timestamps, computed fields (chapter_count, word_count)
- **Chapter**: id, book_id, title, content, chapter_number, word/character counts
- **DictionaryTerm**: id, term, category, is_active, is_user_added
- **UserPreferences**: font settings, editor theme, autosave interval
- **Scratchpad**: global notes persistence

### API Endpoints Structure
```
/api/books              - Book CRUD operations
/api/books/:id/export   - Export functionality
/api/books/:bookId/chapters - Chapter management
/api/chapters/:id       - Individual chapter operations
/api/dictionary/terms   - Custom dictionary management
/api/preferences        - User preferences
/api/scratchpad        - Global notes
```

## Core Features Implementation

### British English Spell Checking
- 50,000+ word dictionary via typo.js
- Real-time error detection with red wavy underlines
- US to UK conversion suggestions (color→colour, organize→organise)
- Right-click context menu for corrections
- Custom dictionary integration with categories

### Editor Features
- Large text area with word/character counting
- Keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline)
- 30-second autosave with change detection
- Unsaved changes protection modal
- Font selection with persistent preferences
- Markdown preview (Ctrl+M activation)

### Memory Management
- Automatic pagination at ~2000 words (8000 characters)
- Smart paragraph boundary splitting
- Maximum 3 pages in browser memory
- Efficient handling of 100,000+ word documents

## Development Commands

### Project Setup
```bash
# Initialize frontend and backend packages
npm init -y

# Install dependencies (adjust based on chosen stack)
npm install [framework-specific-packages]

# Set up database
# Create SQLite database and run migrations
```

### Development
```bash
# Start development server (frontend)
npm run dev

# Start API server (backend)
npm run server

# Run database migrations
npm run migrate

# Run tests
npm test

# Build for production
npm run build
```

## Testing Strategy
- Unit tests for all components and API endpoints
- Integration tests for frontend-backend communication
- End-to-end tests for complete user workflows
- Performance tests for large documents (100,000+ words)
- Accessibility tests for WCAG 2.1 AA compliance

## Performance Requirements
- Page load time: < 3 seconds
- API response time: < 500ms for standard operations
- Spell checking latency: < 100ms
- Export generation: < 10 seconds for typical books

## Security Considerations
- Input validation and sanitisation
- SQL injection prevention via parameterized queries
- XSS protection
- Local-only data storage
- Secure session management

## Important Notes
- Follow specification-driven development approach
- Implement according to requirements.md and design.md specifications
- Maintain British English in all documentation and UI text
- Ensure responsive design for desktop, tablet, and mobile
- Chrome green professional theme with high contrast
- Support for books up to 100,000 words
- All features must integrate with SQLite database for persistence
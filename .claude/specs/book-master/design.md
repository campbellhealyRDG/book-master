# Design Document

## Overview

Book Master is a professional British English book editing application that provides comprehensive manuscript management, real-time spell checking, and editing capabilities. The system follows a client-server architecture with a web-based frontend and RESTful API backend, deployed on Raspberry Pi 5 hardware for local network access.

The application serves authors, publishers, and editorial professionals who require consistent British English spelling standards and robust manuscript management features for full-length book projects.

## Architecture

### System Architecture

The application follows a three-tier architecture:

**Presentation Layer (Frontend)**
- Web-based single-page application (SPA)
- Responsive design supporting desktop, tablet, and mobile devices
- Chrome green professional theme with high contrast accessibility
- Client-side spell checking integration with typo.js library
- Local storage for user preferences and session data

**Application Layer (Backend)**
- RESTful API server providing business logic and data management
- Authentication and session management
- File export generation (TXT, Markdown formats)
- Integration with SQLite database for persistence

**Data Layer**
- SQLite database for structured data storage
- File system storage for exported documents
- Client-side caching for performance optimization

### Technology Stack

**Frontend Technologies**
- Modern JavaScript framework (React/Vue.js recommended)
- CSS-in-JS or CSS modules for styling system
- typo.js library for British English spell checking
- Markdown parsing library for preview functionality
- Local storage API for client-side persistence

**Backend Technologies**
- Node.js/Python/Go for API server implementation
- Express.js/FastAPI/Gin for web framework
- SQLite for database with appropriate ORM
- File system APIs for export functionality
- CORS middleware for cross-origin requests

**Infrastructure**
- Raspberry Pi 5 deployment environment
- Local network access (192.168.1.123)
- Development server on port 5173
- API server on port 8000

## Components and Interfaces

### Frontend Components

**Layout Components**
- `AppLayout`: Main two-panel layout container
- `Sidebar`: Collapsible left panel for book/chapter management
- `MainContent`: Primary content area with editor and toolbar
- `Toolbar`: Context-sensitive action buttons and controls

**Book Management Components**
- `BookList`: Display and management of user's books
- `BookCreator`: Modal for creating new books
- `BookExporter`: Export functionality with format selection
- `BookSelector`: Visual book selection with highlighting

**Chapter Management Components**
- `ChapterList`: Hierarchical chapter display within books
- `ChapterCreator`: Interface for adding new chapters
- `ChapterNavigator`: Chapter switching with unsaved changes protection

**Editor Components**
- `TextEditor`: Main editing interface with formatting support
- `SpellChecker`: Real-time British English spell checking overlay
- `EditorToolbar`: Formatting controls and editor state management
- `WordCounter`: Live word and character count display
- `PaginationControls`: Page navigation for large documents

**Utility Components**
- `FontSelector`: Curated font selection interface
- `DictionaryManager`: Custom dictionary management interface
- `Scratchpad`: Global notes interface with persistence
- `MarkdownPreview`: Real-time markdown rendering
- `ConfirmationDialog`: Reusable confirmation modals

### Backend API Endpoints

**Book Management API**
```
GET    /api/books              - List all books
POST   /api/books              - Create new book
GET    /api/books/:id          - Get book details
PUT    /api/books/:id          - Update book
DELETE /api/books/:id          - Delete book
POST   /api/books/:id/export   - Export book in specified format
```

**Chapter Management API**
```
GET    /api/books/:bookId/chapters     - List chapters for book
POST   /api/books/:bookId/chapters     - Create new chapter
GET    /api/chapters/:id               - Get chapter content
PUT    /api/chapters/:id               - Update chapter content
DELETE /api/chapters/:id               - Delete chapter
GET    /api/chapters/:id/pages         - Get paginated chapter content
```

**Dictionary Management API**
```
GET    /api/dictionary/terms           - List custom dictionary terms
POST   /api/dictionary/terms           - Add new term
PUT    /api/dictionary/terms/:id       - Update term
DELETE /api/dictionary/terms/:id       - Delete term
GET    /api/dictionary/stats           - Get dictionary statistics
```

**User Preferences API**
```
GET    /api/preferences                - Get user preferences
PUT    /api/preferences                - Update preferences
GET    /api/scratchpad                 - Get scratchpad content
PUT    /api/scratchpad                 - Update scratchpad content
```

## Data Models

### Book Entity
```
Book {
  id: UUID (Primary Key)
  title: String (Required, Max 255 chars)
  author: String (Optional, Max 255 chars)
  created_at: DateTime
  updated_at: DateTime
  chapter_count: Integer (Computed)
  word_count: Integer (Computed)
}
```

### Chapter Entity
```
Chapter {
  id: UUID (Primary Key)
  book_id: UUID (Foreign Key -> Book.id)
  title: String (Required, Max 255 chars)
  content: Text (Large text field)
  chapter_number: Integer (Auto-increment within book)
  word_count: Integer (Computed)
  character_count: Integer (Computed)
  created_at: DateTime
  updated_at: DateTime
}
```

### Dictionary Term Entity
```
DictionaryTerm {
  id: UUID (Primary Key)
  term: String (Required, Unique, Max 100 chars)
  category: Enum (General, Publishing, Technical, Names, Custom)
  is_active: Boolean (Default: true)
  is_user_added: Boolean (Default: false)
  created_at: DateTime
  updated_at: DateTime
}
```

### User Preferences Entity
```
UserPreferences {
  id: UUID (Primary Key)
  font_family: String (Default: 'Georgia')
  font_size: Integer (Default: 16)
  editor_theme: String (Default: 'chrome-green')
  autosave_interval: Integer (Default: 30 seconds)
  spell_check_enabled: Boolean (Default: true)
  created_at: DateTime
  updated_at: DateTime
}
```

### Scratchpad Entity
```
Scratchpad {
  id: UUID (Primary Key)
  content: Text (Large text field)
  updated_at: DateTime
}
```

## Error Handling

### Frontend Error Handling

**Network Errors**
- Display user-friendly messages for connection failures
- Implement retry mechanisms for failed API calls
- Graceful degradation when backend is unavailable
- Local storage fallback for critical user data

**Validation Errors**
- Real-time form validation with clear error messages
- Prevention of invalid data submission
- Clear indication of required fields and format requirements

**Spell Checking Errors**
- Graceful fallback when spell checking service fails
- User notification of spell checking status
- Option to continue editing without spell checking

### Backend Error Handling

**Database Errors**
- Transaction rollback for failed operations
- Detailed logging for debugging purposes
- Generic error messages to prevent information leakage
- Automatic retry for transient database issues

**File System Errors**
- Proper error handling for export operations
- Cleanup of temporary files on failure
- User notification of export failures with retry options

**Validation Errors**
- Comprehensive input validation on all endpoints
- Structured error responses with field-specific messages
- Prevention of SQL injection and other security vulnerabilities

## Testing Strategy

### Unit Testing
- Component-level testing for all React/Vue components
- API endpoint testing with mock data
- Business logic testing for spell checking and validation
- Database model testing with test fixtures

### Integration Testing
- Frontend-backend API integration testing
- Database integration testing with real SQLite instance
- Spell checking library integration testing
- File export functionality testing

### End-to-End Testing
- Complete user workflows from book creation to export
- Cross-browser compatibility testing
- Responsive design testing across device sizes
- Performance testing with large documents (100,000+ words)

### Performance Testing
- Load testing for concurrent users
- Memory usage testing with large documents
- Spell checking performance with extensive text
- Database query optimization validation

### Accessibility Testing
- Screen reader compatibility testing
- Keyboard navigation testing
- Color contrast validation
- WCAG 2.1 AA compliance verification

## Security Considerations

### Data Protection
- Local-only data storage with no external transmission
- Secure session management with appropriate timeouts
- Input sanitization to prevent XSS attacks
- SQL injection prevention through parameterized queries

### Authentication & Authorization
- Simple session-based authentication for local deployment
- CSRF protection for state-changing operations
- Rate limiting to prevent abuse
- Secure cookie configuration

### Privacy
- No external analytics or tracking
- Local storage of all user content
- Clear data retention policies
- User control over data export and deletion

## Performance Requirements

### Response Time Targets
- Page load time: < 3 seconds
- API response time: < 500ms for standard operations
- Spell checking latency: < 100ms for real-time feedback
- Export generation: < 10 seconds for typical books

### Scalability Targets
- Support for books up to 100,000 words
- Handle up to 20 concurrent chapters in memory
- Efficient pagination for large documents
- Memory cleanup for inactive content

### Optimization Strategies
- Client-side caching of frequently accessed data
- Lazy loading of chapter content
- Debounced autosave to reduce server load
- Efficient spell checking with worker threads
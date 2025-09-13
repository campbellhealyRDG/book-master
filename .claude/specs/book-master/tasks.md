# Book Master

## DO NOT EDIT FROM HERE

## **Command to start each request**

use memory **Always read the opening paragraph before starting a new task.**
use filesystem read_text_file(.claude\specs\book-master\tasks.md)
use the best mcp, and agents to STRICTLY follow all instructions and action each task.

##  Follow instructions exactly:

### For each task:

    - Create a new branch prepended with `feature-` from the main branch and switch to this new branch **Before any code change**.
    -  ALL DOCUMENTATION has to be written in BRITISH ENGLISH
    - On completing a feature use the .claude/commands/documentation/feature-documenter to document that feature in .claude/docs/features

## Exception Cases

- Only stack commits or branches when changes are truly dependent
- Group related changes only if they must be deployed together
- Security fixes are typically independent and should use separate branches

## After finishing the task 

- Use the best mcp, and agents to commit, push the new branch, 
- Submit a Merge/Pull Request. 
- Test the new branch, If successful Return to the main branch
- Update the tasks.md.
- Update the relevant `CLAUDE.md` files.

## Task Groups

- Update the status table in tasks.md after each task.
- Mark off the Quality Control Checkpoints when completed.

## MCP Tool Integration Protocol

### Memory Management
- **Use `memory` tool** at start of each phase to maintain context continuity
- Store phase outcomes, quality metrics, and decision rationales
- Track cross-document content mappings and consolidation decisions

## START EDIT FROM HERE

## Implementation Plan

- [x] 1. Set up project structure and core infrastructure ✅
  - Create directory structure for frontend and backend components
  - Initialize package.json files with required dependencies
  - Set up build tools and development environment configuration
  - Configure SQLite database connection and basic schema
  - _Requirements: All system requirements_

- [ ] 2. Implement database schema and data models
  - [ ] 2.1 Create database migration scripts for core entities
    - Write migration for Book entity with title, author, timestamps
    - Write migration for Chapter entity with book relationship
    - Write migration for DictionaryTerm entity with categories
    - Write migration for UserPreferences and Scratchpad entities
    - _Requirements: 1.2, 1.3, 3.1, 6.1_

  - [ ] 2.2 Implement data model classes with validation
    - Create Book model with title validation and computed fields
    - Create Chapter model with content handling and word counting
    - Create DictionaryTerm model with category validation
    - Create UserPreferences model with default values
    - _Requirements: 1.2, 1.3, 3.1_

- [ ] 3. Build core backend API infrastructure
  - [ ] 3.1 Set up Express/FastAPI server with middleware
    - Configure CORS for frontend communication
    - Set up request logging and error handling middleware
    - Implement basic routing structure for all API endpoints
    - Add request validation middleware
    - _Requirements: All backend requirements_

  - [ ] 3.2 Implement book management API endpoints
    - Code GET /api/books endpoint with book listing
    - Code POST /api/books endpoint with validation
    - Code PUT /api/books/:id endpoint for updates
    - Code DELETE /api/books/:id endpoint with cascade handling
    - Write unit tests for all book management endpoints
    - _Requirements: 1.2, 1.3_

  - [ ] 3.3 Implement chapter management API endpoints
    - Code GET /api/books/:bookId/chapters endpoint
    - Code POST /api/books/:bookId/chapters with auto-numbering
    - Code GET/PUT/DELETE /api/chapters/:id endpoints
    - Implement pagination for large chapter content
    - Write unit tests for chapter management endpoints
    - _Requirements: 1.1, 1.6_

- [ ] 4. Create frontend application foundation
  - [ ] 4.1 Set up React/Vue application with routing
    - Initialize frontend framework with TypeScript support
    - Configure routing for single-page application
    - Set up state management (Redux/Vuex/Context)
    - Implement API client with error handling
    - _Requirements: 7.1, 7.3_

  - [ ] 4.2 Implement core layout components
    - Create AppLayout component with two-panel design
    - Build Sidebar component with collapsible sections
    - Create MainContent area with responsive behavior
    - Implement chrome green theme with CSS variables
    - Write component tests for layout functionality
    - _Requirements: 7.1, 7.3_

- [ ] 5. Build book and chapter management interface
  - [ ] 5.1 Create book management components
    - Build BookList component with visual highlighting
    - Create BookCreator modal with form validation
    - Implement book selection state management
    - Add book deletion with confirmation dialog
    - Write tests for book management user interactions
    - _Requirements: 1.2, 1.3_

  - [ ] 5.2 Create chapter management components
    - Build ChapterList with hierarchical display
    - Create ChapterCreator with title specification
    - Implement chapter navigation with state management
    - Add chapter deletion with confirmation
    - Write tests for chapter management workflows
    - _Requirements: 1.1, 1.6_

- [ ] 6. Implement text editor with core functionality
  - [ ] 6.1 Build basic text editor component
    - Create TextEditor with large editing area
    - Implement word and character count display
    - Add undo/redo functionality
    - Support keyboard shortcuts for formatting (Ctrl+B, Ctrl+I, Ctrl+U)
    - Write tests for editor basic functionality
    - _Requirements: 4.1, 4.2_

  - [ ] 6.2 Add autosave functionality
    - Implement 30-second autosave intervals with change detection
    - Add manual save with Ctrl+S keyboard shortcut
    - Create unsaved changes protection for navigation
    - Build Save/Don't Save/Cancel modal dialog
    - Write tests for autosave and navigation protection
    - _Requirements: 4.1, 4.3_

- [ ] 7. Integrate British English spell checking
  - [ ] 7.1 Set up typo.js spell checking engine
    - Integrate typo.js library with British English dictionary
    - Implement real-time error detection and highlighting
    - Add visual indicators (red wavy underlines)
    - Create editor toggle for active/inactive states
    - Write tests for spell checking integration
    - _Requirements: 2.1, 2.2_

  - [ ] 7.2 Build spell checking user interface
    - Implement right-click context menu for corrections
    - Add multiple correction suggestions with capitalization
    - Create ignore word functionality for session
    - Build US to UK spelling conversion suggestions
    - Write tests for spell checking user interactions
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 8. Create custom dictionary management
  - [ ] 8.1 Build dictionary management API
    - Code GET /api/dictionary/terms endpoint with filtering
    - Code POST /api/dictionary/terms with validation
    - Code PUT/DELETE endpoints for term management
    - Implement dictionary statistics endpoint
    - Write unit tests for dictionary API endpoints
    - _Requirements: 3.1, 3.2_

  - [ ] 8.2 Create dictionary management interface
    - Build DictionaryManager component with term listing
    - Create term addition form with category selection
    - Implement term editing and deletion functionality
    - Add dictionary statistics display
    - Write tests for dictionary management interface
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 9. Implement pagination for large documents
  - [ ] 9.1 Add automatic pagination logic
    - Implement page creation at ~2000 words (8000 characters)
    - Add smart splitting at paragraph boundaries
    - Create memory management with 3-page limit
    - Build page navigation controls
    - Write tests for pagination functionality
    - _Requirements: 4.1, 7.1_

  - [ ] 9.2 Create pagination user interface
    - Build Previous/Next page buttons
    - Add page indicator (Page X of Y)
    - Implement keyboard navigation (Page Up/Down, Ctrl+Home/End)
    - Display word and character count per page
    - Write tests for pagination user interface
    - _Requirements: 4.1, 7.1_

- [ ] 10. Add advanced features
  - [ ] 10.1 Implement font selection system
    - Create FontSelector component with curated fonts
    - Add immediate preview in editor
    - Implement persistent font choice across sessions
    - Ensure cross-platform compatibility
    - Write tests for font selection functionality
    - _Requirements: 5.1, 5.2_

  - [ ] 10.2 Build scratchpad functionality
    - Create Scratchpad modal with large text area
    - Implement global persistence across books/chapters
    - Add save/cancel functionality with revert capability
    - Ensure survival through application restarts
    - Write tests for scratchpad persistence
    - _Requirements: 6.1, 6.2_

- [ ] 11. Create export functionality
  - [ ] 11.1 Implement backend export generation
    - Code POST /api/books/:id/export endpoint
    - Add support for TXT and Markdown formats
    - Implement standardized filename generation
    - Include book metadata and proper chapter formatting
    - Write unit tests for export functionality
    - _Requirements: 1.3, 6.2_

  - [ ] 11.2 Build export user interface
    - Create BookExporter component with format selection
    - Add export progress indication
    - Implement file download handling
    - Provide export success/failure feedback
    - Write tests for export user interface
    - _Requirements: 1.3, 6.2_

- [ ] 12. Add markdown preview capability
  - [ ] 12.1 Implement markdown rendering
    - Integrate markdown parsing library
    - Add Ctrl+M keyboard shortcut activation
    - Support headers, formatting, lists, and special elements
    - Create real-time conversion to HTML
    - Write tests for markdown rendering
    - _Requirements: 5.1, 5.2_

  - [ ] 12.2 Create markdown preview interface
    - Build MarkdownPreview component with rendered output
    - Add toggle between edit and preview modes
    - Implement synchronized scrolling if possible
    - Style rendered markdown appropriately
    - Write tests for preview interface
    - _Requirements: 5.1, 5.2_

- [ ] 13. Implement responsive design and accessibility
  - [ ] 13.1 Add responsive design support
    - Implement breakpoints for desktop, tablet, mobile
    - Create responsive sidebar behavior
    - Adapt editor interface for touch devices
    - Ensure proper touch target sizes
    - Write tests for responsive behavior
    - _Requirements: 7.1, 7.3_

  - [ ] 13.2 Ensure accessibility compliance
    - Add ARIA labels and semantic HTML
    - Implement keyboard navigation support
    - Verify color contrast ratios
    - Add screen reader compatibility
    - Write accessibility tests
    - _Requirements: 7.1, 7.3_

- [ ] 14. Performance optimization and testing
  - [ ] 14.1 Optimize application performance
    - Implement lazy loading for chapter content
    - Add client-side caching strategies
    - Optimize spell checking performance
    - Ensure memory cleanup for large documents
    - Write performance tests
    - _Requirements: 7.1, 7.2_

  - [ ] 14.2 Create comprehensive test suite
    - Write integration tests for complete user workflows
    - Add end-to-end tests for critical paths
    - Implement performance benchmarking
    - Create browser compatibility tests
    - Add load testing for concurrent usage
    - _Requirements: All requirements_

- [ ] 15. Final integration and deployment preparation
  - [ ] 15.1 Complete system integration
    - Integrate all components into cohesive application
    - Verify all API endpoints work with frontend
    - Test complete user workflows end-to-end
    - Ensure data persistence across application restarts
    - _Requirements: All requirements_

  - [ ] 15.2 Prepare for Raspberry Pi deployment
    - Create deployment scripts and configuration
    - Set up production database initialization
    - Configure environment variables and settings
    - Test deployment on Raspberry Pi 5 environment
    - Create user documentation and setup guide
    - _Requirements: All system requirements_
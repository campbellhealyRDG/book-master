
# Agent Assessment: system-architect

## Context
You are the system-architect agent in a systematic development workflow. Process the requirements and any previous agent outputs to create your deliverables.

## Original Requirements
```
# Book Master - Software Requirements Document

**Version:** 1.0  
**Date:** September 13, 2025  
**Status:** Production Ready  
**Platform:** Web Application (Raspberry Pi 5 Deployment)

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for Book Master, a professional British English book editing application designed for authors, publishers, and editorial professionals.

### 1.2 Scope
Book Master provides comprehensive British English spell checking, real-time editing capabilities, and manuscript management features for full-length book projects.

### 1.3 Intended Audience
- Authors writing British English manuscripts
- Publishers requiring consistent British spelling standards
- Editors working with British publications
- Academic researchers publishing in British English
- Technical writers producing UK-focused documentation

## 2. System Overview

### 2.1 System Architecture
- **Frontend:** Web-based application interface
- **Backend:** RESTful API with SQLite database
- **Deployment:** Raspberry Pi 5 server environment
- **Access URLs:**
  - Live Application: http://192.168.1.123:5173
  - API Documentation: http://192.168.1.123:8000/docs

### 2.2 Key Technologies
- Real-time spell checking via typo.js integration
- SQLite database for persistent storage
- Responsive web design with chrome green theme
- Client-side autosave functionality

## 3. Functional Requirements

### 3.1 User Interface Requirements

#### 3.1.1 Layout Structure
**REQ-UI-001:** The system SHALL provide a two-panel layout consisting of:
- Left sidebar for book and chapter management with collapsible sections
- Main content area for editor display and toolbar

#### 3.1.2 Visual Design
**REQ-UI-002:** The system SHALL implement a chrome green professional theme with:
- High contrast white text on green background
- Responsive design supporting desktop, tablet, and mobile devices
- Collapsible section headers in sidebar

#### 3.1.3 Toolbar Components
**REQ-UI-003:** When editing, the system SHALL display a toolbar containing:
- Close chapter button
- Save chapter button
- Notes/scratchpad access button
- Font selection button
- Dictionary management button
- Chapter title display
- Editor toggle button with visual state indicators

### 3.2 Book Management Requirements

#### 3.2.1 Book Creation
**REQ-BM-001:** The system SHALL allow users to create new books with:
- Required book title field
- Optional author name field
- Automatic save to database upon creation

#### 3.2.2 Book Operations
**REQ-BM-002:** The system SHALL provide book-level operations including:
- Book selection with visual highlighting
- Book deletion with confirmation dialog
- Book export in multiple formats (TXT, Markdown)

#### 3.2.3 Book Export
**REQ-BM-003:** The system SHALL generate exported files with:
- Standardized filename format (Book_Title.txt/md)
- Complete book content including all chapters
- Proper formatting and metadata inclusion

### 3.3 Chapter Management Requirements

#### 3.3.1 Chapter Creation
**REQ-CM-001:** The system SHALL enable chapter creation with:
- Chapter title specification
- Automatic numbering based on creation order
- Association with selected book

#### 3.3.2 Chapter Navigation
**REQ-CM-002:** The system SHALL provide chapter navigation features:
- Chapter list display within selected book
- Click-to-open chapter functionality
- Visual indication of currently selected chapter

#### 3.3.3 Chapter Operations
**REQ-CM-003:** The system SHALL support chapter-level operations:
- Individual chapter deletion with confirmation
- Chapter content saving to database
- Chapter switching with unsaved changes protection

### 3.4 Text Editor Requirements

#### 3.4.1 Editor Functionality
**REQ-ED-001:** The system SHALL provide a text editor with:
- Large text editing area
- Word and character count display
- Real-time spell checking integration
- Undo/redo functionality

#### 3.4.2 Text Formatting
**REQ-ED-002:** The system SHALL support text formatting via keyboard shortcuts:
- Bold formatting (Ctrl+B)
- Italic formatting (Ctrl+I)
- Underline formatting (Ctrl+U)
- Multi-line paragraph formatting support

#### 3.4.3 Editor States
**REQ-ED-003:** The system SHALL maintain two editor states:
- Active state (red button): Real-time spell checking enabled
- Inactive state (grey button): Clean editing without interruption

### 3.5 British English Spell Checking Requirements

#### 3.5.1 Core Spell Checking
**REQ-SC-001:** The system SHALL implement comprehensive British English spell checking with:
- 50,000+ word British English dictionary
- Real-time error detection and highlighting
- Visual indicators (red wavy underlines for spelling errors)
- Multiple correction suggestions per error

#### 3.5.2 US to UK Conversion
**REQ-SC-002:** The system SHALL detect and suggest British English alternatives for common American spellings:
- color → colour, organize → organise, center → centre
- theater → theatre, realize → realise, defense → defence
- honor → honour, favor → favour

#### 3.5.3 Spell Checking Features
**REQ-SC-003:** The system SHALL provide advanced spell checking capabilities:
- Context-aware suggestions maintaining capitalization
- Right-click context menu for corrections
- Interactive correction application
- Integration with custom dictionary

### 3.6 Custom Dictionary Requirements

#### 3.6.1 Dictionary Management
**REQ-CD-001:** The system SHALL provide custom dictionary management with:
- Pre-loaded British publishing terminology
- User term addition capability
- Term categorization (General, Publishing, Technical, Names, Custom)
- Term editing and deletion functionality

#### 3.6.2 Dictionary Statistics
**REQ-CD-002:** The system SHALL display dictionary statistics including:
- Total terms count
- Active terms count
- Category distribution
- User-added terms tracking

#### 3.6.3 Dictionary Integration
**REQ-CD-003:** The system SHALL integrate custom dictionary with spell checker:
- Automatic recognition of custom terms
- Real-time spell checker updates
- Term activation/deactivation capability

### 3.7 Ignore Spelling Requirements

#### 3.7.1 Ignore Functionality
**REQ-IS-001:** The system SHALL provide session-based word ignoring with:
- Right-click ignore option on marked errors
- Immediate removal of error highlighting for all instances
- Ignore list management and display

#### 3.7.2 Ignore Management
**REQ-IS-002:** The system SHALL support ignore list operations:
- View currently ignored words
- Unignore individual words
- Clear all ignored words functionality
- Alphabetical organization of ignored terms

### 3.8 Scratchpad Requirements

#### 3.8.1 Scratchpad Functionality
**REQ-SP-001:** The system SHALL provide a persistent global scratchpad with:
- Large text area for extensive notes
- Global persistence across all books and chapters
- Survival through application restarts

#### 3.8.2 Scratchpad Operations
**REQ-SP-002:** The system SHALL support scratchpad operations:
- Save notes to database
- Cancel changes and revert to last saved version
- Modal dialog interface for note management

### 3.9 Font Selection Requirements

#### 3.9.1 Font Options
**REQ-FS-001:** The system SHALL provide curated font selection including:
- Classic serif fonts (Georgia, Times New Roman, Book Antiqua)
- Modern serif fonts (Crimson Text, Source Serif Pro)
- Clean sans-serif options (Source Sans Pro, Open Sans)
- Monospace fonts (Source Code Pro, Courier New)

#### 3.9.2 Font Application
**REQ-FS-002:** The system SHALL implement font functionality:
- Immediate preview in editor upon selection
- Persistent font choice across sessions
- Cross-platform compatibility

### 3.10 Autosave Requirements

#### 3.10.1 Automatic Saving
**REQ-AS-001:** The system SHALL implement autosave functionality with:
- 30-second automatic save intervals
- Smart detection of actual content changes
- Background operation without user interruption

#### 3.10.2 Manual Save Options
**REQ-AS-002:** The system SHALL provide manual save capabilities:
- Ctrl+S keyboard shortcut
- Toolbar save button
- Automatic save before chapter switching

#### 3.10.3 Navigation Protection
**REQ-AS-003:** The system SHALL protect against data loss with:
- Unsaved changes detection
- Navigation protection modal with Save/Don't Save/Cancel options
- Browser navigation and refresh protection

### 3.11 Pagination Requirements

#### 3.11.1 Automatic Pagination
**REQ-PG-001:** The system SHALL implement memory-efficient pagination:
- Automatic page creation at ~2000 words (8000 characters)
- Smart splitting at paragraph boundaries when possible
- Maximum 3 pages in browser memory

#### 3.11.2 Pagination Navigation
**REQ-PG-002:** The system SHALL provide pagination controls:
- Previous/Next page buttons
- Page indicator showing current position
- Keyboard navigation (Page Up/Down, Ctrl+Home/End)

#### 3.11.3 Page Statistics
**REQ-PG-003:** The system SHALL display page information:
- Word count per page
- Character count per page
- Page position indicator (Page X of Y)

### 3.12 Markdown Preview Requirements

#### 3.12.1 Preview Functionality
**REQ-MP-001:** The system SHALL provide markdown preview with:
- Ctrl+M keyboard shortcut activation
- Real-time conversion to rendered HTML
- Support for headers, formatting, lists, and special elements

#### 3.12.2 Preview Features
**REQ-MP-002:** The system SHALL render markdown elements:
- Text formatting (bold, italic, underline)
- Header hierarchy (H1-H4)
- Ordered and unordered lists
- Block quotes and horizontal rules

### 3.13 Export Requirements

#### 3.13.1 Export Formats
**REQ-EX-001:** The system SHALL support export in multiple formats:
- Plain text (.txt) with structured formatting
- Markdown (.md) with proper markup syntax
- Automatic filename generation with underscores replacing spaces

#### 3.13.2 Export Content
**REQ-EX-002:** The system SHALL include in exports:
- Book title and author information
- All chapters in creation order
- Proper chapter separation and formatting
- Consistent structure across formats

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

#### 4.1.1 Response Time
**REQ-NF-001:** The system SHALL provide responsive performance:
- Page load time under 3 seconds
- Real-time spell checking with minimal lag
- Smooth page navigation in pagination system

#### 4.1.2 Memory Management
**REQ-NF-002:** The system SHALL efficiently manage memory:
- Support for documents up to 100,000 words
- Automatic pagination for large chapters
- Memory cleanup for distant pages

### 4.2 Usability Requirements

#### 4.2.1 Browser Compatibility
**REQ-NF-003:** The system SHALL support modern browsers:
- Chrome 70+, Firefox 65+, Safari 12+, Edge 79+
- JavaScript enabled environment
- Local storage capability

#### 4.2.2 Accessibility
**REQ-NF-004:** The system SHALL provide accessible interface:
- High contrast color scheme
- Keyboard navigation support
- Screen reader compatibility
- Responsive design for various screen sizes

### 4.3 Reliability Requirements

#### 4.3.1 Data Persistence
**REQ-NF-005:** The system SHALL ensure data reliability:
- SQLite database storage for all content
- Automatic backup of changes
- Recovery from browser crashes
- Data persistence across application restarts

#### 4.3.2 Error Handling
**REQ-NF-006:** The system SHALL handle errors gracefully:
- User-friendly error messages
- Save operation retry capability
- Graceful degradation for spell checking failures

### 4.4 Security Requirements

#### 4.4.1 Data Protection
**REQ-NF-007:** The system SHALL protect user data:
- Local database storage only
- No external data transmission for content
- Secure session management

## 5. System Constraints

### 5.1 Technical Constraints
- Web browser environment with JavaScript support
- Client-side storage limitations
- Raspberry Pi 5 hardware deployment
- SQLite database technology

### 5.2 Operational Constraints
- Requires internet connection for initial application load
- Local network access for Raspberry Pi deployment
- Browser storage permissions required

## 6. Assumptions and Dependencies

### 6.1 Assumptions
- Users have modern web browsers with JavaScript enabled
- Users require British English spelling standards
- Target documents are book-length manuscripts
- Users have basic computer literacy

### 6.2 Dependencies
- typo.js library for spell checking functionality
- SQLite database for data persistence
- Web browser local storage capabilities
- Raspberry Pi 5 server infrastructure

## 7. Acceptance Criteria

### 7.1 Functional Acceptance
- All specified British English spell checking rules implemented
- Complete book and chapter management workflow
- Successful export of multi-chapter books
- Reliable autosave and data persistence

### 7.2 Performance Acceptance
- Support for books up to 100,000 words
- Sub-second response times for common operations
- Successful handling of 20+ chapter books
- Memory-efficient operation during extended sessions

### 7.3 Usability Acceptance
- Intuitive interface requiring minimal training
- Efficient keyboard shortcut implementation
- Clear visual feedback for all operations
- Responsive design across target devices

## 8. Future Enhancements

### 8.1 Potential Features
- Multi-user collaboration capabilities
- Cloud synchronization options
- Advanced grammar checking
- Integration with publishing platforms
- Version control and change tracking
- Multiple export format support (PDF, EPUB)

### 8.2 Scalability Considerations
- Database migration to more robust system
- Server-side spell checking services
- Real-time collaboration infrastructure
- Advanced caching mechanisms

---

**Document Control:**
- Created: September 13, 2025
- Version: 1.0
- Status: Approved for Implementation
- Next Review: December 13, 2025
```


## Agent Guidelines
# System Architect

## name: system-architect
description: Transform product requirements into comprehensive technical architecture blueprints. Design system components, define technology stack, create API contracts, and establish data models. Serves as Phase 2 in the development process, providing technical specifications for downstream engineering agents.

You are an elite system architect with deep expertise in designing scalable, maintainable, and robust software systems. You excel at transforming product requirements into comprehensive technical architectures that serve as actionable blueprints for specialist engineering teams.

## Your Role in the Development Pipeline

You are Phase 2 in a 6-phase development process. Your output directly enables:

- Backend Engineers to implement APIs and business logic
- Frontend Engineers to build user interfaces and client architecture
- QA Engineers to design testing strategies
- Security Analysts to implement security measures
- DevOps Engineers to provision infrastructure
Your job is to create the technical blueprint - not to implement it.

## When to Use This Agent

This agent excels at:

- Converting product requirements into technical architecture
- Making critical technology stack decisions with clear rationale
- Designing API contracts and data models for immediate implementation
- Creating system component architecture that enables parallel development
- Establishing security and performance foundations

### Input Requirements

You expect to receive:

- User stories and feature specifications from Product Manager, typically located in a directory called project-documentation
- Core problem definition and user personas
- MVP feature priorities and requirements
- Any specific technology constraints or preferences

## Core Architecture Process

### 1. Comprehensive Requirements Analysis

Begin with systematic analysis in brainstorm tags:
**System Architecture and Infrastructure:**

- Core functionality breakdown and component identification
- Technology stack evaluation based on scale, complexity, and team skills
- Infrastructure requirements and deployment considerations
- Integration points and external service dependencies
**Data Architecture:**
- Entity modeling and relationship mapping
- Storage strategy and database selection rationale
- Caching and performance optimisation approaches
- Data security and privacy requirements
**API and Integration Design:**
- Internal API contract specifications
- External service integration strategies
- Authentication and authorisation architecture
- Error handling and resilience patterns
**Security and Performance:**
- Security threat modeling and mitigation strategies
- Performance requirements and optimisation approaches
- Scalability considerations and bottleneck identification
- Monitoring and observability requirements
**Risk Assessment:**
- Technical risks and mitigation strategies
- Alternative approaches and trade-off analysis
- Potential challenges and complexity estimates

### 2. Technology Stack Architecture

Provide detailed technology decisions with clear rationale:
**Frontend Architecture:**

- Framework selection (React, Vue, Angular) with justification
- State management approach (Redux, Zustand, Context)
- Build tools and development setup
- Component architecture patterns
- Client-side routing and navigation strategy
**Backend Architecture:**
- Framework/runtime selection with rationale
- API architecture style (REST, GraphQL, tRPC)
- Authentication and authorisation strategy
- Business logic organisation patterns
- Error handling and validation approaches
**Database and Storage:**
- Primary database selection and justification
- Caching strategy and tools
- File storage and CDN requirements
- Data backup and recovery considerations
**Infrastructure Foundation:**
- Hosting platform recommendations
- Environment management strategy (dev/staging/prod)
- CI/CD pipeline requirements
- Monitoring and logging foundations

### 3. System Component Design

Define clear system boundaries and interactions:
**Core Components:**

- Component responsibilities and interfaces
- Communication patterns between services
- Data flow architecture
- Shared utilities and libraries
**Integration Architecture:**
- External service integrations
- API gateway and routing strategy
- Inter-service communication patterns
- Event-driven architecture considerations

### 4. Data Architecture Specifications

Create implementation-ready data models:
**Entity Design:**
For each core entity:

- Entity name and purpose
- Attributes (name, type, constraints, defaults)
- Relationships and foreign keys
- Indexes and query optimisation
- Validation rules and business constraints
**Database Schema:**
- Table structures with exact field definitions
- Relationship mappings and junction tables
- Index strategies for performance
- Migration considerations

### 5. API Contract Specifications

Define exact API interfaces for backend implementation:
**Endpoint Specifications:**
For each API endpoint:

- HTTP method and URL pattern
- Request parameters and body schema
- Response schema and status codes
- Authentication requirements
- Rate limiting considerations
- Error response formats
**Authentication Architecture:**
- Authentication flow and token management
- Authorisation patterns and role definitions
- Session handling strategy
- Security middleware requirements

### 6. Security and Performance Foundation

Establish security architecture basics:
**Security Architecture:**

- Authentication and authorisation patterns
- Data encryption strategies (at rest and in transit)
- Input validation and sanitisation requirements
- Security headers and CORS policies
- Vulnerability prevention measures
**Performance Architecture:**
- Caching strategies and cache invalidation
- Database query optimisation approaches
- Asset optimisation and delivery
- Monitoring and alerting requirements

## Output Structure for Team Handoff

Organise your architecture document with clear sections for each downstream team:

### Executive Summary

- Project overview and key architectural decisions
- Technology stack summary with rationale
- System component overview
- Critical technical constraints and assumptions

### For Backend Engineers

- API endpoint specifications with exact schemas
- Database schema with relationships and constraints
- Business logic organisation patterns
- Authentication and authorisation implementation guide
- Error handling and validation strategies

### For Frontend Engineers

- Component architecture and state management approach
- API integration patterns and error handling
- Routing and navigation architecture
- Performance optimisation strategies
- Build and development setup requirements

### For QA Engineers

- Testable component boundaries and interfaces
- Data validation requirements and edge cases
- Integration points requiring testing
- Performance benchmarks and quality metrics
- Security testing considerations

### For Security Analysts

- Authentication flow and security model

## Your Documentation Process

Your final deliverable shall be placed in a directory called “project-documentation” in a file called [architecture-output.md](http://architecture-output.md/)


## Your Task
Create a comprehensive technical architecture document that includes:
1. System component design and technology stack decisions
2. API contract specifications with exact endpoints
3. Database schema with relationships and constraints
4. Security architecture and authentication flows
5. Performance requirements and scalability considerations

Place your output in: project-documentation/architecture-output.md

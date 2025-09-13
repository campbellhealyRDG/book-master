# Requirements Document

## Introduction

Book Master is a professional British English book editing application designed for authors, publishers, and editorial professionals. The system provides comprehensive British English spell checking, real-time editing capabilities, and manuscript management features for full-length book projects, deployed on a Raspberry Pi 5 server environment.

## Requirements

### Requirement 1

**User Story:** As an author writing British English manuscripts, I want to create and manage multiple books with chapters, so that I can organize my writing projects effectively.

#### Acceptance Criteria

1. WHEN I access the application THEN the system SHALL display a two-panel layout with left sidebar for book management and main content area for editing
2. WHEN I create a new book THEN the system SHALL require a book title field and allow optional author name field
3. WHEN I create a book THEN the system SHALL automatically save it to the SQLite database
4. WHEN I select a book THEN the system SHALL provide visual highlighting and display associated chapters
5. WHEN I delete a book THEN the system SHALL show a confirmation dialog before permanent removal
6. WHEN I create a chapter THEN the system SHALL enable chapter title specification with automatic numbering based on creation order

### Requirement 2

**User Story:** As a British English writer, I want comprehensive spell checking with real-time error detection, so that I can maintain consistent British spelling standards throughout my manuscript.

#### Acceptance Criteria

1. WHEN I type in the editor THEN the system SHALL implement real-time British English spell checking with 50,000+ word dictionary
2. WHEN spelling errors are detected THEN the system SHALL display red wavy underlines as visual indicators
3. WHEN I right-click on errors THEN the system SHALL provide multiple correction suggestions maintaining capitalization
4. WHEN American spellings are detected THEN the system SHALL suggest British English alternatives (color→colour, organize→organise, center→centre)
5. WHEN I right-click on errors THEN the system SHALL provide option to ignore word for current session
6. WHEN I toggle editor state THEN the system SHALL switch between active (red button with real-time checking) and inactive (grey button for clean editing)

### Requirement 3

**User Story:** As a professional editor, I want to manage custom dictionaries with publishing terminology, so that I can ensure industry-specific terms are recognized correctly.

#### Acceptance Criteria

1. WHEN I access dictionary management THEN the system SHALL provide pre-loaded British publishing terminology
2. WHEN I add custom terms THEN the system SHALL allow categorization (General, Publishing, Technical, Names, Custom)
3. WHEN I manage dictionary THEN the system SHALL display statistics including total terms, active terms, and category distribution
4. WHEN I add/edit terms THEN the system SHALL integrate with spell checker for automatic recognition
5. WHEN I activate/deactivate terms THEN the system SHALL update real-time spell checker immediately
6. WHEN I view ignored words THEN the system SHALL display alphabetically organized list with unignore functionality

### Requirement 4

**User Story:** As a manuscript author, I want a powerful text editor with formatting capabilities and autosave, so that I can focus on writing without losing my work.

#### Acceptance Criteria

1. WHEN I use the editor THEN the system SHALL provide large text editing area with word and character count display
2. WHEN I use keyboard shortcuts THEN the system SHALL support Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline) formatting
3. WHEN I type content THEN the system SHALL implement 30-second autosave intervals with smart change detection
4. WHEN I press Ctrl+S THEN the system SHALL manually save chapter content
5. WHEN I switch chapters with unsaved changes THEN the system SHALL show protection modal with Save/Don't Save/Cancel options
6. WHEN chapters exceed ~2000 words THEN the system SHALL implement automatic pagination with smart paragraph boundary splitting

### Requirement 5

**User Story:** As a book author, I want font selection and markdown preview capabilities, so that I can customize my writing environment and preview formatted content.

#### Acceptance Criteria

1. WHEN I access font selection THEN the system SHALL provide curated fonts including Georgia, Times New Roman, Crimson Text, Source Sans Pro, and Source Code Pro
2. WHEN I select a font THEN the system SHALL apply immediate preview in editor with persistent choice across sessions
3. WHEN I press Ctrl+M THEN the system SHALL activate markdown preview with real-time HTML conversion
4. WHEN markdown is rendered THEN the system SHALL support headers (H1-H4), formatting, lists, block quotes, and horizontal rules
5. WHEN I navigate pages THEN the system SHALL provide Previous/Next buttons with keyboard navigation (Page Up/Down, Ctrl+Home/End)
6. WHEN viewing pages THEN the system SHALL display word count, character count, and page position indicator

### Requirement 6

**User Story:** As a writer, I want a persistent scratchpad for notes and export capabilities, so that I can keep research notes and share my completed work.

#### Acceptance Criteria

1. WHEN I access scratchpad THEN the system SHALL provide persistent global text area for extensive notes
2. WHEN I save scratchpad notes THEN the system SHALL persist data across all books, chapters, and application restarts
3. WHEN I use scratchpad modal THEN the system SHALL provide save and cancel options with revert capability
4. WHEN I export books THEN the system SHALL support plain text (.txt) and Markdown (.md) formats
5. WHEN files are exported THEN the system SHALL use standardized filename format (Book_Title.txt/md) with underscores replacing spaces
6. WHEN exporting THEN the system SHALL include book title, author information, and all chapters in creation order with proper formatting

### Requirement 7

**User Story:** As a professional user, I want the application to be responsive, accessible, and performant, so that I can work efficiently across different devices and environments.

#### Acceptance Criteria

1. WHEN I access the application THEN the system SHALL load pages in under 3 seconds with responsive design for desktop, tablet, and mobile
2. WHEN I use the interface THEN the system SHALL implement chrome green professional theme with high contrast white text on green background
3. WHEN I navigate THEN the system SHALL support keyboard navigation and screen reader compatibility
4. WHEN working with large documents THEN the system SHALL support up to 100,000 words with memory-efficient pagination (maximum 3 pages in browser memory)
5. WHEN errors occur THEN the system SHALL provide user-friendly error messages with graceful degradation
6. WHEN using the application THEN the system SHALL ensure data persistence with SQLite database storage and automatic backup of changes
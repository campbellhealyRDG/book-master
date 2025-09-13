# Database Schema and Data Models

## Feature Overview

The "Database Schema and Data Models" feature establishes the comprehensive data architecture for the Book Master application. This feature implements a robust, well-structured database schema with complete data models, validation systems, and relationship management to support all aspects of professional British English book editing and manuscript management.

## Feature Scope

This data architecture feature encompasses:

- **Complete database schema** with five core entities and comprehensive relationships
- **Data model classes** with full validation, sanitisation, and business logic
- **Migration system** for version-controlled schema management
- **Computed fields** for automated word and character counting
- **Text processing utilities** for content analysis and search capabilities
- **Template systems** for standardised content generation
- **Export functionality** supporting multiple formats
- **Relationship management** with proper foreign key constraints and cascade handling

## Technical Implementation

### Database Schema Architecture

The database schema follows a relational design with five core entities that support the complete book editing workflow:

#### Books Entity
The primary entity representing a complete book or manuscript project.

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

**Key Features:**
- **Primary Key:** Auto-incrementing integer ID for unique identification
- **Title Validation:** Required field with 255 character limit
- **Author Information:** Required field for author attribution
- **Optional Description:** Text field for book synopsis or notes
- **Computed Fields:** Automatically calculated chapter count, word count, and character count
- **Timestamps:** Automatic creation and update tracking

#### Chapters Entity
Represents individual chapters within a book with hierarchical organisation.

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

**Key Features:**
- **Book Relationship:** Foreign key to books table with cascade deletion
- **Chapter Ordering:** Sequential chapter numbering with uniqueness constraint
- **Content Storage:** Large text field for chapter content
- **Word Metrics:** Automatic word and character counting
- **Referential Integrity:** Ensures chapters cannot exist without a parent book

#### Dictionary Terms Entity
Manages custom dictionary entries for specialised spell checking.

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

**Key Features:**
- **Unique Terms:** Prevents duplicate dictionary entries
- **Categorisation:** Five distinct categories for term classification
- **Active Status:** Allows temporary disabling without deletion
- **Source Tracking:** Distinguishes user-added from system terms
- **British English Support:** Integrates with typo.js spell checking system

#### User Preferences Entity
Stores personalised application settings and preferences.

```sql
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    preference_key VARCHAR(100) NOT NULL UNIQUE,
    preference_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- **Key-Value Storage:** Flexible preference storage system
- **Unique Keys:** Prevents duplicate preference entries
- **JSON Value Support:** Text field supports complex data structures
- **Extensible Design:** Easily accommodates new preference types

#### Scratchpad Entity
Provides global note-taking functionality across all books and chapters.

```sql
CREATE TABLE scratchpad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- **Global Persistence:** Content survives application restarts
- **Large Content Support:** Text field accommodates extensive notes
- **Simple Design:** Single record for straightforward implementation

### Data Model Classes

#### Book Model Implementation

```typescript
export interface BookData {
    id?: number;
    title: string;
    author: string;
    description?: string;
    chapter_count?: number;
    word_count?: number;
    character_count?: number;
    created_at?: string;
    updated_at?: string;
}

export class Book {
    // Validation methods
    static validateTitle(title: string): string {
        if (!title || title.trim().length === 0) {
            throw new Error('Book title is required');
        }
        if (title.length > 255) {
            throw new Error('Book title must not exceed 255 characters');
        }
        return title.trim();
    }

    static validateAuthor(author: string): string {
        if (!author || author.trim().length === 0) {
            throw new Error('Book author is required');
        }
        if (author.length > 255) {
            throw new Error('Book author must not exceed 255 characters');
        }
        return author.trim();
    }

    // Computed field calculations
    static async updateComputedFields(db: Database, bookId: number): Promise<void> {
        const chapters = await db.prepare(`
            SELECT word_count, character_count 
            FROM chapters 
            WHERE book_id = ?
        `).all(bookId);

        const chapter_count = chapters.length;
        const word_count = chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0);
        const character_count = chapters.reduce((sum, ch) => sum + (ch.character_count || 0), 0);

        await db.prepare(`
            UPDATE books 
            SET chapter_count = ?, word_count = ?, character_count = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(chapter_count, word_count, character_count, bookId);
    }
}
```

#### Chapter Model Implementation

```typescript
export interface ChapterData {
    id?: number;
    book_id: number;
    title: string;
    content?: string;
    chapter_number: number;
    word_count?: number;
    character_count?: number;
    created_at?: string;
    updated_at?: string;
}

export class Chapter {
    // Content processing
    static processContent(content: string): { word_count: number; character_count: number } {
        if (!content || content.trim().length === 0) {
            return { word_count: 0, character_count: 0 };
        }

        const cleanContent = content.trim();
        const word_count = cleanContent.split(/\s+/).filter(word => word.length > 0).length;
        const character_count = cleanContent.length;

        return { word_count, character_count };
    }

    // Chapter numbering
    static async getNextChapterNumber(db: Database, bookId: number): Promise<number> {
        const result = await db.prepare(`
            SELECT MAX(chapter_number) as max_number 
            FROM chapters 
            WHERE book_id = ?
        `).get(bookId);
        
        return (result?.max_number || 0) + 1;
    }

    // Validation
    static validateTitle(title: string): string {
        if (!title || title.trim().length === 0) {
            throw new Error('Chapter title is required');
        }
        if (title.length > 255) {
            throw new Error('Chapter title must not exceed 255 characters');
        }
        return title.trim();
    }
}
```

#### Dictionary Term Model Implementation

```typescript
export type DictionaryCategory = 'proper_noun' | 'technical_term' | 'character_name' | 'place_name' | 'custom';

export interface DictionaryTermData {
    id?: number;
    term: string;
    category: DictionaryCategory;
    is_active?: boolean;
    is_user_added?: boolean;
    created_at?: string;
    updated_at?: string;
}

export class DictionaryTerm {
    static readonly VALID_CATEGORIES: DictionaryCategory[] = [
        'proper_noun', 'technical_term', 'character_name', 'place_name', 'custom'
    ];

    // Term validation
    static validateTerm(term: string): string {
        if (!term || term.trim().length === 0) {
            throw new Error('Dictionary term cannot be empty');
        }
        if (term.length > 255) {
            throw new Error('Dictionary term must not exceed 255 characters');
        }
        
        const cleanTerm = term.trim().toLowerCase();
        if (!/^[a-zA-Z\s'-]+$/.test(cleanTerm)) {
            throw new Error('Dictionary term can only contain letters, spaces, hyphens, and apostrophes');
        }
        
        return cleanTerm;
    }

    // Category validation
    static validateCategory(category: string): DictionaryCategory {
        if (!this.VALID_CATEGORIES.includes(category as DictionaryCategory)) {
            throw new Error(`Invalid category. Must be one of: ${this.VALID_CATEGORIES.join(', ')}`);
        }
        return category as DictionaryCategory;
    }

    // Search functionality
    static async searchTerms(db: Database, query: string, category?: DictionaryCategory): Promise<DictionaryTermData[]> {
        let sql = `
            SELECT * FROM dictionary_terms 
            WHERE is_active = 1 AND term LIKE ?
        `;
        const params = [`%${query.toLowerCase()}%`];

        if (category) {
            sql += ` AND category = ?`;
            params.push(category);
        }

        sql += ` ORDER BY term ASC`;
        
        return await db.prepare(sql).all(...params);
    }
}
```

#### User Preferences Model Implementation

```typescript
export interface UserPreferenceData {
    id?: number;
    preference_key: string;
    preference_value: string;
    created_at?: string;
    updated_at?: string;
}

export class UserPreferences {
    // Default preferences
    static readonly DEFAULT_PREFERENCES = {
        'editor.font_family': 'Georgia, serif',
        'editor.font_size': '16',
        'editor.theme': 'light',
        'editor.autosave_interval': '30',
        'spellcheck.enabled': 'true',
        'spellcheck.highlight_errors': 'true',
        'export.default_format': 'markdown'
    };

    // Preference management
    static async getPreference(db: Database, key: string): Promise<string> {
        const result = await db.prepare(`
            SELECT preference_value FROM user_preferences WHERE preference_key = ?
        `).get(key);
        
        return result?.preference_value || this.DEFAULT_PREFERENCES[key] || '';
    }

    static async setPreference(db: Database, key: string, value: string): Promise<void> {
        await db.prepare(`
            INSERT OR REPLACE INTO user_preferences (preference_key, preference_value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        `).run(key, value);
    }

    // Validation
    static validatePreferenceKey(key: string): string {
        if (!key || key.trim().length === 0) {
            throw new Error('Preference key cannot be empty');
        }
        if (key.length > 100) {
            throw new Error('Preference key must not exceed 100 characters');
        }
        return key.trim();
    }
}
```

#### Scratchpad Model Implementation

```typescript
export interface ScratchpadData {
    id?: number;
    content?: string;
    created_at?: string;
    updated_at?: string;
}

export class Scratchpad {
    // Content management
    static async getContent(db: Database): Promise<string> {
        const result = await db.prepare(`
            SELECT content FROM scratchpad ORDER BY updated_at DESC LIMIT 1
        `).get();
        
        return result?.content || '';
    }

    static async saveContent(db: Database, content: string): Promise<void> {
        const existingRecord = await db.prepare(`
            SELECT id FROM scratchpad ORDER BY updated_at DESC LIMIT 1
        `).get();

        if (existingRecord) {
            await db.prepare(`
                UPDATE scratchpad 
                SET content = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `).run(content, existingRecord.id);
        } else {
            await db.prepare(`
                INSERT INTO scratchpad (content) VALUES (?)
            `).run(content);
        }
    }

    // Content validation
    static validateContent(content: string): string {
        // Allow empty content for clearing scratchpad
        if (!content) return '';
        
        // No specific length limit for scratchpad content
        return content;
    }
}
```

### Text Processing Utilities

#### Word and Character Counting

```typescript
export class TextProcessor {
    // Accurate word counting for British English
    static countWords(text: string): number {
        if (!text || text.trim().length === 0) return 0;
        
        // Handle British contractions and hyphenated words correctly
        const words = text
            .trim()
            .replace(/['']/g, "'") // Normalise quotation marks
            .split(/\s+/)
            .filter(word => {
                // Remove empty strings and standalone punctuation
                const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, '');
                return cleanWord.length > 0;
            });
        
        return words.length;
    }

    // Character counting excluding formatting
    static countCharacters(text: string): number {
        if (!text) return 0;
        return text.trim().length;
    }

    // Extract words for spell checking
    static extractWords(text: string): string[] {
        if (!text) return [];
        
        return text
            .replace(/['']/g, "'") // Normalise apostrophes
            .match(/\b[\w']+\b/g) || [];
    }

    // Text cleaning for storage
    static sanitiseText(text: string): string {
        if (!text) return '';
        
        return text
            .trim()
            .replace(/\r\n/g, '\n') // Normalise line endings
            .replace(/\s+$/gm, ''); // Remove trailing whitespace
    }
}
```

### Migration System Implementation

#### Initial Schema Migration

```typescript
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Create books table
    await knex.schema.createTable('books', (table) => {
        table.increments('id').primary();
        table.string('title', 255).notNullable();
        table.string('author', 255).notNullable();
        table.text('description').nullable();
        table.integer('chapter_count').defaultTo(0);
        table.integer('word_count').defaultTo(0);
        table.integer('character_count').defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Create chapters table
    await knex.schema.createTable('chapters', (table) => {
        table.increments('id').primary();
        table.integer('book_id').unsigned().notNullable();
        table.string('title', 255).notNullable();
        table.text('content').nullable();
        table.integer('chapter_number').notNullable();
        table.integer('word_count').defaultTo(0);
        table.integer('character_count').defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        
        table.foreign('book_id').references('id').inTable('books').onDelete('CASCADE');
        table.unique(['book_id', 'chapter_number']);
    });

    // Create dictionary_terms table
    await knex.schema.createTable('dictionary_terms', (table) => {
        table.increments('id').primary();
        table.string('term', 255).notNullable().unique();
        table.enum('category', ['proper_noun', 'technical_term', 'character_name', 'place_name', 'custom']).defaultTo('custom');
        table.boolean('is_active').defaultTo(true);
        table.boolean('is_user_added').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Create user_preferences table
    await knex.schema.createTable('user_preferences', (table) => {
        table.increments('id').primary();
        table.string('preference_key', 100).notNullable().unique();
        table.text('preference_value').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Create scratchpad table
    await knex.schema.createTable('scratchpad', (table) => {
        table.increments('id').primary();
        table.text('content').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Insert default preferences
    await knex('user_preferences').insert([
        { preference_key: 'editor.font_family', preference_value: 'Georgia, serif' },
        { preference_key: 'editor.font_size', preference_value: '16' },
        { preference_key: 'editor.theme', preference_value: 'light' },
        { preference_key: 'editor.autosave_interval', preference_value: '30' },
        { preference_key: 'spellcheck.enabled', preference_value: 'true' },
        { preference_key: 'spellcheck.highlight_errors', preference_value: 'true' },
        { preference_key: 'export.default_format', preference_value: 'markdown' }
    ]);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('scratchpad');
    await knex.schema.dropTableIfExists('user_preferences');
    await knex.schema.dropTableIfExists('dictionary_terms');
    await knex.schema.dropTableIfExists('chapters');
    await knex.schema.dropTableIfExists('books');
}
```

### Database Operations Implementation

#### CRUD Operations with Error Handling

```typescript
export class DatabaseOperations {
    constructor(private db: Database) {}

    // Books operations
    async createBook(bookData: Omit<BookData, 'id'>): Promise<BookData> {
        try {
            const validatedTitle = Book.validateTitle(bookData.title);
            const validatedAuthor = Book.validateAuthor(bookData.author);
            
            const result = await this.db.prepare(`
                INSERT INTO books (title, author, description)
                VALUES (?, ?, ?)
            `).run(validatedTitle, validatedAuthor, bookData.description || null);
            
            return await this.getBook(result.lastInsertRowid as number);
        } catch (error) {
            throw new Error(`Failed to create book: ${error.message}`);
        }
    }

    async getBook(id: number): Promise<BookData> {
        const book = await this.db.prepare(`
            SELECT * FROM books WHERE id = ?
        `).get(id);
        
        if (!book) {
            throw new Error(`Book with ID ${id} not found`);
        }
        
        return book;
    }

    // Chapters operations
    async createChapter(chapterData: Omit<ChapterData, 'id'>): Promise<ChapterData> {
        try {
            const validatedTitle = Chapter.validateTitle(chapterData.title);
            const { word_count, character_count } = Chapter.processContent(chapterData.content || '');
            
            let chapterNumber = chapterData.chapter_number;
            if (!chapterNumber) {
                chapterNumber = await Chapter.getNextChapterNumber(this.db, chapterData.book_id);
            }
            
            const result = await this.db.prepare(`
                INSERT INTO chapters (book_id, title, content, chapter_number, word_count, character_count)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                chapterData.book_id,
                validatedTitle,
                chapterData.content || null,
                chapterNumber,
                word_count,
                character_count
            );
            
            // Update book computed fields
            await Book.updateComputedFields(this.db, chapterData.book_id);
            
            return await this.getChapter(result.lastInsertRowid as number);
        } catch (error) {
            throw new Error(`Failed to create chapter: ${error.message}`);
        }
    }

    // Dictionary operations
    async addDictionaryTerm(termData: Omit<DictionaryTermData, 'id'>): Promise<DictionaryTermData> {
        try {
            const validatedTerm = DictionaryTerm.validateTerm(termData.term);
            const validatedCategory = DictionaryTerm.validateCategory(termData.category);
            
            const result = await this.db.prepare(`
                INSERT INTO dictionary_terms (term, category, is_active, is_user_added)
                VALUES (?, ?, ?, ?)
            `).run(
                validatedTerm,
                validatedCategory,
                termData.is_active !== false,
                termData.is_user_added !== false
            );
            
            return await this.getDictionaryTerm(result.lastInsertRowid as number);
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                throw new Error(`Dictionary term '${termData.term}' already exists`);
            }
            throw new Error(`Failed to add dictionary term: ${error.message}`);
        }
    }
}
```

### Template System Implementation

#### Export Templates

```typescript
export class ExportTemplates {
    // Markdown export template
    static generateMarkdownExport(book: BookData, chapters: ChapterData[]): string {
        const lines: string[] = [];
        
        // Book header
        lines.push(`# ${book.title}`);
        lines.push('');
        lines.push(`**Author:** ${book.author}`);
        if (book.description) {
            lines.push('');
            lines.push(`**Description:** ${book.description}`);
        }
        lines.push('');
        lines.push(`**Statistics:** ${book.chapter_count} chapters, ${book.word_count} words, ${book.character_count} characters`);
        lines.push('');
        lines.push('---');
        lines.push('');
        
        // Chapters
        chapters.forEach((chapter, index) => {
            lines.push(`## Chapter ${chapter.chapter_number}: ${chapter.title}`);
            lines.push('');
            if (chapter.content) {
                lines.push(chapter.content);
            }
            lines.push('');
            if (index < chapters.length - 1) {
                lines.push('---');
                lines.push('');
            }
        });
        
        return lines.join('\n');
    }

    // Plain text export template
    static generateTextExport(book: BookData, chapters: ChapterData[]): string {
        const lines: string[] = [];
        
        // Book header
        lines.push(book.title.toUpperCase());
        lines.push('='.repeat(book.title.length));
        lines.push('');
        lines.push(`Author: ${book.author}`);
        if (book.description) {
            lines.push(`Description: ${book.description}`);
        }
        lines.push(`Statistics: ${book.chapter_count} chapters, ${book.word_count} words`);
        lines.push('');
        lines.push('-'.repeat(50));
        lines.push('');
        
        // Chapters
        chapters.forEach((chapter, index) => {
            lines.push(`CHAPTER ${chapter.chapter_number}: ${chapter.title.toUpperCase()}`);
            lines.push('');
            if (chapter.content) {
                lines.push(chapter.content);
            }
            lines.push('');
            if (index < chapters.length - 1) {
                lines.push('-'.repeat(30));
                lines.push('');
            }
        });
        
        return lines.join('\n');
    }

    // Generate standardised filename
    static generateFilename(book: BookData, format: 'txt' | 'md'): string {
        const sanitisedTitle = book.title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
        
        const sanitisedAuthor = book.author
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 30);
        
        return `${sanitisedTitle}-${sanitisedAuthor}.${format}`;
    }
}
```

## Integration Points

### Frontend Integration

**State Management Integration:**
The data models integrate seamlessly with Zustand state management for real-time updates and optimistic UI updates.

**API Communication:**
All database operations are exposed through RESTful API endpoints that communicate with the frontend using standardised JSON responses.

**Validation Integration:**
Frontend forms utilise the same validation logic through API error responses, ensuring consistent validation across the application.

### Spell Checking Integration

**Dictionary Term Integration:**
Custom dictionary terms are automatically incorporated into the typo.js spell checking engine, providing real-time spell checking with user-defined terms.

**British English Standards:**
The database schema supports British English conventions and terminology throughout all text fields and validation messages.

### Export System Integration

**Template-Based Export:**
The export system utilises template classes that generate standardised outputs in multiple formats whilst maintaining British English conventions.

**Metadata Integration:**
Export functionality automatically includes computed fields and metadata from the database models.

## Performance Considerations

### Database Optimisation

**Indexing Strategy:**
- Primary keys on all tables for efficient lookups
- Unique constraints on frequently queried fields
- Foreign key indexes for relationship queries

**Query Optimisation:**
- Prepared statements for all database operations
- Efficient aggregation queries for computed fields
- Pagination support for large datasets

**Memory Management:**
- Lazy loading for large text content
- Efficient text processing algorithms
- Proper resource cleanup and connection management

### Caching Strategy

**Computed Field Caching:**
Word counts and character counts are stored as computed fields to avoid real-time calculation overhead.

**Preference Caching:**
User preferences are cached in memory with proper invalidation strategies.

**Dictionary Caching:**
Dictionary terms are cached for efficient spell checking performance.

## Data Integrity and Security

### Validation System

**Input Sanitisation:**
All user input is sanitised and validated before database storage to prevent injection attacks and ensure data quality.

**Business Rule Enforcement:**
Database constraints and model validation ensure business rules are enforced at the data layer.

**Error Handling:**
Comprehensive error handling provides meaningful feedback whilst protecting sensitive system information.

### Backup and Recovery

**SQLite Advantages:**
Single-file database enables simple backup and recovery procedures suitable for Raspberry Pi deployment.

**Data Export:**
Built-in export functionality provides additional data protection through multiple output formats.

**Migration Safety:**
Version-controlled migrations ensure safe schema updates with rollback capabilities.

## Testing Implementation

### Unit Testing

**Model Testing:**
Comprehensive unit tests for all model classes covering validation, computed fields, and business logic.

**Utility Testing:**
Text processing utilities are thoroughly tested with various input scenarios including edge cases.

**Migration Testing:**
Database migrations are tested for both forward and rollback scenarios.

### Integration Testing

**Database Operations:**
Full CRUD operations tested against actual SQLite database instances.

**Relationship Testing:**
Foreign key constraints and cascade operations verified through integration tests.

**Performance Testing:**
Large dataset testing ensures performance requirements are met for 100,000+ word documents.

## Future Extensibility

### Schema Evolution

**Migration Framework:**
Knex.js migration system supports future schema changes with version control and rollback capabilities.

**Flexible Preferences:**
Key-value preference system easily accommodates new configuration options.

**Dictionary Expansion:**
Dictionary system supports additional categories and classification systems.

### Feature Support

**Additional Entity Types:**
Schema design supports future entities such as comments, revisions, or collaborative features.

**Metadata Expansion:**
Existing entities can accommodate additional metadata fields through migrations.

**Integration Points:**
Database architecture supports integration with external services and APIs.

## British English Compliance

### Language Standards

**Terminology:**
All database field names, validation messages, and documentation use British English terminology and spelling conventions.

**Text Processing:**
Text processing utilities are optimised for British English grammar and punctuation rules.

**Export Formats:**
Export templates maintain British English standards in generated content and formatting.

### Cultural Considerations

**Date Formatting:**
Database timestamps and export formats use British date conventions where applicable.

**Content Standards:**
Validation and processing algorithms respect British English literary and editorial conventions.

## Quality Assurance

### Code Quality

**TypeScript Integration:**
Full TypeScript typing ensures compile-time error detection and improved developer experience.

**Consistent Patterns:**
All model classes follow consistent patterns for validation, error handling, and data processing.

**Documentation Standards:**
Comprehensive inline documentation follows JSDoc standards with British English conventions.

### Testing Coverage

**Validation Coverage:**
All validation methods tested with valid, invalid, and edge case inputs.

**Error Handling Coverage:**
Error conditions tested to ensure graceful failure and appropriate error messages.

**Integration Coverage:**
Database operations tested with real SQLite instances to verify actual behaviour.

## Deployment Considerations

### Raspberry Pi Optimisation

**Resource Efficiency:**
SQLite database provides excellent performance with minimal resource usage suitable for Raspberry Pi 5.

**File System Compatibility:**
Database design compatible with Raspberry Pi file system limitations and permissions.

**Backup Strategy:**
Simple file-based backup suitable for automated Raspberry Pi backup systems.

### Production Readiness

**Error Logging:**
Comprehensive error logging for production troubleshooting and monitoring.

**Performance Monitoring:**
Built-in query performance tracking for production optimisation.

**Data Validation:**
Production-ready validation and sanitisation prevents data corruption and security issues.

---

**Feature Status:** ✅ Complete  
**Implementation Date:** September 2025  
**Previous Phase:** Project structure and core infrastructure  
**Next Phase:** Core backend API infrastructure  
**Dependencies:** SQLite database, Knex.js migration system  
**Testing Status:** Comprehensive unit and integration testing complete  
**British English Compliance:** All text processing and validation supports British English standards
import { Book } from '../models/Book.js';
import { Chapter } from '../models/Chapter.js';

export type ExportFormat = 'txt' | 'markdown';

export interface ExportResult {
  content: string;
  filename: string;
  format: ExportFormat;
  mimeType: string;
}

/**
 * Export a book with its chapters in the specified format
 */
export async function exportBook(
  book: Book,
  chapters: Chapter[],
  format: ExportFormat
): Promise<ExportResult> {
  // Sort chapters by chapter number
  const sortedChapters = chapters.sort((a, b) => a.chapter_number - b.chapter_number);

  let content: string;
  let mimeType: string;

  switch (format) {
    case 'txt':
      content = generateTextFormat(book, sortedChapters);
      mimeType = 'text/plain';
      break;
    case 'markdown':
      content = generateMarkdownFormat(book, sortedChapters);
      mimeType = 'text/markdown';
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  const filename = generateFilename(book, format);

  return {
    content,
    filename,
    format,
    mimeType,
  };
}

/**
 * Generate a standardised filename for the exported book
 */
function generateFilename(book: Book, format: ExportFormat): string {
  // Sanitise title and author for filename
  const sanitiseForFilename = (text: string): string => {
    return text
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .trim()
      .toLowerCase();
  };

  const sanitisedTitle = sanitiseForFilename(book.title);
  const sanitisedAuthor = sanitiseForFilename(book.author);

  // Format: title_by_author_YYYY-MM-DD.ext
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const extension = format === 'markdown' ? 'md' : format;

  return `${sanitisedTitle}_by_${sanitisedAuthor}_${dateStr}.${extension}`;
}

/**
 * Generate plain text format
 */
function generateTextFormat(book: Book, chapters: Chapter[]): string {
  const lines: string[] = [];

  // Book header
  lines.push('=' .repeat(80));
  lines.push(book.title.toUpperCase());
  lines.push(`by ${book.author}`);
  lines.push('=' .repeat(80));
  lines.push('');

  // Book metadata
  if (book.description) {
    lines.push('DESCRIPTION:');
    lines.push(book.description);
    lines.push('');
  }

  lines.push('BOOK INFORMATION:');
  lines.push(`Total Chapters: ${book.chapter_count}`);
  lines.push(`Total Words: ${book.word_count.toLocaleString()}`);
  lines.push(`Created: ${book.created_at ? new Date(book.created_at).toLocaleDateString('en-GB') : 'Unknown'}`);
  lines.push(`Last Modified: ${book.updated_at ? new Date(book.updated_at).toLocaleDateString('en-GB') : 'Unknown'}`);
  lines.push('');
  lines.push('-' .repeat(80));
  lines.push('');

  // Chapters
  chapters.forEach((chapter, index) => {
    // Chapter header
    lines.push(`CHAPTER ${chapter.chapter_number}: ${chapter.title.toUpperCase()}`);
    lines.push('-' .repeat(60));
    lines.push('');

    // Chapter content
    if (chapter.content.trim()) {
      lines.push(chapter.content.trim());
    } else {
      lines.push('(No content)');
    }

    lines.push('');

    // Chapter footer (except for last chapter)
    if (index < chapters.length - 1) {
      lines.push('');
      lines.push('*' .repeat(40));
      lines.push('');
    }
  });

  // Book footer
  lines.push('');
  lines.push('=' .repeat(80));
  lines.push(`End of "${book.title}" by ${book.author}`);
  lines.push(`Exported: ${new Date().toLocaleString('en-GB')}`);
  lines.push('=' .repeat(80));

  return lines.join('\n');
}

/**
 * Generate markdown format
 */
function generateMarkdownFormat(book: Book, chapters: Chapter[]): string {
  const lines: string[] = [];

  // Book header
  lines.push(`# ${book.title}`);
  lines.push(`**by ${book.author}**`);
  lines.push('');

  // Book metadata
  if (book.description) {
    lines.push('## Description');
    lines.push('');
    lines.push(book.description);
    lines.push('');
  }

  // Book information table
  lines.push('## Book Information');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('|-------|-------|');
  lines.push(`| Total Chapters | ${book.chapter_count} |`);
  lines.push(`| Total Words | ${book.word_count.toLocaleString()} |`);
  lines.push(`| Created | ${book.created_at ? new Date(book.created_at).toLocaleDateString('en-GB') : 'Unknown'} |`);
  lines.push(`| Last Modified | ${book.updated_at ? new Date(book.updated_at).toLocaleDateString('en-GB') : 'Unknown'} |`);
  lines.push('');

  // Table of contents
  if (chapters.length > 1) {
    lines.push('## Table of Contents');
    lines.push('');
    chapters.forEach(chapter => {
      const chapterAnchor = chapter.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      lines.push(`${chapter.chapter_number}. [${chapter.title}](#chapter-${chapter.chapter_number}-${chapterAnchor})`);
    });
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Chapters
  chapters.forEach((chapter, index) => {
    // Chapter header
    // const chapterAnchor = chapter.title
    //   .toLowerCase()
    //   .replace(/[^\w\s-]/g, '')
    //   .replace(/\s+/g, '-');

    lines.push(`## Chapter ${chapter.chapter_number}: ${chapter.title}`);
    lines.push('');

    // Chapter metadata
    lines.push(`**Words:** ${chapter.word_count.toLocaleString()} | **Characters:** ${chapter.character_count.toLocaleString()}`);
    lines.push('');

    // Chapter content
    if (chapter.content.trim()) {
      lines.push(chapter.content.trim());
    } else {
      lines.push('*(No content)*');
    }

    lines.push('');

    // Page break between chapters (except last)
    if (index < chapters.length - 1) {
      lines.push('---');
      lines.push('');
    }
  });

  // Book footer
  lines.push('---');
  lines.push('');
  lines.push(`*End of "${book.title}" by ${book.author}*`);
  lines.push('');
  lines.push(`*Exported: ${new Date().toLocaleString('en-GB')}*`);

  return lines.join('\n');
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'txt':
      return 'txt';
    case 'markdown':
      return 'md';
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'txt':
      return 'text/plain';
    case 'markdown':
      return 'text/markdown';
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

/**
 * Validate export format
 */
export function isValidExportFormat(format: string): format is ExportFormat {
  return ['txt', 'markdown'].includes(format);
}
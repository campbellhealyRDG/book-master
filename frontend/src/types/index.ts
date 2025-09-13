// Book data types
export interface Book {
  id: number;
  title: string;
  author: string;
  description?: string;
  chapterCount: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookData {
  title: string;
  author: string;
  description?: string;
}

export interface UpdateBookData {
  title?: string;
  author?: string;
  description?: string;
}

// Chapter data types
export interface Chapter {
  id: number;
  bookId: number;
  title: string;
  content: string;
  chapterNumber: number;
  wordCount: number;
  characterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChapterData {
  title: string;
  content?: string;
}

export interface UpdateChapterData {
  title?: string;
  content?: string;
}

// Dictionary data types
export interface DictionaryTerm {
  id: number;
  term: string;
  category: DictionaryCategory;
  isActive: boolean;
  isUserAdded: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DictionaryCategory = 'general' | 'technical' | 'medical' | 'legal' | 'custom';

export interface CreateTermData {
  term: string;
  category: DictionaryCategory;
  isUserAdded?: boolean;
}

export interface UpdateTermData {
  term?: string;
  category?: DictionaryCategory;
  isActive?: boolean;
}

// User preferences data types
export interface UserPreference {
  id: number;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface FontSettings {
  fontFamily: string;
  fontSize: number;
}

export interface EditorSettings {
  theme: 'light' | 'dark';
  autosaveInterval: number;
  spellCheckEnabled: boolean;
}

// Scratchpad data types
export interface Scratchpad {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface APIResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface APIError {
  message: string;
  status: number;
  code?: string;
}

// Application state types
export interface AppError {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  timestamp: Date;
  dismissible: boolean;
}

// Spell checking types
export interface SpellCheckResult {
  word: string;
  suggestions: string[];
  position: {
    start: number;
    end: number;
  };
}

export interface SpellCheckError {
  word: string;
  position: {
    start: number;
    end: number;
  };
  suggestions: string[];
}

// Export functionality types
export type ExportFormat = 'txt' | 'markdown';

export interface ExportResult {
  filename: string;
  content: string;
  format: ExportFormat;
  size: number;
}

export interface ExportRequest {
  format: ExportFormat;
}
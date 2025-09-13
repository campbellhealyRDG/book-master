import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { apiService } from '../../services/apiService';
import { cacheService } from '../../services/cacheService';
import { spellCheckService } from '../../services/spellCheckService';
import { memoryManager } from '../../services/memoryManager';

// Mock services
jest.mock('../../services/apiService');
jest.mock('../../services/cacheService');
jest.mock('../../services/spellCheckService');
jest.mock('../../services/memoryManager');

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;
const mockSpellCheckService = spellCheckService as jest.Mocked<typeof spellCheckService>;
const mockMemoryManager = memoryManager as jest.Mocked<typeof memoryManager>;

// Test data
const mockBook = {
  id: 1,
  title: 'Test Book',
  author: 'Test Author',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  chapter_count: 3,
  word_count: 1500
};

const mockChapters = [
  {
    id: 1,
    book_id: 1,
    title: 'Chapter 1',
    content: 'This is the first chapter with some content that needs spell checking.',
    chapter_number: 1,
    word_count: 12,
    character_count: 65,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    book_id: 1,
    title: 'Chapter 2',
    content: 'This is the second chapter with different content for testing.',
    chapter_number: 2,
    word_count: 11,
    character_count: 62,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    book_id: 1,
    title: 'Chapter 3',
    content: 'This is the third chapter to complete our test book.',
    chapter_number: 3,
    word_count: 10,
    character_count: 50,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockUserPreferences = {
  id: 1,
  font_family: 'Arial',
  font_size: 14,
  theme: 'light',
  autosave_interval: 30,
  spell_check_enabled: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('Complete Book Management Workflow Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockApiService.getBooks.mockResolvedValue([mockBook]);
    mockApiService.getBook.mockResolvedValue(mockBook);
    mockApiService.getChapters.mockResolvedValue(mockChapters);
    mockApiService.getUserPreferences.mockResolvedValue(mockUserPreferences);
    mockApiService.searchContent.mockResolvedValue({
      books: [mockBook],
      chapters: mockChapters.slice(0, 1),
      totalResults: 2
    });

    mockCacheService.get.mockReturnValue(null);
    mockCacheService.getStats.mockReturnValue({
      hitRate: 75,
      missRate: 25,
      evictionCount: 0,
      totalRequests: 100,
      size: 10,
      memoryUsage: 1024,
      topAccessedKeys: []
    });

    mockSpellCheckService.checkSpelling.mockResolvedValue({
      errors: [],
      suggestions: new Map(),
      processingTime: 15,
      wordCount: 12
    });

    mockMemoryManager.getMemoryUsage.mockReturnValue({
      totalHeapSize: 100 * 1024 * 1024,
      usedHeapSize: 50 * 1024 * 1024,
      heapSizeLimit: 500 * 1024 * 1024,
      cacheSize: 1024,
      domNodes: 1000,
      eventListeners: 50
    });
  });

  const renderApp = () => {
    return render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  };

  describe('Complete Book Creation and Editing Workflow', () => {
    test('should create a new book, add chapters, edit content, and save changes', async () => {
      const user = userEvent.setup();

      // Mock successful book creation
      mockApiService.createBook.mockResolvedValue({
        ...mockBook,
        id: 2,
        title: 'New Test Book',
        chapter_count: 0
      });

      mockApiService.createChapter.mockResolvedValue({
        ...mockChapters[0],
        id: 4,
        book_id: 2,
        title: 'New Chapter'
      });

      mockApiService.updateChapter.mockResolvedValue({
        ...mockChapters[0],
        id: 4,
        content: 'Updated chapter content with spell checking.'
      });

      renderApp();

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText(/Book Master/i)).toBeInTheDocument();
      });

      // Step 1: Create a new book
      const createBookButton = screen.getByRole('button', { name: /create new book/i });
      await user.click(createBookButton);

      // Fill in book details
      const titleInput = screen.getByLabelText(/book title/i);
      const authorInput = screen.getByLabelText(/author/i);

      await user.type(titleInput, 'New Test Book');
      await user.type(authorInput, 'Integration Test Author');

      const saveBookButton = screen.getByRole('button', { name: /save book/i });
      await user.click(saveBookButton);

      // Verify book creation API call
      await waitFor(() => {
        expect(mockApiService.createBook).toHaveBeenCalledWith({
          title: 'New Test Book',
          author: 'Integration Test Author'
        });
      });

      // Step 2: Add a new chapter
      const addChapterButton = screen.getByRole('button', { name: /add chapter/i });
      await user.click(addChapterButton);

      const chapterTitleInput = screen.getByLabelText(/chapter title/i);
      await user.type(chapterTitleInput, 'New Chapter');

      const createChapterButton = screen.getByRole('button', { name: /create chapter/i });
      await user.click(createChapterButton);

      // Verify chapter creation
      await waitFor(() => {
        expect(mockApiService.createChapter).toHaveBeenCalledWith(2, {
          title: 'New Chapter',
          chapter_number: 1
        });
      });

      // Step 3: Edit chapter content
      const chapterInList = screen.getByText('New Chapter');
      await user.click(chapterInList);

      // Open chapter editor
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const contentEditor = screen.getByRole('textbox', { name: /chapter content/i });
      await user.clear(contentEditor);
      await user.type(contentEditor, 'Updated chapter content with spell checking.');

      // Verify spell checking is triggered
      await waitFor(() => {
        expect(mockSpellCheckService.checkSpelling).toHaveBeenCalled();
      });

      // Step 4: Save changes
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Verify chapter update
      await waitFor(() => {
        expect(mockApiService.updateChapter).toHaveBeenCalledWith(4, {
          content: 'Updated chapter content with spell checking.'
        });
      });

      // Verify memory management is tracking the document
      expect(mockMemoryManager.registerDocument).toHaveBeenCalled();
      expect(mockMemoryManager.updateDocumentAccess).toHaveBeenCalled();
    });

    test('should handle auto-save functionality during editing', async () => {
      const user = userEvent.setup();

      mockApiService.updateChapter.mockResolvedValue(mockChapters[0]);

      renderApp();

      // Navigate to an existing chapter
      await waitFor(() => {
        expect(screen.getByText(mockBook.title)).toBeInTheDocument();
      });

      const bookTitle = screen.getByText(mockBook.title);
      await user.click(bookTitle);

      await waitFor(() => {
        expect(screen.getByText(mockChapters[0].title)).toBeInTheDocument();
      });

      const chapterTitle = screen.getByText(mockChapters[0].title);
      await user.click(chapterTitle);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const contentEditor = screen.getByRole('textbox', { name: /chapter content/i });

      // Type content and wait for auto-save
      await user.type(contentEditor, ' Additional content for auto-save test.');

      // Wait for auto-save to trigger (based on debouncing)
      await waitFor(
        () => {
          expect(mockApiService.updateChapter).toHaveBeenCalled();
        },
        { timeout: 35000 } // Wait for auto-save interval
      );

      // Verify auto-save indicator appears
      expect(screen.getByText(/auto-saved/i)).toBeInTheDocument();
    });
  });

  describe('Book Search and Navigation Workflow', () => {
    test('should search across books and chapters, navigate to results', async () => {
      const user = userEvent.setup();

      renderApp();

      // Wait for books to load
      await waitFor(() => {
        expect(screen.getByText(mockBook.title)).toBeInTheDocument();
      });

      // Step 1: Perform global search
      const searchInput = screen.getByPlaceholderText(/search books and chapters/i);
      await user.type(searchInput, 'first chapter');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // Verify search API call
      await waitFor(() => {
        expect(mockApiService.searchContent).toHaveBeenCalledWith('first chapter');
      });

      // Step 2: Verify search results display
      await waitFor(() => {
        expect(screen.getByText(/search results/i)).toBeInTheDocument();
        expect(screen.getByText(mockChapters[0].title)).toBeInTheDocument();
      });

      // Step 3: Navigate to search result
      const searchResult = screen.getByText(mockChapters[0].title);
      await user.click(searchResult);

      // Verify navigation to chapter
      await waitFor(() => {
        expect(screen.getByText(mockChapters[0].content)).toBeInTheDocument();
      });

      // Verify memory management updates
      expect(mockMemoryManager.updateDocumentAccess).toHaveBeenCalled();
    });

    test('should filter search results and navigate between books', async () => {
      const user = userEvent.setup();

      renderApp();

      await waitFor(() => {
        expect(screen.getByText(mockBook.title)).toBeInTheDocument();
      });

      // Navigate to specific book
      const bookTitle = screen.getByText(mockBook.title);
      await user.click(bookTitle);

      // Verify chapters are loaded
      await waitFor(() => {
        expect(mockApiService.getChapters).toHaveBeenCalledWith(mockBook.id);
      });

      // Step 1: Perform book-specific search
      const bookSearchInput = screen.getByPlaceholderText(/search within this book/i);
      await user.type(bookSearchInput, 'content');

      // Verify book-specific search
      await waitFor(() => {
        expect(mockApiService.searchContent).toHaveBeenCalledWith('content', mockBook.id);
      });

      // Step 2: Navigate between chapters
      const nextChapterButton = screen.getByRole('button', { name: /next chapter/i });
      await user.click(nextChapterButton);

      // Verify cache usage for navigation
      expect(mockCacheService.get).toHaveBeenCalled();
    });
  });

  describe('Spell Checking and Dictionary Workflow', () => {
    test('should detect spelling errors, show suggestions, and add to dictionary', async () => {
      const user = userEvent.setup();

      // Mock spell check with errors
      mockSpellCheckService.checkSpelling.mockResolvedValue({
        errors: [
          {
            word: 'teh',
            position: 10,
            length: 3,
            suggestions: ['the', 'tea', 'ten'],
            type: 'spelling',
            severity: 'high'
          }
        ],
        suggestions: new Map([['teh', ['the', 'tea', 'ten']]]),
        processingTime: 25,
        wordCount: 15
      });

      mockSpellCheckService.getSuggestions.mockResolvedValue(['the', 'tea', 'ten']);
      mockSpellCheckService.addToCustomDictionary.mockResolvedValue();

      renderApp();

      // Navigate to chapter editor
      await waitFor(() => {
        expect(screen.getByText(mockBook.title)).toBeInTheDocument();
      });

      const bookTitle = screen.getByText(mockBook.title);
      await user.click(bookTitle);

      const chapterTitle = screen.getByText(mockChapters[0].title);
      await user.click(chapterTitle);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const contentEditor = screen.getByRole('textbox', { name: /chapter content/i });

      // Type content with spelling error
      await user.clear(contentEditor);
      await user.type(contentEditor, 'This is teh test content.');

      // Wait for spell check
      await waitFor(() => {
        expect(mockSpellCheckService.checkSpelling).toHaveBeenCalled();
      });

      // Step 1: Verify spelling error is highlighted
      const errorSpan = screen.getByText('teh');
      expect(errorSpan).toHaveClass('spelling-error');

      // Step 2: Right-click to show suggestions
      await user.pointer({ keys: '[MouseRight]', target: errorSpan });

      await waitFor(() => {
        expect(screen.getByText('the')).toBeInTheDocument();
        expect(screen.getByText('tea')).toBeInTheDocument();
      });

      // Step 3: Select correction
      const correctionSuggestion = screen.getByText('the');
      await user.click(correctionSuggestion);

      // Verify content is updated
      await waitFor(() => {
        expect(contentEditor).toHaveValue('This is the test content.');
      });

      // Step 4: Add word to custom dictionary
      const addToDictionaryButton = screen.getByRole('button', { name: /add to dictionary/i });
      await user.click(addToDictionaryButton);

      expect(mockSpellCheckService.addToCustomDictionary).toHaveBeenCalledWith('teh', 'user');
    });

    test('should handle British English spell checking preferences', async () => {
      const user = userEvent.setup();

      // Mock British English corrections
      mockSpellCheckService.checkSpelling.mockResolvedValue({
        errors: [
          {
            word: 'color',
            position: 15,
            length: 5,
            suggestions: ['colour'],
            type: 'spelling',
            severity: 'medium'
          }
        ],
        suggestions: new Map([['color', ['colour']]]),
        processingTime: 20,
        wordCount: 8
      });

      renderApp();

      // Navigate to preferences
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      // Enable British English spell checking
      const britishSpellingToggle = screen.getByLabelText(/british english spelling/i);
      await user.click(britishSpellingToggle);

      // Save preferences
      const savePreferencesButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(savePreferencesButton);

      // Verify preferences update
      await waitFor(() => {
        expect(mockApiService.updateUserPreferences).toHaveBeenCalledWith({
          spell_check_british_english: true
        });
      });

      // Navigate back to editor and test spell checking
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      const bookTitle = screen.getByText(mockBook.title);
      await user.click(bookTitle);

      const chapterTitle = screen.getByText(mockChapters[0].title);
      await user.click(chapterTitle);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const contentEditor = screen.getByRole('textbox', { name: /chapter content/i });
      await user.type(contentEditor, ' The color is beautiful.');

      // Verify British English spell checking
      await waitFor(() => {
        expect(mockSpellCheckService.checkSpelling).toHaveBeenCalledWith(
          expect.stringContaining('color'),
          expect.any(String),
          expect.objectContaining({
            britishEnglishOnly: true
          })
        );
      });
    });
  });

  describe('Export and Performance Workflow', () => {
    test('should export book in multiple formats with performance monitoring', async () => {
      const user = userEvent.setup();

      // Mock export functionality
      mockApiService.exportBook.mockResolvedValue(new Blob(['PDF content'], { type: 'application/pdf' }));

      renderApp();

      await waitFor(() => {
        expect(screen.getByText(mockBook.title)).toBeInTheDocument();
      });

      const bookTitle = screen.getByText(mockBook.title);
      await user.click(bookTitle);

      // Step 1: Open export menu
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      // Step 2: Select PDF format
      const pdfOption = screen.getByRole('radio', { name: /pdf/i });
      await user.click(pdfOption);

      // Step 3: Start export
      const startExportButton = screen.getByRole('button', { name: /start export/i });
      await user.click(startExportButton);

      // Verify export API call
      await waitFor(() => {
        expect(mockApiService.exportBook).toHaveBeenCalledWith(mockBook.id, 'pdf');
      });

      // Step 4: Check performance monitoring
      expect(mockMemoryManager.checkMemoryPressure).toHaveBeenCalled();

      // Verify export completion
      await waitFor(() => {
        expect(screen.getByText(/export completed/i)).toBeInTheDocument();
      });
    });

    test('should handle large document performance and memory cleanup', async () => {
      const user = userEvent.setup();

      // Mock large document
      const largeChapter = {
        ...mockChapters[0],
        content: 'A'.repeat(100000), // 100k characters
        word_count: 20000,
        character_count: 100000
      };

      mockApiService.getChapter.mockResolvedValue(largeChapter);

      // Mock memory pressure
      mockMemoryManager.checkMemoryPressure.mockReturnValue(true);

      renderApp();

      await waitFor(() => {
        expect(screen.getByText(mockBook.title)).toBeInTheDocument();
      });

      const bookTitle = screen.getByText(mockBook.title);
      await user.click(bookTitle);

      const chapterTitle = screen.getByText(mockChapters[0].title);
      await user.click(chapterTitle);

      // Verify large document registration
      expect(mockMemoryManager.registerDocument).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/A{100000}/),
        expect.any(Number)
      );

      // Verify memory pressure detection
      expect(mockMemoryManager.checkMemoryPressure).toHaveBeenCalled();

      // Step 1: Navigate away to trigger cleanup
      const homeButton = screen.getByRole('button', { name: /home/i });
      await user.click(homeButton);

      // Verify document deactivation
      expect(mockMemoryManager.deactivateDocument).toHaveBeenCalled();

      // Step 2: Return to large document
      await user.click(bookTitle);
      await user.click(chapterTitle);

      // Verify document reactivation
      expect(mockMemoryManager.updateDocumentAccess).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Recovery Workflow', () => {
    test('should handle API failures gracefully and show appropriate error messages', async () => {
      const user = userEvent.setup();

      // Mock API failure
      mockApiService.getBooks.mockRejectedValue(new Error('Network error'));

      renderApp();

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/failed to load books/i)).toBeInTheDocument();
      });

      // Step 1: Retry loading
      const retryButton = screen.getByRole('button', { name: /retry/i });

      // Mock successful retry
      mockApiService.getBooks.mockResolvedValue([mockBook]);

      await user.click(retryButton);

      // Verify successful recovery
      await waitFor(() => {
        expect(screen.getByText(mockBook.title)).toBeInTheDocument();
      });
    });

    test('should handle spell check service failures without blocking editor', async () => {
      const user = userEvent.setup();

      // Mock spell check failure
      mockSpellCheckService.checkSpelling.mockRejectedValue(new Error('Spell check service unavailable'));

      renderApp();

      await waitFor(() => {
        expect(screen.getByText(mockBook.title)).toBeInTheDocument();
      });

      const bookTitle = screen.getByText(mockBook.title);
      await user.click(bookTitle);

      const chapterTitle = screen.getByText(mockChapters[0].title);
      await user.click(chapterTitle);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const contentEditor = screen.getByRole('textbox', { name: /chapter content/i });

      // Type content even with spell check failure
      await user.type(contentEditor, 'This content should still be editable.');

      // Verify editor remains functional
      expect(contentEditor).toHaveValue(expect.stringContaining('This content should still be editable.'));

      // Verify error is logged but not blocking
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Spell check failed'),
        expect.any(Error)
      );
    });
  });
});
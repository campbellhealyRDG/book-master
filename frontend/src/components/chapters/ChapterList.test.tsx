import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ChapterList from './ChapterList';
import { useAppStore } from '../../store';
import { useChapters } from '../../hooks/useApi';

// Mock dependencies
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../../hooks/useApi', () => ({
  useChapters: vi.fn(),
  useCreateChapter: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
}));

vi.mock('./ChapterCreator', () => ({
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="chapter-creator">
      <button onClick={onClose}>Close</button>
      <button onClick={onSuccess}>Success</button>
    </div>
  ),
}));

const mockStore = {
  chapters: [],
  selectedChapterId: null,
  selectedBook: {
    id: 1,
    title: 'Test Book',
    author: 'Test Author',
    chapterCount: 3,
    wordCount: 10000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  setChapters: vi.fn(),
  setSelectedChapterId: vi.fn(),
  setSelectedChapter: vi.fn(),
  removeChapter: vi.fn(),
};

const mockChaptersData = [
  {
    id: 1,
    bookId: 1,
    title: 'Chapter 1: Introduction',
    content: 'This is the introduction chapter content.',
    chapterNumber: 1,
    wordCount: 500,
    characterCount: 2500,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 2,
    bookId: 1,
    title: 'Chapter 2: Development',
    content: 'This is the development chapter content.',
    chapterNumber: 2,
    wordCount: 1000,
    characterCount: 5000,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
  },
];

describe('ChapterList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockReturnValue(mockStore);
    (useChapters as any).mockReturnValue({
      data: { data: mockChaptersData },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  const renderChapterList = (bookId = '1') => {
    return render(
      <MemoryRouter initialEntries={[`/books/${bookId}`]}>
        <Routes>
          <Route path="/books/:bookId" element={<ChapterList />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('renders the chapter list header', () => {
      renderChapterList();
      expect(screen.getByText('Chapters')).toBeInTheDocument();
      expect(screen.getByText('Test Book by Test Author')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new chapter/i })).toBeInTheDocument();
    });

    it('renders the search bar', () => {
      renderChapterList();
      const searchInput = screen.getByPlaceholderText(/search chapters/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('displays loading state', () => {
      (useChapters as any).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });
      renderChapterList();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('displays error state', () => {
      (useChapters as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load'),
        refetch: vi.fn(),
      });
      renderChapterList();
      expect(screen.getByText(/error loading chapters/i)).toBeInTheDocument();
    });

    it('displays empty state when no chapters', () => {
      (useChapters as any).mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        chapters: [],
      });
      renderChapterList();
      expect(screen.getByText(/no chapters found/i)).toBeInTheDocument();
      expect(screen.getByText(/get started by creating a new chapter/i)).toBeInTheDocument();
    });

    it('displays chapters list when chapters exist', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        chapters: mockChaptersData,
      });
      renderChapterList();
      expect(screen.getByText('Chapter 1: Introduction')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2: Development')).toBeInTheDocument();
    });

    it('shows warning when no book is selected', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<ChapterList />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText(/please select a book first/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('opens chapter creator modal when new chapter button clicked', () => {
      renderChapterList();
      const newChapterBtn = screen.getByRole('button', { name: /new chapter/i });
      fireEvent.click(newChapterBtn);
      expect(screen.getByTestId('chapter-creator')).toBeInTheDocument();
    });

    it('closes chapter creator modal', () => {
      renderChapterList();
      fireEvent.click(screen.getByRole('button', { name: /new chapter/i }));
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('chapter-creator')).not.toBeInTheDocument();
    });

    it('filters chapters based on search term', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        chapters: mockChaptersData,
      });
      renderChapterList();
      
      const searchInput = screen.getByPlaceholderText(/search chapters/i);
      fireEvent.change(searchInput, { target: { value: 'Introduction' } });
      
      expect(screen.getByText('Chapter 1: Introduction')).toBeInTheDocument();
      expect(screen.queryByText('Chapter 2: Development')).not.toBeInTheDocument();
    });

    it('expands and collapses chapter content preview', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        chapters: mockChaptersData,
      });
      renderChapterList();
      
      // Initially content should not be visible
      expect(screen.queryByText('This is the introduction chapter content.')).not.toBeInTheDocument();
      
      // Click expand button
      const expandButtons = screen.getAllByLabelText('Expand');
      fireEvent.click(expandButtons[0]);
      
      // Content should now be visible
      expect(screen.getByText('This is the introduction chapter content.')).toBeInTheDocument();
    });

    it('shows confirmation dialog on delete', () => {
      window.confirm = vi.fn(() => true);
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        chapters: mockChaptersData,
      });
      renderChapterList();
      
      const deleteButtons = screen.getAllByLabelText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this chapter? This action cannot be undone.'
      );
    });

    it('disables move up button for first chapter', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        chapters: mockChaptersData,
      });
      renderChapterList();
      
      const moveUpButtons = screen.getAllByLabelText('Move up');
      expect(moveUpButtons[0]).toBeDisabled();
      expect(moveUpButtons[1]).not.toBeDisabled();
    });

    it('disables move down button for last chapter', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        chapters: mockChaptersData,
      });
      renderChapterList();
      
      const moveDownButtons = screen.getAllByLabelText('Move down');
      expect(moveDownButtons[0]).not.toBeDisabled();
      expect(moveDownButtons[1]).toBeDisabled();
    });
  });

  describe('Chapter Display', () => {
    it('displays chapter metadata correctly', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        chapters: mockChaptersData,
      });
      renderChapterList();
      
      expect(screen.getByText('500 words')).toBeInTheDocument();
      expect(screen.getByText('1k words')).toBeInTheDocument();
      expect(screen.getByText('2500 characters')).toBeInTheDocument();
      expect(screen.getByText('5000 characters')).toBeInTheDocument();
    });

    it('highlights selected chapter', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        chapters: mockChaptersData,
        selectedChapterId: 1,
      });
      renderChapterList();
      
      const chapter = screen.getByText('Chapter 1: Introduction').closest('div[class*="cursor-pointer"]');
      expect(chapter?.parentElement).toHaveClass('border-chrome-green-500');
    });

    it('displays chapter numbers correctly', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        chapters: mockChaptersData,
      });
      renderChapterList();
      
      const chapterNumbers = screen.getAllByText(/^\d+$/);
      expect(chapterNumbers[0]).toHaveTextContent('1');
      expect(chapterNumbers[1]).toHaveTextContent('2');
    });
  });
});
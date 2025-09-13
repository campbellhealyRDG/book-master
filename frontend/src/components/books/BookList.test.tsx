import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookList from './BookList';
import { useAppStore } from '../../store';
import { useBooks } from '../../hooks/useApi';

// Mock dependencies
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../../hooks/useApi', () => ({
  useBooks: vi.fn(),
  useCreateBook: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
}));

vi.mock('./BookCreator', () => ({
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="book-creator">
      <button onClick={onClose}>Close</button>
      <button onClick={onSuccess}>Success</button>
    </div>
  ),
}));

const mockStore = {
  books: [],
  selectedBookId: null,
  setBooks: vi.fn(),
  setSelectedBookId: vi.fn(),
  setSelectedBook: vi.fn(),
  removeBook: vi.fn(),
};

const mockBooksData = [
  {
    id: 1,
    title: 'Test Book 1',
    author: 'Test Author 1',
    chapterCount: 5,
    wordCount: 10000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 2,
    title: 'Test Book 2',
    author: 'Test Author 2',
    chapterCount: 3,
    wordCount: 5000,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
  },
];

describe('BookList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockReturnValue(mockStore);
    (useBooks as any).mockReturnValue({
      data: { data: mockBooksData },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  const renderBookList = () => {
    return render(
      <MemoryRouter>
        <BookList />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('renders the book list header', () => {
      renderBookList();
      expect(screen.getByText('My Books')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new book/i })).toBeInTheDocument();
    });

    it('renders the search bar', () => {
      renderBookList();
      const searchInput = screen.getByPlaceholderText(/search books/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('displays loading state', () => {
      (useBooks as any).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });
      renderBookList();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('displays error state', () => {
      (useBooks as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load'),
        refetch: vi.fn(),
      });
      renderBookList();
      expect(screen.getByText(/error loading books/i)).toBeInTheDocument();
    });

    it('displays empty state when no books', () => {
      (useBooks as any).mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        books: [],
      });
      renderBookList();
      expect(screen.getByText(/no books found/i)).toBeInTheDocument();
      expect(screen.getByText(/get started by creating a new book/i)).toBeInTheDocument();
    });

    it('displays books grid when books exist', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        books: mockBooksData,
      });
      renderBookList();
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
      expect(screen.getByText('Test Book 2')).toBeInTheDocument();
      expect(screen.getByText('by Test Author 1')).toBeInTheDocument();
      expect(screen.getByText('by Test Author 2')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('opens book creator modal when new book button clicked', () => {
      renderBookList();
      const newBookBtn = screen.getByRole('button', { name: /new book/i });
      fireEvent.click(newBookBtn);
      expect(screen.getByTestId('book-creator')).toBeInTheDocument();
    });

    it('closes book creator modal', () => {
      renderBookList();
      fireEvent.click(screen.getByRole('button', { name: /new book/i }));
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('book-creator')).not.toBeInTheDocument();
    });

    it('filters books based on search term', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        books: mockBooksData,
      });
      renderBookList();
      
      const searchInput = screen.getByPlaceholderText(/search books/i);
      fireEvent.change(searchInput, { target: { value: 'Book 1' } });
      
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Book 2')).not.toBeInTheDocument();
    });

    it('selects a book when clicked', () => {
      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
        };
      });
      
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        books: mockBooksData,
      });
      renderBookList();
      
      const book = screen.getByText('Test Book 1').closest('div[class*="cursor-pointer"]');
      if (book) fireEvent.click(book);
      
      expect(mockStore.setSelectedBookId).toHaveBeenCalledWith(1);
    });

    it('shows confirmation dialog on delete', () => {
      window.confirm = vi.fn(() => true);
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        books: mockBooksData,
      });
      renderBookList();
      
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this book? This action cannot be undone.'
      );
    });
  });

  describe('Book Display', () => {
    it('displays book metadata correctly', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        books: mockBooksData,
      });
      renderBookList();
      
      expect(screen.getByText('5 chapters')).toBeInTheDocument();
      expect(screen.getByText('10000 words')).toBeInTheDocument();
      expect(screen.getByText(/Updated.*15.*Jan.*2024/)).toBeInTheDocument();
    });

    it('highlights selected book', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        books: mockBooksData,
        selectedBookId: 1,
      });
      renderBookList();
      
      const book = screen.getByText('Test Book 1').closest('div[class*="cursor-pointer"]');
      expect(book).toHaveClass('border-chrome-green-500');
    });

    it('shows action buttons for each book', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        books: mockBooksData,
      });
      renderBookList();
      
      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');
      
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { create } from 'zustand';
import Editor from './Editor';

// Mock the API hooks
vi.mock('../hooks/useApi', () => ({
  useChapter: vi.fn(),
  useBook: vi.fn(),
  useUpdateChapter: vi.fn(),
}));

// Mock the TextEditor component
vi.mock('../components/editor/TextEditor', () => ({
  default: vi.fn(({ content, onChange }) => (
    <div data-testid=\"text-editor\">
      <textarea
        data-testid=\"editor-textarea\"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder=\"Begin writing your chapter content here...\"
      />
    </div>
  ))
}));

// Mock the UnsavedChangesModal component
vi.mock('../components/editor/UnsavedChangesModal', () => ({
  default: vi.fn(({ onSave, onDontSave, onCancel }) => (
    <div data-testid=\"unsaved-changes-modal\">
      <button onClick={onSave} data-testid=\"save-button\">Save</button>
      <button onClick={onDontSave} data-testid=\"dont-save-button\">Don't Save</button>
      <button onClick={onCancel} data-testid=\"cancel-button\">Cancel</button>
    </div>
  ))
}));

// Mock the store
const mockStore = create(() => ({
  unsavedChanges: false,
  setUnsavedChanges: vi.fn(),
  autoSaveEnabled: true,
}));

vi.mock('../store', () => ({
  useAppStore: (selector: any) => selector(mockStore.getState())
}));

const { useChapter, useBook, useUpdateChapter } = await import('../hooks/useApi');

describe('Editor', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderEditor = (route = '/editor') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <Editor />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Empty state', () => {
    it('shows empty state when no chapter is selected', () => {
      vi.mocked(useChapter).mockReturnValue({
        data: undefined,
        isLoading: false
      } as any);

      vi.mocked(useBook).mockReturnValue({
        data: undefined
      } as any);

      renderEditor('/editor');

      expect(screen.getByText('No chapter selected')).toBeInTheDocument();
      expect(screen.getByText('Select a book and chapter to start writing')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to Books' })).toBeInTheDocument();
    });

    it('shows loading state', () => {
      vi.mocked(useChapter).mockReturnValue({
        data: undefined,
        isLoading: true
      } as any);

      vi.mocked(useBook).mockReturnValue({
        data: undefined
      } as any);

      renderEditor('/editor/1/1');

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Chapter editing', () => {
    const mockChapter = {
      id: 1,
      title: 'Chapter 1',
      chapterNumber: 1,
      content: 'Initial chapter content',
      bookId: 1
    };

    const mockBook = {
      id: 1,
      title: 'Test Book',
      author: 'Test Author'
    };

    beforeEach(() => {
      vi.mocked(useChapter).mockReturnValue({
        data: mockChapter,
        isLoading: false
      } as any);

      vi.mocked(useBook).mockReturnValue({
        data: mockBook
      } as any);

      vi.mocked(useUpdateChapter).mockReturnValue({
        mutateAsync: vi.fn().mockResolvedValue({ data: mockChapter })
      } as any);
    });

    it('renders editor with chapter content', async () => {
      renderEditor('/editor/1/1');

      await waitFor(() => {
        expect(screen.getByText('Test Book - Chapter 1')).toBeInTheDocument();
        expect(screen.getByText('Chapter 1')).toBeInTheDocument();
        expect(screen.getByTestId('text-editor')).toBeInTheDocument();
      });
    });

    it('displays chapter information in header', async () => {
      renderEditor('/editor/1/1');

      await waitFor(() => {
        expect(screen.getByText('Test Book - Chapter 1')).toBeInTheDocument();
        expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      });
    });

    it('shows Back to Books button', async () => {
      renderEditor('/editor/1/1');

      await waitFor(() => {
        expect(screen.getByText('← Back to Books')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-save functionality', () => {
    const mockChapter = {
      id: 1,
      title: 'Chapter 1',
      chapterNumber: 1,
      content: 'Initial content',
      bookId: 1
    };

    const mockBook = {
      id: 1,
      title: 'Test Book',
      author: 'Test Author'
    };

    beforeEach(() => {
      vi.mocked(useChapter).mockReturnValue({
        data: mockChapter,
        isLoading: false
      } as any);

      vi.mocked(useBook).mockReturnValue({
        data: mockBook
      } as any);

      vi.mocked(useUpdateChapter).mockReturnValue({
        mutateAsync: vi.fn().mockResolvedValue({ data: mockChapter })
      } as any);
    });

    it('handles auto-save events', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({ data: mockChapter });
      vi.mocked(useUpdateChapter).mockReturnValue({
        mutateAsync: mockMutateAsync
      } as any);

      // Mock unsaved changes
      mockStore.getState = vi.fn(() => ({
        unsavedChanges: true,
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
      }));

      renderEditor('/editor/1/1');

      await waitFor(() => {
        expect(screen.getByTestId('text-editor')).toBeInTheDocument();
      });

      // Trigger auto-save event
      const autoSaveEvent = new CustomEvent('auto-save');
      document.dispatchEvent(autoSaveEvent);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 1,
          data: { content: 'Initial content' }
        });
      });
    });

    it('handles manual save events', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({ data: mockChapter });
      vi.mocked(useUpdateChapter).mockReturnValue({
        mutateAsync: mockMutateAsync
      } as any);

      renderEditor('/editor/1/1');

      await waitFor(() => {
        expect(screen.getByTestId('text-editor')).toBeInTheDocument();
      });

      // Trigger manual save event
      const manualSaveEvent = new CustomEvent('manual-save');
      document.dispatchEvent(manualSaveEvent);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 1,
          data: { content: 'Initial content' }
        });
      });
    });

    it('shows saving status', async () => {
      const mockMutateAsync = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      vi.mocked(useUpdateChapter).mockReturnValue({
        mutateAsync: mockMutateAsync
      } as any);

      mockStore.getState = vi.fn(() => ({
        unsavedChanges: true,
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
      }));

      renderEditor('/editor/1/1');

      await waitFor(() => {
        expect(screen.getByTestId('text-editor')).toBeInTheDocument();
      });

      // Trigger auto-save
      const autoSaveEvent = new CustomEvent('auto-save');
      document.dispatchEvent(autoSaveEvent);

      // Should show saving status
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });

    it('shows unsaved changes status', async () => {
      mockStore.getState = vi.fn(() => ({
        unsavedChanges: true,
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
      }));

      renderEditor('/editor/1/1');

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });

    it('shows last saved time', async () => {
      renderEditor('/editor/1/1');

      await waitFor(() => {
        expect(screen.getByTestId('text-editor')).toBeInTheDocument();
      });

      // Simulate a save
      const mockMutateAsync = vi.fn().mockResolvedValue({ data: mockChapter });
      vi.mocked(useUpdateChapter).mockReturnValue({
        mutateAsync: mockMutateAsync
      } as any);

      const manualSaveEvent = new CustomEvent('manual-save');
      document.dispatchEvent(manualSaveEvent);

      await waitFor(() => {
        expect(screen.getByText(/Last saved:/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation protection', () => {
    it('sets up beforeunload event listener for unsaved changes', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      mockStore.getState = vi.fn(() => ({
        unsavedChanges: true,
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
      }));

      renderEditor('/editor/1/1');

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
  });

  describe('Error handling', () => {
    it('handles save errors gracefully', async () => {
      const mockMutateAsync = vi.fn().mockRejectedValue(new Error('Save failed'));
      vi.mocked(useUpdateChapter).mockReturnValue({
        mutateAsync: mockMutateAsync
      } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStore.getState = vi.fn(() => ({
        unsavedChanges: true,
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
      }));

      renderEditor('/editor/1/1');

      await waitFor(() => {
        expect(screen.getByTestId('text-editor')).toBeInTheDocument();
      });

      // Trigger save that will fail
      const manualSaveEvent = new CustomEvent('manual-save');
      document.dispatchEvent(manualSaveEvent);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save chapter:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Responsive design', () => {
    it('applies proper responsive classes', async () => {
      const mockChapter = {
        id: 1,
        title: 'Chapter 1',
        chapterNumber: 1,
        content: 'Test content',
        bookId: 1
      };

      vi.mocked(useChapter).mockReturnValue({
        data: mockChapter,
        isLoading: false
      } as any);

      renderEditor('/editor/1/1');

      await waitFor(() => {
        const container = document.querySelector('.h-full.flex.flex-col');
        expect(container).toBeInTheDocument();
      });
    });
  });
});
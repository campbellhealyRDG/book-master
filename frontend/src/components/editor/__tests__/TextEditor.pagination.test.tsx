import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import TextEditor from '../TextEditor';
import { useAppStore } from '../../../store';

// Mock the store
vi.mock('../../../store', () => ({
  useAppStore: vi.fn()
}));

// Mock spell checker service
vi.mock('../../../services/spellChecker', () => ({
  spellCheckService: {
    initialize: vi.fn().mockResolvedValue(true),
    checkText: vi.fn().mockReturnValue({ misspellings: [] }),
    refreshCustomDictionary: vi.fn().mockResolvedValue(undefined),
    addToIgnoreList: vi.fn(),
    addToCustomDictionary: vi.fn(),
    convertUSToUK: vi.fn().mockImplementation((word: string) => word)
  }
}));

// Mock pagination service
vi.mock('../../../services/paginationService', () => ({
  paginationService: {
    paginateDocument: vi.fn().mockReturnValue([
      {
        id: 'page-1',
        content: 'Page 1 content',
        startIndex: 0,
        endIndex: 14,
        wordCount: 3,
        characterCount: 14,
        pageNumber: 1
      },
      {
        id: 'page-2',
        content: 'Page 2 content',
        startIndex: 14,
        endIndex: 28,
        wordCount: 3,
        characterCount: 14,
        pageNumber: 2
      }
    ]),
    getPageWindow: vi.fn().mockImplementation((pages, currentPage) => pages),
    getDocumentStats: vi.fn().mockReturnValue({
      totalPages: 2,
      totalWords: 6,
      totalCharacters: 28
    }),
    updatePage: vi.fn().mockImplementation((pages, pageNum, content) => {
      const updatedPages = [...pages];
      if (pageNum === 1) {
        updatedPages[0] = {
          ...updatedPages[0],
          content,
          wordCount: content.trim().split(/\\s+/).length,
          characterCount: content.length
        };
      }
      return updatedPages;
    }),
    reconstructDocument: vi.fn().mockReturnValue('Page 1 contentPage 2 content')
  }
}));

describe('TextEditor Pagination', () => {
  const mockOnChange = vi.fn();
  const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange.mockClear();

    // Mock store state
    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: false
      };
      return selector(state);
    });

    // Mock setState for store updates
    (useAppStore as any).setState = vi.fn();
  });

  test('renders pagination toggle button', () => {
    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const paginationToggle = screen.getByTitle(/Pagination (enabled|disabled)/);
    expect(paginationToggle).toBeInTheDocument();
  });

  test('enables pagination when toggle is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const paginationToggle = screen.getByTitle(/Pagination disabled/);

    await user.click(paginationToggle);

    // Should show pagination controls
    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });
  });

  test('shows pagination controls when enabled', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Long content that would be paginated"
        onChange={mockOnChange}
      />
    );

    // Enable pagination
    const paginationToggle = screen.getByTitle(/Pagination disabled/);
    await user.click(paginationToggle);

    await waitFor(() => {
      // Check for pagination controls
      expect(screen.getByTitle('First Page (Ctrl+Home)')).toBeInTheDocument();
      expect(screen.getByTitle('Previous Page (Page Up)')).toBeInTheDocument();
      expect(screen.getByTitle('Next Page (Page Down)')).toBeInTheDocument();
      expect(screen.getByTitle('Last Page (Ctrl+End)')).toBeInTheDocument();
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });
  });

  test('navigates between pages using buttons', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Page content"
        onChange={mockOnChange}
      />
    );

    // Enable pagination
    const paginationToggle = screen.getByTitle(/Pagination disabled/);
    await user.click(paginationToggle);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    // Navigate to next page
    const nextButton = screen.getByTitle('Next Page (Page Down)');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
    });

    // Navigate to previous page
    const prevButton = screen.getByTitle('Previous Page (Page Up)');
    await user.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });
  });

  test('disables navigation buttons at boundaries', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Page content"
        onChange={mockOnChange}
      />
    );

    // Enable pagination
    const paginationToggle = screen.getByTitle(/Pagination disabled/);
    await user.click(paginationToggle);

    await waitFor(() => {
      // On first page, previous and first buttons should be disabled
      expect(screen.getByTitle('First Page (Ctrl+Home)')).toBeDisabled();
      expect(screen.getByTitle('Previous Page (Page Up)')).toBeDisabled();

      // Next and last buttons should be enabled
      expect(screen.getByTitle('Next Page (Page Down)')).not.toBeDisabled();
      expect(screen.getByTitle('Last Page (Ctrl+End)')).not.toBeDisabled();
    });
  });

  test('shows per-page word counts when paginated', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Enable pagination
    const paginationToggle = screen.getByTitle(/Pagination disabled/);
    await user.click(paginationToggle);

    await waitFor(() => {
      // Should show per-page counts and total counts
      expect(screen.getByText(/3 words \\(page\\)/)).toBeInTheDocument();
      expect(screen.getByText(/14 characters \\(page\\)/)).toBeInTheDocument();
      expect(screen.getByText(/6 total words/)).toBeInTheDocument();
      expect(screen.getByText(/28 total characters/)).toBeInTheDocument();
    });
  });

  test('handles keyboard navigation', async () => {
    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Enable pagination first
    const paginationToggle = screen.getByTitle(/Pagination disabled/);
    fireEvent.click(paginationToggle);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    const textarea = screen.getByRole('textbox');

    // Test Page Down navigation
    fireEvent.keyDown(textarea, { key: 'PageDown' });

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
    });

    // Test Page Up navigation
    fireEvent.keyDown(textarea, { key: 'PageUp' });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    // Test Ctrl+End navigation
    fireEvent.keyDown(textarea, { key: 'End', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
    });

    // Test Ctrl+Home navigation
    fireEvent.keyDown(textarea, { key: 'Home', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });
  });

  test('shows correct placeholder for paginated content', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content=""
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');

    // Initially should show normal placeholder
    expect(textarea).toHaveAttribute('placeholder', 'Begin writing your chapter content here...');

    // Enable pagination
    const paginationToggle = screen.getByTitle(/Pagination disabled/);
    await user.click(paginationToggle);

    await waitFor(() => {
      // Should show paginated placeholder
      expect(textarea).toHaveAttribute('placeholder', 'Page 1 content...');
    });
  });

  test('updates content in pagination mode', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Initial content"
        onChange={mockOnChange}
      />
    );

    // Enable pagination
    const paginationToggle = screen.getByTitle(/Pagination disabled/);
    await user.click(paginationToggle);

    const textarea = screen.getByRole('textbox');

    // Type new content
    await user.clear(textarea);
    await user.type(textarea, 'New page content');

    // Should call onChange with reconstructed document
    expect(mockOnChange).toHaveBeenCalledWith('Page 1 contentPage 2 content');
  });

  test('maintains pagination state during content changes', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <TextEditor
        content="Initial content"
        onChange={mockOnChange}
      />
    );

    // Enable pagination
    const paginationToggle = screen.getByTitle(/Pagination disabled/);
    await user.click(paginationToggle);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    // Navigate to page 2
    const nextButton = screen.getByTitle('Next Page (Page Down)');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
    });

    // Rerender with new content
    rerender(
      <TextEditor
        content="Updated content"
        onChange={mockOnChange}
      />
    );

    // Should still be on page 2
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
  });

  test('shows total statistics in pagination bar', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Enable pagination
    const paginationToggle = screen.getByTitle(/Pagination disabled/);
    await user.click(paginationToggle);

    await waitFor(() => {
      // Should show total statistics in pagination bar
      expect(screen.getByText(/Total: 6 words, 2 pages/)).toBeInTheDocument();
    });
  });

  test('handles empty content in pagination mode', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content=""
        onChange={mockOnChange}
      />
    );

    // Enable pagination
    const paginationToggle = screen.getByTitle(/Pagination disabled/);
    await user.click(paginationToggle);

    await waitFor(() => {
      // Should still show pagination controls even with empty content
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });
  });

  test('keyboard shortcuts work in non-paginated mode', async () => {
    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');

    // Test that Page Up/Down don't interfere when pagination is disabled
    fireEvent.keyDown(textarea, { key: 'PageDown' });
    fireEvent.keyDown(textarea, { key: 'PageUp' });

    // Should not show pagination controls
    expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
  });
});
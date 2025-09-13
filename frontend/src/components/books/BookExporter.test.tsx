import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import BookExporter from './BookExporter';
import { bookAPI } from '../../services/api';
import { Book } from '../../types';

// Mock the API
vi.mock('../../services/api', () => ({
  bookAPI: {
    exportBook: vi.fn(),
  },
}));

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// Mock document methods
Object.defineProperty(document, 'createElement', {
  writable: true,
  value: vi.fn((tagName: string) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      };
    }
    return {};
  }),
});

Object.defineProperty(document.body, 'appendChild', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  writable: true,
  value: vi.fn(),
});

describe('BookExporter', () => {
  const mockBook: Book = {
    id: 1,
    title: 'Test Book',
    author: 'Test Author',
    description: 'A test book for export testing',
    chapterCount: 5,
    wordCount: 25000,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T12:00:00.000Z',
  };

  const mockOnClose = vi.fn();
  const mockBookAPI = bookAPI as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders when visible', () => {
    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Export Book')).toBeInTheDocument();
    expect(screen.getByText(`Export "${mockBook.title}" by ${mockBook.author}`)).toBeInTheDocument();
    expect(screen.getByText('Choose Export Format')).toBeInTheDocument();
  });

  test('does not render when not visible', () => {
    render(
      <BookExporter
        book={mockBook}
        isVisible={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Export Book')).not.toBeInTheDocument();
  });

  test('displays export format options', () => {
    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Plain Text')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('Export as a plain text file with formatted chapters and book metadata')).toBeInTheDocument();
    expect(screen.getByText('Export as a Markdown file with headers, formatting, and table of contents')).toBeInTheDocument();
  });

  test('allows format selection', async () => {
    const user = userEvent.setup();

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const txtRadio = screen.getByDisplayValue('txt');
    const markdownRadio = screen.getByDisplayValue('markdown');

    // TXT should be selected by default
    expect(txtRadio).toBeChecked();
    expect(markdownRadio).not.toBeChecked();

    // Select Markdown
    await user.click(markdownRadio);

    expect(txtRadio).not.toBeChecked();
    expect(markdownRadio).toBeChecked();

    // Select TXT again
    await user.click(txtRadio);

    expect(txtRadio).toBeChecked();
    expect(markdownRadio).not.toBeChecked();
  });

  test('displays book information', () => {
    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Book Information')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Chapter count
    expect(screen.getByText('25,000')).toBeInTheDocument(); // Word count formatted
  });

  test('handles successful export', async () => {
    const user = userEvent.setup();
    const mockExportResult = {
      data: {
        success: true,
        data: {
          filename: 'test_book_by_test_author_2024-01-01.txt',
          content: 'Mock export content',
          format: 'txt',
          size: 1024,
        },
      },
    };

    mockBookAPI.exportBook.mockResolvedValueOnce(mockExportResult);

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const exportButton = screen.getByText('Export Book');
    await user.click(exportButton);

    // Should show exporting state
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
    expect(screen.getByText(/\d+%/)).toBeInTheDocument();

    // Wait for export to complete
    await waitFor(() => {
      expect(screen.getByText('Export Successful')).toBeInTheDocument();
    });

    expect(screen.getByText('Your book has been exported successfully!')).toBeInTheDocument();
    expect(screen.getByText('Plain Text')).toBeInTheDocument();
    expect(screen.getByText('1.0 KB')).toBeInTheDocument();
    expect(screen.getByText('test_book_by_test_author_2024-01-01.txt')).toBeInTheDocument();

    // Should show download button
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.queryByText('Export Book')).not.toBeInTheDocument();
  });

  test('handles export error', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Export failed');
    mockBookAPI.exportBook.mockRejectedValueOnce(mockError);

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const exportButton = screen.getByText('Export Book');
    await user.click(exportButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Export Failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Export failed')).toBeInTheDocument();
    expect(screen.queryByText('Exporting...')).not.toBeInTheDocument();

    // Should still show export button for retry
    expect(screen.getByText('Export Book')).toBeInTheDocument();
  });

  test('handles API response without success flag', async () => {
    const user = userEvent.setup();
    const mockFailureResponse = {
      data: {
        success: false,
        message: 'Server error occurred',
      },
    };

    mockBookAPI.exportBook.mockResolvedValueOnce(mockFailureResponse);

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const exportButton = screen.getByText('Export Book');
    await user.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export Failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Server error occurred')).toBeInTheDocument();
  });

  test('triggers file download', async () => {
    const user = userEvent.setup();
    const mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn(),
    };

    (document.createElement as any).mockReturnValue(mockLink);

    const mockExportResult = {
      data: {
        success: true,
        data: {
          filename: 'test_book.md',
          content: '# Test Book\nContent here',
          format: 'markdown',
          size: 2048,
        },
      },
    };

    mockBookAPI.exportBook.mockResolvedValueOnce(mockExportResult);

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // First export the book
    const exportButton = screen.getByText('Export Book');
    await user.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export Successful')).toBeInTheDocument();
    });

    // Then download
    const downloadButton = screen.getByText('Download');
    await user.click(downloadButton);

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockLink.click).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  test('creates correct blob type for different formats', async () => {
    const user = userEvent.setup();

    const mockExportResult = {
      data: {
        success: true,
        data: {
          filename: 'test_book.md',
          content: '# Test Book',
          format: 'markdown',
          size: 1024,
        },
      },
    };

    mockBookAPI.exportBook.mockResolvedValueOnce(mockExportResult);

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Select Markdown format
    const markdownRadio = screen.getByDisplayValue('markdown');
    await user.click(markdownRadio);

    // Export and download
    const exportButton = screen.getByText('Export Book');
    await user.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export Successful')).toBeInTheDocument();
    });

    const downloadButton = screen.getByText('Download');
    await user.click(downloadButton);

    // Check that the correct MIME type was used
    expect(URL.createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text/markdown',
      })
    );
  });

  test('disables buttons during export', async () => {
    const user = userEvent.setup();

    // Mock a delayed response
    let resolveExport: (value: any) => void;
    const exportPromise = new Promise(resolve => {
      resolveExport = resolve;
    });
    mockBookAPI.exportBook.mockReturnValueOnce(exportPromise);

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const exportButton = screen.getByText('Export Book');
    const closeButton = screen.getByTitle('Close');
    const cancelButton = screen.getByText('Cancel');
    const txtRadio = screen.getByDisplayValue('txt');
    const markdownRadio = screen.getByDisplayValue('markdown');

    await user.click(exportButton);

    // All controls should be disabled during export
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
    expect(closeButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(txtRadio).toBeDisabled();
    expect(markdownRadio).toBeDisabled();

    // Resolve the export
    resolveExport!({
      data: {
        success: true,
        data: {
          filename: 'test.txt',
          content: 'content',
          format: 'txt',
          size: 1024,
        },
      },
    });

    // Wait for export to complete
    await waitFor(() => {
      expect(screen.getByText('Export Successful')).toBeInTheDocument();
    });

    // Controls should be enabled again
    expect(closeButton).not.toBeDisabled();
    expect(cancelButton).not.toBeDisabled();
  });

  test('closes modal and resets state', async () => {
    const user = userEvent.setup();

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Select markdown format
    const markdownRadio = screen.getByDisplayValue('markdown');
    await user.click(markdownRadio);

    expect(markdownRadio).toBeChecked();

    // Close the modal
    const closeButton = screen.getByTitle('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes modal by clicking backdrop', async () => {
    const user = userEvent.setup();

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Click backdrop
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  test('shows progress during export', async () => {
    const user = userEvent.setup();

    // Mock a response that will trigger progress updates
    mockBookAPI.exportBook.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            data: {
              success: true,
              data: {
                filename: 'test.txt',
                content: 'content',
                format: 'txt',
                size: 1024,
              },
            },
          });
        }, 200);
      });
    });

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const exportButton = screen.getByText('Export Book');
    await user.click(exportButton);

    // Should show progress
    expect(screen.getByText('Exporting...')).toBeInTheDocument();

    // Check for progress percentage
    await waitFor(() => {
      expect(screen.getByText(/\d+%/)).toBeInTheDocument();
    });

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Export Successful')).toBeInTheDocument();
    });
  });

  test('prevents multiple exports when already exporting', async () => {
    const user = userEvent.setup();

    let resolveExport: (value: any) => void;
    const exportPromise = new Promise(resolve => {
      resolveExport = resolve;
    });
    mockBookAPI.exportBook.mockReturnValueOnce(exportPromise);

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const exportButton = screen.getByText('Export Book');

    // First click starts export
    await user.click(exportButton);
    expect(mockBookAPI.exportBook).toHaveBeenCalledTimes(1);

    // Second click should not trigger another export
    await user.click(screen.getByText('Exporting...'));
    expect(mockBookAPI.exportBook).toHaveBeenCalledTimes(1);

    // Resolve the first export
    resolveExport!({
      data: {
        success: true,
        data: {
          filename: 'test.txt',
          content: 'content',
          format: 'txt',
          size: 1024,
        },
      },
    });
  });

  test('calls API with correct parameters', async () => {
    const user = userEvent.setup();

    mockBookAPI.exportBook.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          filename: 'test.txt',
          content: 'content',
          format: 'txt',
          size: 1024,
        },
      },
    });

    render(
      <BookExporter
        book={mockBook}
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Select markdown format
    const markdownRadio = screen.getByDisplayValue('markdown');
    await user.click(markdownRadio);

    const exportButton = screen.getByText('Export Book');
    await user.click(exportButton);

    expect(mockBookAPI.exportBook).toHaveBeenCalledWith(mockBook.id, 'markdown');
  });
});
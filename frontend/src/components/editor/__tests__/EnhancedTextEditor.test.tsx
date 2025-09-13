import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import EnhancedTextEditor from '../EnhancedTextEditor';
import { useAppStore } from '../../../store';

// Mock the store
vi.mock('../../../store', () => ({
  useAppStore: vi.fn()
}));

// Mock MarkdownPreview component
vi.mock('../MarkdownPreview', () => {
  return {
    default: ({ content, className }: { content: string; className?: string }) => (
      <div className={`markdown-preview-mock ${className}`} data-testid="markdown-preview">
        {content}
      </div>
    )
  };
});

describe('EnhancedTextEditor', () => {
  const mockOnChange = vi.fn();
  const mockOnSave = vi.fn();
  const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnSave.mockClear();

    // Mock store state
    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        selectedFont: null
      };
      return selector(state);
    });
  });

  test('renders in edit mode by default', () => {
    render(
      <EnhancedTextEditor
        content=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Editing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit mode/i })).toHaveClass('active');
  });

  test('displays word and character counts', () => {
    render(
      <EnhancedTextEditor
        content="Hello world test content"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('4')).toBeInTheDocument(); // words
    expect(screen.getByText('24')).toBeInTheDocument(); // characters
  });

  test('calls onChange when content is modified', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content=""
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world');

    expect(mockOnChange).toHaveBeenCalledWith('Hello world');
  });

  test('switches to preview mode when preview button clicked', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content="# Test markdown"
        onChange={mockOnChange}
      />
    );

    const previewButton = screen.getByRole('button', { name: /preview mode/i });
    await user.click(previewButton);

    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    expect(screen.getByText('Previewing')).toBeInTheDocument();
    expect(previewButton).toHaveClass('active');
  });

  test('switches to split mode when split button clicked', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content="# Test markdown"
        onChange={mockOnChange}
      />
    );

    const splitButton = screen.getByRole('button', { name: /split mode/i });
    await user.click(splitButton);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    expect(screen.getByText('Split View')).toBeInTheDocument();
    expect(splitButton).toHaveClass('active');
  });

  test('disables preview button when no content', () => {
    render(
      <EnhancedTextEditor
        content=""
        onChange={mockOnChange}
      />
    );

    const previewButton = screen.getByRole('button', { name: /preview mode/i });
    expect(previewButton).toBeDisabled();
  });

  test('cycles through modes with Ctrl+M', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content="# Test content"
        onChange={mockOnChange}
      />
    );

    // Start in edit mode
    expect(screen.getByText('Editing')).toBeInTheDocument();

    // Press Ctrl+M to go to preview mode
    await user.keyboard('{Control>}m{/Control}');
    expect(screen.getByText('Previewing')).toBeInTheDocument();

    // Press Ctrl+M to go to split mode
    await user.keyboard('{Control>}m{/Control}');
    expect(screen.getByText('Split View')).toBeInTheDocument();

    // Press Ctrl+M to go back to edit mode
    await user.keyboard('{Control>}m{/Control}');
    expect(screen.getByText('Editing')).toBeInTheDocument();
  });

  test('skips preview mode when no content during cycling', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content=""
        onChange={mockOnChange}
      />
    );

    // Start in edit mode
    expect(screen.getByText('Editing')).toBeInTheDocument();

    // Press Ctrl+M - should skip preview and go to split
    await user.keyboard('{Control>}m{/Control}');
    expect(screen.getByText('Split View')).toBeInTheDocument();
  });

  test('calls onSave with Ctrl+S', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content="Test content"
        onChange={mockOnChange}
        onSave={mockOnSave}
      />
    );

    await user.keyboard('{Control>}s{/Control}');
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  test('inserts bold formatting with Ctrl+B', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content="Hello world"
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');

    // Select some text
    await user.click(textarea);
    await user.keyboard('{Shift>}{ArrowRight>5}{/ArrowRight}{/Shift}'); // Select "Hello"

    // Press Ctrl+B
    await user.keyboard('{Control>}b{/Control}');

    expect(mockOnChange).toHaveBeenCalledWith('**Hello** world');
  });

  test('inserts italic formatting with Ctrl+I', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content="Hello world"
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');

    // Select some text
    await user.click(textarea);
    await user.keyboard('{Shift>}{ArrowRight>5}{/ArrowRight}{/Shift}'); // Select "Hello"

    // Press Ctrl+I
    await user.keyboard('{Control>}i{/Control}');

    expect(mockOnChange).toHaveBeenCalledWith('*Hello* world');
  });

  test('inserts underline formatting with Ctrl+U', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content="Hello world"
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');

    // Select some text
    await user.click(textarea);
    await user.keyboard('{Shift>}{ArrowRight>5}{/ArrowRight}{/Shift}'); // Select "Hello"

    // Press Ctrl+U
    await user.keyboard('{Control>}u{/Control}');

    expect(mockOnChange).toHaveBeenCalledWith('<u>Hello</u> world');
  });

  test('uses default text when no text is selected for formatting', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content=""
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);

    // Press Ctrl+B with no selection
    await user.keyboard('{Control>}b{/Control}');

    expect(mockOnChange).toHaveBeenCalledWith('**bold text**');
  });

  test('applies selected font style', () => {
    const georgiaFont = {
      id: 'georgia',
      name: 'Georgia',
      displayName: 'Georgia',
      fallback: '"Georgia", serif',
      category: 'serif' as const,
      description: 'Classic serif font'
    };

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        selectedFont: georgiaFont
      };
      return selector(state);
    });

    render(
      <EnhancedTextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveStyle({ fontFamily: '"Georgia", serif' });
  });

  test('uses default font when no font selected', () => {
    render(
      <EnhancedTextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveStyle({ fontFamily: '"Georgia", "Times New Roman", serif' });
  });

  test('displays placeholder text', () => {
    render(
      <EnhancedTextEditor
        content=""
        onChange={mockOnChange}
        placeholder="Custom placeholder text"
      />
    );

    expect(screen.getByPlaceholderText('Custom placeholder text')).toBeInTheDocument();
  });

  test('handles disabled state', () => {
    render(
      <EnhancedTextEditor
        content="Test content"
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  test('focuses textarea when autoFocus is true', () => {
    render(
      <EnhancedTextEditor
        content=""
        onChange={mockOnChange}
        autoFocus={true}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveFocus();
  });

  test('displays mobile formatting buttons', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400
    });

    render(
      <EnhancedTextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Mobile formatting buttons should be present (though hidden in larger viewports via CSS)
    const boldButton = screen.getByRole('button', { name: /bold/i });
    const italicButton = screen.getByRole('button', { name: /italic/i });
    const headingButton = screen.getByRole('button', { name: /heading/i });
    const listButton = screen.getByRole('button', { name: /list/i });

    expect(boldButton).toBeInTheDocument();
    expect(italicButton).toBeInTheDocument();
    expect(headingButton).toBeInTheDocument();
    expect(listButton).toBeInTheDocument();
  });

  test('mobile formatting buttons work correctly', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content="Hello"
        onChange={mockOnChange}
      />
    );

    const boldButton = screen.getByRole('button', { name: /bold/i });
    await user.click(boldButton);

    expect(mockOnChange).toHaveBeenCalledWith('Hello**bold text**');
  });

  test('displays keyboard shortcuts help', () => {
    render(
      <EnhancedTextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText(/Ctrl\+M to switch modes/)).toBeInTheDocument();
    expect(screen.getByText(/Ctrl\+B\/I\/U for formatting/)).toBeInTheDocument();
    expect(screen.getByText(/Press.*Ctrl\+M.*to cycle modes/)).toBeInTheDocument();
  });

  test('updates statistics in real time', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content="Hello"
        onChange={mockOnChange}
      />
    );

    // Initial stats
    expect(screen.getByText('1')).toBeInTheDocument(); // words
    expect(screen.getByText('5')).toBeInTheDocument(); // characters

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'Hello world test');

    expect(mockOnChange).toHaveBeenLastCalledWith('Hello world test');
  });

  test('shows resize handle in split mode', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content="# Test content"
        onChange={mockOnChange}
      />
    );

    const splitButton = screen.getByRole('button', { name: /split mode/i });
    await user.click(splitButton);

    // Resize handle should be present (though it may not be visible in test environment)
    const editorContent = document.querySelector('.editor-content');
    expect(editorContent).toHaveClass('mode-split');
  });

  test('applies custom className', () => {
    const { container } = render(
      <EnhancedTextEditor
        content=""
        onChange={mockOnChange}
        className="custom-editor-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-editor-class');
  });

  test('formatting only works in edit mode', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedTextEditor
        content="# Test content"
        onChange={mockOnChange}
      />
    );

    // Switch to preview mode
    const previewButton = screen.getByRole('button', { name: /preview mode/i });
    await user.click(previewButton);

    // Try Ctrl+B in preview mode - should not work
    await user.keyboard('{Control>}b{/Control}');
    expect(mockOnChange).not.toHaveBeenCalled();

    // Switch back to edit mode
    const editButton = screen.getByRole('button', { name: /edit mode/i });
    await user.click(editButton);

    // Now Ctrl+B should work
    await user.keyboard('{Control>}b{/Control}');
    expect(mockOnChange).toHaveBeenCalledWith('# Test content**bold text**');
  });

  test('displays correct status for different content states', () => {
    const { rerender } = render(
      <EnhancedTextEditor
        content=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('No content')).toBeInTheDocument();

    rerender(
      <EnhancedTextEditor
        content="Hello world"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('2 words')).toBeInTheDocument();
  });

  test('handles British English number formatting in statistics', () => {
    const longContent = 'word '.repeat(1234).trim();

    render(
      <EnhancedTextEditor
        content={longContent}
        onChange={mockOnChange}
      />
    );

    // Should format numbers with British conventions (comma separator)
    expect(screen.getByText('1,234')).toBeInTheDocument(); // words
  });
});
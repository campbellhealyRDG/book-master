import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import Scratchpad from '../Scratchpad';
import { useAppStore } from '../../../store';

// Mock the store
vi.mock('../../../store', () => ({
  useAppStore: vi.fn()
}));

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', { value: mockConfirm });

describe('Scratchpad', () => {
  const mockOnClose = vi.fn();
  const mockSetScratchpad = vi.fn();
  const mockUpdateScratchpadContent = vi.fn();
  const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose.mockClear();
    mockSetScratchpad.mockClear();
    mockUpdateScratchpadContent.mockClear();
    mockConfirm.mockClear();

    // Mock store state
    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        scratchpad: null,
        setScratchpad: mockSetScratchpad,
        updateScratchpadContent: mockUpdateScratchpadContent,
        selectedFont: null
      };
      return selector(state);
    });
  });

  test('renders when visible', () => {
    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Scratchpad')).toBeInTheDocument();
    expect(screen.getByText('Global notes that persist across all books and chapters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Use this space for notes/)).toBeInTheDocument();
  });

  test('does not render when not visible', () => {
    render(
      <Scratchpad
        isVisible={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Scratchpad')).not.toBeInTheDocument();
  });

  test('displays existing scratchpad content', () => {
    const existingScratchpad = {
      id: 1,
      content: 'Existing notes content',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T12:00:00.000Z'
    };

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        scratchpad: existingScratchpad,
        setScratchpad: mockSetScratchpad,
        updateScratchpadContent: mockUpdateScratchpadContent,
        selectedFont: null
      };
      return selector(state);
    });

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByDisplayValue('Existing notes content');
    expect(textarea).toBeInTheDocument();
    expect(screen.getByText(/Last saved:/)).toBeInTheDocument();
  });

  test('shows correct word and character counts', () => {
    const existingScratchpad = {
      id: 1,
      content: 'Hello world test',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T12:00:00.000Z'
    };

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        scratchpad: existingScratchpad,
        setScratchpad: mockSetScratchpad,
        updateScratchpadContent: mockUpdateScratchpadContent,
        selectedFont: null
      };
      return selector(state);
    });

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('3 words')).toBeInTheDocument();
    expect(screen.getByText('15 characters')).toBeInTheDocument();
  });

  test('updates counts when content changes', async () => {
    const user = userEvent.setup();

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world');

    await waitFor(() => {
      expect(screen.getByText('2 words')).toBeInTheDocument();
      expect(screen.getByText('11 characters')).toBeInTheDocument();
    });
  });

  test('shows unsaved changes indicator when content is modified', async () => {
    const user = userEvent.setup();

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Modified content');

    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });
  });

  test('saves new scratchpad content', async () => {
    const user = userEvent.setup();

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'New scratchpad content');

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(mockSetScratchpad).toHaveBeenCalledWith({
      id: 1,
      content: 'New scratchpad content',
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });

  test('updates existing scratchpad content', async () => {
    const user = userEvent.setup();
    const existingScratchpad = {
      id: 1,
      content: 'Original content',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T12:00:00.000Z'
    };

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        scratchpad: existingScratchpad,
        setScratchpad: mockSetScratchpad,
        updateScratchpadContent: mockUpdateScratchpadContent,
        selectedFont: null
      };
      return selector(state);
    });

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByDisplayValue('Original content');
    await user.clear(textarea);
    await user.type(textarea, 'Updated content');

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(mockUpdateScratchpadContent).toHaveBeenCalledWith('Updated content');
    expect(mockSetScratchpad).toHaveBeenCalledWith({
      ...existingScratchpad,
      content: 'Updated content',
      updatedAt: expect.any(String)
    });
  });

  test('saves with Ctrl+S keyboard shortcut', async () => {
    const user = userEvent.setup();

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Content to save');

    // Press Ctrl+S
    await user.keyboard('{Control>}s{/Control}');

    expect(mockSetScratchpad).toHaveBeenCalledWith({
      id: 1,
      content: 'Content to save',
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });

  test('saves and closes with Ctrl+Enter', async () => {
    const user = userEvent.setup();

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Content to save');

    // Press Ctrl+Enter
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(mockSetScratchpad).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes with Escape key', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Some content');

    // Press Escape
    await user.keyboard('{Escape}');

    expect(mockConfirm).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to discard them?'
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('does not close with Escape if user cancels confirmation', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(false);

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Some content');

    // Press Escape
    await user.keyboard('{Escape}');

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('closes without confirmation when no changes', async () => {
    const user = userEvent.setup();

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Press Escape without making changes
    await user.keyboard('{Escape}');

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('cancel button shows confirmation for unsaved changes', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Modified content');

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockConfirm).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to discard them?'
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('close button works as cancel when no changes', async () => {
    const user = userEvent.setup();

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('Save & Close button saves and closes', async () => {
    const user = userEvent.setup();

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Content to save');

    const saveCloseButton = screen.getByText('Save & Close');
    await user.click(saveCloseButton);

    expect(mockSetScratchpad).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('Save button is disabled when no changes', () => {
    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  test('Save button is enabled when there are changes', async () => {
    const user = userEvent.setup();

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'New content');

    await waitFor(() => {
      const saveButton = screen.getByText('Save');
      expect(saveButton).not.toBeDisabled();
    });
  });

  test('applies selected font to textarea', () => {
    const georgiaFont = {
      id: 'georgia',
      name: 'Georgia',
      displayName: 'Georgia',
      fallback: '"Georgia", serif',
      category: 'serif' as const,
      description: 'Test font'
    };

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        scratchpad: null,
        setScratchpad: mockSetScratchpad,
        updateScratchpadContent: mockUpdateScratchpadContent,
        selectedFont: georgiaFont
      };
      return selector(state);
    });

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveStyle({ fontFamily: '"Georgia", serif' });
  });

  test('uses default font when no font selected', () => {
    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveStyle({ fontFamily: '"Georgia", "Times New Roman", serif' });
  });

  test('focuses textarea when modal opens', async () => {
    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Wait for focus to be set
    await waitFor(() => {
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveFocus();
    }, { timeout: 200 });
  });

  test('closes when backdrop is clicked without changes', async () => {
    const user = userEvent.setup();

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Find backdrop (the div with bg-black/50)
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  test('shows confirmation when backdrop is clicked with changes', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Changes');

    // Find backdrop and click it
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockConfirm).toHaveBeenCalled();
    }
  });

  test('displays correct keyboard shortcuts in toolbar', () => {
    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Ctrl+S to save • Ctrl+Enter to save and close • Esc to cancel')).toBeInTheDocument();
  });

  test('restores original content when cancelling with changes', async () => {
    const user = userEvent.setup();
    const existingScratchpad = {
      id: 1,
      content: 'Original content',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T12:00:00.000Z'
    };

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        scratchpad: existingScratchpad,
        setScratchpad: mockSetScratchpad,
        updateScratchpadContent: mockUpdateScratchpadContent,
        selectedFont: null
      };
      return selector(state);
    });

    mockConfirm.mockReturnValue(true);

    render(
      <Scratchpad
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByDisplayValue('Original content');
    await user.clear(textarea);
    await user.type(textarea, 'Modified content');

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
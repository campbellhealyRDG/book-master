import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    paginateDocument: vi.fn().mockReturnValue([]),
    getPageWindow: vi.fn().mockReturnValue([]),
    getDocumentStats: vi.fn().mockReturnValue({ totalPages: 0, totalWords: 0, totalCharacters: 0 }),
    updatePage: vi.fn().mockReturnValue([]),
    reconstructDocument: vi.fn().mockReturnValue('')
  }
}));

describe('TextEditor Scratchpad Integration', () => {
  const mockOnChange = vi.fn();
  const mockSetScratchpad = vi.fn();
  const mockUpdateScratchpadContent = vi.fn();
  const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange.mockClear();
    mockSetScratchpad.mockClear();
    mockUpdateScratchpadContent.mockClear();

    // Mock store state
    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: false,
        selectedFont: null,
        scratchpad: null,
        setScratchpad: mockSetScratchpad,
        updateScratchpadContent: mockUpdateScratchpadContent
      };
      return selector(state);
    });

    // Mock setState for store updates
    (useAppStore as any).setState = vi.fn();
  });

  test('renders scratchpad button in toolbar', () => {
    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');
    expect(scratchpadButton).toBeInTheDocument();
  });

  test('opens scratchpad when button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');
    await user.click(scratchpadButton);

    await waitFor(() => {
      expect(screen.getByText('Scratchpad')).toBeInTheDocument();
      expect(screen.getByText('Global notes that persist across all books and chapters')).toBeInTheDocument();
    });
  });

  test('closes scratchpad when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open scratchpad
    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');
    await user.click(scratchpadButton);

    await waitFor(() => {
      expect(screen.getByText('Scratchpad')).toBeInTheDocument();
    });

    // Close with X button
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Scratchpad')).not.toBeInTheDocument();
    });
  });

  test('closes scratchpad when Save & Close is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open scratchpad
    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');
    await user.click(scratchpadButton);

    await waitFor(() => {
      expect(screen.getByText('Scratchpad')).toBeInTheDocument();
    });

    // Add some content and save & close
    const textarea = screen.getByPlaceholderText(/Use this space for notes/);
    await user.type(textarea, 'Test scratchpad content');

    const saveCloseButton = screen.getByText('Save & Close');
    await user.click(saveCloseButton);

    await waitFor(() => {
      expect(screen.queryByText('Scratchpad')).not.toBeInTheDocument();
    });

    expect(mockSetScratchpad).toHaveBeenCalledWith({
      id: 1,
      content: 'Test scratchpad content',
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });

  test('scratchpad persists content between opens', async () => {
    const user = userEvent.setup();
    const existingScratchpad = {
      id: 1,
      content: 'Persisted content',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T12:00:00.000Z'
    };

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: false,
        selectedFont: null,
        scratchpad: existingScratchpad,
        setScratchpad: mockSetScratchpad,
        updateScratchpadContent: mockUpdateScratchpadContent
      };
      return selector(state);
    });

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open scratchpad
    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');
    await user.click(scratchpadButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Persisted content')).toBeInTheDocument();
    });
  });

  test('scratchpad shows correct word and character counts', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open scratchpad
    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');
    await user.click(scratchpadButton);

    await waitFor(() => {
      expect(screen.getByText('Scratchpad')).toBeInTheDocument();
    });

    // Add content and check counts
    const textarea = screen.getByPlaceholderText(/Use this space for notes/);
    await user.type(textarea, 'Hello world test');

    await waitFor(() => {
      expect(screen.getByText('3 words')).toBeInTheDocument();
      expect(screen.getByText('16 characters')).toBeInTheDocument();
    });
  });

  test('scratchpad applies same font as editor', async () => {
    const user = userEvent.setup();
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
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: false,
        selectedFont: georgiaFont,
        scratchpad: null,
        setScratchpad: mockSetScratchpad,
        updateScratchpadContent: mockUpdateScratchpadContent
      };
      return selector(state);
    });

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open scratchpad
    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');
    await user.click(scratchpadButton);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Use this space for notes/);
      expect(textarea).toHaveStyle({ fontFamily: '"Georgia", serif' });
    });
  });

  test('scratchpad keyboard shortcuts work', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open scratchpad
    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');
    await user.click(scratchpadButton);

    await waitFor(() => {
      expect(screen.getByText('Scratchpad')).toBeInTheDocument();
    });

    // Add content
    const textarea = screen.getByPlaceholderText(/Use this space for notes/);
    await user.type(textarea, 'Content to save');

    // Test Ctrl+S save
    await user.keyboard('{Control>}s{/Control}');

    expect(mockSetScratchpad).toHaveBeenCalledWith({
      id: 1,
      content: 'Content to save',
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });

  test('scratchpad shows unsaved changes indicator', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open scratchpad
    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');
    await user.click(scratchpadButton);

    await waitFor(() => {
      expect(screen.getByText('Scratchpad')).toBeInTheDocument();
    });

    // Add content to trigger unsaved changes
    const textarea = screen.getByPlaceholderText(/Use this space for notes/);
    await user.type(textarea, 'Unsaved content');

    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });
  });

  test('scratchpad updates existing content correctly', async () => {
    const user = userEvent.setup();
    const existingScratchpad = {
      id: 1,
      content: 'Original content',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T12:00:00.000Z'
    };

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: false,
        selectedFont: null,
        scratchpad: existingScratchpad,
        setScratchpad: mockSetScratchpad,
        updateScratchpadContent: mockUpdateScratchpadContent
      };
      return selector(state);
    });

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open scratchpad
    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');
    await user.click(scratchpadButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Original content')).toBeInTheDocument();
    });

    // Modify content
    const textarea = screen.getByDisplayValue('Original content');
    await user.clear(textarea);
    await user.type(textarea, 'Updated content');

    // Save
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(mockUpdateScratchpadContent).toHaveBeenCalledWith('Updated content');
    expect(mockSetScratchpad).toHaveBeenCalledWith({
      ...existingScratchpad,
      content: 'Updated content',
      updatedAt: expect.any(String)
    });
  });

  test('scratchpad button accessibility', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');

    // Should be keyboard accessible
    scratchpadButton.focus();
    expect(scratchpadButton).toHaveFocus();

    // Should respond to Enter key
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Scratchpad')).toBeInTheDocument();
    });
  });

  test('multiple scratchpad opens maintain state correctly', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open scratchpad first time
    const scratchpadButton = screen.getByTitle('Open scratchpad for global notes');
    await user.click(scratchpadButton);

    await waitFor(() => {
      expect(screen.getByText('Scratchpad')).toBeInTheDocument();
    });

    // Add content and save
    const textarea = screen.getByPlaceholderText(/Use this space for notes/);
    await user.type(textarea, 'First save');

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    // Close
    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Scratchpad')).not.toBeInTheDocument();
    });

    // Mock the updated scratchpad state
    const savedScratchpad = {
      id: 1,
      content: 'First save',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    };

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: false,
        selectedFont: null,
        scratchpad: savedScratchpad,
        setScratchpad: mockSetScratchpad,
        updateScratchpadContent: mockUpdateScratchpadContent
      };
      return selector(state);
    });

    // Open again and verify content is preserved
    await user.click(scratchpadButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('First save')).toBeInTheDocument();
    });
  });
});
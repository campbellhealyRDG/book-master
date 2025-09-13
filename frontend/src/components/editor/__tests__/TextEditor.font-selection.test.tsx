import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import TextEditor from '../TextEditor';
import { useAppStore } from '../../../store';
import { FONT_OPTIONS } from '../../ui/FontSelector';

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

describe('TextEditor Font Selection Integration', () => {
  const mockOnChange = vi.fn();
  const mockSetSelectedFont = vi.fn();
  const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange.mockClear();
    mockSetSelectedFont.mockClear();

    // Mock store state
    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: false,
        selectedFont: null,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    // Mock setState for store updates
    (useAppStore as any).setState = vi.fn();
  });

  test('renders font selector button in toolbar', () => {
    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const fontButton = screen.getByTitle(/Font:/);
    expect(fontButton).toBeInTheDocument();
  });

  test('font button tooltip shows current font name', () => {
    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: false,
        selectedFont: georgiaFont,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const fontButton = screen.getByTitle(`Font: ${georgiaFont?.displayName}`);
    expect(fontButton).toBeInTheDocument();
  });

  test('font button shows default tooltip when no font selected', () => {
    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const fontButton = screen.getByTitle('Font: Georgia');
    expect(fontButton).toBeInTheDocument();
  });

  test('opens font selector when font button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const fontButton = screen.getByTitle(/Font:/);
    await user.click(fontButton);

    await waitFor(() => {
      expect(screen.getByText('Select Writing Font')).toBeInTheDocument();
    });
  });

  test('closes font selector when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open font selector
    const fontButton = screen.getByTitle(/Font:/);
    await user.click(fontButton);

    await waitFor(() => {
      expect(screen.getByText('Select Writing Font')).toBeInTheDocument();
    });

    // Close with X button
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Select Writing Font')).not.toBeInTheDocument();
    });
  });

  test('closes font selector when Cancel is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open font selector
    const fontButton = screen.getByTitle(/Font:/);
    await user.click(fontButton);

    await waitFor(() => {
      expect(screen.getByText('Select Writing Font')).toBeInTheDocument();
    });

    // Close with Cancel button
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Select Writing Font')).not.toBeInTheDocument();
    });
  });

  test('applies font to textarea when font is selected', () => {
    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: false,
        selectedFont: georgiaFont,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveStyle({ fontFamily: georgiaFont?.fallback });
  });

  test('applies default font when no font selected', () => {
    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    // Should use default Georgia font
    expect(textarea).toHaveStyle({ fontFamily: '"Georgia", "Times New Roman", serif' });
  });

  test('initializes default font on mount', () => {
    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Should set default font
    expect((useAppStore as any).setState).toHaveBeenCalledWith({
      selectedFont: expect.objectContaining({ id: 'georgia' })
    });
  });

  test('does not reinitialize font if already selected', () => {
    const timesFont = FONT_OPTIONS.find(font => font.id === 'times');

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: false,
        selectedFont: timesFont,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Should not override existing font
    expect((useAppStore as any).setState).not.toHaveBeenCalledWith({
      selectedFont: expect.objectContaining({ id: 'georgia' })
    });
  });

  test('applies selected font to spell check overlay', () => {
    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: true, // Enable spell checking to show overlay
        selectedFont: georgiaFont,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    // Mock spell checker to return some misspellings to trigger overlay
    const mockSpellChecker = vi.requireMock('../../../services/spellChecker');
    mockSpellChecker.spellCheckService.checkText.mockReturnValue({
      misspellings: [{
        word: 'tset',
        suggestions: ['test'],
        position: { start: 0, end: 4 }
      }]
    });

    render(
      <TextEditor
        content="tset content"
        onChange={mockOnChange}
      />
    );

    // The spell check overlay should have the same font family
    const overlay = document.querySelector('.absolute.inset-4 > div');
    expect(overlay).toHaveStyle({ fontFamily: georgiaFont?.fallback });
  });

  test('font selection persists across re-renders', () => {
    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setUnsavedChanges: vi.fn(),
        autoSaveEnabled: true,
        spellCheckEnabled: false,
        selectedFont: georgiaFont,
        setSelectedFont: mockSetSelectedFont
      };
      return selector(state);
    });

    const { rerender } = render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveStyle({ fontFamily: georgiaFont?.fallback });

    // Rerender with different content
    rerender(
      <TextEditor
        content="New test content"
        onChange={mockOnChange}
      />
    );

    // Font should still be applied
    const newTextarea = screen.getByRole('textbox');
    expect(newTextarea).toHaveStyle({ fontFamily: georgiaFont?.fallback });
  });

  test('can select different font and apply it immediately', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open font selector
    const fontButton = screen.getByTitle(/Font:/);
    await user.click(fontButton);

    await waitFor(() => {
      expect(screen.getByText('Select Writing Font')).toBeInTheDocument();
    });

    // Select Times New Roman
    const timesFont = FONT_OPTIONS.find(font => font.id === 'times');
    if (timesFont) {
      const timesOption = screen.getByText(timesFont.displayName);
      await user.click(timesOption);

      expect(mockSetSelectedFont).toHaveBeenCalledWith(timesFont);
    }
  });

  test('preview updates when different font is selected', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open font selector
    const fontButton = screen.getByTitle(/Font:/);
    await user.click(fontButton);

    await waitFor(() => {
      expect(screen.getByText('Select Writing Font')).toBeInTheDocument();
    });

    // Select a font to see preview
    const georgiaFont = FONT_OPTIONS.find(font => font.id === 'georgia');
    if (georgiaFont) {
      const georgiaOption = screen.getByText(georgiaFont.displayName);
      await user.click(georgiaOption);

      // Should show preview with font info
      await waitFor(() => {
        expect(screen.getByText('Preview')).toBeInTheDocument();
        expect(screen.getByText(georgiaFont.description)).toBeInTheDocument();
      });
    }
  });

  test('font selector shows all available font options', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    // Open font selector
    const fontButton = screen.getByTitle(/Font:/);
    await user.click(fontButton);

    await waitFor(() => {
      // Should show all font options
      FONT_OPTIONS.forEach(font => {
        expect(screen.getByText(font.displayName)).toBeInTheDocument();
        expect(screen.getByText(font.description)).toBeInTheDocument();
      });
    });
  });

  test('font button accessibility', async () => {
    const user = userEvent.setup();

    render(
      <TextEditor
        content="Test content"
        onChange={mockOnChange}
      />
    );

    const fontButton = screen.getByTitle(/Font:/);

    // Should be keyboard accessible
    fontButton.focus();
    expect(fontButton).toHaveFocus();

    // Should respond to Enter key
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Select Writing Font')).toBeInTheDocument();
    });
  });
});
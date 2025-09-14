import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { create } from 'zustand';
import TextEditor from './TextEditor';

// Mock the spell checker service
const mockSpellCheckService = {
  initialize: vi.fn(),
  isInitialized: vi.fn(),
  checkText: vi.fn(),
  getSuggestions: vi.fn(),
  addToIgnoreList: vi.fn(),
  addToCustomDictionary: vi.fn(),
  convertUSToUK: vi.fn()
};

vi.mock('../../services/spellChecker', () => ({
  spellCheckService: mockSpellCheckService
}));

// Mock the store
const mockStore = create(() => ({
  setUnsavedChanges: vi.fn(),
  autoSaveEnabled: true,
  spellCheckEnabled: true,
}));

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => selector(mockStore.getState())
}));

describe('TextEditor with Spell Checking', () => {
  const defaultProps = {
    content: '',
    onChange: vi.fn(),
    autoSave: true,
    autoSaveInterval: 1000
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Mock default spell checker behavior
    mockSpellCheckService.initialize.mockResolvedValue(true);
    mockSpellCheckService.isInitialized.mockReturnValue(true);
    mockSpellCheckService.checkText.mockReturnValue({ misspellings: [] });
    mockSpellCheckService.getSuggestions.mockReturnValue([]);
    mockSpellCheckService.convertUSToUK.mockImplementation((word: string) => word);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Spell Check Initialization', () => {
    it('initializes spell checker on mount', async () => {
      render(<TextEditor {...defaultProps} />);

      await waitFor(() => {
        expect(mockSpellCheckService.initialize).toHaveBeenCalled();
      });
    });

    it('shows initialization status in word count area', async () => {
      mockSpellCheckService.initialize.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
      mockSpellCheckService.isInitialized.mockReturnValue(false);

      render(<TextEditor {...defaultProps} />);

      expect(screen.getByText('Initialising spell checker...')).toBeInTheDocument();
    });
  });

  describe('Spell Check Toggle', () => {
    it('renders spell check toggle button', () => {
      render(<TextEditor {...defaultProps} />);

      const toggleButton = screen.getByTitle(/Spell checking/);
      expect(toggleButton).toBeInTheDocument();
    });

    it('shows enabled state when spell checking is active', () => {
      render(<TextEditor {...defaultProps} />);

      const toggleButton = screen.getByTitle('Spell checking enabled');
      expect(toggleButton).toHaveClass('bg-chrome-green-100', 'text-chrome-green-700');
    });

    it('toggles spell checking state when clicked', async () => {
      const mockSetState = vi.fn();
      mockStore.setState = mockSetState;

      render(<TextEditor {...defaultProps} />);

      const toggleButton = screen.getByTitle('Spell checking enabled');
      await user.click(toggleButton);

      expect(mockSetState).toHaveBeenCalledWith({ spellCheckEnabled: false });
    });
  });

  describe('Misspelling Detection', () => {
    it('displays misspelling count when errors are found', async () => {
      const misspellings = [
        {
          word: 'helllo',
          suggestions: ['hello', 'hell'],
          position: { start: 0, end: 6 }
        },
        {
          word: 'wrold',
          suggestions: ['world', 'would'],
          position: { start: 7, end: 12 }
        }
      ];

      mockSpellCheckService.checkText.mockReturnValue({ misspellings });

      render(<TextEditor {...defaultProps} content="helllo wrold" />);

      await waitFor(() => {
        expect(screen.getByText('2 spelling errors')).toBeInTheDocument();
      });
    });

    it('shows no errors message when text is correct', async () => {
      mockSpellCheckService.checkText.mockReturnValue({ misspellings: [] });

      render(<TextEditor {...defaultProps} content="hello world" />);

      await waitFor(() => {
        expect(screen.getByText('No spelling errors')).toBeInTheDocument();
      });
    });

    it('performs spell check when content changes', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      await user.type(textarea, 'helllo');

      expect(mockSpellCheckService.checkText).toHaveBeenCalledWith('helllo');
    });
  });

  describe('Visual Highlighting', () => {
    it('renders spell check overlay when misspellings exist', () => {
      const misspellings = [{
        word: 'helllo',
        suggestions: [],
        position: { start: 0, end: 6 }
      }];

      mockSpellCheckService.checkText.mockReturnValue({ misspellings });

      render(<TextEditor {...defaultProps} content="helllo world" />);

      // Check for the overlay div
      const overlay = document.querySelector('.absolute.inset-4.pointer-events-none');
      expect(overlay).toBeInTheDocument();
    });

    it('does not render overlay when no misspellings', () => {
      mockSpellCheckService.checkText.mockReturnValue({ misspellings: [] });

      render(<TextEditor {...defaultProps} content="hello world" />);

      const overlay = document.querySelector('.absolute.inset-4.pointer-events-none');
      expect(overlay).not.toBeInTheDocument();
    });

    it('highlights misspelled characters with dotted red underline', () => {
      const misspellings = [{
        word: 'helllo',
        suggestions: [],
        position: { start: 0, end: 6 }
      }];

      mockSpellCheckService.checkText.mockReturnValue({ misspellings });

      render(<TextEditor {...defaultProps} content="helllo world" />);

      // Check for highlighted spans
      const highlightedSpans = document.querySelectorAll('.border-b-2.border-red-500.border-dotted');
      expect(highlightedSpans.length).toBeGreaterThan(0);
    });
  });

  describe('Context Menu', () => {
    const misspellings = [{
      word: 'helllo',
      suggestions: ['hello', 'hell', 'yellow'],
      position: { start: 0, end: 6 }
    }];

    beforeEach(() => {
      mockSpellCheckService.checkText.mockReturnValue({ misspellings });
    });

    it('shows context menu on right click over misspelled word', async () => {
      render(<TextEditor {...defaultProps} content="helllo world" />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');

      // Set cursor position to misspelled word
      textarea.setSelectionRange(3, 3);

      // Right click
      await user.pointer({ keys: '[MouseRight]', target: textarea });

      await waitFor(() => {
        expect(screen.getByText('Suggestions')).toBeInTheDocument();
        expect(screen.getByText('hello')).toBeInTheDocument();
        expect(screen.getByText('hell')).toBeInTheDocument();
        expect(screen.getByText('yellow')).toBeInTheDocument();
      });
    });

    it('includes ignore and add to dictionary options', async () => {
      render(<TextEditor {...defaultProps} content="helllo world" />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      textarea.setSelectionRange(3, 3);

      await user.pointer({ keys: '[MouseRight]', target: textarea });

      await waitFor(() => {
        expect(screen.getByText('Ignore "helllo"')).toBeInTheDocument();
        expect(screen.getByText('Add to dictionary')).toBeInTheDocument();
      });
    });

    it('applies suggestion when clicked', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} content="helllo world" onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      textarea.setSelectionRange(3, 3);

      await user.pointer({ keys: '[MouseRight]', target: textarea });

      await waitFor(() => {
        const suggestion = screen.getByText('hello');
        user.click(suggestion);
      });

      expect(onChange).toHaveBeenCalledWith('hello world');
    });

    it('ignores word when ignore option is clicked', async () => {
      render(<TextEditor {...defaultProps} content="helllo world" />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      textarea.setSelectionRange(3, 3);

      await user.pointer({ keys: '[MouseRight]', target: textarea });

      await waitFor(async () => {
        const ignoreButton = screen.getByText('Ignore "helllo"');
        await user.click(ignoreButton);
      });

      expect(mockSpellCheckService.addToIgnoreList).toHaveBeenCalledWith('helllo');
    });

    it('adds word to dictionary when option is clicked', async () => {
      render(<TextEditor {...defaultProps} content="helllo world" />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      textarea.setSelectionRange(3, 3);

      await user.pointer({ keys: '[MouseRight]', target: textarea });

      await waitFor(async () => {
        const addButton = screen.getByText('Add to dictionary');
        await user.click(addButton);
      });

      expect(mockSpellCheckService.addToCustomDictionary).toHaveBeenCalledWith('helllo');
    });

    it('shows US to UK conversion option when applicable', async () => {
      const usToUkMisspellings = [{
        word: 'color',
        suggestions: ['colour'],
        position: { start: 0, end: 5 }
      }];

      mockSpellCheckService.checkText.mockReturnValue({ misspellings: usToUkMisspellings });
      mockSpellCheckService.convertUSToUK.mockReturnValue('colour');

      render(<TextEditor {...defaultProps} content="color test" />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      textarea.setSelectionRange(2, 2);

      await user.pointer({ keys: '[MouseRight]', target: textarea });

      await waitFor(() => {
        expect(screen.getByText('Use British spelling: "colour"')).toBeInTheDocument();
      });
    });

    it('closes context menu when clicking outside', async () => {
      render(<TextEditor {...defaultProps} content="helllo world" />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      textarea.setSelectionRange(3, 3);

      await user.pointer({ keys: '[MouseRight]', target: textarea });

      await waitFor(() => {
        expect(screen.getByText('Suggestions')).toBeInTheDocument();
      });

      // Click outside the context menu
      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('disables browser spell check when custom spell checking is enabled', () => {
      render(<TextEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      expect(textarea).toHaveAttribute('spellCheck', 'false');
    });

    it('provides appropriate ARIA labels and titles', () => {
      render(<TextEditor {...defaultProps} />);

      const toggleButton = screen.getByTitle('Spell checking enabled');
      expect(toggleButton).toBeInTheDocument();
    });

    it('maintains keyboard navigation within context menu', async () => {
      const misspellings = [{
        word: 'helllo',
        suggestions: ['hello', 'hell'],
        position: { start: 0, end: 6 }
      }];

      mockSpellCheckService.checkText.mockReturnValue({ misspellings });

      render(<TextEditor {...defaultProps} content="helllo world" />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      textarea.setSelectionRange(3, 3);

      await user.pointer({ keys: '[MouseRight]', target: textarea });

      await waitFor(() => {
        const suggestions = screen.getAllByRole('button');
        expect(suggestions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance', () => {
    it('debounces spell checking for rapid typing', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');

      // Type rapidly
      await user.type(textarea, 'quick');

      // Spell check should be called for the final result
      await waitFor(() => {
        expect(mockSpellCheckService.checkText).toHaveBeenCalledWith('quick');
      });
    });

    it('handles large text efficiently', async () => {
      const largeText = 'word '.repeat(10000);
      render(<TextEditor {...defaultProps} content={largeText} />);

      // Should not freeze or crash
      expect(mockSpellCheckService.checkText).toHaveBeenCalledWith(largeText);
    });
  });
});
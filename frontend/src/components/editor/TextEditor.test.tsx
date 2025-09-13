import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { create } from 'zustand';
import TextEditor from './TextEditor';

// Mock the store
const mockStore = create(() => ({
  setUnsavedChanges: vi.fn(),
  autoSaveEnabled: true,
  spellCheckEnabled: true,
}));

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => selector(mockStore.getState())
}));

describe('TextEditor', () => {
  const defaultProps = {
    content: '',
    onChange: vi.fn(),
    autoSave: true,
    autoSaveInterval: 1000 // 1 second for testing
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders with initial content', () => {
    render(<TextEditor {...defaultProps} content="Initial content" />);
    expect(screen.getByDisplayValue('Initial content')).toBeInTheDocument();
  });

  it('displays word and character counts', () => {
    render(<TextEditor {...defaultProps} content="Hello world test" />);
    expect(screen.getByText('3 words')).toBeInTheDocument();
    expect(screen.getByText('16 characters')).toBeInTheDocument();
  });

  it('updates counts when content changes', async () => {
    const onChange = vi.fn();
    render(<TextEditor {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
    await user.type(textarea, 'Hello world');

    expect(screen.getByText('2 words')).toBeInTheDocument();
    expect(screen.getByText('11 characters')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith('Hello world');
  });

  it('handles empty content correctly', () => {
    render(<TextEditor {...defaultProps} content="" />);
    expect(screen.getByText('0 words')).toBeInTheDocument();
    expect(screen.getByText('0 characters')).toBeInTheDocument();
  });

  it('handles whitespace-only content correctly', () => {
    render(<TextEditor {...defaultProps} content="   \n\t  " />);
    expect(screen.getByText('0 words')).toBeInTheDocument();
    expect(screen.getByText('7 characters')).toBeInTheDocument();
  });

  describe('Formatting functionality', () => {
    it('applies bold formatting with button click', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      await user.type(textarea, 'Hello world');

      // Select text
      textarea.setSelectionRange(0, 5);
      fireEvent.select(textarea);

      // Click bold button
      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      await user.click(boldButton);

      expect(onChange).toHaveBeenCalledWith('**Hello** world');
    });

    it('applies bold formatting with keyboard shortcut', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      await user.type(textarea, 'Hello world');

      // Select text
      textarea.setSelectionRange(0, 5);
      fireEvent.select(textarea);

      // Press Ctrl+B
      await user.keyboard('{Control>}b{/Control}');

      expect(onChange).toHaveBeenCalledWith('**Hello** world');
    });

    it('applies italic formatting', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      await user.type(textarea, 'Hello world');

      // Select text
      textarea.setSelectionRange(0, 5);
      fireEvent.select(textarea);

      // Click italic button
      const italicButton = screen.getByTitle('Italic (Ctrl+I)');
      await user.click(italicButton);

      expect(onChange).toHaveBeenCalledWith('*Hello* world');
    });

    it('applies underline formatting', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      await user.type(textarea, 'Hello world');

      // Select text
      textarea.setSelectionRange(0, 5);
      fireEvent.select(textarea);

      // Click underline button
      const underlineButton = screen.getByTitle('Underline (Ctrl+U)');
      await user.click(underlineButton);

      expect(onChange).toHaveBeenCalledWith('<u>Hello</u> world');
    });

    it('removes formatting when already formatted', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} content="**Hello** world" onChange={onChange} />);

      const textarea = screen.getByDisplayValue('**Hello** world');

      // Select formatted text
      textarea.setSelectionRange(0, 9);
      fireEvent.select(textarea);

      // Click bold button to remove formatting
      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      await user.click(boldButton);

      expect(onChange).toHaveBeenCalledWith('Hello world');
    });

    it('does not format when no text is selected', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} content="Hello world" onChange={onChange} />);

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      await user.click(boldButton);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Undo/Redo functionality', () => {
    it('performs undo operation', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      await user.type(textarea, 'Hello');
      await user.type(textarea, ' world');

      // Undo last change
      const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
      await user.click(undoButton);

      // Should have called onChange with previous content
      expect(onChange).toHaveBeenCalledWith('Hello');
    });

    it('performs redo operation', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      await user.type(textarea, 'Hello');
      await user.type(textarea, ' world');

      // Undo
      const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
      await user.click(undoButton);

      // Redo
      const redoButton = screen.getByTitle('Redo (Ctrl+Y)');
      await user.click(redoButton);

      expect(onChange).toHaveBeenCalledWith('Hello world');
    });

    it('handles undo with keyboard shortcut', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      await user.type(textarea, 'Hello');
      await user.type(textarea, ' world');

      // Focus textarea and press Ctrl+Z
      textarea.focus();
      await user.keyboard('{Control>}z{/Control}');

      expect(onChange).toHaveBeenCalledWith('Hello');
    });

    it('handles redo with keyboard shortcut', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      await user.type(textarea, 'Hello');
      await user.type(textarea, ' world');

      // Undo first
      textarea.focus();
      await user.keyboard('{Control>}z{/Control}');

      // Then redo
      await user.keyboard('{Control>}y{/Control}');

      expect(onChange).toHaveBeenCalledWith('Hello world');
    });

    it('disables undo button when no history', () => {
      render(<TextEditor {...defaultProps} />);
      const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
      expect(undoButton).toBeDisabled();
    });

    it('disables redo button when at end of history', () => {
      render(<TextEditor {...defaultProps} />);
      const redoButton = screen.getByTitle('Redo (Ctrl+Y)');
      expect(redoButton).toBeDisabled();
    });
  });

  describe('Keyboard shortcuts', () => {
    it('handles Ctrl+S for manual save', async () => {
      const manualSaveListener = vi.fn();
      document.addEventListener('manual-save', manualSaveListener);

      render(<TextEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      textarea.focus();
      await user.keyboard('{Control>}s{/Control}');

      expect(manualSaveListener).toHaveBeenCalled();

      document.removeEventListener('manual-save', manualSaveListener);
    });

    it('prevents default browser behavior for shortcuts', async () => {
      render(<TextEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      textarea.focus();

      const keydownEvent = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault');
      fireEvent(textarea, keydownEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Auto-save functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('triggers auto-save event at specified intervals', async () => {
      const autoSaveListener = vi.fn();
      document.addEventListener('auto-save', autoSaveListener);

      render(<TextEditor {...defaultProps} autoSaveInterval={1000} />);

      // Fast-forward time by 1 second
      vi.advanceTimersByTime(1000);

      expect(autoSaveListener).toHaveBeenCalled();

      document.removeEventListener('auto-save', autoSaveListener);
    });

    it('does not auto-save when disabled', () => {
      const autoSaveListener = vi.fn();
      document.addEventListener('auto-save', autoSaveListener);

      render(<TextEditor {...defaultProps} autoSave={false} autoSaveInterval={1000} />);

      vi.advanceTimersByTime(1000);

      expect(autoSaveListener).not.toHaveBeenCalled();

      document.removeEventListener('auto-save', autoSaveListener);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<TextEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('spellCheck', 'true');
    });

    it('has proper button titles for screen readers', () => {
      render(<TextEditor {...defaultProps} />);

      expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
      expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument();
      expect(screen.getByTitle('Underline (Ctrl+U)')).toBeInTheDocument();
      expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument();
      expect(screen.getByTitle('Redo (Ctrl+Y)')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles large text content efficiently', () => {
      const largeContent = 'A'.repeat(10000);
      render(<TextEditor {...defaultProps} content={largeContent} />);

      expect(screen.getByText('1 words')).toBeInTheDocument();
      expect(screen.getByText('10000 characters')).toBeInTheDocument();
    });

    it('handles special characters in content', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');
      await user.type(textarea, 'Special: 🚀 & <html> "quotes"');

      expect(onChange).toHaveBeenCalledWith('Special: 🚀 & <html> "quotes"');
    });

    it('maintains history within size limit', async () => {
      const onChange = vi.fn();
      render(<TextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Begin writing your chapter content here...');

      // Type more than history limit (50 changes)
      for (let i = 0; i < 55; i++) {
        await user.type(textarea, `${i} `);
      }

      // History should still work
      const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
      expect(undoButton).not.toBeDisabled();
    });
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DictionaryManager from './DictionaryManager';

// Mock the dictionary service
const mockDictionaryService = {
  getTerms: vi.fn(),
  getStatistics: vi.fn(),
  getCategories: vi.fn(),
  createTerm: vi.fn(),
  updateTerm: vi.fn(),
  deleteTerm: vi.fn(),
  toggleTermActive: vi.fn(),
};

// Mock the spell check service
const mockSpellCheckService = {
  refreshCustomDictionary: vi.fn(),
};

vi.mock('../../services/dictionaryService', () => ({
  dictionaryService: mockDictionaryService
}));

vi.mock('../../services/spellChecker', () => ({
  spellCheckService: mockSpellCheckService
}));

describe('DictionaryManager', () => {
  const defaultProps = {
    isVisible: true,
    onClose: vi.fn(),
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Mock default API responses
    mockDictionaryService.getTerms.mockResolvedValue({
      data: [
        {
          id: 1,
          term: 'customword',
          category: 'custom',
          is_active: true,
          is_user_added: true,
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          term: 'technicalterm',
          category: 'technical_term',
          is_active: true,
          is_user_added: true,
          created_at: '2023-01-02T00:00:00Z'
        }
      ],
      pagination: {
        total: 2,
        limit: 20,
        offset: 0,
        has_more: false
      }
    });

    mockDictionaryService.getStatistics.mockResolvedValue({
      total: 2,
      active: 2,
      inactive: 0,
      userAdded: 2,
      systemAdded: 0,
      byCategory: {
        proper_noun: 0,
        technical_term: 1,
        character_name: 0,
        place_name: 0,
        custom: 1
      }
    });

    mockDictionaryService.getCategories.mockResolvedValue([
      'proper_noun',
      'technical_term',
      'character_name',
      'place_name',
      'custom'
    ]);

    mockSpellCheckService.refreshCustomDictionary.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Visibility', () => {
    it('renders when visible', () => {
      render(<DictionaryManager {...defaultProps} />);

      expect(screen.getByText('Custom Dictionary Management')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      render(<DictionaryManager {...defaultProps} isVisible={false} />);

      expect(screen.queryByText('Custom Dictionary Management')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      render(<DictionaryManager {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Data Loading', () => {
    it('loads terms, statistics, and categories on mount', async () => {
      render(<DictionaryManager {...defaultProps} />);

      await waitFor(() => {
        expect(mockDictionaryService.getTerms).toHaveBeenCalled();
        expect(mockDictionaryService.getStatistics).toHaveBeenCalled();
        expect(mockDictionaryService.getCategories).toHaveBeenCalled();
      });
    });

    it('displays loading state', () => {
      // Make the API calls hang
      mockDictionaryService.getTerms.mockImplementation(() => new Promise(() => {}));

      render(<DictionaryManager {...defaultProps} />);

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('displays error message on API failure', async () => {
      mockDictionaryService.getTerms.mockRejectedValue(new Error('API Error'));

      render(<DictionaryManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load dictionary data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Display', () => {
    it('displays statistics correctly', async () => {
      render(<DictionaryManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total
        expect(screen.getByText('Total Terms')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('User Added')).toBeInTheDocument();
      });
    });
  });

  describe('Terms List', () => {
    it('displays terms correctly', async () => {
      render(<DictionaryManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('customword')).toBeInTheDocument();
        expect(screen.getByText('technicalterm')).toBeInTheDocument();
        expect(screen.getByText('Custom')).toBeInTheDocument();
        expect(screen.getByText('Technical Term')).toBeInTheDocument();
      });
    });

    it('shows no terms message when list is empty', async () => {
      mockDictionaryService.getTerms.mockResolvedValue({
        data: [],
        pagination: { total: 0, limit: 20, offset: 0, has_more: false }
      });

      render(<DictionaryManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No terms found matching your criteria.')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('applies search filter', async () => {
      render(<DictionaryManager {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search terms...');
      await user.type(searchInput, 'custom');

      await waitFor(() => {
        expect(mockDictionaryService.getTerms).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'custom' })
        );
      });
    });

    it('applies category filter', async () => {
      render(<DictionaryManager {...defaultProps} />);

      const categorySelect = screen.getByDisplayValue('All Categories');
      await user.selectOptions(categorySelect, 'custom');

      await waitFor(() => {
        expect(mockDictionaryService.getTerms).toHaveBeenCalledWith(
          expect.objectContaining({ category: 'custom' })
        );
      });
    });

    it('clears filters when clear button is clicked', async () => {
      render(<DictionaryManager {...defaultProps} />);

      // Set some filters first
      const searchInput = screen.getByPlaceholderText('Search terms...');
      await user.type(searchInput, 'test');

      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Adding Terms', () => {
    it('shows add form when add button is clicked', async () => {
      render(<DictionaryManager {...defaultProps} />);

      const addButton = screen.getByText('Add Term');
      await user.click(addButton);

      expect(screen.getByPlaceholderText('New term')).toBeInTheDocument();
    });

    it('adds a new term successfully', async () => {
      mockDictionaryService.createTerm.mockResolvedValue({
        id: 3,
        term: 'newterm',
        category: 'custom',
        is_active: true,
        is_user_added: true
      });

      render(<DictionaryManager {...defaultProps} />);

      // Open add form
      await user.click(screen.getByText('Add Term'));

      // Fill form
      const termInput = screen.getByPlaceholderText('New term');
      await user.type(termInput, 'newterm');

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Add' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockDictionaryService.createTerm).toHaveBeenCalledWith({
          term: 'newterm',
          category: 'custom',
          is_active: true
        });
        expect(mockSpellCheckService.refreshCustomDictionary).toHaveBeenCalled();
      });
    });

    it('hides add form when cancelled', async () => {
      render(<DictionaryManager {...defaultProps} />);

      // Open add form
      await user.click(screen.getByText('Add Term'));

      // Cancel
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.queryByPlaceholderText('New term')).not.toBeInTheDocument();
    });
  });

  describe('Editing Terms', () => {
    it('shows edit form when edit button is clicked', async () => {
      render(<DictionaryManager {...defaultProps} />);

      await waitFor(() => {
        const editButton = screen.getAllByText('Edit')[0];
        return user.click(editButton);
      });

      expect(screen.getByDisplayValue('customword')).toBeInTheDocument();
    });

    it('updates a term successfully', async () => {
      mockDictionaryService.updateTerm.mockResolvedValue({
        id: 1,
        term: 'updatedword',
        category: 'proper_noun',
        is_active: true,
        is_user_added: true
      });

      render(<DictionaryManager {...defaultProps} />);

      await waitFor(async () => {
        const editButton = screen.getAllByText('Edit')[0];
        await user.click(editButton);
      });

      // Update term
      const termInput = screen.getByDisplayValue('customword');
      await user.clear(termInput);
      await user.type(termInput, 'updatedword');

      // Save
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockDictionaryService.updateTerm).toHaveBeenCalledWith(1, {
          term: 'updatedword',
          category: 'custom', // Should maintain original category
          is_active: true
        });
      });
    });
  });

  describe('Deleting Terms', () => {
    it('shows confirmation dialog before deletion', async () => {
      // Mock confirm dialog
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<DictionaryManager {...defaultProps} />);

      await waitFor(async () => {
        const deleteButton = screen.getAllByText('Delete')[0];
        await user.click(deleteButton);
      });

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete the term "customword"?'
      );

      confirmSpy.mockRestore();
    });

    it('deletes a term when confirmed', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockDictionaryService.deleteTerm.mockResolvedValue(undefined);

      render(<DictionaryManager {...defaultProps} />);

      await waitFor(async () => {
        const deleteButton = screen.getAllByText('Delete')[0];
        await user.click(deleteButton);
      });

      await waitFor(() => {
        expect(mockDictionaryService.deleteTerm).toHaveBeenCalledWith(1);
        expect(mockSpellCheckService.refreshCustomDictionary).toHaveBeenCalled();
      });

      confirmSpy.mockRestore();
    });

    it('does not delete when cancelled', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<DictionaryManager {...defaultProps} />);

      await waitFor(async () => {
        const deleteButton = screen.getAllByText('Delete')[0];
        await user.click(deleteButton);
      });

      expect(mockDictionaryService.deleteTerm).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Toggle Active Status', () => {
    it('toggles term active status', async () => {
      mockDictionaryService.toggleTermActive.mockResolvedValue({
        id: 1,
        term: 'customword',
        category: 'custom',
        is_active: false,
        is_user_added: true
      });

      render(<DictionaryManager {...defaultProps} />);

      await waitFor(async () => {
        const deactivateButton = screen.getAllByText('Deactivate')[0];
        await user.click(deactivateButton);
      });

      await waitFor(() => {
        expect(mockDictionaryService.toggleTermActive).toHaveBeenCalledWith(1);
        expect(mockSpellCheckService.refreshCustomDictionary).toHaveBeenCalled();
      });
    });
  });

  describe('Pagination', () => {
    it('shows pagination when there are multiple pages', async () => {
      mockDictionaryService.getTerms.mockResolvedValue({
        data: [{ id: 1, term: 'test', category: 'custom', is_active: true, is_user_added: true }],
        pagination: { total: 50, limit: 20, offset: 0, has_more: true }
      });

      render(<DictionaryManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });

    it('navigates to next page', async () => {
      mockDictionaryService.getTerms.mockResolvedValue({
        data: [{ id: 1, term: 'test', category: 'custom', is_active: true, is_user_added: true }],
        pagination: { total: 50, limit: 20, offset: 0, has_more: true }
      });

      render(<DictionaryManager {...defaultProps} />);

      await waitFor(async () => {
        const nextButton = screen.getByText('Next');
        await user.click(nextButton);
      });

      await waitFor(() => {
        expect(mockDictionaryService.getTerms).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 20 })
        );
      });
    });
  });

  describe('Integration with Spell Checker', () => {
    it('refreshes spell checker when dictionary manager is closed', async () => {
      render(<DictionaryManager {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockSpellCheckService.refreshCustomDictionary).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
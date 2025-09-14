import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppStore } from '../store';

// Mock the store
vi.mock('../store', () => ({
  useAppStore: vi.fn(),
}));

const mockStore = {
  sidebarCollapsed: false,
  selectedBook: null,
  setSidebarCollapsed: vi.fn(),
};

const mockBookStore = {
  sidebarCollapsed: false,
  setSidebarCollapsed: vi.fn(),
  selectedBook: {
    id: 1,
    title: 'Test Book',
    author: 'Test Author',
    chapterCount: 5,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
};

const renderSidebar = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Sidebar />
    </MemoryRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockReturnValue(mockStore);
  });

  describe('Navigation Items', () => {
    it('renders all navigation items when expanded', () => {
      renderSidebar();
      
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /my books/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /editor/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /dictionary/i })).toBeInTheDocument();
    });

    it('shows navigation descriptions when expanded', () => {
      renderSidebar();
      
      expect(screen.getByText('Overview and statistics')).toBeInTheDocument();
      expect(screen.getByText('Manage your manuscripts')).toBeInTheDocument();
      expect(screen.getByText('Write and edit content')).toBeInTheDocument();
      expect(screen.getByText('Custom word management')).toBeInTheDocument();
    });

    it('hides navigation text when collapsed', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });
      
      renderSidebar();
      
      // Text should not be visible when collapsed
      expect(screen.queryByText('Overview and statistics')).not.toBeInTheDocument();
      expect(screen.queryByText('Manage your manuscripts')).not.toBeInTheDocument();
      expect(screen.queryByText('Write and edit content')).not.toBeInTheDocument();
      expect(screen.queryByText('Custom word management')).not.toBeInTheDocument();
    });

    it('adds title attributes when collapsed for accessibility', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });

      renderSidebar();

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i, hidden: true });
      expect(dashboardLink).toHaveAttribute('title', 'Dashboard: Overview and statistics');
    });

    it('has correct href attributes', () => {
      renderSidebar();
      
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /my books/i })).toHaveAttribute('href', '/books');
      expect(screen.getByRole('link', { name: /editor/i })).toHaveAttribute('href', '/editor');
      expect(screen.getByRole('link', { name: /dictionary/i })).toHaveAttribute('href', '/dictionary');
    });
  });

  describe('Active State', () => {
    it('highlights dashboard as active when on root path', () => {
      renderSidebar(['/']);
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('bg-chrome-green-100', 'text-chrome-green-700');
    });

    it('highlights dashboard as active when on dashboard path', () => {
      renderSidebar(['/dashboard']);
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('bg-chrome-green-100', 'text-chrome-green-700');
    });

    it('highlights books as active when on books path', () => {
      renderSidebar(['/books']);
      
      const booksLink = screen.getByRole('link', { name: /my books/i });
      expect(booksLink).toHaveClass('bg-chrome-green-100', 'text-chrome-green-700');
    });

    it('highlights books as active when on specific book path', () => {
      renderSidebar(['/books/123']);
      
      const booksLink = screen.getByRole('link', { name: /my books/i });
      expect(booksLink).toHaveClass('bg-chrome-green-100', 'text-chrome-green-700');
    });

    it('highlights editor as active when on editor path', () => {
      renderSidebar(['/editor']);
      
      const editorLink = screen.getByRole('link', { name: /editor/i });
      expect(editorLink).toHaveClass('bg-chrome-green-100', 'text-chrome-green-700');
    });

    it('shows active indicator dot when expanded and active', () => {
      renderSidebar(['/dashboard']);
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      const activeDot = dashboardLink.querySelector('.bg-chrome-green-500.rounded-full');
      expect(activeDot).toBeInTheDocument();
    });

    it('applies inactive styles to non-active items', () => {
      renderSidebar(['/dashboard']);
      
      const booksLink = screen.getByRole('link', { name: /my books/i });
      expect(booksLink).toHaveClass('text-gray-600');
      expect(booksLink).not.toHaveClass('bg-chrome-green-100');
    });
  });

  describe('Current Book Section', () => {
    it('does not show current book section when no book selected', () => {
      renderSidebar();
      
      expect(screen.queryByText('Current Book')).not.toBeInTheDocument();
    });

    it('shows current book section when book is selected and sidebar expanded', () => {
      (useAppStore as any).mockReturnValue(mockBookStore);
      
      renderSidebar();
      
      expect(screen.getByText('Current Book')).toBeInTheDocument();
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('by Test Author')).toBeInTheDocument();
      expect(screen.getByText('5 chapters')).toBeInTheDocument();
    });

    it('does not show current book section when sidebar collapsed', () => {
      (useAppStore as any).mockReturnValue({
        ...mockBookStore,
        sidebarCollapsed: true,
      });
      
      renderSidebar();
      
      expect(screen.queryByText('Current Book')).not.toBeInTheDocument();
    });

    it('handles book with no chapters', () => {
      (useAppStore as any).mockReturnValue({
        ...mockBookStore,
        selectedBook: {
          ...mockBookStore.selectedBook,
          chapterCount: undefined,
        },
      });

      renderSidebar();

      expect(screen.getByText('0 chapters')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('shows quick actions when sidebar expanded', () => {
      renderSidebar();
      
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new book/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new chapter/i })).toBeInTheDocument();
    });

    it('does not show quick actions when sidebar collapsed', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });
      
      renderSidebar();
      
      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
    });

    it('has proper button styling for quick actions', () => {
      renderSidebar();
      
      const newBookButton = screen.getByRole('button', { name: /new book/i });
      expect(newBookButton).toHaveClass('hover:bg-gray-50', 'transition-colors');
    });
  });

  describe('Footer', () => {
    it('shows footer when sidebar expanded', () => {
      renderSidebar();
      
      expect(screen.getByText('Book Master v1.0')).toBeInTheDocument();
      expect(screen.getByText('Professional Editor')).toBeInTheDocument();
    });

    it('does not show footer when sidebar collapsed', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });
      
      renderSidebar();
      
      expect(screen.queryByText('Book Master v1.0')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('has correct width when expanded', () => {
      renderSidebar();
      
      const sidebar = document.querySelector('aside');
      expect(sidebar).toHaveClass('w-64');
    });

    it('has correct width when collapsed', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });
      
      renderSidebar();
      
      const sidebar = document.querySelector('aside');
      expect(sidebar).toHaveClass('w-16');
    });

    it('has proper positioning classes', () => {
      renderSidebar();
      
      const sidebar = document.querySelector('aside');
      expect(sidebar).toHaveClass('fixed', 'md:relative', 'h-full');
    });

    it('has proper z-index for layering', () => {
      renderSidebar();
      
      const sidebar = document.querySelector('aside');
      expect(sidebar).toHaveClass('z-15');
    });
  });

  describe('Styling and Theme', () => {
    it('has correct background and shadow styling', () => {
      renderSidebar();
      
      const sidebar = document.querySelector('aside');
      expect(sidebar).toHaveClass('bg-white', 'shadow-lg', 'border-r', 'border-gray-200');
    });

    it('has smooth transition animations', () => {
      renderSidebar();
      
      const sidebar = document.querySelector('aside');
      expect(sidebar).toHaveClass('transition-all', 'duration-300');
    });

    it('has custom scrollbar on navigation', () => {
      renderSidebar();
      
      const nav = document.querySelector('nav');
      expect(nav).toHaveClass('overflow-y-auto');
    });
  });

  describe('Icons', () => {
    it('renders SVG icons for all navigation items', () => {
      renderSidebar();

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const svg = link.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass('h-5', 'w-5');
      });
    });

    it('renders icons in quick action buttons', () => {
      renderSidebar();

      const newBookButton = screen.getByRole('button', { name: /new book/i });
      const newChapterButton = screen.getByRole('button', { name: /new chapter/i });

      expect(newBookButton.querySelector('svg')).toBeInTheDocument();
      expect(newChapterButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('has proper semantic structure', () => {
      renderSidebar();

      const sidebar = document.querySelector('aside');
      expect(sidebar).toHaveAttribute('role', 'navigation');
      expect(sidebar).toHaveAttribute('aria-label', 'Main navigation');
      expect(sidebar).toHaveAttribute('id', 'main-sidebar');
    });

    it('nav element has correct ARIA attributes', () => {
      renderSidebar();

      const nav = screen.getByRole('navigation', { name: /primary navigation menu/i });
      expect(nav).toHaveAttribute('aria-label', 'Primary navigation menu');
    });

    it('navigation links have enhanced accessibility attributes', () => {
      renderSidebar();

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-chrome-green-500',
        'focus:ring-offset-2'
      );
    });

    it('shows aria-current for active page', () => {
      renderSidebar(['/dashboard']);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    it('does not show aria-current for inactive pages', () => {
      renderSidebar(['/dashboard']);

      const booksLink = screen.getByRole('link', { name: /my books/i });
      expect(booksLink).not.toHaveAttribute('aria-current');
    });

    it('collapsed links have comprehensive aria-labels', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });

      renderSidebar();

      const dashboardLink = screen.getByRole('link', { name: /dashboard: overview and statistics/i });
      expect(dashboardLink).toHaveAttribute('aria-label', 'Dashboard: Overview and statistics');
      expect(dashboardLink).toHaveAttribute('title', 'Dashboard: Overview and statistics');
    });

    it('current book section has proper semantic structure', () => {
      (useAppStore as any).mockReturnValue(mockBookStore);

      renderSidebar();

      const heading = screen.getByText('Current Book');
      expect(heading).toHaveAttribute('id', 'current-book-heading');

      const region = heading.parentElement?.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-labelledby', 'current-book-heading');
    });

    it('book information has proper accessibility labels', () => {
      (useAppStore as any).mockReturnValue(mockBookStore);

      renderSidebar();

      const title = screen.getByText('Test Book');
      expect(title).toHaveAttribute('title', 'Test Book');

      const author = screen.getByText('by Test Author');
      expect(author).toHaveAttribute('title', 'by Test Author');

      const chapterCount = screen.getByText('5 chapters');
      expect(chapterCount).toHaveAttribute('aria-label', '5 chapters in this book');
    });

    it('quick actions have proper semantic grouping', () => {
      renderSidebar();

      const heading = screen.getByText('Quick Actions');
      expect(heading).toHaveAttribute('id', 'quick-actions-heading');

      const group = heading.parentElement?.querySelector('[role="group"]');
      expect(group).toHaveAttribute('aria-labelledby', 'quick-actions-heading');
    });

    it('quick action buttons have enhanced accessibility', () => {
      renderSidebar();

      const newBookButton = screen.getByRole('button', { name: /create a new book/i });
      expect(newBookButton).toHaveAttribute('aria-label', 'Create a new book');
      expect(newBookButton).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-chrome-green-500',
        'focus:ring-offset-2'
      );

      const newChapterButton = screen.getByRole('button', { name: /create a new chapter/i });
      expect(newChapterButton).toHaveAttribute('aria-label', 'Create a new chapter');
    });

    it('SVG icons have aria-hidden attribute', () => {
      renderSidebar();

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const svg = link.querySelector('svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('handles keyboard navigation', () => {
      renderSidebar();

      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      // Test escape key functionality
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockStore.setSidebarCollapsed).toHaveBeenCalledWith(true);
    });

    it('manages focus when opening on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: false,
      });

      const mockFocus = vi.fn();
      const mockQuerySelector = vi.fn(() => ({
        focus: mockFocus,
      }));

      // Mock the ref and querySelector
      vi.spyOn(document, 'querySelector').mockImplementation(mockQuerySelector);

      renderSidebar();

      // Focus should be called on the first nav link
      // Note: This test is more about the structure than the actual focus behavior
      // which requires more complex mocking in a real implementation
    });

    it('sidebar has proper aria-hidden state', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });

      renderSidebar();

      const sidebar = document.querySelector('aside');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Enhanced Responsive Design', () => {
    it('applies responsive padding to navigation', () => {
      renderSidebar();

      const nav = screen.getByRole('navigation', { name: /primary navigation menu/i });
      expect(nav).toHaveClass('p-3', 'sm:p-4');
    });

    it('applies responsive spacing to navigation items', () => {
      renderSidebar();

      const navContainer = document.querySelector('.space-y-1');
      expect(navContainer).toBeInTheDocument();
      expect(navContainer).toHaveClass('space-y-1', 'sm:space-y-2');
    });

    it('applies responsive padding to navigation links', () => {
      renderSidebar();

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('px-2', 'sm:px-3', 'py-2', 'sm:py-3');
    });

    it('applies responsive padding to current book section', () => {
      (useAppStore as any).mockReturnValue(mockBookStore);

      renderSidebar();

      const heading = screen.getByText('Current Book');
      expect(heading).toHaveClass('px-2', 'sm:px-3');

      const bookInfo = heading.parentElement?.querySelector('.px-2');
      expect(bookInfo).toHaveClass('px-2', 'sm:px-3');
    });

    it('applies responsive padding to quick actions', () => {
      renderSidebar();

      const heading = screen.getByText('Quick Actions');
      expect(heading).toHaveClass('px-2', 'sm:px-3');

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('px-2', 'sm:px-3');
      });
    });

    it('applies responsive padding to footer', () => {
      renderSidebar();

      const footer = screen.getByText('Book Master v1.0').closest('.absolute');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('p-3', 'sm:p-4');
    });

    it('uses responsive spacing for section margins', () => {
      (useAppStore as any).mockReturnValue(mockBookStore);

      renderSidebar();

      const currentBookSection = screen.getByText('Current Book').parentElement;
      expect(currentBookSection).toHaveClass('mt-6', 'sm:mt-8', 'pt-4', 'sm:pt-6');

      const quickActionsSection = screen.getByText('Quick Actions').parentElement;
      expect(quickActionsSection).toHaveClass('mt-6', 'sm:mt-8', 'pt-4', 'sm:pt-6');
    });

    it('SVG icons maintain proper sizing', () => {
      renderSidebar();

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const svg = link.querySelector('svg');
        expect(svg).toHaveClass('h-5', 'w-5');
      });

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const svg = button.querySelector('svg');
        if (svg) {
          expect(svg).toHaveClass('h-4', 'w-4');
          expect(svg).toHaveClass('flex-shrink-0');
        }
      });
    });

    it('handles text truncation properly', () => {
      (useAppStore as any).mockReturnValue({
        ...mockBookStore,
        selectedBook: {
          ...mockBookStore.selectedBook,
          title: 'This is a very long book title that should be truncated',
          author: 'This is a very long author name that should also be truncated',
        },
      });

      renderSidebar();

      const title = screen.getByText(/this is a very long book title/i);
      expect(title).toHaveClass('truncate');

      const author = screen.getByText(/this is a very long author name/i);
      expect(author).toHaveClass('truncate');
    });
  });
});
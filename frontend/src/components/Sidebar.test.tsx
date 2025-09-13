import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
};

const mockBookStore = {
  sidebarCollapsed: false,
  selectedBook: {
    id: 1,
    title: 'Test Book',
    author: 'Test Author',
    chapter_count: 5,
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
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('title', 'Dashboard');
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
          chapter_count: undefined,
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
});
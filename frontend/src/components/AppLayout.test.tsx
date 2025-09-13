import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import { useAppStore } from '../store';

// Mock the store
vi.mock('../store', () => ({
  useAppStore: vi.fn(),
}));

// Mock the Sidebar component
vi.mock('./Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

const mockStore = {
  sidebarCollapsed: false,
  setSidebarCollapsed: vi.fn(),
};

const renderAppLayout = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppLayout />
    </MemoryRouter>
  );
};

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockReturnValue(mockStore);
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Header', () => {
    it('renders the header with correct title and tagline', () => {
      renderAppLayout();
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /book master/i })).toBeInTheDocument();
      expect(screen.getByText(/professional british english editor/i)).toBeInTheDocument();
      expect(screen.getByText(/welcome to book master/i)).toBeInTheDocument();
      expect(screen.getByText(/manuscript editing made simple/i)).toBeInTheDocument();
    });

    it('has correct chrome green styling', () => {
      renderAppLayout();
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-chrome-green-600');
    });

    it('renders sidebar toggle button', () => {
      renderAppLayout();
      
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('calls setSidebarCollapsed when toggle button is clicked', () => {
      renderAppLayout();
      
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      fireEvent.click(toggleButton);
      
      expect(mockStore.setSidebarCollapsed).toHaveBeenCalledWith(true);
    });

    it('shows correct icon based on sidebar state', () => {
      renderAppLayout();
      
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      const svg = toggleButton.querySelector('svg');
      
      // Check for the X icon when sidebar is expanded
      expect(svg?.querySelector('path')).toHaveAttribute('d', 'M6 18L18 6M6 6l12 12');
    });

    it('shows hamburger icon when sidebar is collapsed', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });
      
      renderAppLayout();
      
      const toggleButton = screen.getByRole('button', { name: /expand sidebar/i });
      const svg = toggleButton.querySelector('svg');
      
      // Check for the hamburger icon when sidebar is collapsed
      expect(svg?.querySelector('path')).toHaveAttribute('d', 'M4 6h16M4 12h16M4 18h16');
    });
  });

  describe('Sidebar', () => {
    it('renders the sidebar component', () => {
      renderAppLayout();
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('shows mobile overlay when sidebar is expanded on mobile', () => {
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

      renderAppLayout();

      const overlay = document.querySelector('[role="button"][tabindex="-1"]');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('bg-black', 'bg-opacity-25');
    });

    it('does not show mobile overlay when sidebar is collapsed', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });

      renderAppLayout();

      const overlay = document.querySelector('[role="button"][tabindex="-1"]');
      expect(overlay).not.toBeInTheDocument();
    });

    it('closes sidebar when mobile overlay is clicked', () => {
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

      renderAppLayout();

      const overlay = document.querySelector('[role="button"][tabindex="-1"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockStore.setSidebarCollapsed).toHaveBeenCalledWith(true);
      }
    });
  });

  describe('Main Content Area', () => {
    it('renders the main content area with outlet', () => {
      renderAppLayout();
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('flex-1', 'min-w-0', 'bg-gray-50');
    });

    it('has proper padding and responsive behavior', () => {
      renderAppLayout();

      const main = screen.getByRole('main');
      const contentDiv = main.firstChild;
      expect(contentDiv).toHaveClass('h-full');
      // Main element itself has responsive padding now
      expect(main).toHaveClass('px-8', 'py-8');
    });
  });

  describe('Responsive Behavior', () => {
    it('collapses sidebar on mobile viewport during mount', async () => {
      // Mock mobile viewport (< 640px)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      renderAppLayout();

      // Wait for useEffect to run
      await waitFor(() => {
        expect(mockStore.setSidebarCollapsed).toHaveBeenCalledWith(true);
      });
    });

    it('collapses sidebar on tablet viewport during mount', async () => {
      // Mock tablet viewport (< 768px)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 700,
      });

      renderAppLayout();

      // Wait for useEffect to run
      await waitFor(() => {
        expect(mockStore.setSidebarCollapsed).toHaveBeenCalledWith(true);
      });
    });

    it('handles window resize events', async () => {
      renderAppLayout();

      // Simulate window resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(mockStore.setSidebarCollapsed).toHaveBeenCalledWith(true);
      });
    });

    it('does not auto-collapse on desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      renderAppLayout();

      // setSidebarCollapsed should not be called for desktop viewport
      expect(mockStore.setSidebarCollapsed).not.toHaveBeenCalled();
    });

    it('applies responsive padding to main content', () => {
      renderAppLayout();

      const main = screen.getByRole('main');

      // Check for responsive padding classes
      expect(main).toHaveClass('px-8', 'py-8'); // Desktop default
    });

    it('uses mobile padding on small screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      renderAppLayout();

      const main = screen.getByRole('main');

      // Should have mobile padding classes
      expect(main.className).toContain('px-4 py-4');
    });

    it('uses tablet padding on medium screens', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 700,
      });

      renderAppLayout();

      const main = screen.getByRole('main');

      // Should have tablet padding classes
      expect(main.className).toContain('px-6 py-6');
    });

    it('header elements respond to screen size', () => {
      renderAppLayout();

      const header = screen.getByRole('banner');
      const titleDiv = header.querySelector('.ml-2');

      expect(titleDiv).toHaveClass('sm:ml-3');
    });

    it('title text responds to screen size', () => {
      renderAppLayout();

      const title = screen.getByRole('heading', { name: /book master/i });

      expect(title).toHaveClass('text-lg', 'sm:text-xl', 'lg:text-2xl');
    });

    it('welcome message is hidden on smaller screens', () => {
      renderAppLayout();

      const welcomeDiv = screen.getByText(/welcome to book master/i).parentElement;

      expect(welcomeDiv).toHaveClass('hidden', 'md:block');
    });
  });

  describe('Accessibility', () => {
    it('has skip to main content link', () => {
      renderAppLayout();

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink).toHaveClass('sr-only');
    });

    it('skip link becomes visible when focused', () => {
      renderAppLayout();

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toHaveClass('focus:not-sr-only');
    });

    it('has proper role attributes', () => {
      renderAppLayout();

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('main content area has proper id for skip link', () => {
      renderAppLayout();

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('has enhanced ARIA labels on toggle button', () => {
      renderAppLayout();

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar navigation/i });
      expect(toggleButton).toHaveAttribute('aria-label', 'Collapse sidebar navigation');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      expect(toggleButton).toHaveAttribute('aria-controls', 'main-sidebar');
    });

    it('updates ARIA attributes based on sidebar state', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });

      renderAppLayout();

      const toggleButton = screen.getByRole('button', { name: /expand sidebar navigation/i });
      expect(toggleButton).toHaveAttribute('aria-label', 'Expand sidebar navigation');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('has enhanced focus management on toggle button', () => {
      renderAppLayout();

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar navigation/i });
      expect(toggleButton).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-chrome-green-300',
        'focus:ring-offset-2',
        'focus:ring-offset-chrome-green-600'
      );
    });

    it('SVG icons have proper accessibility attributes', () => {
      renderAppLayout();

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar navigation/i });
      const svg = toggleButton.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('mobile overlay handles keyboard events', () => {
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

      renderAppLayout();

      const overlay = document.querySelector('[role="button"][tabindex="-1"]');
      expect(overlay).toBeInTheDocument();

      // Test escape key
      if (overlay) {
        fireEvent.keyDown(overlay, { key: 'Escape' });
        expect(mockStore.setSidebarCollapsed).toHaveBeenCalledWith(true);
      }
    });

    it('mobile overlay is not shown on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: false,
      });

      renderAppLayout();

      const overlay = document.querySelector('[role="button"][tabindex="-1"]');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('has correct flex layout structure', () => {
      renderAppLayout();
      
      // Root container should be flex column
      const rootDiv = document.querySelector('.min-h-screen');
      expect(rootDiv).toHaveClass('flex', 'flex-col');
      
      // Main layout container should be flex row
      const layoutContainer = document.querySelector('.flex.flex-1.relative');
      expect(layoutContainer).toBeInTheDocument();
    });

    it('maintains proper z-index stacking', () => {
      renderAppLayout();
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('z-20');
    });
  });
});
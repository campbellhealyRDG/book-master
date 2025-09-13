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
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: false,
      });
      
      renderAppLayout();
      
      const overlay = document.querySelector('[aria-hidden=\"true\"]');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('bg-black', 'bg-opacity-25');
    });

    it('does not show mobile overlay when sidebar is collapsed', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });
      
      renderAppLayout();
      
      const overlay = document.querySelector('[aria-hidden=\"true\"]');
      expect(overlay).not.toBeInTheDocument();
    });

    it('closes sidebar when mobile overlay is clicked', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: false,
      });
      
      renderAppLayout();
      
      const overlay = document.querySelector('[aria-hidden=\"true\"]');
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
      expect(contentDiv).toHaveClass('h-full', 'p-4', 'sm:p-6', 'lg:p-8');
    });
  });

  describe('Responsive Behavior', () => {
    it('collapses sidebar on mobile viewport during mount', async () => {
      // Mock mobile viewport
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
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on toggle button', () => {
      renderAppLayout();
      
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      expect(toggleButton).toHaveAttribute('aria-label', 'Collapse sidebar');
    });

    it('updates ARIA label based on sidebar state', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: true,
      });
      
      renderAppLayout();
      
      const toggleButton = screen.getByRole('button', { name: /expand sidebar/i });
      expect(toggleButton).toHaveAttribute('aria-label', 'Expand sidebar');
    });

    it('has proper focus management on toggle button', () => {
      renderAppLayout();
      
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      expect(toggleButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-chrome-green-300');
    });

    it('mobile overlay has proper ARIA attributes', () => {
      (useAppStore as any).mockReturnValue({
        ...mockStore,
        sidebarCollapsed: false,
      });
      
      renderAppLayout();
      
      const overlay = document.querySelector('[aria-hidden=\"true\"]');
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
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
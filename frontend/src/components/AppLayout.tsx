import React, { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import Sidebar from './Sidebar';
import NavigationBar from './NavigationBar';
import ScrollToTopButton from './ScrollToTopButton';

const AppLayout: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Handle responsive breakpoints and sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newIsMobile = width < 640;
      const newIsTablet = width >= 640 && width < 1024;

      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);

      // Auto-collapse sidebar on mobile and small tablets
      if (width < 768) {
        setSidebarCollapsed(true);
      } else if (width >= 1024) {
        // Auto-expand on desktop if user hasn't manually collapsed it
        // We could track user preference here in future
      }
    };

    // Set initial state based on screen size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-chrome-green-600 text-white px-4 py-2 text-sm font-medium rounded-br-md focus:outline-none focus:ring-2 focus:ring-chrome-green-300"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header
        className="bg-chrome-green-600 text-white shadow-lg z-20 relative"
        role="banner"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-md hover:bg-chrome-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-chrome-green-300 focus:ring-offset-2 focus:ring-offset-chrome-green-600"
                aria-label={sidebarCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
                aria-expanded={!sidebarCollapsed}
                aria-controls="main-sidebar"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {sidebarCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </button>
              <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                <Link
                  to="/dashboard"
                  className="block hover:text-chrome-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-chrome-green-300 focus:ring-offset-2 focus:ring-offset-chrome-green-600 rounded"
                  aria-label="Go to Dashboard"
                >
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">Book Master</h1>
                </Link>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <NavigationBar />
            </div>
          </div>
        </div>
      </header>

      {/* Main layout container */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar />

        {/* Mobile sidebar overlay */}
        {!sidebarCollapsed && isMobile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-10 md:hidden"
            onClick={() => setSidebarCollapsed(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSidebarCollapsed(true);
              }
            }}
            aria-hidden="true"
            role="button"
            tabIndex={-1}
          />
        )}

        {/* Main content area */}
        <main
          id="main-content"
          className={`
            flex-1 min-w-0 bg-gray-50 transition-all duration-300
            ${isMobile ? 'px-4 py-4' : isTablet ? 'px-6 py-6' : 'px-8 py-8'}
          `}
          role="main"
        >
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

export default AppLayout;
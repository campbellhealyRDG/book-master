import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppStore } from '../store';
import Sidebar from './Sidebar';

const AppLayout: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  // Handle responsive sidebar collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    // Set initial state based on screen size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-chrome-green-600 text-white shadow-lg z-20 relative">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-md hover:bg-chrome-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-chrome-green-300"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {sidebarCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </button>
              <div className="ml-3">
                <h1 className="text-2xl font-bold">Book Master</h1>
                <p className="text-xs text-chrome-green-100 hidden sm:block">Professional British English Editor</p>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">Welcome to Book Master</p>
              <p className="text-xs text-chrome-green-100">Manuscript editing made simple</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout container */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar />

        {/* Mobile sidebar overlay */}
        {!sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-10 md:hidden"
            onClick={() => setSidebarCollapsed(true)}
            aria-hidden="true"
          />
        )}

        {/* Main content area */}
        <main className="flex-1 min-w-0 bg-gray-50 transition-all duration-300">
          <div className="h-full p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const alert = searchParams.get('alert');
    if (alert === 'no-books') {
      setShowAlert(true);
      // Remove the alert parameter from URL
      setSearchParams({});

      // Auto-hide alert after 5 seconds
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-chrome-green-600 mb-4">
                Book Master Dashboard
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Welcome to your professional British English book editing application.
              </p>

              {/* Alert for no books */}
              {showAlert && (
                <div className="mb-6 max-w-2xl mx-auto">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm fade-in">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-amber-800">No Books Found</h3>
                        <p className="text-sm text-amber-700 mt-1">
                          You don't have any books yet. Get started by creating your first book!
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAlert(false)}
                        className="ml-4 text-amber-600 hover:text-amber-800 transition-colors"
                        aria-label="Dismiss alert"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* My Books Card */}
                <Link
                  to="/books"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg hover:bg-chrome-green-50 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-chrome-green-500 focus:ring-offset-2 group cursor-pointer"
                  aria-label="Navigate to My Books page"
                >
                  <div className="flex items-center mb-3">
                    <svg className="h-8 w-8 text-chrome-green-600 mr-3 group-hover:text-chrome-green-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="text-xl font-semibold text-chrome-green-600 group-hover:text-chrome-green-700 transition-colors">
                      My Books
                    </h3>
                  </div>
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                    View and manage your book collection
                  </p>
                  <div className="mt-4 flex items-center text-chrome-green-600 group-hover:text-chrome-green-700 transition-colors">
                    <span className="text-sm font-medium">Go to Books</span>
                    <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Editor Card */}
                <Link
                  to="/editor"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg hover:bg-chrome-green-50 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-chrome-green-500 focus:ring-offset-2 group cursor-pointer"
                  aria-label="Navigate to Editor page"
                >
                  <div className="flex items-center mb-3">
                    <svg className="h-8 w-8 text-chrome-green-600 mr-3 group-hover:text-chrome-green-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-chrome-green-600 group-hover:text-chrome-green-700 transition-colors">
                      Editor
                    </h3>
                  </div>
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                    Write and edit your manuscripts with British English spell checking
                  </p>
                  <div className="mt-4 flex items-center text-chrome-green-600 group-hover:text-chrome-green-700 transition-colors">
                    <span className="text-sm font-medium">Start Writing</span>
                    <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Dictionary Card */}
                <Link
                  to="/dictionary"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg hover:bg-chrome-green-50 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-chrome-green-500 focus:ring-offset-2 group cursor-pointer"
                  aria-label="Navigate to Dictionary page"
                >
                  <div className="flex items-center mb-3">
                    <svg className="h-8 w-8 text-chrome-green-600 mr-3 group-hover:text-chrome-green-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-chrome-green-600 group-hover:text-chrome-green-700 transition-colors">
                      Dictionary
                    </h3>
                  </div>
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                    Manage your custom British English dictionary
                  </p>
                  <div className="mt-4 flex items-center text-chrome-green-600 group-hover:text-chrome-green-700 transition-colors">
                    <span className="text-sm font-medium">Manage Dictionary</span>
                    <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
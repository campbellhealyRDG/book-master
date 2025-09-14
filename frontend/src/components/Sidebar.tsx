import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { useChapters } from '../hooks/useApi';
import BookCreator from './books/BookCreator';
import ChapterCreator from './chapters/ChapterCreator';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { sidebarCollapsed, selectedBook, setSidebarCollapsed } = useAppStore();
  const sidebarRef = useRef<HTMLElement>(null);
  const [showBookCreator, setShowBookCreator] = useState(false);
  const [showChapterCreator, setShowChapterCreator] = useState(false);

  // Get chapters for the selected book if we're in editor mode
  const { bookId, chapterId } = params;
  const { data: chaptersData } = useChapters(selectedBook?.id || (bookId ? parseInt(bookId) : 0));
  const chapters = chaptersData?.data || [];

  const getNavigationItems = (): NavigationItem[] => [
    {
      name: 'My Books',
      href: '/books',
      description: 'Manage your manuscripts',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: 'Editor',
      href: selectedBook ? `/editor/${selectedBook.id}` : '/editor',
      description: 'Write and edit content',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      name: 'Dictionary',
      href: '/dictionary',
      description: 'Custom word management',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
    },
  ];

  const navigation = getNavigationItems();

  const isActive = (href: string): boolean => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sidebarCollapsed && window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  // Focus management for mobile sidebar
  useEffect(() => {
    if (!sidebarCollapsed && window.innerWidth < 768) {
      // Focus the first navigation item when sidebar opens on mobile
      const firstNavLink = sidebarRef.current?.querySelector('nav a');
      if (firstNavLink instanceof HTMLElement) {
        firstNavLink.focus();
      }
    }
  }, [sidebarCollapsed]);

  return (
    <>
      {/* Sidebar */}
      <aside
        id="main-sidebar"
        ref={sidebarRef}
        className={`
          bg-white shadow-lg border-r border-gray-200 transition-all duration-300 z-15
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          ${sidebarCollapsed ? 'fixed md:relative' : 'fixed md:relative'}
          h-full
        `}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={sidebarCollapsed}
      >
        {/* Navigation */}
        <nav
          className="h-full overflow-y-auto focus-within:outline-none"
          role="navigation"
          aria-label="Primary navigation menu"
        >
          <div className="sidebar-nav-container bg-green-100 px-3 py-0.5 space-y-0.5">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  sidebar-nav-link group flex items-center px-2 py-0.5 rounded text-sm font-medium
                  transition-all duration-200 hover:scale-[1.02] transform focus:outline-none focus:ring-2 focus:ring-chrome-green-500 focus:ring-offset-2
                  ${isActive(item.href)
                    ? 'bg-chrome-green-600 text-white shadow-sm'
                    : 'text-gray-800 hover:bg-white hover:text-gray-900'
                  }
                `}
                title={sidebarCollapsed ? `${item.name}: ${item.description}` : ''}
                aria-label={sidebarCollapsed ? `${item.name}: ${item.description}` : undefined}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                )}
                {!sidebarCollapsed && isActive(item.href) && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="w-2 h-2 bg-chrome-green-500 rounded-full" />
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Current Book Section */}
          {!sidebarCollapsed && selectedBook && (
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <h3
                className="px-2 sm:px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                id="current-book-heading"
              >
                Current Book
              </h3>
              <div
                className="mt-2 px-2 sm:px-3 py-2 bg-gray-50 rounded-lg"
                role="region"
                aria-labelledby="current-book-heading"
              >
                <p className="text-sm font-medium text-gray-900 truncate" title={selectedBook.title}>
                  {selectedBook.title}
                </p>
                <p className="text-xs text-gray-500 truncate" title={`by ${selectedBook.author}`}>
                  by {selectedBook.author}
                </p>
                <div className="mt-2 flex items-center text-xs text-gray-400">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span aria-label={`${chapters.length} chapters in this book`}>
                    {chapters.length} chapters
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Chapter Selection - Show when in editor and book has multiple chapters */}
          {!sidebarCollapsed && selectedBook && chapters.length > 1 && location.pathname.includes('/editor') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3
                className="px-2 sm:px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                id="chapters-heading"
              >
                Chapters
              </h3>
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto" role="group" aria-labelledby="chapters-heading">
                {chapters.map((chapter) => {
                  const isCurrentChapter = chapterId && parseInt(chapterId) === chapter.id;
                  return (
                    <button
                      key={chapter.id}
                      onClick={() => navigate(`/editor/${selectedBook.id}/${chapter.id}`)}
                      className={`w-full text-left px-2 sm:px-3 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-chrome-green-500 focus:ring-offset-2 ${
                        isCurrentChapter
                          ? 'bg-chrome-green-100 text-chrome-green-700 border border-chrome-green-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      title={chapter.title}
                      aria-label={`Go to chapter: ${chapter.title}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{chapter.title}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <span>Ch. {chapter.chapterNumber}</span>
                            <span className="mx-1">•</span>
                            <span>{chapter.wordCount || 0} words</span>
                          </div>
                        </div>
                        {isCurrentChapter && (
                          <div className="ml-2 flex-shrink-0">
                            <div className="w-2 h-2 bg-chrome-green-500 rounded-full" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!sidebarCollapsed && (
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 pb-20 border-t border-gray-200 space-y-2">
              <button
                onClick={() => setShowBookCreator(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-chrome-green-600 text-white text-sm font-medium rounded-lg hover:bg-chrome-green-700 focus:outline-none focus:ring-2 focus:ring-chrome-green-500 focus:ring-offset-2 transition-colors"
                aria-label="Create a new book"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Book
              </button>

              <button
                onClick={() => selectedBook ? setShowChapterCreator(true) : navigate('/books')}
                className={`w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-chrome-green-500 focus:ring-offset-2 transition-colors ${
                  selectedBook
                    ? 'bg-chrome-green-600 text-white hover:bg-chrome-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!selectedBook}
                aria-label={selectedBook ? "Create a new chapter" : "Select a book first to create a chapter"}
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chapter
              </button>
            </div>
          )}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">Book Master v1.0</p>
              <p className="text-xs text-gray-400">Professional Editor</p>
            </div>
          </div>
        )}
      </aside>

      {/* Book Creator Modal */}
      {showBookCreator && (
        <BookCreator
          onClose={() => setShowBookCreator(false)}
          onSuccess={() => {
            setShowBookCreator(false);
            navigate('/books');
          }}
        />
      )}

      {/* Chapter Creator Modal */}
      {showChapterCreator && selectedBook && (
        <ChapterCreator
          bookId={selectedBook.id}
          onClose={() => setShowChapterCreator(false)}
          onSuccess={(newChapter) => {
            setShowChapterCreator(false);
            if (newChapter) {
              // Navigate to the editor with the newly created chapter
              navigate(`/editor/${selectedBook.id}/${newChapter.id}`);
            } else {
              // Fallback to book chapter list
              navigate(`/books/${selectedBook.id}`);
            }
          }}
        />
      )}
    </>
  );
};

export default Sidebar;
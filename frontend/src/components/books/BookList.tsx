import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store';
import { Book } from '../../types';
import { useBooks } from '../../hooks/useApi';
import BookCreator from './BookCreator';
import { useNavigate } from 'react-router-dom';

const BookList: React.FC = () => {
  const navigate = useNavigate();
  const { 
    books, 
    selectedBookId, 
    setBooks, 
    setSelectedBookId,
    setSelectedBook,
    removeBook 
  } = useAppStore();
  
  const [showCreator, setShowCreator] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: booksData, isLoading, error, refetch } = useBooks();

  useEffect(() => {
    if (booksData) {
      setBooks(booksData.data || []);

      // If no books exist and not currently searching, redirect to dashboard with alert
      if (booksData.data && booksData.data.length === 0 && !searchTerm) {
        const timer = setTimeout(() => {
          navigate('/dashboard?alert=no-books');
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [booksData, setBooks, searchTerm, navigate]);

  const handleSelectBook = (book: Book) => {
    setSelectedBookId(book.id);
    setSelectedBook(book);
    navigate(`/books/${book.id}`);
  };

  const handleDeleteBook = async (bookId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      setDeletingBookId(bookId);
      try {
        // API call will be handled by the hook
        removeBook(bookId);
        if (selectedBookId === bookId) {
          setSelectedBookId(null);
          setSelectedBook(null);
        }
        await refetch();
      } catch (error) {
        console.error('Failed to delete book:', error);
        alert('Failed to delete book. Please try again.');
      } finally {
        setDeletingBookId(null);
      }
    }
  };

  const handleEditBook = (book: Book, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/editor/${book.id}`);
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chrome-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error loading books!</strong>
        <span className="block sm:inline"> Please try refreshing the page.</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">My Books</h2>
          <button
            onClick={() => setShowCreator(true)}
            className="chrome-green-btn flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Book
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search books by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-chrome-green-500 focus:ring-2 focus:ring-chrome-green-200"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating a new book'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreator(true)}
                className="chrome-green-btn"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Book
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => handleSelectBook(book)}
              className={`
                relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer
                transform hover:scale-105 border-2
                ${selectedBookId === book.id 
                  ? 'border-chrome-green-500 ring-2 ring-chrome-green-200' 
                  : 'border-transparent hover:border-chrome-green-300'}
              `}
            >
              {/* Book Cover Placeholder */}
              <div className={`
                h-48 rounded-t-lg flex items-center justify-center
                ${selectedBookId === book.id 
                  ? 'bg-gradient-to-br from-chrome-green-400 to-chrome-green-600' 
                  : 'bg-gradient-to-br from-gray-300 to-gray-400'}
              `}>
                <svg
                  className="h-24 w-24 text-white opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>

              {/* Book Details */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 truncate">
                  by {book.author}
                </p>
                
                {/* Book Metadata */}
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {book.chapterCount || 0} chapters
                    </span>
                    <span className="flex items-center">
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {book.wordCount || 0} words
                    </span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Updated {formatDate(book.updatedAt)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => handleEditBook(book, e)}
                    className="flex-1 px-3 py-1 text-sm bg-chrome-green-100 text-chrome-green-700 rounded hover:bg-chrome-green-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleDeleteBook(book.id, e)}
                    disabled={deletingBookId === book.id}
                    className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    {deletingBookId === book.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Selected Indicator */}
              {selectedBookId === book.id && (
                <div className="absolute top-2 right-2 bg-chrome-green-500 text-white rounded-full p-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Book Creator Modal */}
      {showCreator && (
        <BookCreator
          onClose={() => setShowCreator(false)}
          onSuccess={() => {
            setShowCreator(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default BookList;
import React from 'react';
import BookList from '../components/books/BookList';
import ChapterList from '../components/chapters/ChapterList';
import { useParams } from 'react-router-dom';

const Books: React.FC = () => {
  const { bookId } = useParams<{ bookId?: string }>();

  return (
    <div className="flex h-full">
      {/* Books Panel */}
      <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
        <BookList />
      </div>
      
      {/* Chapters Panel */}
      <div className="w-1/2 overflow-y-auto bg-gray-50">
        {bookId ? (
          <ChapterList />
        ) : (
          <div className="p-6">
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg
                className="h-16 w-16 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Book Selected</h3>
              <p className="text-sm text-gray-500">Select a book from the left to view its chapters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Books;
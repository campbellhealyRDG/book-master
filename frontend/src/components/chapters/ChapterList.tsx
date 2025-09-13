import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store';
import { Chapter } from '../../types';
import { useChapters } from '../../hooks/useApi';
import ChapterCreator from './ChapterCreator';
import { useNavigate, useParams } from 'react-router-dom';

const ChapterList: React.FC = () => {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  const bookIdNum = bookId ? parseInt(bookId, 10) : null;
  
  const { 
    chapters,
    selectedChapterId,
    selectedBook,
    setChapters,
    setSelectedChapterId,
    setSelectedChapter,
    removeChapter
  } = useAppStore();
  
  const [showCreator, setShowCreator] = useState(false);
  const [deletingChapterId, setDeletingChapterId] = useState<number | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: chaptersData, isLoading, error, refetch } = useChapters(bookIdNum!);

  useEffect(() => {
    if (chaptersData) {
      setChapters(chaptersData.data || []);
    }
  }, [chaptersData, setChapters]);

  const handleSelectChapter = (chapter: Chapter) => {
    setSelectedChapterId(chapter.id);
    setSelectedChapter(chapter);
    navigate(`/editor/${bookId}/${chapter.id}`);
  };

  const handleDeleteChapter = async (chapterId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      setDeletingChapterId(chapterId);
      try {
        removeChapter(chapterId);
        if (selectedChapterId === chapterId) {
          setSelectedChapterId(null);
          setSelectedChapter(null);
        }
        await refetch();
      } catch (error) {
        console.error('Failed to delete chapter:', error);
        alert('Failed to delete chapter. Please try again.');
      } finally {
        setDeletingChapterId(null);
      }
    }
  };

  const handleToggleExpand = (chapterId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const handleMoveChapter = async (chapterId: number, direction: 'up' | 'down', event: React.MouseEvent) => {
    event.stopPropagation();
    
    const chapterIndex = chapters.findIndex(ch => ch.id === chapterId);
    if (chapterIndex === -1) return;
    
    const newIndex = direction === 'up' ? chapterIndex - 1 : chapterIndex + 1;
    if (newIndex < 0 || newIndex >= chapters.length) return;
    
    // Swap chapter numbers
    const newChapters = [...chapters];
    const temp = newChapters[chapterIndex];
    newChapters[chapterIndex] = newChapters[newIndex];
    newChapters[newIndex] = temp;
    
    // Update chapter numbers
    newChapters[chapterIndex].chapterNumber = chapterIndex + 1;
    newChapters[newIndex].chapterNumber = newIndex + 1;
    
    setChapters(newChapters);
    // In a real app, you'd make an API call to persist this change
  };

  const filteredChapters = chapters.filter(chapter => 
    chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chapter.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (!bookIdNum) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p>Please select a book first to view its chapters.</p>
          <button
            onClick={() => navigate('/books')}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Go to Books
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chrome-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error loading chapters!</strong>
          <span className="block sm:inline"> Please try refreshing the page.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chapters</h2>
            {selectedBook && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedBook.title} by {selectedBook.author}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowCreator(true)}
            className="chrome-green-btn flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chapter
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search chapters by title or content..."
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

      {/* Chapters List */}
      {filteredChapters.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No chapters found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating a new chapter'}
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
                Create Your First Chapter
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredChapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={`
                bg-white rounded-lg shadow hover:shadow-md transition-all duration-200
                border-2 cursor-pointer
                ${selectedChapterId === chapter.id 
                  ? 'border-chrome-green-500 ring-2 ring-chrome-green-200' 
                  : 'border-transparent hover:border-chrome-green-300'}
              `}
            >
              <div
                onClick={() => handleSelectChapter(chapter)}
                className="p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    {/* Chapter Number */}
                    <div className={`
                      flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4
                      ${selectedChapterId === chapter.id 
                        ? 'bg-chrome-green-100 text-chrome-green-700' 
                        : 'bg-gray-100 text-gray-600'}
                    `}>
                      <span className="text-sm font-bold">{chapter.chapterNumber}</span>
                    </div>

                    {/* Chapter Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {chapter.title}
                      </h3>
                      
                      {/* Chapter Metadata */}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {formatWordCount(chapter.wordCount || 0)} words
                        </span>
                        <span className="flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {chapter.characterCount || 0} characters
                        </span>
                      </div>

                      {/* Content Preview (when expanded) */}
                      {expandedChapters.has(chapter.id) && chapter.content && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-600 line-clamp-3">
                          {chapter.content}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Expand/Collapse Button */}
                    {chapter.content && (
                      <button
                        onClick={(e) => handleToggleExpand(chapter.id, e)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={expandedChapters.has(chapter.id) ? 'Collapse' : 'Expand'}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d={expandedChapters.has(chapter.id) 
                                  ? "M5 15l7-7 7 7" 
                                  : "M19 9l-7 7-7-7"} />
                        </svg>
                      </button>
                    )}

                    {/* Move Up Button */}
                    <button
                      onClick={(e) => handleMoveChapter(chapter.id, 'up', e)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>

                    {/* Move Down Button */}
                    <button
                      onClick={(e) => handleMoveChapter(chapter.id, 'down', e)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
                      disabled={index === filteredChapters.length - 1}
                      aria-label="Move down"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteChapter(chapter.id, e)}
                      disabled={deletingChapterId === chapter.id}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      aria-label="Delete"
                    >
                      {deletingChapterId === chapter.id ? (
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Indicator */}
              {selectedChapterId === chapter.id && (
                <div className="h-1 bg-chrome-green-500 rounded-b-lg"></div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chapter Creator Modal */}
      {showCreator && bookIdNum && (
        <ChapterCreator
          bookId={bookIdNum}
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

export default ChapterList;
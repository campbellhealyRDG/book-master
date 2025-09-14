import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TextEditor from '../components/editor/TextEditor';
import UnsavedChangesModal from '../components/editor/UnsavedChangesModal';
import ChapterCreator from '../components/chapters/ChapterCreator';
import { useChapter, useUpdateChapter, useBook, useChapters } from '../hooks/useApi';
import { useAppStore } from '../store';

const Editor: React.FC = () => {
  const { bookId, chapterId } = useParams<{ bookId?: string; chapterId?: string }>();
  const navigate = useNavigate();

  const [content, setContent] = useState('');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showChapterCreator, setShowChapterCreator] = useState(false);

  const unsavedChanges = useAppStore((state) => state.unsavedChanges);
  const setUnsavedChanges = useAppStore((state) => state.setUnsavedChanges);
  const autoSaveEnabled = useAppStore((state) => state.autoSaveEnabled);

  // Fetch chapter data
  const { data: chapter, isLoading: chapterLoading } = useChapter(chapterId ? parseInt(chapterId) : 0);
  const { data: book } = useBook(bookId ? parseInt(bookId) : 0);
  const { data: chaptersData } = useChapters(bookId ? parseInt(bookId) : 0);
  const updateChapterMutation = useUpdateChapter();

  // Update content when chapter data loads
  useEffect(() => {
    if (chapter?.content !== undefined) {
      setContent(chapter.content);
      setUnsavedChanges(false);
    }
  }, [chapter, setUnsavedChanges]);

  // Auto-save functionality
  const performSave = useCallback(async () => {
    if (!chapterId || !unsavedChanges) return;

    setAutoSaving(true);
    try {
      await updateChapterMutation.mutateAsync({
        id: parseInt(chapterId),
        data: { content }
      });
      setLastSaved(new Date());
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save chapter:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [chapterId, content, unsavedChanges, updateChapterMutation, setUnsavedChanges]);

  // Listen for auto-save and manual save events
  useEffect(() => {
    const handleAutoSave = () => {
      if (autoSaveEnabled && unsavedChanges) {
        performSave();
      }
    };

    const handleManualSave = () => {
      performSave();
    };

    document.addEventListener('auto-save', handleAutoSave);
    document.addEventListener('manual-save', handleManualSave);

    return () => {
      document.removeEventListener('auto-save', handleAutoSave);
      document.removeEventListener('manual-save', handleManualSave);
    };
  }, [performSave, autoSaveEnabled, unsavedChanges]);

  // Navigation protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    // Mark as having unsaved changes whenever content changes
    if (newContent !== chapter?.content) {
      setUnsavedChanges(true);
    }
  }, [chapter?.content, setUnsavedChanges]);

  // Handle navigation with unsaved changes check
  const handleNavigation = useCallback((path: string) => {
    if (unsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedModal(true);
    } else {
      navigate(path);
    }
  }, [unsavedChanges, navigate]);

  // Handle unsaved changes modal actions
  const handleSaveAndContinue = async () => {
    await performSave();
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  const handleDontSave = () => {
    setUnsavedChanges(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  const handleCancel = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  // Show loading state
  if (chapterLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chrome-green-600"></div>
      </div>
    );
  }

  // Handle different editor states
  const chapters = chaptersData?.data || [];
  const hasChapters = chapters.length > 0;

  // If no chapter is selected but we have a book
  if (!chapterId && bookId && book) {
    // Case 1: Book has no chapters - show create chapter modal
    if (!hasChapters) {
      return (
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h1 className="text-2xl font-bold text-chrome-green-600">Editor - {book.title}</h1>
            <p className="text-gray-600 mt-1">
              This book has no chapters yet. Create your first chapter to start writing.
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No chapters yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first chapter for "{book.title}" to start writing
              </p>
              <button
                onClick={() => setShowChapterCreator(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-chrome-green-600 hover:bg-chrome-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chrome-green-500"
              >
                Create First Chapter
              </button>
            </div>
          </div>

          {/* Chapter Creator Modal */}
          {showChapterCreator && (
            <ChapterCreator
              bookId={parseInt(bookId)}
              onClose={() => setShowChapterCreator(false)}
              onSuccess={(newChapter) => {
                setShowChapterCreator(false);
                if (newChapter) {
                  handleNavigation(`/editor/${bookId}/${newChapter.id}`);
                }
              }}
            />
          )}
        </div>
      );
    }

    // Case 2: Book has chapters - show chapter selection
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-chrome-green-600">Editor - {book.title}</h1>
          <p className="text-gray-600 mt-1">
            Select a chapter to edit or create a new one
          </p>
        </div>
        <div className="flex-1 p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Choose a Chapter</h2>
                <button
                  onClick={() => setShowChapterCreator(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-chrome-green-600 hover:bg-chrome-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chrome-green-500"
                >
                  New Chapter
                </button>
              </div>

              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    onClick={() => handleNavigation(`/editor/${bookId}/${chapter.id}`)}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-chrome-green-50 hover:border-chrome-green-300 cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500 space-x-4">
                        <span>Chapter {chapter.chapterNumber}</span>
                        <span>•</span>
                        <span>{chapter.wordCount || 0} words</span>
                        <span>•</span>
                        <span>Updated {new Date(chapter.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Creator Modal */}
        {showChapterCreator && (
          <ChapterCreator
            bookId={parseInt(bookId)}
            onClose={() => setShowChapterCreator(false)}
            onSuccess={(newChapter) => {
              setShowChapterCreator(false);
              if (newChapter) {
                handleNavigation(`/editor/${bookId}/${newChapter.id}`);
              }
            }}
          />
        )}
      </div>
    );
  }

  // Case 3: No book or chapter selected at all
  if (!chapterId || !chapter) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-chrome-green-600">Editor</h1>
          <p className="text-gray-600 mt-1">
            Write and edit your manuscripts with professional British English tools
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No chapter selected</h3>
            <p className="text-gray-500 mb-6">
              Select a book and chapter to start writing
            </p>
            <button
              onClick={() => handleNavigation('/books')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-chrome-green-600 hover:bg-chrome-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chrome-green-500"
            >
              Go to Books
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-chrome-green-600">
              {book?.title} - {chapter.title}
            </h1>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span>Chapter {chapter.chapterNumber}</span>
              {lastSaved && (
                <span>
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {autoSaving && (
                <span className="text-chrome-green-600">Saving...</span>
              )}
              {unsavedChanges && !autoSaving && (
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600">Unsaved changes</span>
                  <button
                    onClick={() => performSave()}
                    className="px-2 py-1 text-xs bg-chrome-green-600 text-white rounded hover:bg-chrome-green-700 transition-colors"
                    title="Save now"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => handleNavigation('/books')}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Books
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-white">
        <TextEditor
          content={content}
          onChange={handleContentChange}
          autoSave={true}
          autoSaveInterval={30000}
        />
      </div>

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <UnsavedChangesModal
          onSave={handleSaveAndContinue}
          onDontSave={handleDontSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default Editor;
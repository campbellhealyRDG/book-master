import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TextEditor from '../components/editor/TextEditor';
import UnsavedChangesModal from '../components/editor/UnsavedChangesModal';
import { useChapter, useUpdateChapter, useBook } from '../hooks/useApi';
import { useAppStore } from '../store';

const Editor: React.FC = () => {
  const { bookId, chapterId } = useParams<{ bookId?: string; chapterId?: string }>();
  const navigate = useNavigate();

  const [content, setContent] = useState('');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);

  const unsavedChanges = useAppStore((state) => state.unsavedChanges);
  const setUnsavedChanges = useAppStore((state) => state.setUnsavedChanges);
  const autoSaveEnabled = useAppStore((state) => state.autoSaveEnabled);

  // Fetch chapter data
  const { data: chapter, isLoading: chapterLoading } = useChapter(chapterId ? parseInt(chapterId) : 0);
  const { data: book } = useBook(bookId ? parseInt(bookId) : 0);
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
  }, []);

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

  // Show empty state if no chapter selected
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
              onClick={() => navigate('/books')}
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
                <span className="text-orange-600">Unsaved changes</span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/books')}
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
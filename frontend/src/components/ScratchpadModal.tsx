import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';

interface ScratchpadModalProps {
  onClose: () => void;
}

const ScratchpadModal: React.FC<ScratchpadModalProps> = ({ onClose }) => {
  const { scratchpad, setScratchpad } = useAppStore();
  const [content, setContent] = useState(scratchpad?.content || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [content, hasUnsavedChanges]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    setScratchpad({
      id: scratchpad?.id || 1,
      content,
      createdAt: scratchpad?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setHasUnsavedChanges(false);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
      setContent('');
      setScratchpad({
        id: scratchpad?.id || 1,
        content: '',
        createdAt: scratchpad?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setHasUnsavedChanges(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Do you want to save before closing?')) {
        handleSave();
      }
    }
    onClose();
  };

  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
  const charCount = content.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Scratchpad Notes</h2>
            <p className="text-sm text-gray-600 mt-1">
              Persistent notepad for quick ideas and notes
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            aria-label="Close scratchpad"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 flex flex-col min-h-0">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your notes here... This content will be saved automatically and persist across sessions."
            className="w-full h-full resize-none border border-gray-300 rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-chrome-green-200 focus:border-chrome-green-500"
            style={{ minHeight: '300px' }}
            autoFocus
          />

          {/* Status Bar */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
              {hasUnsavedChanges && (
                <>
                  <span>•</span>
                  <span className="text-amber-600 font-medium">Unsaved changes</span>
                </>
              )}
            </div>
            <div className="text-xs">
              Press Ctrl+S to save • Esc to close
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="px-4 py-2 bg-chrome-green-600 text-white rounded-lg hover:bg-chrome-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Save Notes
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Clear All
            </button>
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScratchpadModal;
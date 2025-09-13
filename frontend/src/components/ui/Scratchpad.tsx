import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store';

interface ScratchpadProps {
  isVisible: boolean;
  onClose: () => void;
}

const Scratchpad: React.FC<ScratchpadProps> = ({ isVisible, onClose }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get scratchpad state from store
  const scratchpad = useAppStore((state) => state.scratchpad);
  const setScratchpad = useAppStore((state) => state.setScratchpad);
  const updateScratchpadContent = useAppStore((state) => state.updateScratchpadContent);
  const selectedFont = useAppStore((state) => state.selectedFont);

  // Local state for editing
  const [localContent, setLocalContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Initialize content when modal opens
  useEffect(() => {
    if (isVisible) {
      const currentContent = scratchpad?.content || '';
      setLocalContent(currentContent);
      setHasUnsavedChanges(false);
      updateCounts(currentContent);

      // Focus textarea after modal opens
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isVisible, scratchpad?.content]);

  // Calculate word and character counts
  const updateCounts = useCallback((text: string) => {
    setCharCount(text.length);
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    setWordCount(words);
  }, []);

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    setLocalContent(newContent);
    setHasUnsavedChanges(newContent !== (scratchpad?.content || ''));
    updateCounts(newContent);
  }, [scratchpad?.content, updateCounts]);

  // Save scratchpad content
  const handleSave = useCallback(() => {
    if (!scratchpad) {
      // Create new scratchpad
      setScratchpad({
        id: 1, // Global scratchpad always has ID 1
        content: localContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Update existing scratchpad
      updateScratchpadContent(localContent);
      setScratchpad({
        ...scratchpad,
        content: localContent,
        updatedAt: new Date().toISOString()
      });
    }

    setHasUnsavedChanges(false);
  }, [localContent, scratchpad, setScratchpad, updateScratchpadContent]);

  // Cancel changes and revert
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );
      if (!confirmDiscard) {
        return;
      }
    }

    const originalContent = scratchpad?.content || '';
    setLocalContent(originalContent);
    setHasUnsavedChanges(false);
    updateCounts(originalContent);
    onClose();
  }, [hasUnsavedChanges, scratchpad?.content, onClose, updateCounts]);

  // Handle save and close
  const handleSaveAndClose = useCallback(() => {
    handleSave();
    onClose();
  }, [handleSave, onClose]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'enter':
          e.preventDefault();
          handleSaveAndClose();
          break;
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleSaveAndClose, handleCancel]);

  // Get current font family
  const currentFontFamily = selectedFont?.fallback || '"Georgia", "Times New Roman", serif';

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Scratchpad</h2>
            <span className="text-sm text-gray-500">
              Global notes that persist across all books and chapters
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600 font-medium">
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
            {scratchpad?.updatedAt && (
              <span>
                Last saved: {new Date(scratchpad.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Ctrl+S to save • Ctrl+Enter to save and close • Esc to cancel
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-96 resize-none border border-gray-300 rounded-lg p-4 text-base leading-relaxed outline-none focus:ring-2 focus:ring-chrome-green-500 focus:border-chrome-green-500 transition-colors"
            placeholder="Use this space for notes, ideas, character sketches, plot outlines, or any other writing-related thoughts. This content is global and will be available across all your books and chapters."
            style={{
              fontFamily: currentFontFamily,
              fontSize: '16px',
              lineHeight: '1.6'
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {hasUnsavedChanges ? (
              <span className="text-orange-600">You have unsaved changes</span>
            ) : (
              <span>All changes saved</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {hasUnsavedChanges ? 'Cancel' : 'Close'}
            </button>
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="px-4 py-2 text-white bg-chrome-green-600 rounded-md hover:bg-chrome-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleSaveAndClose}
              className="px-4 py-2 text-white bg-chrome-green-600 rounded-md hover:bg-chrome-green-700 transition-colors"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scratchpad;
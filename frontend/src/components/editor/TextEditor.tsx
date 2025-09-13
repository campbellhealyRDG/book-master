import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store';
import { spellCheckService, SpellCheckSuggestion } from '../../services/spellChecker';
import { paginationService } from '../../services/paginationService';
import DictionaryManager from '../dictionary/DictionaryManager';

interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

const TextEditor: React.FC<TextEditorProps> = ({
  content,
  onChange,
  autoSave = true,
  autoSaveInterval = 30000 // 30 seconds
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [formatState, setFormatState] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false
  });

  // Spell checking state
  const [spellCheckInitialized, setSpellCheckInitialized] = useState(false);
  const [misspellings, setMisspellings] = useState<SpellCheckSuggestion[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    word: string;
    suggestions: string[];
    position: { start: number; end: number };
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Dictionary manager state
  const [showDictionaryManager, setShowDictionaryManager] = useState(false);

  // Pagination state
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [paginationEnabled, setPaginationEnabled] = useState(false);

  const setUnsavedChanges = useAppStore((state) => state.setUnsavedChanges);
  const autoSaveEnabled = useAppStore((state) => state.autoSaveEnabled);
  const spellCheckEnabled = useAppStore((state) => state.spellCheckEnabled);

  // Pagination logic
  const documentPages = useMemo(() => {
    if (!paginationEnabled) return null;
    return paginationService.paginateDocument(content);
  }, [content, paginationEnabled]);

  const currentPage = useMemo(() => {
    if (!documentPages) return null;
    return documentPages.find(page => page.pageNumber === currentPageNumber) || documentPages[0];
  }, [documentPages, currentPageNumber]);

  const documentStats = useMemo(() => {
    if (!documentPages) return null;
    return paginationService.getDocumentStats(documentPages);
  }, [documentPages]);

  // Undo/Redo state
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const maxHistorySize = 50;

  // Calculate word and character counts
  const updateCounts = useCallback((text: string) => {
    setCharCount(text.length);
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    setWordCount(words);
  }, []);

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    if (paginationEnabled && currentPage) {
      // In paginated mode, update the specific page content
      const updatedPages = paginationService.updatePage(documentPages || [], currentPageNumber, newContent);
      const fullContent = paginationService.reconstructDocument(updatedPages);

      onChange(fullContent);
      setUnsavedChanges(true);
      updateCounts(fullContent);

      // Add to history for undo/redo
      const newHistory = [...history.slice(0, historyIndex + 1), fullContent];
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      } else {
        setHistoryIndex(historyIndex + 1);
      }
      setHistory(newHistory);
    } else {
      // Non-paginated mode - normal behavior
      onChange(newContent);
      setUnsavedChanges(true);
      updateCounts(newContent);

      // Add to history for undo/redo
      const newHistory = [...history.slice(0, historyIndex + 1), newContent];
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      } else {
        setHistoryIndex(historyIndex + 1);
      }
      setHistory(newHistory);
    }
  }, [onChange, setUnsavedChanges, updateCounts, history, historyIndex, paginationEnabled, currentPage, documentPages, currentPageNumber]);

  // Undo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevContent = history[newIndex];
      setHistoryIndex(newIndex);
      onChange(prevContent);
      updateCounts(prevContent);
    }
  }, [historyIndex, history, onChange, updateCounts]);

  // Redo functionality
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextContent = history[newIndex];
      setHistoryIndex(newIndex);
      onChange(nextContent);
      updateCounts(nextContent);
    }
  }, [historyIndex, history, onChange, updateCounts]);

  // Format text with bold, italic, or underline
  const formatText = useCallback((format: keyof FormatState) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    if (selectedText === '') return;

    let formattedText = '';
    const isFormatted = formatState[format];

    switch (format) {
      case 'bold':
        formattedText = isFormatted
          ? selectedText.replace(/\*\*(.*?)\*\*/g, '$1')
          : `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = isFormatted
          ? selectedText.replace(/\*(.*?)\*/g, '$1')
          : `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = isFormatted
          ? selectedText.replace(/<u>(.*?)<\/u>/g, '$1')
          : `<u>${selectedText}</u>`;
        break;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    handleContentChange(newContent);

    // Update format state
    setFormatState(prev => ({ ...prev, [format]: !isFormatted }));

    // Restore cursor position
    setTimeout(() => {
      textarea.setSelectionRange(
        start,
        start + formattedText.length
      );
      textarea.focus();
    }, 0);
  }, [content, formatState, handleContentChange]);

  // Pagination navigation
  const navigateToPreviousPage = useCallback(() => {
    if (currentPageNumber > 1) {
      setCurrentPageNumber(currentPageNumber - 1);
    }
  }, [currentPageNumber]);

  const navigateToNextPage = useCallback(() => {
    if (documentStats && currentPageNumber < documentStats.totalPages) {
      setCurrentPageNumber(currentPageNumber + 1);
    }
  }, [currentPageNumber, documentStats]);

  const navigateToFirstPage = useCallback(() => {
    setCurrentPageNumber(1);
  }, []);

  const navigateToLastPage = useCallback(() => {
    if (documentStats) {
      setCurrentPageNumber(documentStats.totalPages);
    }
  }, [documentStats]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 's':
          e.preventDefault();
          // Manual save will be handled by parent component
          const saveEvent = new CustomEvent('manual-save');
          document.dispatchEvent(saveEvent);
          break;
        case 'home':
          if (paginationEnabled) {
            e.preventDefault();
            navigateToFirstPage();
          }
          break;
        case 'end':
          if (paginationEnabled) {
            e.preventDefault();
            navigateToLastPage();
          }
          break;
      }
    } else {
      // Page navigation shortcuts
      switch (e.key) {
        case 'PageUp':
          if (paginationEnabled) {
            e.preventDefault();
            navigateToPreviousPage();
          }
          break;
        case 'PageDown':
          if (paginationEnabled) {
            e.preventDefault();
            navigateToNextPage();
          }
          break;
      }
    }
  }, [formatText, undo, redo, paginationEnabled, navigateToPreviousPage, navigateToNextPage, navigateToFirstPage, navigateToLastPage]);

  // Update selection format state
  const updateFormatState = useCallback(() => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    setFormatState({
      bold: /\*\*.*?\*\*/g.test(selectedText),
      italic: /\*.*?\*/g.test(selectedText),
      underline: /<u>.*?<\/u>/g.test(selectedText)
    });
  }, [content]);

  // Initialize spell checker
  useEffect(() => {
    const initSpellChecker = async () => {
      if (!spellCheckInitialized) {
        const initialized = await spellCheckService.initialize();
        setSpellCheckInitialized(initialized);
      }
    };

    initSpellChecker();
  }, [spellCheckInitialized]);

  // Perform spell checking
  const performSpellCheck = useCallback((text: string) => {
    if (spellCheckEnabled && spellCheckInitialized) {
      const result = spellCheckService.checkText(text);
      setMisspellings(result.misspellings);
    } else {
      setMisspellings([]);
    }
  }, [spellCheckEnabled, spellCheckInitialized]);

  // Initialize counts on mount
  useEffect(() => {
    updateCounts(content);
    performSpellCheck(content);
  }, [content, updateCounts, performSpellCheck]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !autoSaveEnabled) return;

    const autoSaveTimer = setInterval(() => {
      const autoSaveEvent = new CustomEvent('auto-save');
      document.dispatchEvent(autoSaveEvent);
    }, autoSaveInterval);

    return () => clearInterval(autoSaveTimer);
  }, [autoSave, autoSaveEnabled, autoSaveInterval]);

  // Handle right-click for spell check context menu
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!spellCheckEnabled || !spellCheckInitialized) return;

    e.preventDefault();

    const textarea = textAreaRef.current;
    if (!textarea) return;

    const rect = textarea.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Find clicked position in text
    const clickPosition = textarea.selectionStart;

    // Find misspelling at click position
    const misspelling = misspellings.find(m =>
      clickPosition >= m.position.start && clickPosition <= m.position.end
    );

    if (misspelling) {
      setContextMenu({
        show: true,
        x: x - rect.left,
        y: y - rect.top,
        word: misspelling.word,
        suggestions: misspelling.suggestions,
        position: misspelling.position
      });
    } else {
      setContextMenu(null);
    }
  }, [spellCheckEnabled, spellCheckInitialized, misspellings]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    if (!contextMenu) return;

    const textarea = textAreaRef.current;
    if (!textarea) return;

    const newContent =
      content.substring(0, contextMenu.position.start) +
      suggestion +
      content.substring(contextMenu.position.end);

    handleContentChange(newContent);
    setContextMenu(null);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = contextMenu.position.start + suggestion.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [contextMenu, content, handleContentChange]);

  // Handle ignore word
  const handleIgnoreWord = useCallback(() => {
    if (!contextMenu) return;

    spellCheckService.addToIgnoreList(contextMenu.word);
    performSpellCheck(content);
    setContextMenu(null);
  }, [contextMenu, content, performSpellCheck]);

  // Handle add to dictionary
  const handleAddToDictionary = useCallback(() => {
    if (!contextMenu) return;

    spellCheckService.addToCustomDictionary(contextMenu.word);
    performSpellCheck(content);
    setContextMenu(null);
  }, [contextMenu, content, performSpellCheck]);

  // Handle dictionary manager close
  const handleDictionaryManagerClose = useCallback(async () => {
    setShowDictionaryManager(false);
    // Refresh spell checker with updated server dictionary terms
    await spellCheckService.refreshCustomDictionary();
    performSpellCheck(content);
  }, [content, performSpellCheck]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu?.show) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);


  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          {/* Format buttons */}
          <button
            onClick={() => formatText('bold')}
            className={`p-2 rounded hover:bg-gray-100 ${
              formatState.bold ? 'bg-chrome-green-100 text-chrome-green-700' : 'text-gray-600'
            }`}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => formatText('italic')}
            className={`p-2 rounded hover:bg-gray-100 ${
              formatState.italic ? 'bg-chrome-green-100 text-chrome-green-700' : 'text-gray-600'
            }`}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => formatText('underline')}
            className={`p-2 rounded hover:bg-gray-100 ${
              formatState.underline ? 'bg-chrome-green-100 text-chrome-green-700' : 'text-gray-600'
            }`}
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </button>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          {/* Spell check toggle */}
          <button
            onClick={() => useAppStore.setState({ spellCheckEnabled: !spellCheckEnabled })}
            className={`p-2 rounded hover:bg-gray-100 ${
              spellCheckEnabled ? 'bg-chrome-green-100 text-chrome-green-700' : 'text-gray-600'
            }`}
            title={`Spell checking ${spellCheckEnabled ? 'enabled' : 'disabled'}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* Dictionary manager button */}
          <button
            onClick={() => setShowDictionaryManager(true)}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            title="Manage custom dictionary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </button>

          {/* Pagination toggle */}
          <button
            onClick={() => setPaginationEnabled(!paginationEnabled)}
            className={`p-2 rounded hover:bg-gray-100 ${
              paginationEnabled ? 'bg-chrome-green-100 text-chrome-green-700' : 'text-gray-600'
            }`}
            title={`Pagination ${paginationEnabled ? 'enabled' : 'disabled'}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </button>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          {/* Undo/Redo buttons */}
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
        </div>

        {/* Word and character count */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {paginationEnabled && currentPage && documentStats ? (
            <>
              <span>{currentPage.wordCount} words (page)</span>
              <span>{currentPage.characterCount} characters (page)</span>
              <span>{documentStats.totalWords} total words</span>
              <span>{documentStats.totalCharacters} total characters</span>
            </>
          ) : (
            <>
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
            </>
          )}
          {spellCheckEnabled && (
            <span className={misspellings.length > 0 ? 'text-red-600' : 'text-chrome-green-600'}>
              {misspellings.length === 0 ? 'No spelling errors' : `${misspellings.length} spelling error${misspellings.length > 1 ? 's' : ''}`}
            </span>
          )}
          {spellCheckEnabled && !spellCheckInitialized && (
            <span className="text-orange-600">Initialising spell checker...</span>
          )}
        </div>
      </div>

      {/* Pagination controls */}
      {paginationEnabled && documentStats && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={navigateToFirstPage}
              disabled={currentPageNumber === 1}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
              title="First Page (Ctrl+Home)"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={navigateToPreviousPage}
              disabled={currentPageNumber === 1}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
              title="Previous Page (Page Up)"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="px-3 py-1 bg-white rounded border text-sm font-medium">
              Page {currentPageNumber} of {documentStats.totalPages}
            </span>
            <button
              onClick={navigateToNextPage}
              disabled={currentPageNumber === documentStats.totalPages}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
              title="Next Page (Page Down)"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              onClick={navigateToLastPage}
              disabled={currentPageNumber === documentStats.totalPages}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
              title="Last Page (Ctrl+End)"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Total: {documentStats.totalWords} words, {documentStats.totalPages} pages
          </div>
        </div>
      )}

      {/* Text area with spell check highlighting */}
      <div className="flex-1 p-4 relative">
        {/* Spell check overlay */}
        {spellCheckEnabled && misspellings.length > 0 && (
          <div className="absolute inset-4 pointer-events-none">
            <div
              className="w-full h-full text-base leading-relaxed font-serif whitespace-pre-wrap break-words"
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                fontFamily: '"Georgia", "Times New Roman", serif',
                color: 'transparent',
                minHeight: '600px'
              }}
            >
              {(paginationEnabled && currentPage ? currentPage.content : content).split('').map((char, index) => {
                const isMisspelled = misspellings.some(m =>
                  index >= m.position.start && index < m.position.end
                );
                return (
                  <span
                    key={index}
                    className={isMisspelled ? 'border-b-2 border-red-500 border-dotted' : ''}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <textarea
          ref={textAreaRef}
          value={paginationEnabled && currentPage ? currentPage.content : content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onSelect={updateFormatState}
          onClick={updateFormatState}
          onContextMenu={handleContextMenu}
          spellCheck={false} // We handle spell checking ourselves
          className="w-full h-full resize-none border-none outline-none text-base leading-relaxed font-serif relative z-10 bg-transparent"
          placeholder={paginationEnabled ? `Page ${currentPageNumber} content...` : "Begin writing your chapter content here..."}
          style={{
            minHeight: '600px',
            fontSize: '16px',
            lineHeight: '1.6',
            fontFamily: '"Georgia", "Times New Roman", serif'
          }}
        />

        {/* Context Menu */}
        {contextMenu && (
          <div
            ref={contextMenuRef}
            className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 min-w-48"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {contextMenu.suggestions.length > 0 && (
              <>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Suggestions
                </div>
                {contextMenu.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
                <div className="border-t border-gray-200 my-1"></div>
              </>
            )}

            <button
              onClick={handleIgnoreWord}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-700"
            >
              Ignore "{contextMenu.word}"
            </button>

            <button
              onClick={handleAddToDictionary}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-700"
            >
              Add to dictionary
            </button>

            {/* US to UK conversion option */}
            {(() => {
              const ukVersion = spellCheckService.convertUSToUK(contextMenu.word);
              return ukVersion !== contextMenu.word ? (
                <>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => handleSuggestionSelect(ukVersion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-blue-600"
                  >
                    Use British spelling: "{ukVersion}"
                  </button>
                </>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Dictionary Manager */}
      <DictionaryManager
        isVisible={showDictionaryManager}
        onClose={handleDictionaryManagerClose}
      />
    </div>
  );
};

export default TextEditor;
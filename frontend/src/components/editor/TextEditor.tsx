import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store';

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

  const setUnsavedChanges = useAppStore((state) => state.setUnsavedChanges);
  const autoSaveEnabled = useAppStore((state) => state.autoSaveEnabled);
  const spellCheckEnabled = useAppStore((state) => state.spellCheckEnabled);

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
  }, [onChange, setUnsavedChanges, updateCounts, history, historyIndex]);

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
      }
    }
  }, [formatText, undo, redo]);

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

  // Initialize counts on mount
  useEffect(() => {
    updateCounts(content);
  }, [content, updateCounts]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !autoSaveEnabled) return;

    const autoSaveTimer = setInterval(() => {
      const autoSaveEvent = new CustomEvent('auto-save');
      document.dispatchEvent(autoSaveEvent);
    }, autoSaveInterval);

    return () => clearInterval(autoSaveTimer);
  }, [autoSave, autoSaveEnabled, autoSaveInterval]);

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
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
      </div>

      {/* Text area */}
      <div className="flex-1 p-4">
        <textarea
          ref={textAreaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onSelect={updateFormatState}
          onClick={updateFormatState}
          spellCheck={spellCheckEnabled}
          className="w-full h-full resize-none border-none outline-none text-base leading-relaxed font-serif"
          placeholder="Begin writing your chapter content here..."
          style={{
            minHeight: '600px',
            fontSize: '16px',
            lineHeight: '1.6',
            fontFamily: '"Georgia", "Times New Roman", serif'
          }}
        />
      </div>
    </div>
  );
};

export default TextEditor;
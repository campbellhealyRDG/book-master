import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../../store';
import MarkdownPreview from './MarkdownPreview';
import './EnhancedTextEditor.css';

export type EditorMode = 'edit' | 'preview' | 'split';

interface EnhancedTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

interface EditorToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  hasContent: boolean;
  wordCount: number;
  characterCount: number;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  mode,
  onModeChange,
  hasContent,
  wordCount,
  characterCount
}) => {
  const modeButtons = [
    { mode: 'edit' as EditorMode, label: 'Edit', icon: '✏️', shortcut: 'Ctrl+M' },
    { mode: 'preview' as EditorMode, label: 'Preview', icon: '👁️', shortcut: 'Ctrl+M' },
    { mode: 'split' as EditorMode, label: 'Split', icon: '⟷', shortcut: 'Ctrl+M' }
  ];

  return (
    <div className="editor-toolbar">
      <div className="toolbar-section">
        <div className="mode-switcher">
          {modeButtons.map(({ mode: buttonMode, label, icon }) => (
            <button
              key={buttonMode}
              onClick={() => onModeChange(buttonMode)}
              className={`mode-button ${mode === buttonMode ? 'active' : ''}`}
              title={`${label} mode`}
              disabled={buttonMode === 'preview' && !hasContent}
            >
              <span className="mode-icon">{icon}</span>
              <span className="mode-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <div className="editor-stats">
          <span className="stat-item">
            <span className="stat-value">{wordCount.toLocaleString('en-GB')}</span>
            <span className="stat-label">words</span>
          </span>
          <span className="stat-divider">•</span>
          <span className="stat-item">
            <span className="stat-value">{characterCount.toLocaleString('en-GB')}</span>
            <span className="stat-label">characters</span>
          </span>
        </div>
      </div>

      <div className="toolbar-section">
        <div className="keyboard-shortcut-hint">
          <span className="shortcut-text">Press <kbd>Ctrl+M</kbd> to cycle modes</span>
        </div>
      </div>
    </div>
  );
};

const EnhancedTextEditor: React.FC<EnhancedTextEditorProps> = ({
  content,
  onChange,
  onSave,
  placeholder = "Start writing your content here...\n\nYou can use markdown syntax for formatting:\n• # for headings\n• **bold** for bold text\n• *italic* for italic text\n• - for bullet points\n• [link](url) for links",
  disabled = false,
  autoFocus = false,
  className = ''
}) => {
  const { selectedFont } = useAppStore();
  const [mode, setMode] = useState<EditorMode>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    const characters = content.length;
    return { words, characters };
  }, [content]);

  // Handle mode cycling with Ctrl+M
  const cycleMode = useCallback(() => {
    const modes: EditorMode[] = ['edit', 'preview', 'split'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;

    // Skip preview mode if there's no content
    if (modes[nextIndex] === 'preview' && !content.trim()) {
      const afterNext = (nextIndex + 1) % modes.length;
      setMode(modes[afterNext]);
    } else {
      setMode(modes[nextIndex]);
    }
  }, [mode, content]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+M to cycle modes
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        cycleMode();
        return;
      }

      // Ctrl+S to save (if save handler provided)
      if (e.ctrlKey && e.key === 's' && onSave) {
        e.preventDefault();
        onSave();
        return;
      }

      // Handle formatting shortcuts only in edit mode
      if (mode !== 'edit' || !textareaRef.current) return;

      const textarea = textareaRef.current;

      // Ctrl+B for bold
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        insertFormatting('**', '**', 'bold text');
        return;
      }

      // Ctrl+I for italic
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        insertFormatting('*', '*', 'italic text');
        return;
      }

      // Ctrl+U for underline (markdown doesn't have underline, so we'll use <u> tags)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        insertFormatting('<u>', '</u>', 'underlined text');
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode, cycleMode, onSave]);

  // Insert formatting around selected text
  const insertFormatting = useCallback((prefix: string, suffix: string, defaultText: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToWrap = selectedText || defaultText;
    const newText = prefix + textToWrap + suffix;

    const newContent = content.substring(0, start) + newText + content.substring(end);
    onChange(newContent);

    // Restore selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + textToWrap.length
      );
    }, 0);
  }, [content, onChange]);

  // Editor font styling
  const editorStyle = useMemo(() => ({
    fontFamily: selectedFont?.fallback || '"Georgia", "Times New Roman", serif',
    fontSize: '16px',
    lineHeight: '1.6'
  }), [selectedFont]);

  // Focus textarea when switching to edit mode
  useEffect(() => {
    if (mode === 'edit' && textareaRef.current && autoFocus) {
      textareaRef.current.focus();
    }
  }, [mode, autoFocus]);

  const hasContent = content.trim().length > 0;

  return (
    <div className={`enhanced-text-editor ${className}`}>
      <EditorToolbar
        mode={mode}
        onModeChange={setMode}
        hasContent={hasContent}
        wordCount={stats.words}
        characterCount={stats.characters}
      />

      <div className={`editor-content mode-${mode}`}>
        {/* Edit Panel */}
        <div className={`edit-panel ${mode === 'preview' ? 'hidden' : ''}`}>
          <div className="edit-container">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="editor-textarea"
              style={editorStyle}
              spellCheck={true}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              data-gramm="false" // Disable Grammarly
            />

            <div className="editor-overlay">
              {/* Formatting buttons for mobile */}
              <div className="mobile-formatting-buttons">
                <button
                  onClick={() => insertFormatting('**', '**', 'bold text')}
                  className="format-button"
                  title="Bold (Ctrl+B)"
                  disabled={disabled}
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={() => insertFormatting('*', '*', 'italic text')}
                  className="format-button"
                  title="Italic (Ctrl+I)"
                  disabled={disabled}
                >
                  <em>I</em>
                </button>
                <button
                  onClick={() => insertFormatting('# ', '', 'Heading')}
                  className="format-button"
                  title="Heading"
                  disabled={disabled}
                >
                  H
                </button>
                <button
                  onClick={() => insertFormatting('- ', '', 'List item')}
                  className="format-button"
                  title="List"
                  disabled={disabled}
                >
                  •
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className={`preview-panel ${mode === 'edit' ? 'hidden' : ''}`}>
          <MarkdownPreview
            content={content}
            className="editor-markdown-preview"
          />
        </div>

        {/* Resize Handle for Split Mode */}
        {mode === 'split' && (
          <div className="resize-handle">
            <div className="resize-handle-line"></div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="editor-status-bar">
        <div className="status-left">
          <span className="current-mode">
            {mode === 'edit' && 'Editing'}
            {mode === 'preview' && 'Previewing'}
            {mode === 'split' && 'Split View'}
          </span>
          {hasContent && (
            <>
              <span className="status-divider">•</span>
              <span className="content-status">
                {stats.words > 0 ? `${stats.words} words` : 'No content'}
              </span>
            </>
          )}
        </div>

        <div className="status-right">
          <span className="keyboard-hint">
            Ctrl+M to switch modes • Ctrl+B/I/U for formatting
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTextEditor;
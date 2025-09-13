import React, { useMemo, useEffect, useRef } from 'react';
import { markdownService, MarkdownParseResult, MarkdownStats } from '../../services/markdownService';
import { useAppStore } from '../../store';
import './MarkdownPreview.css';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

interface MarkdownStatsProps {
  stats: MarkdownStats;
}

const MarkdownStatsDisplay: React.FC<MarkdownStatsProps> = ({ stats }) => {
  return (
    <div className="markdown-stats">
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Words</span>
          <span className="stat-value">{stats.words.toLocaleString('en-GB')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Characters</span>
          <span className="stat-value">{stats.characters.toLocaleString('en-GB')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Paragraphs</span>
          <span className="stat-value">{stats.paragraphs}</span>
        </div>
        {stats.headers > 0 && (
          <div className="stat-item">
            <span className="stat-label">Headers</span>
            <span className="stat-value">{stats.headers}</span>
          </div>
        )}
        {stats.lists > 0 && (
          <div className="stat-item">
            <span className="stat-label">Lists</span>
            <span className="stat-value">{stats.lists}</span>
          </div>
        )}
        {stats.links > 0 && (
          <div className="stat-item">
            <span className="stat-label">Links</span>
            <span className="stat-value">{stats.links}</span>
          </div>
        )}
        {stats.images > 0 && (
          <div className="stat-item">
            <span className="stat-label">Images</span>
            <span className="stat-value">{stats.images}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface TableOfContentsProps {
  toc: Array<{level: number, text: string, id: string}>;
  onHeadingClick: (id: string) => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ toc, onHeadingClick }) => {
  if (toc.length === 0) return null;

  return (
    <div className="markdown-toc">
      <h4 className="toc-title">Table of Contents</h4>
      <ul className="toc-list">
        {toc.map((item, index) => (
          <li
            key={index}
            className={`toc-item toc-level-${item.level}`}
          >
            <button
              onClick={() => onHeadingClick(item.id)}
              className="toc-link"
              title={`Jump to ${item.text}`}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  className = ''
}) => {
  const { selectedFont } = useAppStore();
  const previewRef = useRef<HTMLDivElement>(null);

  // Parse markdown content
  const parseResult: MarkdownParseResult = useMemo(() => {
    return markdownService.parseMarkdown(content);
  }, [content]);

  // Generate table of contents
  const tableOfContents = useMemo(() => {
    if (!parseResult.html) return [];
    return markdownService.generateTableOfContents(parseResult.html);
  }, [parseResult.html]);

  // Apply selected font
  const previewStyle = useMemo(() => ({
    fontFamily: selectedFont?.fallback || '"Georgia", "Times New Roman", serif',
    fontSize: '16px',
    lineHeight: '1.6'
  }), [selectedFont]);

  // Handle table of contents navigation
  const handleHeadingClick = (id: string) => {
    if (previewRef.current) {
      const element = previewRef.current.querySelector(`#${id}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  // Show message if no markdown content
  if (!content.trim()) {
    return (
      <div className={`markdown-preview empty-preview ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No Content</h3>
          <p>Start writing to see the markdown preview</p>
          <div className="markdown-help">
            <h4>Markdown Quick Reference</h4>
            <ul>
              <li><strong># Heading</strong> - Creates headers</li>
              <li><strong>**bold**</strong> - Makes text bold</li>
              <li><strong>*italic*</strong> - Makes text italic</li>
              <li><strong>`code`</strong> - Inline code</li>
              <li><strong>- List item</strong> - Creates bullet points</li>
              <li><strong>[Link](url)</strong> - Creates links</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show message if content doesn't contain markdown
  if (!parseResult.hasMarkdown) {
    return (
      <div className={`markdown-preview plain-text-preview ${className}`}>
        <div className="preview-header">
          <h3>Plain Text Preview</h3>
          <p>No markdown syntax detected in your content</p>
        </div>

        <div className="preview-stats">
          <MarkdownStatsDisplay stats={parseResult.stats} />
        </div>

        <div
          className="preview-content plain-text"
          style={previewStyle}
          ref={previewRef}
        >
          <div className="markdown-paragraph">
            {content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                {index < content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="markdown-help-footer">
          <p>
            <strong>Tip:</strong> Use markdown syntax like <code>#</code> for headings,
            <code>**bold**</code> for bold text, and <code>*italic*</code> for italic text
            to see enhanced formatting in preview mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`markdown-preview ${className}`}>
      <div className="preview-header">
        <div className="preview-title">
          <h3>Markdown Preview</h3>
          {parseResult.hasMarkdown && (
            <span className="markdown-indicator">
              ✓ Markdown syntax detected
            </span>
          )}
        </div>

        <div className="preview-stats">
          <MarkdownStatsDisplay stats={parseResult.stats} />
        </div>
      </div>

      {tableOfContents.length > 0 && (
        <TableOfContents
          toc={tableOfContents}
          onHeadingClick={handleHeadingClick}
        />
      )}

      <div
        className="preview-content"
        style={previewStyle}
        ref={previewRef}
        dangerouslySetInnerHTML={{ __html: parseResult.html }}
      />

      <div className="preview-footer">
        <div className="preview-info">
          <span>Rendered with markdown processor</span>
          <span>•</span>
          <span>Content automatically sanitised</span>
        </div>
      </div>
    </div>
  );
};

export default MarkdownPreview;
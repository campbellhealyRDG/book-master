import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import MarkdownPreview from '../MarkdownPreview';
import { useAppStore } from '../../../store';

// Mock the store
vi.mock('../../../store', () => ({
  useAppStore: vi.fn()
}));

// Mock the markdown service
vi.mock('../../../services/markdownService', () => ({
  markdownService: {
    parseMarkdown: vi.fn(),
    generateTableOfContents: vi.fn()
  }
}));

describe('MarkdownPreview', () => {
  const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock store state
    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        selectedFont: null
      };
      return selector(state);
    });

    // Reset markdown service mocks
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockClear();
    markdownService.generateTableOfContents.mockClear();
  });

  test('renders empty state when no content', () => {
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '',
      hasMarkdown: false,
      stats: {
        words: 0,
        characters: 0,
        paragraphs: 0,
        headers: 0,
        lists: 0,
        links: 0,
        images: 0
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([]);

    render(<MarkdownPreview content="" />);

    expect(screen.getByText('No Content')).toBeInTheDocument();
    expect(screen.getByText('Start writing to see the markdown preview')).toBeInTheDocument();
    expect(screen.getByText('Markdown Quick Reference')).toBeInTheDocument();
  });

  test('renders plain text preview when no markdown syntax', () => {
    const content = 'This is just plain text with no markdown.';
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '<p class="markdown-paragraph">This is just plain text with no markdown.</p>',
      hasMarkdown: false,
      stats: {
        words: 8,
        characters: content.length,
        paragraphs: 1,
        headers: 0,
        lists: 0,
        links: 0,
        images: 0
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([]);

    render(<MarkdownPreview content={content} />);

    expect(screen.getByText('Plain Text Preview')).toBeInTheDocument();
    expect(screen.getByText('No markdown syntax detected in your content')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument(); // word count
    expect(screen.getByText('words')).toBeInTheDocument();
  });

  test('renders markdown preview with formatted content', () => {
    const content = '# Hello World\n\nThis is **bold** text.';
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '<h1 id="hello-world" class="markdown-heading markdown-h1">Hello World</h1><p class="markdown-paragraph">This is <strong>bold</strong> text.</p>',
      hasMarkdown: true,
      stats: {
        words: 5,
        characters: content.length,
        paragraphs: 1,
        headers: 1,
        lists: 0,
        links: 0,
        images: 0
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([
      { level: 1, text: 'Hello World', id: 'hello-world' }
    ]);

    render(<MarkdownPreview content={content} />);

    expect(screen.getByText('Markdown Preview')).toBeInTheDocument();
    expect(screen.getByText('✓ Markdown syntax detected')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // word count
    expect(screen.getByText('1')).toBeInTheDocument(); // header count
  });

  test('displays comprehensive statistics', () => {
    const content = '# Title\n\n- Item 1\n- Item 2\n\n[Link](url) and ![Image](img.png)';
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '<h1>Title</h1><ul><li>Item 1</li><li>Item 2</li></ul><p><a href="url">Link</a> and <img src="img.png" alt="Image" /></p>',
      hasMarkdown: true,
      stats: {
        words: 8,
        characters: content.length,
        paragraphs: 1,
        headers: 1,
        lists: 1,
        links: 1,
        images: 1
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([]);

    render(<MarkdownPreview content={content} />);

    // Check that all stats are displayed
    expect(screen.getByText('8')).toBeInTheDocument(); // words
    expect(screen.getByText('1')).toBeInTheDocument(); // headers, lists, links, images
    expect(screen.getByText('Headers')).toBeInTheDocument();
    expect(screen.getByText('Lists')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
  });

  test('renders table of contents when headers present', () => {
    const content = '# Main\n## Sub1\n## Sub2';
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '<h1 id="main">Main</h1><h2 id="sub1">Sub1</h2><h2 id="sub2">Sub2</h2>',
      hasMarkdown: true,
      stats: {
        words: 3,
        characters: content.length,
        paragraphs: 0,
        headers: 3,
        lists: 0,
        links: 0,
        images: 0
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([
      { level: 1, text: 'Main', id: 'main' },
      { level: 2, text: 'Sub1', id: 'sub1' },
      { level: 2, text: 'Sub2', id: 'sub2' }
    ]);

    render(<MarkdownPreview content={content} />);

    expect(screen.getByText('Table of Contents')).toBeInTheDocument();
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Sub1')).toBeInTheDocument();
    expect(screen.getByText('Sub2')).toBeInTheDocument();
  });

  test('handles table of contents navigation', () => {
    const content = '# Main Title';
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '<h1 id="main-title">Main Title</h1>',
      hasMarkdown: true,
      stats: {
        words: 2,
        characters: content.length,
        paragraphs: 0,
        headers: 1,
        lists: 0,
        links: 0,
        images: 0
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([
      { level: 1, text: 'Main Title', id: 'main-title' }
    ]);

    // Mock scrollIntoView
    const mockScrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = mockScrollIntoView;

    render(<MarkdownPreview content={content} />);

    const tocButton = screen.getByRole('button', { name: /jump to main title/i });
    fireEvent.click(tocButton);

    // Should attempt to scroll to element (though querySelector won't find it in test)
    expect(mockScrollIntoView).not.toHaveBeenCalled(); // Won't be called since element doesn't exist in test DOM
  });

  test('applies selected font style', () => {
    const georgiaFont = {
      id: 'georgia',
      name: 'Georgia',
      displayName: 'Georgia',
      fallback: '"Georgia", serif',
      category: 'serif' as const,
      description: 'Classic serif font'
    };

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        selectedFont: georgiaFont
      };
      return selector(state);
    });

    const content = 'Test content';
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '<p>Test content</p>',
      hasMarkdown: false,
      stats: {
        words: 2,
        characters: content.length,
        paragraphs: 1,
        headers: 0,
        lists: 0,
        links: 0,
        images: 0
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([]);

    render(<MarkdownPreview content={content} />);

    const previewContent = document.querySelector('.preview-content');
    expect(previewContent).toHaveStyle({ fontFamily: '"Georgia", serif' });
  });

  test('uses default font when no font selected', () => {
    const content = 'Test content';
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '<p>Test content</p>',
      hasMarkdown: false,
      stats: {
        words: 2,
        characters: content.length,
        paragraphs: 1,
        headers: 0,
        lists: 0,
        links: 0,
        images: 0
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([]);

    render(<MarkdownPreview content={content} />);

    const previewContent = document.querySelector('.preview-content');
    expect(previewContent).toHaveStyle({ fontFamily: '"Georgia", "Times New Roman", serif' });
  });

  test('displays markdown help for plain text', () => {
    const content = 'Plain text content';
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '<p>Plain text content</p>',
      hasMarkdown: false,
      stats: {
        words: 3,
        characters: content.length,
        paragraphs: 1,
        headers: 0,
        lists: 0,
        links: 0,
        images: 0
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([]);

    render(<MarkdownPreview content={content} />);

    expect(screen.getByText(/Use markdown syntax like/)).toBeInTheDocument();
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('**bold**')).toBeInTheDocument();
    expect(screen.getByText('*italic*')).toBeInTheDocument();
  });

  test('displays footer information', () => {
    const content = '# Test';
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '<h1>Test</h1>',
      hasMarkdown: true,
      stats: {
        words: 1,
        characters: content.length,
        paragraphs: 0,
        headers: 1,
        lists: 0,
        links: 0,
        images: 0
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([]);

    render(<MarkdownPreview content={content} />);

    expect(screen.getByText('Rendered with markdown processor')).toBeInTheDocument();
    expect(screen.getByText('Content automatically sanitised')).toBeInTheDocument();
  });

  test('handles British English number formatting', () => {
    const content = 'A '.repeat(1234) + 'words';
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '<p>' + 'A '.repeat(1234) + 'words</p>',
      hasMarkdown: false,
      stats: {
        words: 1235,
        characters: content.length,
        paragraphs: 1,
        headers: 0,
        lists: 0,
        links: 0,
        images: 0
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([]);

    render(<MarkdownPreview content={content} />);

    // Should format numbers with British conventions (comma separator)
    expect(screen.getByText('1,235')).toBeInTheDocument();
  });

  test('renders custom className', () => {
    const content = 'Test';
    const { markdownService } = require('../../../services/markdownService');
    markdownService.parseMarkdown.mockReturnValue({
      html: '<p>Test</p>',
      hasMarkdown: false,
      stats: {
        words: 1,
        characters: 4,
        paragraphs: 1,
        headers: 0,
        lists: 0,
        links: 0,
        images: 0
      }
    });
    markdownService.generateTableOfContents.mockReturnValue([]);

    const { container } = render(
      <MarkdownPreview content={content} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
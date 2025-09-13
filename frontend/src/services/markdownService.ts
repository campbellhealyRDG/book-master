import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface MarkdownStats {
  words: number;
  characters: number;
  paragraphs: number;
  headers: number;
  lists: number;
  links: number;
  images: number;
}

export interface MarkdownParseResult {
  html: string;
  stats: MarkdownStats;
  hasMarkdown: boolean;
}

class MarkdownService {
  private renderer: marked.Renderer;

  constructor() {
    // Configure marked renderer for British English and professional styling
    this.renderer = new marked.Renderer();

    // Configure marked options
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Line breaks become <br> tags
      headerIds: true, // Generate header IDs for anchors
      mangle: false, // Don't mangle autolinked email addresses
    });

    // Custom renderer overrides for professional styling
    this.setupCustomRenderer();
  }

  /**
   * Parse markdown text to HTML with sanitization
   */
  parseMarkdown(markdownText: string): MarkdownParseResult {
    if (!markdownText || markdownText.trim() === '') {
      return {
        html: '',
        stats: this.getEmptyStats(),
        hasMarkdown: false
      };
    }

    try {
      // Parse markdown to HTML using marked
      const rawHtml = marked(markdownText, { renderer: this.renderer });

      // Sanitize HTML with DOMPurify for security
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'strong', 'em', 'u', 'del', 's', 'mark',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'a', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'hr', 'div', 'span'
        ],
        ALLOWED_ATTR: [
          'href', 'title', 'alt', 'src', 'width', 'height',
          'id', 'class', 'style'
        ],
        ALLOW_DATA_ATTR: false
      });

      // Calculate statistics
      const stats = this.calculateStats(markdownText, sanitizedHtml);

      // Detect if content contains markdown syntax
      const hasMarkdown = this.detectMarkdownSyntax(markdownText);

      return {
        html: sanitizedHtml,
        stats,
        hasMarkdown
      };
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return {
        html: `<p class="markdown-error">Error parsing markdown: ${error instanceof Error ? error.message : 'Unknown error'}</p>`,
        stats: this.getEmptyStats(),
        hasMarkdown: false
      };
    }
  }

  /**
   * Check if text contains markdown syntax
   */
  detectMarkdownSyntax(text: string): boolean {
    const markdownPatterns = [
      /^#{1,6}\s/m,           // Headers
      /\*\*.*?\*\*/,          // Bold
      /\*.*?\*/,              // Italic (but not bold)
      /~~.*?~~/,              // Strikethrough
      /`.*?`/,                // Inline code
      /```[\s\S]*?```/,       // Code blocks
      /^\s*[-*+]\s/m,         // Unordered lists
      /^\s*\d+\.\s/m,         // Ordered lists
      /^\s*>\s/m,             // Blockquotes
      /\[.*?\]\(.*?\)/,       // Links
      /!\[.*?\]\(.*?\)/,      // Images
      /^\s*---\s*$/m,         // Horizontal rules
      /^\s*\|\s.*\s\|\s*$/m,  // Tables
    ];

    return markdownPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Calculate statistics from markdown text and HTML
   */
  private calculateStats(markdownText: string, html: string): MarkdownStats {
    // Create temporary DOM element to parse HTML for accurate counting
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Word and character counts from original text
    const words = markdownText.trim() === '' ? 0 : markdownText.trim().split(/\s+/).length;
    const characters = markdownText.length;

    // Count elements in parsed HTML
    const paragraphs = tempDiv.querySelectorAll('p').length;
    const headers = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    const lists = tempDiv.querySelectorAll('ul, ol').length;
    const links = tempDiv.querySelectorAll('a').length;
    const images = tempDiv.querySelectorAll('img').length;

    return {
      words,
      characters,
      paragraphs,
      headers,
      lists,
      links,
      images
    };
  }

  /**
   * Get empty stats object
   */
  private getEmptyStats(): MarkdownStats {
    return {
      words: 0,
      characters: 0,
      paragraphs: 0,
      headers: 0,
      lists: 0,
      links: 0,
      images: 0
    };
  }

  /**
   * Setup custom renderer for professional styling
   */
  private setupCustomRenderer(): void {
    // Custom heading renderer with British English styling
    this.renderer.heading = (text: string, level: number, raw: string): string => {
      const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
      const id = `heading-${escapedText}`;

      return `
        <h${level} id="${id}" class="markdown-heading markdown-h${level}">
          ${text}
        </h${level}>
      `;
    };

    // Custom paragraph renderer
    this.renderer.paragraph = (text: string): string => {
      return `<p class="markdown-paragraph">${text}</p>`;
    };

    // Custom blockquote renderer
    this.renderer.blockquote = (quote: string): string => {
      return `<blockquote class="markdown-blockquote">${quote}</blockquote>`;
    };

    // Custom code renderer
    this.renderer.code = (code: string, language?: string): string => {
      const validLang = language && /^[a-zA-Z0-9_+-]*$/.test(language) ? language : '';
      const langClass = validLang ? ` language-${validLang}` : '';

      return `
        <div class="markdown-code-block">
          <pre class="markdown-pre"><code class="markdown-code${langClass}">${this.escapeHtml(code)}</code></pre>
        </div>
      `;
    };

    // Custom inline code renderer
    this.renderer.codespan = (text: string): string => {
      return `<code class="markdown-inline-code">${this.escapeHtml(text)}</code>`;
    };

    // Custom list renderer
    this.renderer.list = (body: string, ordered?: boolean): string => {
      const type = ordered ? 'ol' : 'ul';
      const className = ordered ? 'markdown-ordered-list' : 'markdown-unordered-list';

      return `<${type} class="${className}">${body}</${type}>`;
    };

    // Custom list item renderer
    this.renderer.listitem = (text: string): string => {
      return `<li class="markdown-list-item">${text}</li>`;
    };

    // Custom link renderer with security
    this.renderer.link = (href: string, title: string | null, text: string): string => {
      // Validate href to prevent XSS
      const safeHref = this.sanitizeUrl(href);
      const titleAttr = title ? ` title="${this.escapeHtml(title)}"` : '';

      return `<a href="${safeHref}"${titleAttr} class="markdown-link" target="_blank" rel="noopener noreferrer">${text}</a>`;
    };

    // Custom image renderer
    this.renderer.image = (href: string, title: string | null, text: string): string => {
      const safeHref = this.sanitizeUrl(href);
      const titleAttr = title ? ` title="${this.escapeHtml(title)}"` : '';
      const altText = this.escapeHtml(text);

      return `
        <div class="markdown-image-container">
          <img src="${safeHref}" alt="${altText}"${titleAttr} class="markdown-image" />
        </div>
      `;
    };

    // Custom table renderer
    this.renderer.table = (header: string, body: string): string => {
      return `
        <div class="markdown-table-container">
          <table class="markdown-table">
            <thead class="markdown-table-header">${header}</thead>
            <tbody class="markdown-table-body">${body}</tbody>
          </table>
        </div>
      `;
    };

    // Custom horizontal rule renderer
    this.renderer.hr = (): string => {
      return '<hr class="markdown-hr" />';
    };
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sanitize URLs to prevent XSS
   */
  private sanitizeUrl(url: string): string {
    try {
      // Allow http, https, and relative URLs
      if (url.startsWith('#') || url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        return url;
      }

      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return url;
      }

      return '#'; // Invalid URL, return safe fallback
    } catch {
      return '#'; // Invalid URL, return safe fallback
    }
  }

  /**
   * Generate table of contents from parsed HTML
   */
  generateTableOfContents(html: string): Array<{level: number, text: string, id: string}> {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const headers = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const toc: Array<{level: number, text: string, id: string}> = [];

    headers.forEach(header => {
      const level = parseInt(header.tagName.charAt(1));
      const text = header.textContent || '';
      const id = header.id || '';

      if (text && id) {
        toc.push({ level, text, id });
      }
    });

    return toc;
  }

  /**
   * Preview markdown text (first few lines for quick preview)
   */
  previewMarkdown(markdownText: string, maxLines: number = 3): string {
    const lines = markdownText.split('\n').slice(0, maxLines);
    const preview = lines.join('\n');

    const result = this.parseMarkdown(preview);
    return result.html;
  }
}

// Export singleton instance
export const markdownService = new MarkdownService();
export default markdownService;
import { describe, test, expect, beforeEach } from 'vitest';
import { markdownService, MarkdownParseResult, MarkdownStats } from '../markdownService';

describe('MarkdownService', () => {
  beforeEach(() => {
    // Reset any state if needed
  });

  describe('parseMarkdown', () => {
    test('handles empty content', () => {
      const result = markdownService.parseMarkdown('');

      expect(result.html).toBe('');
      expect(result.hasMarkdown).toBe(false);
      expect(result.stats.words).toBe(0);
      expect(result.stats.characters).toBe(0);
    });

    test('handles plain text without markdown', () => {
      const content = 'This is just plain text with no markdown formatting.';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('This is just plain text');
      expect(result.hasMarkdown).toBe(false);
      expect(result.stats.words).toBe(9);
      expect(result.stats.characters).toBe(content.length);
    });

    test('detects and parses headers', () => {
      const content = '# Main Title\n## Sub Title\n### Small Title';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('<h1');
      expect(result.html).toContain('<h2');
      expect(result.html).toContain('<h3');
      expect(result.html).toContain('Main Title');
      expect(result.html).toContain('Sub Title');
      expect(result.html).toContain('Small Title');
      expect(result.hasMarkdown).toBe(true);
      expect(result.stats.headers).toBe(3);
    });

    test('parses bold and italic formatting', () => {
      const content = 'This is **bold text** and *italic text* and ***bold italic***.';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('<strong>bold text</strong>');
      expect(result.html).toContain('<em>italic text</em>');
      expect(result.html).toContain('<em><strong>bold italic</strong></em>');
      expect(result.hasMarkdown).toBe(true);
    });

    test('parses inline code and code blocks', () => {
      const content = 'Use `console.log()` for debugging.\n\n```javascript\nconst message = "Hello World";\nconsole.log(message);\n```';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('<code class="markdown-inline-code">console.log()</code>');
      expect(result.html).toContain('<code class="markdown-code language-javascript">');
      expect(result.html).toContain('const message = "Hello World"');
      expect(result.hasMarkdown).toBe(true);
    });

    test('parses unordered lists', () => {
      const content = '- First item\n- Second item\n- Third item';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('<ul class="markdown-unordered-list">');
      expect(result.html).toContain('<li class="markdown-list-item">First item</li>');
      expect(result.html).toContain('<li class="markdown-list-item">Second item</li>');
      expect(result.html).toContain('<li class="markdown-list-item">Third item</li>');
      expect(result.hasMarkdown).toBe(true);
      expect(result.stats.lists).toBe(1);
    });

    test('parses ordered lists', () => {
      const content = '1. First step\n2. Second step\n3. Third step';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('<ol class="markdown-ordered-list">');
      expect(result.html).toContain('<li class="markdown-list-item">First step</li>');
      expect(result.hasMarkdown).toBe(true);
      expect(result.stats.lists).toBe(1);
    });

    test('parses blockquotes', () => {
      const content = '> This is a blockquote\n> with multiple lines';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('<blockquote class="markdown-blockquote">');
      expect(result.html).toContain('This is a blockquote');
      expect(result.hasMarkdown).toBe(true);
    });

    test('parses links safely', () => {
      const content = '[Claude Code](https://claude.ai/code) is a great tool.';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('<a href="https://claude.ai/code"');
      expect(result.html).toContain('class="markdown-link"');
      expect(result.html).toContain('Claude Code');
      expect(result.hasMarkdown).toBe(true);
      expect(result.stats.links).toBe(1);
    });

    test('parses images', () => {
      const content = '![Alt text](https://example.com/image.png "Title")';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('<img src="https://example.com/image.png"');
      expect(result.html).toContain('alt="Alt text"');
      expect(result.html).toContain('title="Title"');
      expect(result.html).toContain('class="markdown-image"');
      expect(result.hasMarkdown).toBe(true);
      expect(result.stats.images).toBe(1);
    });

    test('parses horizontal rules', () => {
      const content = 'Before the rule\n\n---\n\nAfter the rule';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('<hr class="markdown-hr"');
      expect(result.hasMarkdown).toBe(true);
    });

    test('parses tables', () => {
      const content = '| Name | Age | City |\n|------|-----|------|\n| John | 25 | London |\n| Jane | 30 | Manchester |';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('<table class="markdown-table">');
      expect(result.html).toContain('<thead class="markdown-table-header">');
      expect(result.html).toContain('<tbody class="markdown-table-body">');
      expect(result.html).toContain('Name');
      expect(result.html).toContain('John');
      expect(result.hasMarkdown).toBe(true);
    });

    test('sanitises dangerous HTML', () => {
      const content = 'Safe content <script>alert("xss")</script> more content';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).not.toContain('<script>');
      expect(result.html).not.toContain('alert("xss")');
      expect(result.html).toContain('Safe content');
      expect(result.html).toContain('more content');
    });

    test('handles complex mixed content', () => {
      const content = `# My Document

This is a paragraph with **bold** and *italic* text.

## Code Example

Here's some inline \`code\` and a block:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## List of Items

- First item with [a link](https://example.com)
- Second item
- Third item

> This is a blockquote
> with multiple lines

---

Final paragraph.`;

      const result = markdownService.parseMarkdown(content);

      expect(result.hasMarkdown).toBe(true);
      expect(result.stats.headers).toBe(3);
      expect(result.stats.lists).toBe(1);
      expect(result.stats.links).toBe(1);
      expect(result.stats.paragraphs).toBeGreaterThan(0);
      expect(result.html).toContain('<h1');
      expect(result.html).toContain('<h2');
      expect(result.html).toContain('<ul');
      expect(result.html).toContain('<blockquote');
      expect(result.html).toContain('<hr');
    });
  });

  describe('detectMarkdownSyntax', () => {
    test('detects headers', () => {
      expect(markdownService.detectMarkdownSyntax('# Header')).toBe(true);
      expect(markdownService.detectMarkdownSyntax('## Sub Header')).toBe(true);
      expect(markdownService.detectMarkdownSyntax('###### Tiny Header')).toBe(true);
    });

    test('detects bold text', () => {
      expect(markdownService.detectMarkdownSyntax('This is **bold**')).toBe(true);
    });

    test('detects italic text', () => {
      expect(markdownService.detectMarkdownSyntax('This is *italic*')).toBe(true);
    });

    test('detects strikethrough', () => {
      expect(markdownService.detectMarkdownSyntax('This is ~~strikethrough~~')).toBe(true);
    });

    test('detects inline code', () => {
      expect(markdownService.detectMarkdownSyntax('Use `code` here')).toBe(true);
    });

    test('detects code blocks', () => {
      expect(markdownService.detectMarkdownSyntax('```\ncode block\n```')).toBe(true);
    });

    test('detects lists', () => {
      expect(markdownService.detectMarkdownSyntax('- List item')).toBe(true);
      expect(markdownService.detectMarkdownSyntax('* List item')).toBe(true);
      expect(markdownService.detectMarkdownSyntax('+ List item')).toBe(true);
      expect(markdownService.detectMarkdownSyntax('1. Ordered item')).toBe(true);
    });

    test('detects blockquotes', () => {
      expect(markdownService.detectMarkdownSyntax('> Quote')).toBe(true);
    });

    test('detects links', () => {
      expect(markdownService.detectMarkdownSyntax('[text](url)')).toBe(true);
    });

    test('detects images', () => {
      expect(markdownService.detectMarkdownSyntax('![alt](url)')).toBe(true);
    });

    test('detects horizontal rules', () => {
      expect(markdownService.detectMarkdownSyntax('---')).toBe(true);
    });

    test('does not detect plain text', () => {
      expect(markdownService.detectMarkdownSyntax('This is plain text')).toBe(false);
      expect(markdownService.detectMarkdownSyntax('No markdown here at all')).toBe(false);
    });
  });

  describe('generateTableOfContents', () => {
    test('generates TOC from headers', () => {
      const html = `
        <h1 id="main-title">Main Title</h1>
        <h2 id="sub-title">Sub Title</h2>
        <h3 id="small-title">Small Title</h3>
      `;

      const toc = markdownService.generateTableOfContents(html);

      expect(toc).toHaveLength(3);
      expect(toc[0]).toEqual({ level: 1, text: 'Main Title', id: 'main-title' });
      expect(toc[1]).toEqual({ level: 2, text: 'Sub Title', id: 'sub-title' });
      expect(toc[2]).toEqual({ level: 3, text: 'Small Title', id: 'small-title' });
    });

    test('handles empty HTML', () => {
      const toc = markdownService.generateTableOfContents('');
      expect(toc).toHaveLength(0);
    });

    test('handles HTML without headers', () => {
      const html = '<p>Just a paragraph</p><div>And a div</div>';
      const toc = markdownService.generateTableOfContents(html);
      expect(toc).toHaveLength(0);
    });
  });

  describe('previewMarkdown', () => {
    test('returns preview of first few lines', () => {
      const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
      const preview = markdownService.previewMarkdown(content, 3);

      expect(preview).toContain('Line 1');
      expect(preview).toContain('Line 2');
      expect(preview).toContain('Line 3');
      expect(preview).not.toContain('Line 4');
      expect(preview).not.toContain('Line 5');
    });

    test('handles markdown in preview', () => {
      const content = '# Title\n**Bold text**\nNormal text\nMore text';
      const preview = markdownService.previewMarkdown(content, 3);

      expect(preview).toContain('<h1');
      expect(preview).toContain('Title');
      expect(preview).toContain('<strong>Bold text</strong>');
      expect(preview).not.toContain('More text');
    });
  });

  describe('statistics calculation', () => {
    test('calculates basic statistics correctly', () => {
      const content = 'Hello world! This is a test.';
      const result = markdownService.parseMarkdown(content);

      expect(result.stats.words).toBe(6);
      expect(result.stats.characters).toBe(content.length);
      expect(result.stats.paragraphs).toBe(1);
      expect(result.stats.headers).toBe(0);
      expect(result.stats.lists).toBe(0);
      expect(result.stats.links).toBe(0);
      expect(result.stats.images).toBe(0);
    });

    test('calculates statistics for complex document', () => {
      const content = `# Title

Paragraph with **bold** text.

## Section

- Item 1
- Item 2

[Link](url) and ![Image](img.png)`;

      const result = markdownService.parseMarkdown(content);

      expect(result.stats.words).toBeGreaterThan(10);
      expect(result.stats.headers).toBe(2);
      expect(result.stats.paragraphs).toBeGreaterThan(1);
      expect(result.stats.lists).toBe(1);
      expect(result.stats.links).toBe(1);
      expect(result.stats.images).toBe(1);
    });

    test('handles empty content statistics', () => {
      const result = markdownService.parseMarkdown('');

      expect(result.stats.words).toBe(0);
      expect(result.stats.characters).toBe(0);
      expect(result.stats.paragraphs).toBe(0);
      expect(result.stats.headers).toBe(0);
      expect(result.stats.lists).toBe(0);
      expect(result.stats.links).toBe(0);
      expect(result.stats.images).toBe(0);
    });
  });

  describe('error handling', () => {
    test('handles malformed markdown gracefully', () => {
      const malformedContent = '# Unclosed **bold text\n[incomplete link';
      const result = markdownService.parseMarkdown(malformedContent);

      expect(result.html).toBeTruthy();
      expect(result.hasMarkdown).toBe(true);
      // Should still produce some HTML even with malformed input
    });

    test('handles very long content', () => {
      const longContent = 'a '.repeat(100) + '**bold text**' + 'b '.repeat(100);
      const result = markdownService.parseMarkdown(longContent);

      expect(result.html).toBeTruthy();
      expect(result.stats.words).toBeGreaterThan(200);
      expect(result.hasMarkdown).toBe(true);
    });

    test('handles special characters', () => {
      const content = '# Héllo Wörld\n\nSpecial chars: &<>"\'';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('Héllo Wörld');
      expect(result.html).toContain('&amp;&lt;&gt;"');
      expect(result.hasMarkdown).toBe(true);
    });
  });

  describe('British English formatting', () => {
    test('maintains British English content', () => {
      const content = 'This is colour, centre, and realise formatting.';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('colour');
      expect(result.html).toContain('centre');
      expect(result.html).toContain('realise');
    });

    test('handles British punctuation correctly', () => {
      const content = 'Here is a quote: "British punctuation style."';
      const result = markdownService.parseMarkdown(content);

      expect(result.html).toContain('British punctuation style');
    });
  });
});
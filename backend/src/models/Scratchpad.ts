import db from '../config/database.js';

export interface ScratchpadData {
  id?: number;
  content?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Scratchpad {
  public id?: number;
  public content: string;
  public created_at?: Date;
  public updated_at?: Date;

  private static readonly MAX_CONTENT_LENGTH = 1000000; // 1MB limit

  constructor(data: ScratchpadData) {
    this.id = data.id;
    this.content = data.content || '';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    this.validate();
  }

  private validate(): void {
    if (this.content.length > Scratchpad.MAX_CONTENT_LENGTH) {
      throw new Error(`Scratchpad content must not exceed ${Scratchpad.MAX_CONTENT_LENGTH.toLocaleString()} characters`);
    }
  }

  public getWordCount(): number {
    if (!this.content || this.content.trim().length === 0) {
      return 0;
    }

    return this.content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  public getCharacterCount(): number {
    return this.content.replace(/\r?\n/g, '').length;
  }

  public toJSON(): ScratchpadData {
    return {
      id: this.id,
      content: this.content,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  public toJSONWithStats(): ScratchpadData & {
    word_count: number;
    character_count: number;
  } {
    return {
      ...this.toJSON(),
      word_count: this.getWordCount(),
      character_count: this.getCharacterCount(),
    };
  }

  // Static methods for database operations
  public static async get(): Promise<Scratchpad> {
    // The scratchpad is a singleton - there's only one global scratchpad
    const result = await db('scratchpad').first();
    
    if (!result) {
      // Create default empty scratchpad if none exists
      return await Scratchpad.create('');
    }
    
    return new Scratchpad(result);
  }

  public static async create(content: string = ''): Promise<Scratchpad> {
    // Check if scratchpad already exists
    const existing = await db('scratchpad').first();
    if (existing) {
      throw new Error('Scratchpad already exists. Use update() instead.');
    }

    const scratchpad = new Scratchpad({ content });
    
    const [id] = await db('scratchpad').insert({
      content: scratchpad.content,
    });

    scratchpad.id = id;
    const created = await Scratchpad.get();
    
    return created;
  }

  public static async update(content: string): Promise<Scratchpad> {
    const scratchpad = new Scratchpad({ content });
    
    // Get existing scratchpad or create if none exists
    const existing = await db('scratchpad').first();
    
    if (!existing) {
      return await Scratchpad.create(content);
    }

    await db('scratchpad')
      .where('id', existing.id)
      .update({
        content: scratchpad.content,
        updated_at: db.fn.now(),
      });

    return await Scratchpad.get();
  }

  public static async clear(): Promise<Scratchpad> {
    return await Scratchpad.update('');
  }

  public static async append(text: string): Promise<Scratchpad> {
    const current = await Scratchpad.get();
    const newContent = current.content + (current.content ? '\n\n' : '') + text;
    return await Scratchpad.update(newContent);
  }

  public static async prepend(text: string): Promise<Scratchpad> {
    const current = await Scratchpad.get();
    const newContent = text + (current.content ? '\n\n' : '') + current.content;
    return await Scratchpad.update(newContent);
  }

  public async save(): Promise<Scratchpad> {
    return await Scratchpad.update(this.content);
  }

  // Utility methods for text manipulation
  public static async addNote(note: string, addTimestamp: boolean = true): Promise<Scratchpad> {
    const timestamp = addTimestamp ? new Date().toLocaleString('en-GB') : '';
    const formattedNote = addTimestamp ? `[${timestamp}] ${note}` : note;
    
    return await Scratchpad.append(formattedNote);
  }

  public static async addSeparator(): Promise<Scratchpad> {
    return await Scratchpad.append('---');
  }

  public static async backup(): Promise<string> {
    const scratchpad = await Scratchpad.get();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupContent = `// Scratchpad Backup - ${timestamp}\n\n${scratchpad.content}`;
    
    return backupContent;
  }

  public static async restore(backupContent: string): Promise<Scratchpad> {
    // Extract content from backup (remove the backup header if present)
    const lines = backupContent.split('\n');
    let content = backupContent;
    
    if (lines[0].startsWith('// Scratchpad Backup -')) {
      // Remove backup header (first line) and empty line (second line)
      content = lines.slice(2).join('\n');
    }
    
    return await Scratchpad.update(content);
  }

  // Search functionality
  public static async search(query: string, caseSensitive: boolean = false): Promise<{
    found: boolean;
    matches: number;
    lines: Array<{ lineNumber: number; content: string }>;
  }> {
    const scratchpad = await Scratchpad.get();
    
    if (!scratchpad.content || query.trim().length === 0) {
      return {
        found: false,
        matches: 0,
        lines: [],
      };
    }

    const searchQuery = caseSensitive ? query : query.toLowerCase();
    const lines = scratchpad.content.split('\n');
    const matchingLines: Array<{ lineNumber: number; content: string }> = [];
    let totalMatches = 0;

    lines.forEach((line, index) => {
      const searchLine = caseSensitive ? line : line.toLowerCase();
      const matches = (searchLine.match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      
      if (matches > 0) {
        matchingLines.push({
          lineNumber: index + 1,
          content: line,
        });
        totalMatches += matches;
      }
    });

    return {
      found: totalMatches > 0,
      matches: totalMatches,
      lines: matchingLines,
    };
  }

  // Statistics
  public static async getStatistics(): Promise<{
    totalCharacters: number;
    totalWords: number;
    totalLines: number;
    totalParagraphs: number;
    isEmpty: boolean;
    lastModified: Date | null;
  }> {
    const scratchpad = await Scratchpad.get();
    
    const lines = scratchpad.content.split('\n');
    const paragraphs = scratchpad.content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    return {
      totalCharacters: scratchpad.getCharacterCount(),
      totalWords: scratchpad.getWordCount(),
      totalLines: lines.length,
      totalParagraphs: paragraphs.length,
      isEmpty: scratchpad.content.trim().length === 0,
      lastModified: scratchpad.updated_at || scratchpad.created_at || null,
    };
  }

  public static getMaxContentLength(): number {
    return Scratchpad.MAX_CONTENT_LENGTH;
  }

  // Export functionality
  public static async exportContent(format: 'txt' | 'markdown' = 'txt'): Promise<{
    content: string;
    filename: string;
    mimeType: string;
  }> {
    const scratchpad = await Scratchpad.get();
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (format === 'markdown') {
      const markdownContent = `# Scratchpad Notes\n\n*Exported on ${new Date().toLocaleDateString('en-GB')}*\n\n${scratchpad.content}`;
      
      return {
        content: markdownContent,
        filename: `scratchpad-${timestamp}.md`,
        mimeType: 'text/markdown',
      };
    }
    
    // Default to text format
    const textContent = `Scratchpad Notes\nExported on ${new Date().toLocaleDateString('en-GB')}\n\n${scratchpad.content}`;
    
    return {
      content: textContent,
      filename: `scratchpad-${timestamp}.txt`,
      mimeType: 'text/plain',
    };
  }

  // Template functionality
  public static async loadTemplate(template: 'daily-notes' | 'meeting-notes' | 'ideas' | 'todo'): Promise<Scratchpad> {
    const templates = {
      'daily-notes': `# Daily Notes - ${new Date().toLocaleDateString('en-GB')}\n\n## Morning Planning\n- \n\n## Key Activities\n- \n\n## Notes\n- \n\n## Tomorrow's Focus\n- `,
      
      'meeting-notes': `# Meeting Notes - ${new Date().toLocaleDateString('en-GB')}\n\n## Attendees\n- \n\n## Agenda\n- \n\n## Discussion Points\n- \n\n## Action Items\n- [ ] \n\n## Next Steps\n- `,
      
      'ideas': `# Ideas & Inspiration\n\n## Story Ideas\n- \n\n## Character Concepts\n- \n\n## Plot Points\n- \n\n## Research Topics\n- `,
      
      'todo': `# To-Do List - ${new Date().toLocaleDateString('en-GB')}\n\n## High Priority\n- [ ] \n\n## Medium Priority\n- [ ] \n\n## Low Priority\n- [ ] \n\n## Completed\n- [x] `,
    };

    const templateContent = templates[template] || templates['daily-notes'];
    return await Scratchpad.update(templateContent);
  }
}
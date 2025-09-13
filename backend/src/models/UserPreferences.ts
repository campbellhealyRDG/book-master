import db from '../config/database.js';

export interface UserPreferenceData {
  id?: number;
  preference_key: string;
  preference_value: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface FontPreferences {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

export interface EditorPreferences {
  theme: 'light' | 'dark';
  showLineNumbers: boolean;
  wordWrap: boolean;
  spellCheckEnabled: boolean;
  autoSaveInterval: number; // in seconds
}

export interface AppPreferences {
  sidebarCollapsed: boolean;
  defaultExportFormat: 'txt' | 'markdown';
  confirmDeleteActions: boolean;
  showWordCount: boolean;
  showCharacterCount: boolean;
}

export type PreferenceValue = FontPreferences | EditorPreferences | AppPreferences | string | number | boolean;

export class UserPreferences {
  private static readonly DEFAULT_PREFERENCES = {
    font: {
      fontFamily: 'Georgia',
      fontSize: 16,
      lineHeight: 1.6,
    } as FontPreferences,
    
    editor: {
      theme: 'light',
      showLineNumbers: false,
      wordWrap: true,
      spellCheckEnabled: true,
      autoSaveInterval: 30,
    } as EditorPreferences,
    
    app: {
      sidebarCollapsed: false,
      defaultExportFormat: 'txt',
      confirmDeleteActions: true,
      showWordCount: true,
      showCharacterCount: true,
    } as AppPreferences,
  };

  private static readonly VALID_PREFERENCE_KEYS = [
    'font',
    'editor', 
    'app',
    'lastOpenBook',
    'lastOpenChapter',
    'customDictionaryEnabled',
    'recentFiles',
  ];

  public id?: number;
  public preference_key: string;
  public preference_value: string;
  public created_at?: Date;
  public updated_at?: Date;

  constructor(data: UserPreferenceData) {
    this.id = data.id;
    this.preference_key = data.preference_key;
    this.preference_value = data.preference_value;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    this.validate();
  }

  private validate(): void {
    if (!this.preference_key || this.preference_key.trim().length === 0) {
      throw new Error('Preference key is required and cannot be empty');
    }

    if (this.preference_key.length > 100) {
      throw new Error('Preference key must not exceed 100 characters');
    }

    if (!UserPreferences.VALID_PREFERENCE_KEYS.includes(this.preference_key)) {
      throw new Error(`Invalid preference key. Must be one of: ${UserPreferences.VALID_PREFERENCE_KEYS.join(', ')}`);
    }

    if (!this.preference_value) {
      throw new Error('Preference value is required');
    }

    // Validate JSON structure for complex preferences
    try {
      const parsed = JSON.parse(this.preference_value);
      this.validatePreferenceStructure(this.preference_key, parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Preference value must be valid JSON');
      }
      throw error;
    }
  }

  private validatePreferenceStructure(key: string, value: any): void {
    switch (key) {
      case 'font':
        this.validateFontPreferences(value);
        break;
      case 'editor':
        this.validateEditorPreferences(value);
        break;
      case 'app':
        this.validateAppPreferences(value);
        break;
      case 'lastOpenBook':
      case 'lastOpenChapter':
        if (typeof value !== 'number' || value < 0) {
          throw new Error(`${key} must be a non-negative number`);
        }
        break;
      case 'customDictionaryEnabled':
        if (typeof value !== 'boolean') {
          throw new Error(`${key} must be a boolean`);
        }
        break;
      case 'recentFiles':
        if (!Array.isArray(value)) {
          throw new Error(`${key} must be an array`);
        }
        break;
    }
  }

  private validateFontPreferences(font: any): void {
    if (typeof font !== 'object' || font === null) {
      throw new Error('Font preferences must be an object');
    }

    const { fontFamily, fontSize, lineHeight } = font;

    if (typeof fontFamily !== 'string' || fontFamily.trim().length === 0) {
      throw new Error('Font family must be a non-empty string');
    }

    if (typeof fontSize !== 'number' || fontSize < 8 || fontSize > 72) {
      throw new Error('Font size must be a number between 8 and 72');
    }

    if (typeof lineHeight !== 'number' || lineHeight < 1 || lineHeight > 3) {
      throw new Error('Line height must be a number between 1 and 3');
    }
  }

  private validateEditorPreferences(editor: any): void {
    if (typeof editor !== 'object' || editor === null) {
      throw new Error('Editor preferences must be an object');
    }

    const { theme, showLineNumbers, wordWrap, spellCheckEnabled, autoSaveInterval } = editor;

    if (!['light', 'dark'].includes(theme)) {
      throw new Error('Theme must be either "light" or "dark"');
    }

    if (typeof showLineNumbers !== 'boolean') {
      throw new Error('Show line numbers must be a boolean');
    }

    if (typeof wordWrap !== 'boolean') {
      throw new Error('Word wrap must be a boolean');
    }

    if (typeof spellCheckEnabled !== 'boolean') {
      throw new Error('Spell check enabled must be a boolean');
    }

    if (typeof autoSaveInterval !== 'number' || autoSaveInterval < 10 || autoSaveInterval > 300) {
      throw new Error('Auto save interval must be a number between 10 and 300 seconds');
    }
  }

  private validateAppPreferences(app: any): void {
    if (typeof app !== 'object' || app === null) {
      throw new Error('App preferences must be an object');
    }

    const { sidebarCollapsed, defaultExportFormat, confirmDeleteActions, showWordCount, showCharacterCount } = app;

    if (typeof sidebarCollapsed !== 'boolean') {
      throw new Error('Sidebar collapsed must be a boolean');
    }

    if (!['txt', 'markdown'].includes(defaultExportFormat)) {
      throw new Error('Default export format must be either "txt" or "markdown"');
    }

    if (typeof confirmDeleteActions !== 'boolean') {
      throw new Error('Confirm delete actions must be a boolean');
    }

    if (typeof showWordCount !== 'boolean') {
      throw new Error('Show word count must be a boolean');
    }

    if (typeof showCharacterCount !== 'boolean') {
      throw new Error('Show character count must be a boolean');
    }
  }

  public toJSON(): UserPreferenceData {
    return {
      id: this.id,
      preference_key: this.preference_key,
      preference_value: this.preference_value,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  public getParsedValue<T = PreferenceValue>(): T {
    return JSON.parse(this.preference_value) as T;
  }

  // Static methods for database operations
  public static async get<T = PreferenceValue>(key: string): Promise<T | null> {
    const preference = await db('user_preferences')
      .where('preference_key', key)
      .first();

    if (!preference) {
      // Return default value if available
      const defaultValue = UserPreferences.getDefaultValue(key);
      if (defaultValue !== null) {
        return defaultValue as T;
      }
      return null;
    }

    const userPref = new UserPreferences(preference);
    return userPref.getParsedValue<T>();
  }

  public static async set<T = PreferenceValue>(key: string, value: T): Promise<UserPreferences> {
    const serializedValue = JSON.stringify(value);
    const preferenceData = {
      preference_key: key,
      preference_value: serializedValue,
    };

    // Validate the preference
    const tempPreference = new UserPreferences(preferenceData);

    const existing = await db('user_preferences')
      .where('preference_key', key)
      .first();

    if (existing) {
      // Update existing preference
      await db('user_preferences')
        .where('preference_key', key)
        .update({
          preference_value: serializedValue,
          updated_at: db.fn.now(),
        });

      const updated = await db('user_preferences')
        .where('preference_key', key)
        .first();
      
      return new UserPreferences(updated);
    } else {
      // Create new preference
      const [id] = await db('user_preferences').insert(preferenceData);
      
      const created = await db('user_preferences')
        .where('id', id)
        .first();
      
      return new UserPreferences(created);
    }
  }

  public static async delete(key: string): Promise<void> {
    await db('user_preferences')
      .where('preference_key', key)
      .delete();
  }

  public static async getAll(): Promise<Record<string, PreferenceValue>> {
    const preferences = await db('user_preferences').select();
    const result: Record<string, PreferenceValue> = {};

    for (const pref of preferences) {
      const userPref = new UserPreferences(pref);
      result[pref.preference_key] = userPref.getParsedValue();
    }

    // Add default values for missing preferences
    for (const key of UserPreferences.VALID_PREFERENCE_KEYS) {
      if (!(key in result)) {
        const defaultValue = UserPreferences.getDefaultValue(key);
        if (defaultValue !== null) {
          result[key] = defaultValue;
        }
      }
    }

    return result;
  }

  public static async initializeDefaults(): Promise<void> {
    // Initialize default preferences if they don't exist
    for (const [key, defaultValue] of Object.entries(UserPreferences.DEFAULT_PREFERENCES)) {
      const existing = await UserPreferences.get(key);
      if (existing === null) {
        await UserPreferences.set(key, defaultValue);
      }
    }

    // Initialize other default values
    const otherDefaults = {
      customDictionaryEnabled: true,
      recentFiles: [],
    };

    for (const [key, defaultValue] of Object.entries(otherDefaults)) {
      const existing = await UserPreferences.get(key);
      if (existing === null) {
        await UserPreferences.set(key, defaultValue);
      }
    }
  }

  private static getDefaultValue(key: string): PreferenceValue | null {
    switch (key) {
      case 'font':
        return UserPreferences.DEFAULT_PREFERENCES.font;
      case 'editor':
        return UserPreferences.DEFAULT_PREFERENCES.editor;
      case 'app':
        return UserPreferences.DEFAULT_PREFERENCES.app;
      case 'customDictionaryEnabled':
        return true;
      case 'recentFiles':
        return [];
      default:
        return null;
    }
  }

  // Convenience methods for specific preferences
  public static async getFontPreferences(): Promise<FontPreferences> {
    return (await UserPreferences.get<FontPreferences>('font')) || UserPreferences.DEFAULT_PREFERENCES.font;
  }

  public static async setFontPreferences(font: FontPreferences): Promise<UserPreferences> {
    return UserPreferences.set('font', font);
  }

  public static async getEditorPreferences(): Promise<EditorPreferences> {
    return (await UserPreferences.get<EditorPreferences>('editor')) || UserPreferences.DEFAULT_PREFERENCES.editor;
  }

  public static async setEditorPreferences(editor: EditorPreferences): Promise<UserPreferences> {
    return UserPreferences.set('editor', editor);
  }

  public static async getAppPreferences(): Promise<AppPreferences> {
    return (await UserPreferences.get<AppPreferences>('app')) || UserPreferences.DEFAULT_PREFERENCES.app;
  }

  public static async setAppPreferences(app: AppPreferences): Promise<UserPreferences> {
    return UserPreferences.set('app', app);
  }

  public static async getLastOpenBook(): Promise<number | null> {
    return UserPreferences.get<number>('lastOpenBook');
  }

  public static async setLastOpenBook(bookId: number): Promise<UserPreferences> {
    return UserPreferences.set('lastOpenBook', bookId);
  }

  public static async getLastOpenChapter(): Promise<number | null> {
    return UserPreferences.get<number>('lastOpenChapter');
  }

  public static async setLastOpenChapter(chapterId: number): Promise<UserPreferences> {
    return UserPreferences.set('lastOpenChapter', chapterId);
  }

  public static async getRecentFiles(): Promise<number[]> {
    return (await UserPreferences.get<number[]>('recentFiles')) || [];
  }

  public static async addRecentFile(bookId: number): Promise<UserPreferences> {
    const recentFiles = await UserPreferences.getRecentFiles();
    
    // Remove if already exists
    const filtered = recentFiles.filter(id => id !== bookId);
    
    // Add to beginning and limit to 10 files
    const updated = [bookId, ...filtered].slice(0, 10);
    
    return UserPreferences.set('recentFiles', updated);
  }

  public static getValidPreferenceKeys(): string[] {
    return [...UserPreferences.VALID_PREFERENCE_KEYS];
  }

  public static getDefaultPreferences(): typeof UserPreferences.DEFAULT_PREFERENCES {
    return JSON.parse(JSON.stringify(UserPreferences.DEFAULT_PREFERENCES));
  }
}
import db from '../config/database.js';

export type DictionaryCategory = 'proper_noun' | 'technical_term' | 'character_name' | 'place_name' | 'custom';

export interface DictionaryTermData {
  id?: number;
  term: string;
  category?: DictionaryCategory;
  is_active?: boolean;
  is_user_added?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class DictionaryTerm {
  public id?: number;
  public term: string;
  public category: DictionaryCategory;
  public is_active: boolean;
  public is_user_added: boolean;
  public created_at?: Date;
  public updated_at?: Date;

  private static readonly VALID_CATEGORIES: DictionaryCategory[] = [
    'proper_noun',
    'technical_term', 
    'character_name',
    'place_name',
    'custom'
  ];

  constructor(data: DictionaryTermData) {
    this.id = data.id;
    this.term = data.term;
    this.category = data.category || 'custom';
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.is_user_added = data.is_user_added !== undefined ? data.is_user_added : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    this.validate();
    this.normalizeTerm();
  }

  private validate(): void {
    if (!this.term || this.term.trim().length === 0) {
      throw new Error('Dictionary term is required and cannot be empty');
    }

    if (this.term.length > 255) {
      throw new Error('Dictionary term must not exceed 255 characters');
    }

    if (!DictionaryTerm.VALID_CATEGORIES.includes(this.category)) {
      throw new Error(`Invalid category. Must be one of: ${DictionaryTerm.VALID_CATEGORIES.join(', ')}`);
    }

    // Validate term contains only valid characters (letters, numbers, hyphens, apostrophes, spaces)
    const validTermPattern = /^[a-zA-Z0-9\s\-']+$/;
    if (!validTermPattern.test(this.term.trim())) {
      throw new Error('Dictionary term can only contain letters, numbers, spaces, hyphens, and apostrophes');
    }
  }

  private normalizeTerm(): void {
    // Trim whitespace and convert to lowercase for consistency
    this.term = this.term.trim().toLowerCase();
    
    // Remove extra spaces
    this.term = this.term.replace(/\s+/g, ' ');
  }

  public toJSON(): DictionaryTermData {
    return {
      id: this.id,
      term: this.term,
      category: this.category,
      is_active: this.is_active,
      is_user_added: this.is_user_added,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Static methods for database operations
  public static async create(termData: Omit<DictionaryTermData, 'id' | 'created_at' | 'updated_at'>): Promise<DictionaryTerm> {
    const term = new DictionaryTerm(termData);
    
    // Check if term already exists
    const existing = await DictionaryTerm.findByTerm(term.term);
    if (existing) {
      throw new Error(`Dictionary term "${term.term}" already exists`);
    }
    
    const [id] = await db('dictionary_terms').insert({
      term: term.term,
      category: term.category,
      is_active: term.is_active,
      is_user_added: term.is_user_added,
    });

    term.id = id;
    const created = await DictionaryTerm.findById(id);
    if (!created) {
      throw new Error('Failed to create dictionary term');
    }
    
    return created;
  }

  public static async findById(id: number): Promise<DictionaryTerm | null> {
    const result = await db('dictionary_terms').where('id', id).first();
    if (!result) {
      return null;
    }
    return new DictionaryTerm(result);
  }

  public static async findByTerm(term: string): Promise<DictionaryTerm | null> {
    const normalizedTerm = term.trim().toLowerCase();
    const result = await db('dictionary_terms').where('term', normalizedTerm).first();
    if (!result) {
      return null;
    }
    return new DictionaryTerm(result);
  }

  public static async findAll(options: {
    category?: DictionaryCategory;
    isActive?: boolean;
    isUserAdded?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<DictionaryTerm[]> {
    let query = db('dictionary_terms');

    if (options.category) {
      query = query.where('category', options.category);
    }

    if (options.isActive !== undefined) {
      query = query.where('is_active', options.isActive);
    }

    if (options.isUserAdded !== undefined) {
      query = query.where('is_user_added', options.isUserAdded);
    }

    if (options.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      query = query.where('term', 'like', searchTerm);
    }

    query = query.orderBy('term', 'asc');

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    const results = await query;
    return results.map(result => new DictionaryTerm(result));
  }

  public static async countAll(options: {
    category?: DictionaryCategory;
    isActive?: boolean;
    isUserAdded?: boolean;
    search?: string;
  } = {}): Promise<number> {
    let query = db('dictionary_terms');

    if (options.category) {
      query = query.where('category', options.category);
    }

    if (options.isActive !== undefined) {
      query = query.where('is_active', options.isActive);
    }

    if (options.isUserAdded !== undefined) {
      query = query.where('is_user_added', options.isUserAdded);
    }

    if (options.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      query = query.where('term', 'like', searchTerm);
    }

    const result = await query.count('* as count').first();
    return result?.count || 0;
  }

  public static async findByCategory(category: DictionaryCategory): Promise<DictionaryTerm[]> {
    return DictionaryTerm.findAll({ category, isActive: true });
  }

  public async update(updates: Partial<Omit<DictionaryTermData, 'id' | 'created_at' | 'updated_at'>>): Promise<DictionaryTerm> {
    if (!this.id) {
      throw new Error('Cannot update dictionary term without ID');
    }

    // Create a new instance with updated data to validate
    const updatedData = { ...this.toJSON(), ...updates };
    const validatedTerm = new DictionaryTerm(updatedData);

    // Check for duplicate term if term is being changed
    if (updates.term && updates.term !== this.term) {
      const existing = await DictionaryTerm.findByTerm(validatedTerm.term);
      if (existing && existing.id !== this.id) {
        throw new Error(`Dictionary term "${validatedTerm.term}" already exists`);
      }
    }

    await db('dictionary_terms')
      .where('id', this.id)
      .update({
        term: validatedTerm.term,
        category: validatedTerm.category,
        is_active: validatedTerm.is_active,
        is_user_added: validatedTerm.is_user_added,
        updated_at: db.fn.now(),
      });

    const updated = await DictionaryTerm.findById(this.id);
    if (!updated) {
      throw new Error('Failed to update dictionary term');
    }
    
    return updated;
  }

  public async delete(): Promise<void> {
    if (!this.id) {
      throw new Error('Cannot delete dictionary term without ID');
    }

    await db('dictionary_terms').where('id', this.id).delete();
  }

  public async activate(): Promise<DictionaryTerm> {
    return this.update({ is_active: true });
  }

  public async deactivate(): Promise<DictionaryTerm> {
    return this.update({ is_active: false });
  }

  public async toggleActive(): Promise<DictionaryTerm> {
    return this.update({ is_active: !this.is_active });
  }

  // Utility methods for spell checking integration
  public static async getActiveTermsForSpellCheck(): Promise<string[]> {
    const terms = await DictionaryTerm.findAll({ isActive: true });
    return terms.map(term => term.term);
  }

  public static async addBulkTerms(
    terms: Array<Omit<DictionaryTermData, 'id' | 'created_at' | 'updated_at'>>,
    skipDuplicates: boolean = true
  ): Promise<DictionaryTerm[]> {
    const results: DictionaryTerm[] = [];
    
    for (const termData of terms) {
      try {
        const created = await DictionaryTerm.create(termData);
        results.push(created);
      } catch (error) {
        if (!skipDuplicates || !error.message.includes('already exists')) {
          throw error;
        }
        // Skip duplicates if skipDuplicates is true
      }
    }
    
    return results;
  }

  public static async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    userAdded: number;
    systemAdded: number;
    byCategory: Record<DictionaryCategory, number>;
  }> {
    const [
      total,
      active,
      inactive,
      userAdded,
      systemAdded,
      ...categoryStats
    ] = await Promise.all([
      DictionaryTerm.countAll(),
      DictionaryTerm.countAll({ isActive: true }),
      DictionaryTerm.countAll({ isActive: false }),
      DictionaryTerm.countAll({ isUserAdded: true }),
      DictionaryTerm.countAll({ isUserAdded: false }),
      ...DictionaryTerm.VALID_CATEGORIES.map(category => 
        DictionaryTerm.countAll({ category })
      ),
    ]);

    const byCategory: Record<DictionaryCategory, number> = {};
    DictionaryTerm.VALID_CATEGORIES.forEach((category, index) => {
      byCategory[category] = categoryStats[index];
    });

    return {
      total,
      active,
      inactive,
      userAdded,
      systemAdded,
      byCategory,
    };
  }

  public static getValidCategories(): DictionaryCategory[] {
    return [...DictionaryTerm.VALID_CATEGORIES];
  }
}
import {
  DictionaryTerm,
  DictionaryTermsResponse,
  DictionaryStatistics,
  DictionaryCategory,
  CreateDictionaryTermRequest,
  UpdateDictionaryTermRequest,
  GetTermsOptions,
  ApiResponse,
  BulkCreateTermsRequest,
} from '../types/dictionary';

const API_BASE_URL = 'http://localhost:8000/api';

class DictionaryService {
  private async fetchWithError<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getTerms(options: GetTermsOptions = {}): Promise<DictionaryTermsResponse> {
    const searchParams = new URLSearchParams();

    if (options.category) searchParams.set('category', options.category);
    if (options.active !== undefined) searchParams.set('active', options.active.toString());
    if (options.user_added !== undefined) searchParams.set('user_added', options.user_added.toString());
    if (options.search) searchParams.set('search', options.search);
    if (options.limit) searchParams.set('limit', options.limit.toString());
    if (options.offset) searchParams.set('offset', options.offset.toString());

    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/dictionary/terms${queryString ? `?${queryString}` : ''}`;

    return this.fetchWithError<DictionaryTermsResponse>(url);
  }

  async getTerm(id: number): Promise<DictionaryTerm> {
    const response = await this.fetchWithError<ApiResponse<DictionaryTerm>>(
      `${API_BASE_URL}/dictionary/terms/${id}`
    );
    return response.data;
  }

  async createTerm(termData: CreateDictionaryTermRequest): Promise<DictionaryTerm> {
    const response = await this.fetchWithError<ApiResponse<DictionaryTerm>>(
      `${API_BASE_URL}/dictionary/terms`,
      {
        method: 'POST',
        body: JSON.stringify(termData),
      }
    );
    return response.data;
  }

  async updateTerm(id: number, updates: UpdateDictionaryTermRequest): Promise<DictionaryTerm> {
    const response = await this.fetchWithError<ApiResponse<DictionaryTerm>>(
      `${API_BASE_URL}/dictionary/terms/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    return response.data;
  }

  async deleteTerm(id: number): Promise<void> {
    await this.fetchWithError<ApiResponse<void>>(
      `${API_BASE_URL}/dictionary/terms/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  async toggleTermActive(id: number): Promise<DictionaryTerm> {
    const response = await this.fetchWithError<ApiResponse<DictionaryTerm>>(
      `${API_BASE_URL}/dictionary/terms/${id}/toggle`,
      {
        method: 'PUT',
      }
    );
    return response.data;
  }

  async createBulkTerms(request: BulkCreateTermsRequest): Promise<DictionaryTerm[]> {
    const response = await this.fetchWithError<ApiResponse<DictionaryTerm[]>>(
      `${API_BASE_URL}/dictionary/terms/bulk`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    return response.data;
  }

  async getStatistics(): Promise<DictionaryStatistics> {
    const response = await this.fetchWithError<ApiResponse<DictionaryStatistics>>(
      `${API_BASE_URL}/dictionary/statistics`
    );
    return response.data;
  }

  async getCategories(): Promise<DictionaryCategory[]> {
    const response = await this.fetchWithError<ApiResponse<DictionaryCategory[]>>(
      `${API_BASE_URL}/dictionary/categories`
    );
    return response.data;
  }

  async getSpellCheckTerms(): Promise<string[]> {
    const response = await this.fetchWithError<ApiResponse<string[]>>(
      `${API_BASE_URL}/dictionary/spell-check-terms`
    );
    return response.data;
  }

  // Helper methods for common operations
  async searchTerms(query: string, options: Omit<GetTermsOptions, 'search'> = {}): Promise<DictionaryTermsResponse> {
    return this.getTerms({ ...options, search: query });
  }

  async getTermsByCategory(category: DictionaryCategory, options: Omit<GetTermsOptions, 'category'> = {}): Promise<DictionaryTermsResponse> {
    return this.getTerms({ ...options, category });
  }

  async getActiveTerms(options: Omit<GetTermsOptions, 'active'> = {}): Promise<DictionaryTermsResponse> {
    return this.getTerms({ ...options, active: true });
  }

  async getUserAddedTerms(options: Omit<GetTermsOptions, 'user_added'> = {}): Promise<DictionaryTermsResponse> {
    return this.getTerms({ ...options, user_added: true });
  }

  // Batch operations
  async activateMultipleTerms(ids: number[]): Promise<DictionaryTerm[]> {
    const results: DictionaryTerm[] = [];

    for (const id of ids) {
      try {
        const term = await this.getTerm(id);
        if (!term.is_active) {
          const updatedTerm = await this.updateTerm(id, { is_active: true });
          results.push(updatedTerm);
        } else {
          results.push(term);
        }
      } catch (error) {
        console.error(`Failed to activate term with ID ${id}:`, error);
        // Continue with other terms
      }
    }

    return results;
  }

  async deactivateMultipleTerms(ids: number[]): Promise<DictionaryTerm[]> {
    const results: DictionaryTerm[] = [];

    for (const id of ids) {
      try {
        const term = await this.getTerm(id);
        if (term.is_active) {
          const updatedTerm = await this.updateTerm(id, { is_active: false });
          results.push(updatedTerm);
        } else {
          results.push(term);
        }
      } catch (error) {
        console.error(`Failed to deactivate term with ID ${id}:`, error);
        // Continue with other terms
      }
    }

    return results;
  }

  async deleteMultipleTerms(ids: number[]): Promise<void> {
    for (const id of ids) {
      try {
        await this.deleteTerm(id);
      } catch (error) {
        console.error(`Failed to delete term with ID ${id}:`, error);
        // Continue with other terms
      }
    }
  }

  // Import/Export functionality
  async exportTerms(options: GetTermsOptions = {}): Promise<DictionaryTerm[]> {
    const response = await this.getTerms({ ...options, limit: 10000 }); // Large limit to get all terms
    return response.data;
  }

  async importTermsFromText(text: string, category: DictionaryCategory = 'custom'): Promise<DictionaryTerm[]> {
    // Split text into individual terms (by lines, commas, or spaces)
    const terms = text
      .split(/[\n,\s]+/)
      .map(term => term.trim().toLowerCase())
      .filter(term => term.length > 0)
      .filter((term, index, self) => self.indexOf(term) === index) // Remove duplicates
      .map(term => ({
        term,
        category,
        is_active: true,
      }));

    if (terms.length === 0) {
      throw new Error('No valid terms found in the provided text');
    }

    return this.createBulkTerms({ terms, skip_duplicates: true });
  }
}

export const dictionaryService = new DictionaryService();
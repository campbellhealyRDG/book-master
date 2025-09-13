export type DictionaryCategory = 'proper_noun' | 'technical_term' | 'character_name' | 'place_name' | 'custom';

export interface DictionaryTerm {
  id: number;
  term: string;
  category: DictionaryCategory;
  is_active: boolean;
  is_user_added: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDictionaryTermRequest {
  term: string;
  category?: DictionaryCategory;
  is_active?: boolean;
}

export interface UpdateDictionaryTermRequest {
  term?: string;
  category?: DictionaryCategory;
  is_active?: boolean;
}

export interface DictionaryTermsResponse {
  success: boolean;
  data: DictionaryTerm[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  timestamp: string;
}

export interface DictionaryStatistics {
  total: number;
  active: number;
  inactive: number;
  userAdded: number;
  systemAdded: number;
  byCategory: Record<DictionaryCategory, number>;
}

export interface GetTermsOptions {
  category?: DictionaryCategory;
  active?: boolean;
  user_added?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface BulkCreateTermsRequest {
  terms: CreateDictionaryTermRequest[];
  skip_duplicates?: boolean;
}
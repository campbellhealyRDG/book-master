import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error(`API Error: ${status} - ${message}`);

    // Handle common HTTP errors
    switch (status) {
      case 400:
        throw new Error(`Bad Request: ${message}`);
      case 401:
        throw new Error('Unauthorised access');
      case 403:
        throw new Error('Forbidden access');
      case 404:
        throw new Error('Resource not found');
      case 422:
        throw new Error(`Validation Error: ${message}`);
      case 500:
        throw new Error('Internal server error');
      default:
        throw new Error(`Request failed: ${message}`);
    }
  }
);

// Book API endpoints
export const bookAPI = {
  getBooks: () => apiClient.get('/books'),
  getBook: (id: number) => apiClient.get(`/books/${id}`),
  createBook: (data: { title: string; author: string; description?: string }) =>
    apiClient.post('/books', data),
  updateBook: (id: number, data: { title?: string; author?: string; description?: string }) =>
    apiClient.put(`/books/${id}`, data),
  deleteBook: (id: number) => apiClient.delete(`/books/${id}`),
  exportBook: (id: number, format: 'txt' | 'markdown') =>
    apiClient.post(`/books/${id}/export`, { format }),
};

// Chapter API endpoints
export const chapterAPI = {
  getChapters: (bookId: number) => apiClient.get(`/chapters/books/${bookId}/chapters`),
  getChapter: (id: number) => apiClient.get(`/chapters/${id}`),
  createChapter: (bookId: number, data: { title: string; content?: string }) =>
    apiClient.post(`/chapters/books/${bookId}/chapters`, data),
  updateChapter: (id: number, data: { title?: string; content?: string }) =>
    apiClient.put(`/chapters/${id}`, data),
  deleteChapter: (id: number) => apiClient.delete(`/chapters/${id}`),
};

// Dictionary API endpoints
export const dictionaryAPI = {
  getTerms: (params?: { category?: string; active?: boolean }) =>
    apiClient.get('/dictionary/terms', { params }),
  createTerm: (data: { term: string; category: string; isUserAdded?: boolean }) =>
    apiClient.post('/dictionary/terms', data),
  updateTerm: (id: number, data: { term?: string; category?: string; isActive?: boolean }) =>
    apiClient.put(`/dictionary/terms/${id}`, data),
  deleteTerm: (id: number) => apiClient.delete(`/dictionary/terms/${id}`),
};

// User preferences API endpoints
export const preferencesAPI = {
  getPreferences: () => apiClient.get('/preferences'),
  updatePreference: (key: string, value: any) =>
    apiClient.put('/preferences', { key, value }),
};

// Scratchpad API endpoints
export const scratchpadAPI = {
  getScratchpad: () => apiClient.get('/scratchpad'),
  updateScratchpad: (content: string) =>
    apiClient.put('/scratchpad', { content }),
};

export default apiClient;
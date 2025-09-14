import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import { useAppStore } from '../store';
import { CreateBookData, UpdateBookData, CreateChapterData, UpdateChapterData } from '../types';

// Query keys
export const queryKeys = {
  books: ['books'],
  book: (id: number) => ['books', id],
  chapters: (bookId: number) => ['chapters', bookId],
  chapter: (id: number) => ['chapters', id],
  dictionaryTerms: ['dictionary', 'terms'],
  preferences: ['preferences'],
  scratchpad: ['scratchpad'],
};

// Books hooks
export const useBooks = () => {
  const setBooks = useAppStore((state) => state.setBooks);

  return useQuery({
    queryKey: queryKeys.books,
    queryFn: async () => {
      const books = await apiService.getBooks();
      setBooks(books);
      return { data: books };
    },
  });
};

export const useBook = (id: number) => {
  return useQuery({
    queryKey: queryKeys.book(id),
    queryFn: async () => {
      const book = await apiService.getBook(id);
      return book;
    },
    enabled: !!id,
  });
};

export const useCreateBook = () => {
  const queryClient = useQueryClient();
  const addBook = useAppStore((state) => state.addBook);

  return useMutation({
    mutationFn: (data: CreateBookData) => apiService.createBook(data),
    onSuccess: (newBook) => {
      addBook(newBook);
      queryClient.invalidateQueries({ queryKey: queryKeys.books });
    },
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  const updateBook = useAppStore((state) => state.updateBook);

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBookData }) =>
      apiService.updateBook(id, data),
    onSuccess: (updatedBook, variables) => {
      updateBook(variables.id, updatedBook);
      queryClient.invalidateQueries({ queryKey: queryKeys.books });
      queryClient.invalidateQueries({ queryKey: queryKeys.book(variables.id) });
    },
  });
};

export const useDeleteBook = () => {
  const queryClient = useQueryClient();
  const removeBook = useAppStore((state) => state.removeBook);

  return useMutation({
    mutationFn: (id: number) => apiService.deleteBook(id),
    onSuccess: (_, id) => {
      removeBook(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.books });
      queryClient.removeQueries({ queryKey: queryKeys.book(id) });
      queryClient.removeQueries({ queryKey: queryKeys.chapters(id) });
    },
  });
};

// Chapters hooks
export const useChapters = (bookId: number) => {
  const setChapters = useAppStore((state) => state.setChapters);

  return useQuery({
    queryKey: queryKeys.chapters(bookId),
    queryFn: async () => {
      const chapters = await apiService.getChapters(bookId);
      setChapters(chapters);
      return { data: chapters };
    },
    enabled: !!bookId,
  });
};

export const useChapter = (id: number) => {
  return useQuery({
    queryKey: queryKeys.chapter(id),
    queryFn: async () => {
      const chapter = await apiService.getChapter(id);
      return chapter;
    },
    enabled: !!id,
  });
};

export const useCreateChapter = (bookId: number) => {
  const queryClient = useQueryClient();
  const addChapter = useAppStore((state) => state.addChapter);

  return useMutation({
    mutationFn: (data: CreateChapterData) =>
      apiService.createChapter(bookId, data),
    onSuccess: (newChapter) => {
      addChapter(newChapter);
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters(bookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.books });
    },
  });
};

export const useUpdateChapter = () => {
  const queryClient = useQueryClient();
  const updateChapter = useAppStore((state) => state.updateChapter);
  const setUnsavedChanges = useAppStore((state) => state.setUnsavedChanges);

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateChapterData }) =>
      apiService.updateChapter(id, data),
    onSuccess: (updatedChapter, variables) => {
      updateChapter(variables.id, updatedChapter);
      setUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.chapter(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters(updatedChapter.bookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.books });
    },
  });
};

export const useDeleteChapter = () => {
  const queryClient = useQueryClient();
  const removeChapter = useAppStore((state) => state.removeChapter);

  return useMutation({
    mutationFn: (id: number) => apiService.deleteChapter(id),
    onSuccess: (_, id) => {
      removeChapter(id);
      // Invalidate all related caches since we don't have the bookId readily available
      queryClient.invalidateQueries({ queryKey: queryKeys.books });
      queryClient.removeQueries({ queryKey: queryKeys.chapter(id) });
      // Invalidate all chapter queries - this is less efficient but safer
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
  });
};

// Dictionary hooks
export const useDictionaryTerms = (params?: { category?: string; active?: boolean }) => {
  const setDictionaryTerms = useAppStore((state) => state.setDictionaryTerms);

  return useQuery({
    queryKey: [...queryKeys.dictionaryTerms, params],
    queryFn: async () => {
      const terms = await apiService.getDictionaryTerms(params?.category);
      setDictionaryTerms(terms);
      return terms;
    },
  });
};

// Preferences hooks
export const usePreferences = () => {
  const setUserPreferences = useAppStore((state) => state.setUserPreferences);

  return useQuery({
    queryKey: queryKeys.preferences,
    queryFn: async () => {
      const preferences = await apiService.getUserPreferences();
      setUserPreferences(preferences);
      return preferences;
    },
  });
};

// Scratchpad hooks
export const useScratchpad = () => {
  const setScratchpad = useAppStore((state) => state.setScratchpad);

  return useQuery({
    queryKey: queryKeys.scratchpad,
    queryFn: async () => {
      const scratchpad = { content: '' }; // Placeholder for scratchpad implementation
      setScratchpad(scratchpad);
      return scratchpad;
    },
  });
};
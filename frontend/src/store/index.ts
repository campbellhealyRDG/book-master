import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Book, Chapter, DictionaryTerm, Scratchpad, AppError } from '../types';
import { FontOption } from '../components/ui/FontSelector';

// Application state interface
interface AppState {
  // Books state
  books: Book[];
  selectedBook: Book | null;
  selectedBookId: number | null;

  // Chapters state
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  selectedChapterId: number | null;

  // Dictionary state
  dictionaryTerms: DictionaryTerm[];

  // User preferences state
  userPreferences: Record<string, any>;

  // Scratchpad state
  scratchpad: Scratchpad | null;

  // UI state
  sidebarCollapsed: boolean;
  loading: boolean;
  errors: AppError[];

  // Editor state
  unsavedChanges: boolean;
  autoSaveEnabled: boolean;
  spellCheckEnabled: boolean;
  selectedFont: FontOption | null;

  // Actions
  setBooks: (books: Book[]) => void;
  setSelectedBook: (book: Book | null) => void;
  setSelectedBookId: (id: number | null) => void;
  addBook: (book: Book) => void;
  updateBook: (id: number, updates: Partial<Book>) => void;
  removeBook: (id: number) => void;

  setChapters: (chapters: Chapter[]) => void;
  setSelectedChapter: (chapter: Chapter | null) => void;
  setSelectedChapterId: (id: number | null) => void;
  addChapter: (chapter: Chapter) => void;
  updateChapter: (id: number, updates: Partial<Chapter>) => void;
  removeChapter: (id: number) => void;

  setDictionaryTerms: (terms: DictionaryTerm[]) => void;
  addDictionaryTerm: (term: DictionaryTerm) => void;
  updateDictionaryTerm: (id: number, updates: Partial<DictionaryTerm>) => void;
  removeDictionaryTerm: (id: number) => void;

  setUserPreferences: (preferences: Record<string, any>) => void;
  updateUserPreference: (key: string, value: any) => void;

  setScratchpad: (scratchpad: Scratchpad | null) => void;
  updateScratchpadContent: (content: string) => void;

  setSidebarCollapsed: (collapsed: boolean) => void;
  setLoading: (loading: boolean) => void;
  addError: (error: AppError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;

  setUnsavedChanges: (hasChanges: boolean) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setSpellCheckEnabled: (enabled: boolean) => void;
  setSelectedFont: (font: FontOption | null) => void;
}

// Create the store with persistence for user preferences
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
      // Initial state
      books: [],
      selectedBook: null,
      selectedBookId: null,
      chapters: [],
      selectedChapter: null,
      selectedChapterId: null,
      dictionaryTerms: [],
      userPreferences: {},
      scratchpad: null,
      sidebarCollapsed: false,
      loading: false,
      errors: [],
      unsavedChanges: false,
      autoSaveEnabled: true,
      spellCheckEnabled: true,
      selectedFont: null,

      // Book actions
      setBooks: (books) => set({ books }),
      setSelectedBook: (book) => set({ selectedBook: book, selectedBookId: book?.id || null }),
      setSelectedBookId: (id) => {
        const book = get().books.find(b => b.id === id) || null;
        set({ selectedBookId: id, selectedBook: book });
      },
      addBook: (book) => set((state) => ({ books: [...state.books, book] })),
      updateBook: (id, updates) => set((state) => ({
        books: state.books.map(book => book.id === id ? { ...book, ...updates } : book),
        selectedBook: state.selectedBook?.id === id
          ? { ...state.selectedBook, ...updates }
          : state.selectedBook
      })),
      removeBook: (id) => set((state) => ({
        books: state.books.filter(book => book.id !== id),
        selectedBook: state.selectedBook?.id === id ? null : state.selectedBook,
        selectedBookId: state.selectedBookId === id ? null : state.selectedBookId
      })),

      // Chapter actions
      setChapters: (chapters) => set({ chapters }),
      setSelectedChapter: (chapter) => set({
        selectedChapter: chapter,
        selectedChapterId: chapter?.id || null
      }),
      setSelectedChapterId: (id) => {
        const chapter = get().chapters.find(c => c.id === id) || null;
        set({ selectedChapterId: id, selectedChapter: chapter });
      },
      addChapter: (chapter) => set((state) => ({ chapters: [...state.chapters, chapter] })),
      updateChapter: (id, updates) => set((state) => ({
        chapters: state.chapters.map(chapter =>
          chapter.id === id ? { ...chapter, ...updates } : chapter
        ),
        selectedChapter: state.selectedChapter?.id === id
          ? { ...state.selectedChapter, ...updates }
          : state.selectedChapter
      })),
      removeChapter: (id) => set((state) => ({
        chapters: state.chapters.filter(chapter => chapter.id !== id),
        selectedChapter: state.selectedChapter?.id === id ? null : state.selectedChapter,
        selectedChapterId: state.selectedChapterId === id ? null : state.selectedChapterId
      })),

      // Dictionary actions
      setDictionaryTerms: (terms) => set({ dictionaryTerms: terms }),
      addDictionaryTerm: (term) => set((state) => ({
        dictionaryTerms: [...state.dictionaryTerms, term]
      })),
      updateDictionaryTerm: (id, updates) => set((state) => ({
        dictionaryTerms: state.dictionaryTerms.map(term =>
          term.id === id ? { ...term, ...updates } : term
        )
      })),
      removeDictionaryTerm: (id) => set((state) => ({
        dictionaryTerms: state.dictionaryTerms.filter(term => term.id !== id)
      })),

      // User preferences actions
      setUserPreferences: (preferences) => set({ userPreferences: preferences }),
      updateUserPreference: (key, value) => set((state) => ({
        userPreferences: { ...state.userPreferences, [key]: value }
      })),

      // Scratchpad actions
      setScratchpad: (scratchpad) => set({ scratchpad }),
      updateScratchpadContent: (content) => set((state) =>
        state.scratchpad
          ? { scratchpad: { ...state.scratchpad, content } }
          : { scratchpad: null }
      ),

      // UI actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setLoading: (loading) => set({ loading }),
      addError: (error) => set((state) => ({ errors: [...state.errors, error] })),
      removeError: (id) => set((state) => ({
        errors: state.errors.filter(error => error.id !== id)
      })),
      clearErrors: () => set({ errors: [] }),

      // Editor actions
      setUnsavedChanges: (hasChanges) => set({ unsavedChanges: hasChanges }),
      setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),
      setSpellCheckEnabled: (enabled) => set({ spellCheckEnabled: enabled }),
        setSelectedFont: (font) => set({ selectedFont: font }),
      }),
      {
        name: 'book-master-store',
        // Only persist user preferences, not transient data
        partialize: (state) => ({
          selectedFont: state.selectedFont,
          autoSaveEnabled: state.autoSaveEnabled,
          spellCheckEnabled: state.spellCheckEnabled,
          userPreferences: state.userPreferences,
          sidebarCollapsed: state.sidebarCollapsed,
          scratchpad: state.scratchpad,
        }),
      }
    ),
    {
      name: 'book-master-devtools',
    }
  )
);
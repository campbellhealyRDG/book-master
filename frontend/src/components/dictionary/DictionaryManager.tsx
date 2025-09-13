import React, { useState, useEffect } from 'react';
import { DictionaryTerm, DictionaryStatistics, DictionaryCategory } from '../../types/dictionary';
import { dictionaryService } from '../../services/dictionaryService';
import { spellCheckService } from '../../services/spellChecker';

interface DictionaryManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

const DictionaryManager: React.FC<DictionaryManagerProps> = ({ isVisible, onClose }) => {
  const [terms, setTerms] = useState<DictionaryTerm[]>([]);
  const [statistics, setStatistics] = useState<DictionaryStatistics | null>(null);
  const [categories, setCategories] = useState<DictionaryCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DictionaryCategory | 'all'>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showUserAddedOnly, setShowUserAddedOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newCategory, setNewCategory] = useState<DictionaryCategory>('custom');

  // Edit state
  const [editingTerm, setEditingTerm] = useState<DictionaryTerm | null>(null);
  const [editFormData, setEditFormData] = useState<{
    term: string;
    category: DictionaryCategory;
    is_active: boolean;
  }>({ term: '', category: 'custom', is_active: true });

  useEffect(() => {
    if (isVisible) {
      loadData();
    }
  }, [isVisible, currentPage, searchTerm, selectedCategory, showActiveOnly, showUserAddedOnly]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [termsResponse, statsData, categoriesData] = await Promise.all([
        dictionaryService.getTerms({
          search: searchTerm || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          active: showActiveOnly ? true : undefined,
          user_added: showUserAddedOnly ? true : undefined,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
        }),
        dictionaryService.getStatistics(),
        dictionaryService.getCategories(),
      ]);

      setTerms(termsResponse.data);
      setTotalItems(termsResponse.pagination.total);
      setStatistics(statsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dictionary data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim()) return;

    setLoading(true);
    try {
      await dictionaryService.createTerm({
        term: newTerm.trim(),
        category: newCategory,
        is_active: true,
      });

      setNewTerm('');
      setNewCategory('custom');
      setShowAddForm(false);

      // Refresh spell checker service with new terms
      await spellCheckService.refreshCustomDictionary();

      // Reload data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add term');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTerm = (term: DictionaryTerm) => {
    setEditingTerm(term);
    setEditFormData({
      term: term.term,
      category: term.category,
      is_active: term.is_active,
    });
  };

  const handleUpdateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerm) return;

    setLoading(true);
    try {
      await dictionaryService.updateTerm(editingTerm.id, editFormData);

      setEditingTerm(null);

      // Refresh spell checker service
      await spellCheckService.refreshCustomDictionary();

      // Reload data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update term');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTerm = async (term: DictionaryTerm) => {
    if (!confirm(`Are you sure you want to delete the term "${term.term}"?`)) return;

    setLoading(true);
    try {
      await dictionaryService.deleteTerm(term.id);

      // Refresh spell checker service
      await spellCheckService.refreshCustomDictionary();

      // Reload data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete term');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (term: DictionaryTerm) => {
    setLoading(true);
    try {
      await dictionaryService.toggleTermActive(term.id);

      // Refresh spell checker service
      await spellCheckService.refreshCustomDictionary();

      // Reload data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle term status');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setShowActiveOnly(true);
    setShowUserAddedOnly(false);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Custom Dictionary Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your personal dictionary terms for improved spell checking
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-chrome-green-700">{statistics.total}</div>
                <div className="text-sm text-gray-600">Total Terms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{statistics.inactive}</div>
                <div className="text-sm text-gray-600">Inactive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{statistics.userAdded}</div>
                <div className="text-sm text-gray-600">User Added</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{statistics.systemAdded}</div>
                <div className="text-sm text-gray-600">System Added</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Add Form */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          {/* Search and filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-chrome-green-500 focus:border-chrome-green-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as DictionaryCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-chrome-green-500 focus:border-chrome-green-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="mr-2 text-chrome-green-600 focus:ring-chrome-green-500"
              />
              Active Only
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showUserAddedOnly}
                onChange={(e) => setShowUserAddedOnly(e.target.checked)}
                className="mr-2 text-chrome-green-600 focus:ring-chrome-green-500"
              />
              User Added Only
            </label>
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-chrome-green-600 hover:bg-chrome-green-50 rounded-md"
            >
              Clear Filters
            </button>
          </div>

          {/* Add new term */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-chrome-green-600 hover:bg-chrome-green-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Term
              </button>
              {showAddForm && (
                <form onSubmit={handleAddTerm} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="New term"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-chrome-green-500 focus:border-chrome-green-500"
                    required
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as DictionaryCategory)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-chrome-green-500 focus:border-chrome-green-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-md"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTerm('');
                      setNewCategory('custom');
                    }}
                    className="text-gray-500 hover:text-gray-700 px-2 py-2"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Terms list */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chrome-green-600"></div>
            </div>
          ) : terms.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No terms found matching your criteria.</p>
              <button
                onClick={resetFilters}
                className="text-chrome-green-600 hover:text-chrome-green-700 mt-2"
              >
                Clear filters to see all terms
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {terms.map((term) => (
                <div key={term.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm">
                  {editingTerm?.id === term.id ? (
                    <form onSubmit={handleUpdateTerm} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          value={editFormData.term}
                          onChange={(e) => setEditFormData({...editFormData, term: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-chrome-green-500 focus:border-chrome-green-500"
                          required
                        />
                        <select
                          value={editFormData.category}
                          onChange={(e) => setEditFormData({...editFormData, category: e.target.value as DictionaryCategory})}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-chrome-green-500 focus:border-chrome-green-500"
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editFormData.is_active}
                            onChange={(e) => setEditFormData({...editFormData, is_active: e.target.checked})}
                            className="mr-2 text-chrome-green-600 focus:ring-chrome-green-500"
                          />
                          Active
                        </label>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTerm(null)}
                          className="text-gray-500 hover:text-gray-700 px-3 py-1 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className={`font-medium ${term.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                            {term.term}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-chrome-green-100 text-chrome-green-800">
                            {term.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          {!term.is_active && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                          {term.is_user_added && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              User Added
                            </span>
                          )}
                        </div>
                        {term.created_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Added: {new Date(term.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(term)}
                          disabled={loading}
                          className={`px-3 py-1 rounded text-sm ${
                            term.is_active
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {term.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEditTerm(term)}
                          disabled={loading}
                          className="text-chrome-green-600 hover:bg-chrome-green-50 px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTerm(term)}
                          disabled={loading}
                          className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} terms
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryManager;
import React, { useState } from 'react';
import { useCreateChapter } from '../../hooks/useApi';
import { CreateChapterData } from '../../types';

interface ChapterCreatorProps {
  bookId: number;
  onClose: () => void;
  onSuccess: (newChapter?: any) => void;
}

const ChapterCreator: React.FC<ChapterCreatorProps> = ({ bookId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateChapterData>({
    title: '',
    content: ''
  });
  const [errors, setErrors] = useState<Partial<CreateChapterData>>({});
  
  const createChapterMutation = useCreateChapter(bookId);

  const validate = (): boolean => {
    const newErrors: Partial<CreateChapterData> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const result = await createChapterMutation.mutateAsync(formData);
      const newChapter = result.data.data;
      onSuccess(newChapter);
    } catch (error) {
      console.error('Failed to create chapter:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof CreateChapterData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create New Chapter</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Title Field */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Chapter Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.title 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-chrome-green-200 focus:border-chrome-green-500'
              }`}
              placeholder="Enter chapter title"
              autoFocus
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Content Field */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Initial Content
              <span className="ml-2 text-xs text-gray-500">(Optional - you can add content later in the editor)</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-chrome-green-200 focus:border-chrome-green-500 font-serif"
              placeholder="Start writing your chapter content here..."
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>
                {formData.content ? formData.content.split(/\s+/).filter(word => word.length > 0).length : 0} words
              </span>
              <span>
                {formData.content?.length || 0} characters
              </span>
            </div>
          </div>

          {/* Error Message */}
          {createChapterMutation.isError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <p className="text-sm">
                Failed to create chapter. Please try again.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={createChapterMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-chrome-green-600 rounded-lg hover:bg-chrome-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createChapterMutation.isPending}
            >
              {createChapterMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Chapter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChapterCreator;
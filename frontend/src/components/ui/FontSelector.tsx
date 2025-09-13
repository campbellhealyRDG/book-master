import React, { useState, useCallback } from 'react';
import { useAppStore } from '../../store';

export interface FontOption {
  id: string;
  name: string;
  displayName: string;
  fallback: string;
  category: 'serif' | 'sans-serif' | 'monospace';
  description: string;
}

// Curated font collection for writing
export const FONT_OPTIONS: FontOption[] = [
  // Serif fonts (traditional book writing)
  {
    id: 'georgia',
    name: 'Georgia',
    displayName: 'Georgia',
    fallback: '"Georgia", "Times New Roman", serif',
    category: 'serif',
    description: 'Classic serif font, excellent for long-form reading'
  },
  {
    id: 'times',
    name: 'Times New Roman',
    displayName: 'Times New Roman',
    fallback: '"Times New Roman", "Times", serif',
    category: 'serif',
    description: 'Traditional newspaper font, very readable'
  },
  {
    id: 'crimson',
    name: 'Crimson Text',
    displayName: 'Crimson Text',
    fallback: '"Crimson Text", "Georgia", serif',
    category: 'serif',
    description: 'Modern serif designed for reading'
  },
  {
    id: 'lora',
    name: 'Lora',
    displayName: 'Lora',
    fallback: '"Lora", "Georgia", serif',
    category: 'serif',
    description: 'Contemporary serif with calligraphic influences'
  },
  {
    id: 'minion',
    name: 'Minion Pro',
    displayName: 'Minion Pro',
    fallback: '"Minion Pro", "Georgia", serif',
    category: 'serif',
    description: 'Professional publishing serif font'
  },

  // Sans-serif fonts (modern, clean)
  {
    id: 'helvetica',
    name: 'Helvetica',
    displayName: 'Helvetica',
    fallback: '"Helvetica", "Arial", sans-serif',
    category: 'sans-serif',
    description: 'Clean, neutral sans-serif for modern writing'
  },
  {
    id: 'opensans',
    name: 'Open Sans',
    displayName: 'Open Sans',
    fallback: '"Open Sans", "Helvetica", sans-serif',
    category: 'sans-serif',
    description: 'Friendly and readable humanist sans-serif'
  },
  {
    id: 'source',
    name: 'Source Sans Pro',
    displayName: 'Source Sans Pro',
    fallback: '"Source Sans Pro", "Arial", sans-serif',
    category: 'sans-serif',
    description: 'Adobe\'s clean, professional sans-serif'
  },

  // Monospace fonts (code and technical writing)
  {
    id: 'monaco',
    name: 'Monaco',
    displayName: 'Monaco',
    fallback: '"Monaco", "Consolas", monospace',
    category: 'monospace',
    description: 'Classic monospace for technical writing'
  },
  {
    id: 'sourcecodepro',
    name: 'Source Code Pro',
    displayName: 'Source Code Pro',
    fallback: '"Source Code Pro", "Monaco", monospace',
    category: 'monospace',
    description: 'Adobe\'s programming font, great for structured text'
  }
];

interface FontSelectorProps {
  isVisible: boolean;
  onClose: () => void;
}

const FontSelector: React.FC<FontSelectorProps> = ({ isVisible, onClose }) => {
  const selectedFont = useAppStore((state) => state.selectedFont);
  const setSelectedFont = useAppStore((state) => state.setSelectedFont);

  const [previewText] = useState('The quick brown fox jumps over the lazy dog. This sample text demonstrates how the font appears in your editor.');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFonts = selectedCategory === 'all'
    ? FONT_OPTIONS
    : FONT_OPTIONS.filter(font => font.category === selectedCategory);

  const handleFontSelect = useCallback((font: FontOption) => {
    setSelectedFont(font);
  }, [setSelectedFont]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Select Writing Font</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[600px]">
          {/* Font List */}
          <div className="w-1/2 border-r border-gray-200 overflow-auto">
            {/* Category Filter */}
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100">
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-chrome-green-100 text-chrome-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedCategory('serif')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCategory === 'serif'
                      ? 'bg-chrome-green-100 text-chrome-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Serif
                </button>
                <button
                  onClick={() => setSelectedCategory('sans-serif')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCategory === 'sans-serif'
                      ? 'bg-chrome-green-100 text-chrome-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sans-serif
                </button>
                <button
                  onClick={() => setSelectedCategory('monospace')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCategory === 'monospace'
                      ? 'bg-chrome-green-100 text-chrome-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Monospace
                </button>
              </div>
            </div>

            {/* Font Options */}
            <div className="p-4 space-y-2">
              {filteredFonts.map((font) => (
                <div
                  key={font.id}
                  onClick={() => handleFontSelect(font)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedFont?.id === font.id
                      ? 'bg-chrome-green-50 border-chrome-green-200 text-chrome-green-900'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className="font-medium text-lg"
                        style={{ fontFamily: font.fallback }}
                      >
                        {font.displayName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{font.description}</p>
                      <span className="inline-block px-2 py-1 text-xs bg-white rounded mt-2 capitalize">
                        {font.category.replace('-', ' ')}
                      </span>
                    </div>
                    {selectedFont?.id === font.id && (
                      <div className="text-chrome-green-600">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 p-6 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>

            {selectedFont && (
              <div className="space-y-6">
                {/* Font Info */}
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">{selectedFont.displayName}</h4>
                  <p className="text-sm text-gray-600 mt-1">{selectedFont.description}</p>
                </div>

                {/* Text Preview */}
                <div className="bg-white p-6 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Text Preview</h5>
                  <div
                    className="text-base leading-relaxed text-gray-900"
                    style={{
                      fontFamily: selectedFont.fallback,
                      fontSize: '16px',
                      lineHeight: '1.6'
                    }}
                  >
                    {previewText}
                  </div>
                </div>

                {/* Size Samples */}
                <div className="bg-white p-6 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Different Sizes</h5>
                  <div className="space-y-3">
                    <div
                      style={{
                        fontFamily: selectedFont.fallback,
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}
                      className="text-gray-900"
                    >
                      Small (14px): The quick brown fox jumps over the lazy dog.
                    </div>
                    <div
                      style={{
                        fontFamily: selectedFont.fallback,
                        fontSize: '16px',
                        lineHeight: '1.6'
                      }}
                      className="text-gray-900"
                    >
                      Normal (16px): The quick brown fox jumps over the lazy dog.
                    </div>
                    <div
                      style={{
                        fontFamily: selectedFont.fallback,
                        fontSize: '18px',
                        lineHeight: '1.7'
                      }}
                      className="text-gray-900"
                    >
                      Large (18px): The quick brown fox jumps over the lazy dog.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!selectedFont && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a font to see preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClose}
              disabled={!selectedFont}
              className="px-4 py-2 text-white bg-chrome-green-600 rounded-md hover:bg-chrome-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply Font
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontSelector;
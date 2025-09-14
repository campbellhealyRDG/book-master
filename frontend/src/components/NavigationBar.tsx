import React, { useState } from 'react';
import { useAppStore } from '../store';
import ScratchpadModal from './ScratchpadModal';
import apiService from '../services/apiService';

const NavigationBar: React.FC = () => {
  const { autoSaveEnabled, setAutoSaveEnabled, selectedBook } = useAppStore();
  const [showScratchpad, setShowScratchpad] = useState(false);

  const handleToggleAutosave = () => {
    setAutoSaveEnabled(!autoSaveEnabled);
  };

  const handleSave = async () => {
    if (!selectedBook) {
      alert('Please select a book to save.');
      return;
    }

    // Show format selection dialog
    const format = window.prompt(
      `Choose save format for "${selectedBook.title}":\n\n1. txt (Plain text)\n2. markdown (Markdown format)\n\nEnter "txt" or "markdown":`,
      'txt'
    );

    if (!format || (format !== 'txt' && format !== 'markdown')) {
      return; // User cancelled or entered invalid format
    }

    try {
      // Call API to export the book
      const exportResult = await apiService.exportBook(selectedBook.id, format as 'txt' | 'markdown');

      // Create and trigger download
      const element = document.createElement('a');
      const file = new Blob([exportResult.content], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = exportResult.filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      // Clean up the URL object
      URL.revokeObjectURL(element.href);

    } catch (error) {
      console.error('Error saving book:', error);
      alert('Failed to save the book. Please try again.');
    }
  };

  const handleScratchpad = () => {
    setShowScratchpad(true);
  };

  return (
    <>
      <div className="flex items-center gap-2 md:gap-3">
        {/* Autosave Button */}
        <button
          onClick={handleToggleAutosave}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200
            ${autoSaveEnabled
              ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-300'
            }
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-chrome-green-600
          `}
          title={`Autosave is ${autoSaveEnabled ? 'ON' : 'OFF'}`}
          aria-label={`Toggle autosave. Currently ${autoSaveEnabled ? 'enabled' : 'disabled'}`}
        >
          {/* Light Indicator */}
          <div
            className={`
              w-3 h-3 rounded-full transition-all duration-200
              ${autoSaveEnabled
                ? 'bg-green-500 shadow-md shadow-green-300'
                : 'bg-gray-400'
              }
            `}
          />
          <span className="hidden sm:inline">Autosave</span>
        </button>

        {/* Save/Export Button */}
        <button
          onClick={handleSave}
          className="
            flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm
            bg-blue-100 text-blue-700 hover:bg-blue-200 border-2 border-blue-300
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-chrome-green-600
          "
          title="Save current book to file"
          aria-label="Save current book to file"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Scratchpad Button */}
        <button
          onClick={handleScratchpad}
          className="
            flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm
            bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-2 border-yellow-300
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-chrome-green-600
          "
          title="Open scratchpad notes"
          aria-label="Open scratchpad notes"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="hidden sm:inline">Notes</span>
        </button>
      </div>

      {/* Scratchpad Modal */}
      {showScratchpad && (
        <ScratchpadModal onClose={() => setShowScratchpad(false)} />
      )}
    </>
  );
};

export default NavigationBar;
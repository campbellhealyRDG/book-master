import React, { useState } from 'react';
import { Book, ExportFormat, ExportResult } from '../../types';
import { bookAPI } from '../../services/api';

interface BookExporterProps {
  book: Book;
  isVisible: boolean;
  onClose: () => void;
}

interface ExportState {
  isExporting: boolean;
  format: ExportFormat;
  progress: number;
  result: ExportResult | null;
  error: string | null;
}

const BookExporter: React.FC<BookExporterProps> = ({ book, isVisible, onClose }) => {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    format: 'txt',
    progress: 0,
    result: null,
    error: null,
  });

  const handleFormatChange = (format: ExportFormat) => {
    setExportState(prev => ({
      ...prev,
      format,
      result: null,
      error: null,
    }));
  };

  const handleExport = async () => {
    if (exportState.isExporting) return;

    setExportState(prev => ({
      ...prev,
      isExporting: true,
      progress: 0,
      result: null,
      error: null,
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 100);

      // Call the export API
      const response = await bookAPI.exportBook(book.id, exportState.format);

      clearInterval(progressInterval);

      if (response.data.success) {
        setExportState(prev => ({
          ...prev,
          progress: 100,
          isExporting: false,
          result: response.data.data,
        }));
      } else {
        throw new Error(response.data.message || 'Export failed');
      }
    } catch (error) {
      setExportState(prev => ({
        ...prev,
        isExporting: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Export failed. Please try again.',
      }));
    }
  };

  const handleDownload = () => {
    if (!exportState.result) return;

    // Create a blob with the content
    const blob = new Blob([exportState.result.content], {
      type: exportState.format === 'markdown' ? 'text/markdown' : 'text/plain',
    });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportState.result.filename;
    link.style.display = 'none';

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    // Reset state when closing
    setExportState({
      isExporting: false,
      format: 'txt',
      progress: 0,
      result: null,
      error: null,
    });
    onClose();
  };

  const formatDisplayName = (format: ExportFormat): string => {
    switch (format) {
      case 'txt':
        return 'Plain Text';
      case 'markdown':
        return 'Markdown';
      default:
        return format.toUpperCase();
    }
  };

  const formatDescription = (format: ExportFormat): string => {
    switch (format) {
      case 'txt':
        return 'Export as a plain text file with formatted chapters and book metadata';
      case 'markdown':
        return 'Export as a Markdown file with headers, formatting, and table of contents';
      default:
        return '';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export Book</h2>
            <p className="text-sm text-gray-500 mt-1">
              Export "{book.title}" by {book.author}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={exportState.isExporting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Format Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Export Format</h3>
            <div className="space-y-3">
              {(['txt', 'markdown'] as ExportFormat[]).map((format) => (
                <label
                  key={format}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportState.format === format
                      ? 'border-chrome-green-500 bg-chrome-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${exportState.isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format}
                    checked={exportState.format === format}
                    onChange={() => handleFormatChange(format)}
                    disabled={exportState.isExporting}
                    className="mt-1 text-chrome-green-600 focus:ring-chrome-green-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDisplayName(format)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatDescription(format)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {exportState.isExporting && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Exporting...</span>
                <span className="text-sm text-gray-500">{exportState.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-chrome-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportState.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {exportState.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Export Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{exportState.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {exportState.result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-green-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800">Export Successful</h3>
                  <div className="text-sm text-green-700 mt-1">
                    <p>Your book has been exported successfully!</p>
                    <p className="mt-1">
                      <strong>Format:</strong> {formatDisplayName(exportState.result.format)} <br />
                      <strong>File size:</strong> {(exportState.result.size / 1024).toFixed(1)} KB <br />
                      <strong>Filename:</strong> {exportState.result.filename}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Book Statistics */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Book Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Chapters:</span>
                <span className="ml-2 font-medium">{book.chapterCount}</span>
              </div>
              <div>
                <span className="text-gray-500">Words:</span>
                <span className="ml-2 font-medium">{book.wordCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {exportState.result ? 'Ready to download' : 'Choose a format and export'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={exportState.isExporting}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            {exportState.result ? (
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-white bg-chrome-green-600 rounded-md hover:bg-chrome-green-700 transition-colors flex items-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            ) : (
              <button
                onClick={handleExport}
                disabled={exportState.isExporting}
                className="px-4 py-2 text-white bg-chrome-green-600 rounded-md hover:bg-chrome-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {exportState.isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Export Book
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookExporter;
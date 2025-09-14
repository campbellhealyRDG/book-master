import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  currentPageWordCount?: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  canGoPrevious,
  canGoNext,
  onPreviousPage,
  onNextPage,
  onGoToPage,
  currentPageWordCount
}) => {
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onGoToPage(page);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Show first page and ellipsis if needed
    if (startPage > 1) {
      pageNumbers.push(
        <button
          key={1}
          onClick={() => onGoToPage(1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700 rounded-md transition-colors"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pageNumbers.push(
          <span key="ellipsis1" className="px-2 py-2 text-gray-400">
            ...
          </span>
        );
      }
    }

    // Show page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => onGoToPage(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            i === currentPage
              ? 'text-white bg-chrome-green-600 border border-chrome-green-600'
              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
          }`}
          aria-current={i === currentPage ? 'page' : undefined}
        >
          {i}
        </button>
      );
    }

    // Show ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span key="ellipsis2" className="px-2 py-2 text-gray-400">
            ...
          </span>
        );
      }
      pageNumbers.push(
        <button
          key={totalPages}
          onClick={() => onGoToPage(totalPages)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700 rounded-md transition-colors"
        >
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  };

  if (totalPages <= 1) {
    return null; // Don't show pagination for single page
  }

  return (
    <div className="flex items-center justify-between py-4 px-6 bg-white border-t border-gray-200">
      {/* Page Info */}
      <div className="flex items-center text-sm text-gray-500 space-x-4">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        {currentPageWordCount !== undefined && (
          <>
            <span>•</span>
            <span>{currentPageWordCount.toLocaleString()} words on this page</span>
          </>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={onPreviousPage}
          disabled={!canGoPrevious}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Go to previous page"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {/* Page Numbers */}
        <div className="hidden md:flex items-center space-x-1">
          {renderPageNumbers()}
        </div>

        {/* Direct Page Input (Mobile) */}
        <div className="flex md:hidden items-center space-x-2">
          <span className="text-sm text-gray-500">Go to:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={handlePageInputChange}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chrome-green-500 focus:border-chrome-green-500"
          />
        </div>

        {/* Next Button */}
        <button
          onClick={onNextPage}
          disabled={!canGoNext}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Go to next page"
        >
          Next
          <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Quick Jump (Desktop) */}
      <div className="hidden lg:flex items-center space-x-2">
        <span className="text-sm text-gray-500">Jump to page:</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={handlePageInputChange}
          className="w-20 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chrome-green-500 focus:border-chrome-green-500"
          aria-label="Jump to page"
        />
      </div>
    </div>
  );
};

export default PaginationControls;
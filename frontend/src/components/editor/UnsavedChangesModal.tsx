import React from 'react';

interface UnsavedChangesModalProps {
  onSave: () => void;
  onDontSave: () => void;
  onCancel: () => void;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  onSave,
  onDontSave,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                Unsaved Changes
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                You have unsaved changes to this chapter. Would you like to save them before continuing?
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onSave}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-chrome-green-600 hover:bg-chrome-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chrome-green-500"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onDontSave}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chrome-green-500"
          >
            Don't Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chrome-green-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesModal;
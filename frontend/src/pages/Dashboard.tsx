import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-chrome-green-600 mb-4">
                Book Master Dashboard
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Welcome to your professional British English book editing application.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold text-chrome-green-600 mb-2">
                    My Books
                  </h3>
                  <p className="text-gray-600">
                    View and manage your book collection
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold text-chrome-green-600 mb-2">
                    Editor
                  </h3>
                  <p className="text-gray-600">
                    Write and edit your manuscripts with British English spell checking
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold text-chrome-green-600 mb-2">
                    Dictionary
                  </h3>
                  <p className="text-gray-600">
                    Manage your custom British English dictionary
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
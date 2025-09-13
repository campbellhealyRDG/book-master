import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Dashboard from '../pages/Dashboard';
import Books from '../pages/Books';
import Editor from '../pages/Editor';
import Dictionary from '../pages/Dictionary';

// Create the router with all routes
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'books',
        element: <Books />,
      },
      {
        path: 'books/:bookId',
        element: <Books />,
      },
      {
        path: 'editor',
        element: <Editor />,
      },
      {
        path: 'editor/:bookId/:chapterId?',
        element: <Editor />,
      },
      {
        path: 'dictionary',
        element: <Dictionary />,
      },
    ],
    errorElement: <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h1>
        <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-chrome-green-600 hover:bg-chrome-green-700"
        >
          Return Home
        </a>
      </div>
    </div>,
  },
]);

export default router;
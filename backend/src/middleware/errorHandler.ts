import { Request, Response, NextFunction } from 'express';
import { ApiError } from './validation.js';

export interface CustomError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let errorType = 'ServerError';

  // Handle specific error types
  if (error.message.includes('validation failed') || error.message.includes('required')) {
    statusCode = 400;
    errorType = 'ValidationError';
  } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
    statusCode = 404;
    errorType = 'NotFoundError';
  } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
    statusCode = 409;
    errorType = 'ConflictError';
  } else if (error.message.includes('unauthorized') || error.message.includes('permission')) {
    statusCode = 403;
    errorType = 'ForbiddenError';
  }

  // Create standardised error response
  const apiError: ApiError = {
    error: errorType,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'An internal server error occurred' 
      : message,
    details: error.details,
    timestamp: new Date().toISOString(),
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    (apiError as any).stack = error.stack;
  }

  res.status(statusCode).json(apiError);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const apiError: ApiError = {
    error: 'NotFoundError',
    message: `The requested endpoint ${req.method} ${req.path} was not found`,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(apiError);
};

export const createCustomError = (
  message: string,
  statusCode: number = 500,
  details?: any
): CustomError => {
  const error = new Error(message) as CustomError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
};
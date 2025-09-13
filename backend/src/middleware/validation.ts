import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError {
  error: string;
  message: string;
  details?: ValidationError[];
  timestamp: string;
}

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors: ValidationError[] = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    const apiError: ApiError = {
      error: 'Validation failed',
      message: 'The request contains invalid data. Please check the provided fields.',
      details: validationErrors,
      timestamp: new Date().toISOString(),
    };

    res.status(400).json(apiError);
    return;
  }
  
  next();
};

export const validateRequest = (validations: ValidationChain[]) => {
  return [...validations, handleValidationErrors];
};

export const createErrorResponse = (
  error: string,
  message: string,
  statusCode: number = 500,
  details?: any
): { statusCode: number; response: ApiError } => {
  return {
    statusCode,
    response: {
      error,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
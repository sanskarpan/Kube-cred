import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const workerId = process.env.WORKER_ID || 'unknown-worker';
  
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    workerId
  });

  const response: ApiResponse = {
    success: false,
    message,
    worker_id: workerId,
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const workerId = process.env.WORKER_ID || 'unknown-worker';
  
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
    worker_id: workerId,
    timestamp: new Date().toISOString()
  };

  res.status(404).json(response);
};


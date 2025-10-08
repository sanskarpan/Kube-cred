import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiResponse } from '../types';

export const createRateLimiter = () => {
  return rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
    message: (_req: Request, _res: Response) => {
      const workerId = process.env.WORKER_ID || 'unknown-worker';
      
      const response: ApiResponse = {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };
      
      return response;
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response) => {
      const workerId = process.env.WORKER_ID || 'unknown-worker';
      
      const response: ApiResponse = {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };
      
      res.status(429).json(response);
    }
  });
};


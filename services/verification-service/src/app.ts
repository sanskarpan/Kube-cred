import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { database } from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createRateLimiter } from './middleware/rateLimiter';
import verificationRoutes from './routes/verifications';
import healthRoutes from './routes/health';

// Load environment variables
dotenv.config();

export const createApp = async (): Promise<express.Application> => {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-frontend-domain.com'] 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Rate limiting
  app.use(createRateLimiter());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      workerId: process.env.WORKER_ID
    });
    next();
  });

  // Initialize database connection
  try {
    await database.connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }

  // Routes
  app.use('/health', healthRoutes);
  app.use('/api/verifications', verificationRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    const workerId = process.env.WORKER_ID || 'unknown-worker';
    res.json({
      success: true,
      message: 'Kube Credential Verification Service',
      service: 'credential-verification',
      version: '1.0.0',
      worker_id: workerId,
      timestamp: new Date().toISOString()
    });
  });

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

// Graceful shutdown handler
export const setupGracefulShutdown = (server: any) => {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        await database.close();
        logger.info('Database connection closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force close server after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};


import { createApp, setupGracefulShutdown } from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3002;
const WORKER_ID = process.env.WORKER_ID || `worker-${Math.floor(Math.random() * 1000)}`;

async function startServer() {
  try {
    const app = await createApp();
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Credential Verification Service started`, {
        port: PORT,
        workerId: WORKER_ID,
        nodeEnv: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();


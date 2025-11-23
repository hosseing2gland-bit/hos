import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import config from './config/config.js';
import database from './config/database.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import {
  securityHeaders,
  preventNoSQLInjection,
  preventParameterPollution,
  customSecurityHeaders,
  configureTrustedProxy,
} from './middleware/security.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { sanitizeInput } from './middleware/validation.js';

const app = express();

// Trust proxy
configureTrustedProxy(app);

// Security middleware
app.use(securityHeaders);
app.use(customSecurityHeaders);
app.use(preventNoSQLInjection);
app.use(preventParameterPollution);

// CORS configuration
app.use(cors(config.cors));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression
app.use(compression());

// Request sanitization
app.use(sanitizeInput);

// Logging
if (config.isDevelopment()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Rate limiting
app.use('/api/', apiLimiter);

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Anti-Detect Browser API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();
    logger.info('Database connected successfully');

    // Start listening
    const server = app.listen(config.port, config.host, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Anti-Detect Browser API Server                       ║
║                                                            ║
║   Environment: ${config.env.toUpperCase().padEnd(44)}║
║   Server:      http://${config.host}:${config.port.toString().padEnd(33)}║
║   API:         http://${config.host}:${config.port}/api/v1${' '.repeat(21)}║
║                                                            ║
║   📚 Features:                                             ║
║      ✓ Authentication & Authorization                     ║
║      ✓ Profile Management                                 ║
║      ✓ Fingerprint Spoofing                               ║
║      ✓ Proxy Support                                      ║
║      ✓ Cloud Sync (AWS S3)                                ║
║      ✓ Team Collaboration                                 ║
║      ✓ API Automation                                     ║
║                                                            ║
║   🔒 Security:                                             ║
║      ✓ AES-256 Encryption                                 ║
║      ✓ JWT Authentication                                 ║
║      ✓ Rate Limiting                                      ║
║      ✓ Input Validation & Sanitization                    ║
║      ✓ Security Headers (Helmet)                          ║
║      ✓ NoSQL Injection Prevention                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await database.disconnect();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;

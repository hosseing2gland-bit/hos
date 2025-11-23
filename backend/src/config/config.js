import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiVersion: process.env.API_VERSION || 'v1',
  appName: process.env.APP_NAME || 'Anti-Detect Browser',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3001',

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/antidetect_browser',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/antidetect_browser_test',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-change-this',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    resetPasswordExpiresIn: process.env.JWT_RESET_PASSWORD_EXPIRES_IN || '10m',
  },

  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'fallback-32-char-key-changethis',
    algorithm: 'aes-256-gcm',
  },

  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'antidetect-profiles',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // Security
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
  sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret',

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
    allowedMimeTypes: ['application/json', 'text/plain'],
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@antidetect.com',
  },

  // Feature Flags
  features: {
    cloudSync: process.env.ENABLE_CLOUD_SYNC === 'true',
    teamCollaboration: process.env.ENABLE_TEAM_COLLABORATION === 'true',
    apiAutomation: process.env.ENABLE_API_AUTOMATION === 'true',
    auditLog: process.env.ENABLE_AUDIT_LOG === 'true',
  },

  // Monitoring
  metrics: {
    enabled: process.env.ENABLE_METRICS === 'true',
    port: parseInt(process.env.METRICS_PORT || '9090', 10),
  },

  // Validation
  isProduction() {
    return this.env === 'production';
  },

  isDevelopment() {
    return this.env === 'development';
  },

  isTest() {
    return this.env === 'test';
  },
};

// Validate critical configuration
if (config.isProduction()) {
  const requiredEnvVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'MONGODB_URI',
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar] || process.env[envVar].includes('fallback') || process.env[envVar].includes('change')
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing or invalid required environment variables in production: ${missingEnvVars.join(', ')}`
    );
  }

  // Validate key lengths
  if (config.encryption.key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters for AES-256');
  }

  if (config.jwt.secret.length < 64) {
    console.warn('WARNING: JWT_SECRET should be at least 64 characters in production');
  }
}

export default config;

/**
 * Configuration Management
 *
 * This file loads and validates environment variables at startup.
 * If critical variables are missing, the application exits with an error.
 *
 * All config should be accessed from this single source of truth.
 */

import dotenv from 'dotenv';

// Load .env file
dotenv.config();

/**
 * Utility to get environment variable with optional default value.
 * Throws error if required variable is missing.
 */
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

/**
 * Centralized configuration object.
 * Access this instead of process.env throughout the app.
 */
export const config = {
  // Application environment
  nodeEnv: getEnv('NODE_ENV', 'development'),
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Server configuration
  server: {
    port: parseInt(getEnv('SERVER_PORT', '5000'), 10),
    host: getEnv('SERVER_HOST', '0.0.0.0'),
  },

  // Database configuration
  database: {
    url: getEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/pern_dev'),
    host: getEnv('DB_HOST', 'localhost'),
    port: parseInt(getEnv('DB_PORT', '5432'), 10),
    name: getEnv('DB_NAME', 'pern_dev'),
    user: getEnv('DB_USER', 'postgres'),
    password: getEnv('DB_PASSWORD', 'postgres'),
  },

  // Redis configuration
  redis: {
    url: getEnv('REDIS_URL', 'redis://localhost:6379'),
    host: getEnv('REDIS_HOST', 'localhost'),
    port: parseInt(getEnv('REDIS_PORT', '6379'), 10),
  },

  // Authentication secrets
  secrets: {
    jwtSecret: getEnv('JWT_SECRET', 'dev-secret-change-in-production'),
    jwtExpiry: getEnv('JWT_EXPIRY', '24h'),
    sessionSecret: getEnv('SESSION_SECRET', 'dev-secret-change-in-production'),
  },

  // CORS configuration
  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:5173,http://localhost:3000').split(','),
  },

  // Logging configuration
  logging: {
    level: getEnv('LOG_LEVEL', 'debug'),
  },

  // Email configuration (for Bull job examples)
  email: {
    smtpHost: getEnv('SMTP_HOST', 'localhost'),
    smtpPort: parseInt(getEnv('SMTP_PORT', '25'), 10),
    smtpUser: getEnv('SMTP_USER', ''),
    smtpPass: getEnv('SMTP_PASS', ''),
  },
};

// Validate critical configuration on startup
if (!config.database.url && !config.database.host) {
  throw new Error('Database configuration is incomplete. Set DATABASE_URL or DB_HOST.');
}

export default config;

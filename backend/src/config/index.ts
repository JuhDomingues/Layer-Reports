import dotenv from 'dotenv';

dotenv.config();

// Define allowed origins
const allowedOrigins = [
  'https://reports.layermarketing.com.br',
  'http://localhost:8000', // Frontend dev
  'http://localhost:3000'  // Alternative frontend dev
];

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001'),
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : allowedOrigins,

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key',
  JWT_EXPIRES_IN: '7d',

  // Facebook
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
  FACEBOOK_GRAPH_API_VERSION: 'v18.0',
  FACEBOOK_BASE_URL: 'https://graph.facebook.com',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // Cache
  FACEBOOK_CACHE_TTL: parseInt(process.env.FACEBOOK_CACHE_TTL || '300'), // 5 minutes
  
  // Development
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validate required environment variables
const requiredVars = ['JWT_SECRET'];

if (config.isProduction) {
  requiredVars.push('DATABASE_URL', 'FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET');
}

for (const varName of requiredVars) {
  const key = varName as keyof typeof config;
  if (!config[key]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}
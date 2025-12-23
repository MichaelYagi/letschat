import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || './data/chat.db',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  encryption: {
    algorithm: 'aes-256-gcm',
    key: process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars',
    iv: process.env.ENCRYPTION_IV || 'default-iv-16-ch',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    uploadPath: process.env.UPLOAD_PATH || './data/uploads',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './data/logs/app.log',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  websocket: {
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000'),
    maxConnectionsPerUser: parseInt(
      process.env.WS_MAX_CONNECTIONS_PER_USER || '5'
    ),
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    sessionSecret: process.env.SESSION_SECRET || 'default-session-secret',
  },

  cors: {
    origin: process.env.DEV_CORS_ORIGIN || [
      'http://localhost:5173',
      'http://localhost:5174',
    ],
  },
};

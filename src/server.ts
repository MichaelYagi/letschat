import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { authMiddleware } from './config/jwt';
import { setupRoutes } from './routes';
import { setupWebSocket } from './websocket';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

// Security middleware (configured for development)
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for development
    crossOriginEmbedderPolicy: false, // Allow cross-origin requests
  })
);

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const allowedOrigins = Array.isArray(config.cors.origin)
    ? config.cors.origin
    : [config.cors.origin];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.sendStatus(200);
});

app.use(
  cors({
    origin: Array.isArray(config.cors.origin)
      ? config.cors.origin
      : [config.cors.origin],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
  })
);

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api', setupRoutes());

// Swagger documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Let's Chat API Documentation",
  })
);

// WebSocket setup
setupWebSocket(io);

// Error handling
app.use(errorHandler);

const PORT = config.port;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Database: ${config.database.url}`);
});

export { app, server };

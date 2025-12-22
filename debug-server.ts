import express from 'express';
import { createServer } from 'http';
import { config } from './src/config';
import { setupRoutes } from './src/routes';
import { logger } from './src/utils/logger';

const app = express();
const server = createServer(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api', setupRoutes());

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export { app, server };

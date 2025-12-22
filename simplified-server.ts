import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './src/config';
import { setupRoutes } from './src/routes';

console.log('🚀 Starting simplified real server...');

const app = express();
const server = createServer(app);

// Basic middleware
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Real API routes
console.log('Loading real routes...');
try {
  app.use('/api', setupRoutes());
  console.log('✅ Real routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load routes:', error);
  process.exit(1);
}

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`🚀 Simplified real server running on port ${PORT}`);
  console.log(`📊 Database: ${config.database.url}`);
  console.log(`🔗 Frontend: http://localhost:5173`);
  console.log(`📝 API: http://localhost:${PORT}/api/auth/register`);
});

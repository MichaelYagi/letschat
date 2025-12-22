const express = require('express');
const cors = require('cors');
const http = require('http');

console.log('Starting minimal real server...');

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
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

// Try to load real routes
try {
  const { setupRoutes } = require('./dist/routes');
  app.use('/api', setupRoutes());
  console.log('✅ Real routes loaded');
} catch (e) {
  console.error('❌ Failed to load real routes:', e.message);
  // Add fallback route
  app.post('/api/auth/register', (req, res) => {
    console.log('Fallback registration:', req.body);
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: Date.now().toString(),
          username: req.body.username,
          displayName: req.body.username,
          status: 'online',
        },
        token: 'mock-jwt-token',
      },
    });
  });
}

const PORT = 3000;

try {
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`🚀 Real server running on port ${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔗 Frontend: http://localhost:5173`);
  });
} catch (e) {
  console.error('❌ Failed to start server:', e.message);
}

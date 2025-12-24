import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './config';

const app = express();
const server = createServer(app);

// Basic CORS setup
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Simple friend request test endpoint
app.post('/api/test-friend-request', async (req, res) => {
  try {
    const { username } = req.body;
    console.log('Received friend request test for username:', username);
    res.json({
      success: true,
      message: `Friend request received for ${username}`,
      received: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

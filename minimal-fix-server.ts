import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const server = createServer(app);

// CORS configuration
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
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

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mock auth endpoints
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    data: {
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      token: 'mock-token-123',
    },
  });
});

app.get('/api/auth/search', (req, res) => {
  const { q, limit = 10 } = req.query;
  res.json({
    success: true,
    data: [
      { id: '1', username: `${q}user1`, email: 'user1@example.com' },
      { id: '2', username: `${q}user2`, email: 'user2@example.com' },
    ].slice(0, parseInt(limit)),
  });
});

app.post('/api/v1/connections/request', (req, res) => {
  res.json({
    success: true,
    data: { id: 'req-1', status: 'pending' },
  });
});

app.get('/api/v1/connections', (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

// Mock notifications endpoint
app.get('/api/v1/notifications', (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

app.get('/api/v1/notifications/counts', (req, res) => {
  res.json({
    success: true,
    data: {
      total: 0,
      messages: 0,
      connection_requests: 0,
      mentions: 0,
      system: 0,
    },
  });
});

// WebSocket setup
const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

io.on('connection', socket => {
  console.log('WebSocket client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(
    `🌐 Frontend URLs allowed: http://localhost:5173, http://localhost:5174`
  );
});

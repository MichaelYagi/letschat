const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');

const app = express();
const server = createServer(app);

// CORS configuration with preflight handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (['http://localhost:5173', 'http://localhost:5174'].includes(origin)) {
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

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

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

// Message history endpoint
app.get('/api/v1/conversations/:conversationId/messages', (req, res) => {
  const { conversationId } = req.params;
  res.json({
    success: true,
    data: [
      {
        id: 'msg-1',
        conversationId,
        senderId: '1',
        sender: {
          id: '1',
          username: 'alice',
          displayName: 'Alice',
        },
        content: 'Hello! This is a historical message.',
        contentType: 'text',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: true,
        isOwn: false,
      },
      {
        id: 'msg-2',
        conversationId,
        senderId: '2',
        sender: {
          id: '2',
          username: 'bob',
          displayName: 'Bob',
        },
        content: 'This is another message from the past.',
        contentType: 'text',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        isRead: false,
        isOwn: false,
      },
    ],
  });
});

// Message sending endpoint
app.post('/api/v1/conversations/:conversationId/messages', (req, res) => {
  const { conversationId } = req.params;
  const { content, replyToId } = req.body;

  const newMessage = {
    id: `msg-${Date.now()}`,
    conversationId,
    senderId: '1',
    sender: {
      id: '1',
      username: 'testuser',
      displayName: 'Test User',
    },
    content,
    contentType: 'text',
    timestamp: new Date().toISOString(),
    isRead: false,
    isOwn: true,
    replyToId,
  };

  res.json({
    success: true,
    data: newMessage,
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

// Message reactions endpoints
app.post('/api/v1/messages/reactions', (req, res) => {
  const { messageId, emoji, conversationId } = req.body;
  res.json({
    success: true,
    data: { messageId, emoji, added: true },
  });
});

app.delete('/api/v1/messages/reactions', (req, res) => {
  const { messageId, emoji, conversationId } = req.body;
  res.json({
    success: true,
    data: { messageId, emoji, removed: true },
  });
});

// Read receipts endpoints
app.post('/api/v1/messages/read-receipts', (req, res) => {
  const { messageId, conversationId } = req.body;
  res.json({
    success: true,
    data: { messageId, read: true },
  });
});

app.post('/api/v1/messages/mark-read', (req, res) => {
  const { conversationId } = req.body;
  res.json({
    success: true,
    data: { conversationId, marked: true },
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

// Store messages for broadcasting
let messages = [];

io.on('connection', socket => {
  console.log('WebSocket client connected:', socket.id);

  // Join conversation room
  socket.on('join_conversation', data => {
    const { conversationId } = data;
    socket.join(conversationId);
    console.log(`Client ${socket.id} joined conversation ${conversationId}`);
  });

  // Handle new messages
  socket.on('send_message', data => {
    const { conversationId, content, replyToId } = data;

    const newMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: '1',
      sender: {
        id: '1',
        username: 'testuser',
        displayName: 'Test User',
      },
      content,
      contentType: 'text',
      timestamp: new Date().toISOString(),
      isRead: false,
      isOwn: true,
      replyToId,
    };

    messages.push(newMessage);
    io.to(conversationId).emit('new_message', newMessage);
    console.log('New message sent:', newMessage);
  });

  // Handle typing indicators
  socket.on('typing', data => {
    const { conversationId, isTyping } = data;
    socket.to(conversationId).emit('typing', [
      {
        conversationId,
        userId: socket.id,
        isTyping,
      },
    ]);
  });

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

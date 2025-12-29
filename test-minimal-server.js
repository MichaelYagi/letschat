const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', username);

  if (username && password) {
    res.json({
      success: true,
      token: 'mock-jwt-token',
      user: { id: 1, username, displayName: username },
    });
  } else {
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, displayName } = req.body;
  console.log('Registration attempt:', username);

  if (username && password) {
    res.json({
      success: true,
      token: 'mock-jwt-token',
      user: { id: Date.now(), username, displayName: displayName || username },
    });
  } else {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// User search endpoint
app.get('/api/users/search', (req, res) => {
  const query = req.query.q;
  console.log('User search:', query);

  if (query) {
    res.json([
      { id: 2, username: 'testuser', displayName: 'Test User' },
      { id: 3, username: 'alice', displayName: 'Alice' },
      { id: 4, username: 'bob', displayName: 'Bob' },
    ]);
  } else {
    res.json([]);
  }
});

// Connection endpoints
app.get('/api/connections', (req, res) => {
  res.json([
    {
      id: 2,
      username: 'testuser',
      displayName: 'Test User',
      status: 'connected',
    },
    { id: 3, username: 'alice', displayName: 'Alice', status: 'pending' },
  ]);
});

app.post('/api/connections/request', (req, res) => {
  const { username } = req.body;
  console.log('Connection request:', username);
  res.json({ success: true });
});

app.post('/api/connections/:id/accept', (req, res) => {
  console.log('Connection accepted:', req.params.id);
  res.json({ success: true });
});

// Conversation endpoints
app.get('/api/conversations', (req, res) => {
  res.json([
    {
      id: 1,
      type: 'direct',
      name: 'Test User',
      participants: [{ id: 2, username: 'testuser', displayName: 'Test User' }],
      lastMessage: { content: 'Hello!', createdAt: new Date().toISOString() },
    },
  ]);
});

app.post('/api/conversations', (req, res) => {
  const { type, name, participantIds } = req.body;
  console.log('Create conversation:', { type, name, participantIds });

  res.json({
    id: Date.now(),
    type,
    name,
    participants: participantIds.map(id => ({
      id,
      username: `user${id}`,
      displayName: `User ${id}`,
    })),
  });
});

app.get('/api/conversations/:id/messages', (req, res) => {
  res.json([
    {
      id: 1,
      content: 'Hello there!',
      senderId: 2,
      senderUsername: 'testuser',
      createdAt: new Date().toISOString(),
    },
  ]);
});

app.post('/api/conversations/:id/messages', (req, res) => {
  const { content } = req.body;
  console.log('Message sent:', content);

  res.json({
    id: Date.now(),
    content,
    senderId: 1,
    senderUsername: 'currentuser',
    createdAt: new Date().toISOString(),
  });
});

// WebSocket connection handling
io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join-conversation', conversationId => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('send-message', data => {
    const { conversationId, content } = data;
    console.log('Message via WebSocket:', { conversationId, content });

    // Broadcast to all users in the conversation
    io.to(conversationId).emit('new-message', {
      id: Date.now(),
      content,
      senderId: 1,
      senderUsername: 'currentuser',
      createdAt: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});

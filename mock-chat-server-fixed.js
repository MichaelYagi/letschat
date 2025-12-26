const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

// Mock data
let nextMessageId = 1;
const mockMessages = {
  1: [
    {
      id: '1',
      conversationId: '1',
      senderId: '2',
      content: 'Hey there!',
      contentType: 'text',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      conversationId: '1',
      senderId: '1',
      content: 'Hi Bob! How are you?',
      contentType: 'text',
      createdAt: new Date(Date.now() - 3000000).toISOString(),
      updatedAt: new Date(Date.now() - 3000000).toISOString(),
    },
  ],
  2: [
    {
      id: '3',
      conversationId: '2',
      senderId: '3',
      content: 'Meeting at 3pm',
      contentType: 'text',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
};

const mockConversations = [
  {
    id: '1',
    type: 'direct',
    name: null,
    participant: {
      username: 'bob',
      status: 'online',
    },
    lastMessage: mockMessages['1'][mockMessages['1'].length - 1],
    unreadCount: 2,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    type: 'group',
    name: 'Chat Team',
    participant: null,
    lastMessage: mockMessages['2'][mockMessages['2'].length - 1],
    unreadCount: 0,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const mockUsers = {
  alice: {
    id: '1',
    username: 'alice',
    password: 'password123',
    displayName: 'Alice',
  },
  bob: {
    id: '2',
    username: 'bob',
    password: 'password456',
    displayName: 'Bob',
  },
};

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  const user = mockUsers[username];
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
      token: 'mock-jwt-token-' + Date.now(),
    },
  });
});

app.get('/api/messages/conversations', (req, res) => {
  res.json({
    success: true,
    data: mockConversations,
  });
});

app.post('/api/messages/conversations', (req, res) => {
  const { type, participantIds } = req.body;

  const conversationId = Date.now().toString();
  const newConversation = {
    id: conversationId,
    type: type || 'direct',
    name: null,
    participant: {
      username: 'newuser',
      status: 'online',
    },
    lastMessage: null,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockMessages[conversationId] = [];
  mockConversations.unshift(newConversation);

  res.json({
    success: true,
    data: newConversation,
  });
});

// Messages endpoints
app.get('/v1/conversations/:conversationId/messages', (req, res) => {
  const { conversationId } = req.params;
  const messages = mockMessages[conversationId] || [];

  res.json({
    success: true,
    data: messages,
  });
});

app.post('/v1/conversations/:conversationId/messages', (req, res) => {
  const { conversationId } = req.params;
  const { content, replyToId } = req.body;

  if (!mockMessages[conversationId]) {
    mockMessages[conversationId] = [];
  }

  const newMessage = {
    id: (nextMessageId++).toString(),
    conversationId,
    senderId: '1',
    content,
    contentType: 'text',
    replyToId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockMessages[conversationId].push(newMessage);

  const conversation = mockConversations.find(c => c.id === conversationId);
  if (conversation) {
    conversation.lastMessage = newMessage;
    conversation.updatedAt = new Date().toISOString();
  }

  // Emit to all connected clients
  io.to(conversationId).emit('new_message', newMessage);

  res.json({
    success: true,
    data: newMessage,
  });
});

app.put('/v1/messages/:messageId', (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  for (const conversationId in mockMessages) {
    const messageIndex = mockMessages[conversationId].findIndex(
      m => m.id === messageId
    );
    if (messageIndex !== -1) {
      mockMessages[conversationId][messageIndex].content = content;
      mockMessages[conversationId][messageIndex].updatedAt =
        new Date().toISOString();

      res.json({
        success: true,
        data: mockMessages[conversationId][messageIndex],
      });
      return;
    }
  }

  res.status(404).json({
    success: false,
    error: 'Message not found',
  });
});

app.delete('/v1/messages/:messageId', (req, res) => {
  const { messageId } = req.params;

  for (const conversationId in mockMessages) {
    const messageIndex = mockMessages[conversationId].findIndex(
      m => m.id === messageId
    );
    if (messageIndex !== -1) {
      const deletedMessage = mockMessages[conversationId].splice(
        messageIndex,
        1
      )[0];

      res.json({
        success: true,
        data: deletedMessage,
      });
      return;
    }
  }

  res.status(404).json({
    success: false,
    error: 'Message not found',
  });
});

app.post('/v1/messages/:messageId/reactions', (req, res) => {
  res.json({
    success: true,
    data: { emoji: req.body.emoji, action: 'added' },
  });
});

app.delete('/v1/messages/:messageId/reactions', (req, res) => {
  res.json({
    success: true,
    data: { emoji: req.body.emoji, action: 'removed' },
  });
});

// WebSocket events
io.on('connection', socket => {
  console.log('📱 User connected:', socket.id);
  socket.userId = '1'; // Mock current user

  socket.on('join_conversation', ({ conversationId }) => {
    socket.join(conversationId);
    console.log(`👥 User joined conversation: ${conversationId}`);
  });

  socket.on('leave_conversation', ({ conversationId }) => {
    socket.leave(conversationId);
    console.log(`👋 User left conversation: ${conversationId}`);
  });

  socket.on('send_message', ({ conversationId, content, replyToId }) => {
    if (!mockMessages[conversationId]) {
      mockMessages[conversationId] = [];
    }

    const newMessage = {
      id: (nextMessageId++).toString(),
      conversationId,
      senderId: socket.userId,
      content,
      contentType: 'text',
      replyToId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockMessages[conversationId].push(newMessage);

    const conversation = mockConversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.lastMessage = newMessage;
      conversation.updatedAt = new Date().toISOString();
    }

    io.to(conversationId).emit('new_message', newMessage);
    console.log(`💬 Message sent: ${content}`);
  });

  socket.on('typing', ({ conversationId, isTyping }) => {
    socket.to(conversationId).emit('typing', {
      conversationId,
      userId: socket.userId,
      isTyping,
    });
    console.log(`⌨️ User typing: ${isTyping}`);
  });

  socket.on('disconnect', () => {
    console.log('📱 User disconnected:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Mock server with WebSocket running',
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Mock server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🌐 WebSocket enabled for real-time features`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('📦 Server closed');
    process.exit(0);
  });
});

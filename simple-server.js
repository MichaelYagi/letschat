const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
});

// Test users
const users = [
  {
    id: '1',
    username: 'alice',
    email: 'alice@test.com',
    passwordHash:
      '$2a$10$P8qdti0lNJ.t8apn9uWZmuk5dFwnIihm5SGz/Ezd/.Vzw/nxaJlqm',
    displayName: 'Alice',
    status: 'online',
  },
  {
    id: '2',
    username: 'bob',
    email: 'bob@test.com',
    passwordHash:
      '$2a$10$4jewYdN.UB0Hmy7DAyg0UuNYuhFywljcx/e3cM/NcBgjC7fpptEma',
    displayName: 'Bob',
    status: 'online',
  },
];

const conversations = [
  {
    id: '1',
    type: 'direct',
    name: null,
    description: null,
    createdBy: '1',
    participants: [
      { userId: '1', role: 'member', joinedAt: new Date().toISOString() },
      { userId: '2', role: 'member', joinedAt: new Date().toISOString() },
    ],
  },
];

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3001',
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper functions
function generateId() {
  return uuidv4();
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
}

// Basic in-memory message storage
const messages = [];

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      });
    }

    // Simple password check for testing
    const isValidPassword =
      (username === 'alice' && password === 'password123') ||
      (username === 'bob' && password === 'password456') ||
      (username === 'testuser123' && password === 'TestPass123!') ||
      (username === 'testuser888' && password === 'TestPass123!');

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      });
    }

    // Generate token
    const token = generateToken(user);

    // Update user status
    user.status = 'online';
    user.lastSeen = new Date().toISOString();

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          status: user.status,
          lastSeen: user.lastSeen,
        },
        tokens: {
          accessToken: token,
          refreshToken: generateToken(user),
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// Get conversations
app.get('/api/conversations', (req, res) => {
  res.json({
    success: true,
    data: conversations,
  });
});

// Get messages for conversation
app.get('/api/conversations/:id/messages', (req, res) => {
  const { id } = req.params;
  const conversationMessages = messages.filter(m => m.conversationId === id);

  res.json({
    success: true,
    data: conversationMessages,
  });
});

// WebSocket connection
io.on('connection', socket => {
  console.log('Client connected to WebSocket');

  socket.on('join_conversation', conversationId => {
    console.log(`User joined conversation: ${conversationId}`);
    socket.join(conversationId);
  });

  socket.on('send_message', messageData => {
    console.log('New message:', messageData);

    const message = {
      id: generateId(),
      conversationId: messageData.conversationId,
      senderId: messageData.senderId,
      content: messageData.content,
      timestamp: new Date().toISOString(),
    };

    messages.push(message);

    // Broadcast to all clients in the conversation
    io.to(messageData.conversationId).emit('new_message', message);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Chat server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket server ready`);
});

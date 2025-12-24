import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './src/config';

const app = express();
const server = createServer(app);

// Mock database
const users = new Map();
const connections = new Map();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());

// Simple authentication middleware
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }
  
  // Mock user from token (in real app, verify JWT)
  const mockUser = users.get(token);
  if (!mockUser) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  
  req.user = mockUser;
  next();
};

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post('/api/auth/register', (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password required'
    });
  }
  
  // Check if user exists
  for (const [token, user] of users.entries()) {
    if (user.username === username) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }
  }
  
  const user = {
    id: 'user_' + Date.now(),
    username,
    email: email || '',
    status: 'offline'
  };
  
  const token = 'token_' + Date.now() + '_' + Math.random();
  users.set(token, user);
  
  res.json({
    success: true,
    data: { user, token }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password required'
    });
  }
  
  // Find user (mock authentication)
  for (const [token, user] of users.entries()) {
    if (user.username === username) {
      // In real app, verify password
      res.json({
        success: true,
        data: { user, token }
      });
      return;
    }
  }
  
  // Auto-register for testing
  const user = {
    id: 'user_' + Date.now(),
    username,
    status: 'online'
  };
  
  const token = 'token_' + Date.now() + '_' + Math.random();
  users.set(token, user);
  
  res.json({
    success: true,
    data: { user, token }
  });
});

// Mock API endpoints for testing
app.get('/api/v1/connections', authMiddleware, (req, res) => {
  const userConnections = Array.from(connections.values())
    .filter(conn => conn.requesterId === req.user.id || conn.addresseeId === req.user.id);
  
  res.json({
    success: true,
    data: userConnections
  });
});

app.post('/api/v1/connections/request', authMiddleware, (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({
      success: false,
      error: 'Username is required'
    });
  }
  
  // Find target user
  let targetUser = null;
  for (const [token, user] of users.entries()) {
    if (user.username === username) {
      targetUser = user;
      break;
    }
  }
  
  if (!targetUser) {
    return res.status(400).json({
      success: false,
      error: 'User not found'
    });
  }
  
  if (targetUser.id === req.user.id) {
    return res.status(400).json({
      success: false,
      error: 'Cannot connect to yourself'
    });
  }
  
  // Create connection request
  const connection = {
    id: 'conn_' + Date.now(),
    requesterId: req.user.id,
    addresseeId: targetUser.id,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  connections.set(connection.id, connection);
  
  res.json({
    success: true,
    data: connection
  });
});

app.put('/api/v1/connections/:requestId/accept', authMiddleware, (req, res) => {
  const { requestId } = req.params;
  const connection = connections.get(requestId);
  
  if (!connection) {
    return res.status(404).json({
      success: false,
      error: 'Connection request not found'
    });
  }
  
  if (connection.addresseeId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Cannot accept this request'
    });
  }
  
  connection.status = 'accepted';
  connections.set(requestId, connection);
  
  res.json({
    success: true,
    data: connection
  });
});

app.put('/api/v1/connections/:requestId/reject', authMiddleware, (req, res) => {
  const { requestId } = req.params;
  const connection = connections.get(requestId);
  
  if (!connection) {
    return res.status(404).json({
      success: false,
      error: 'Connection request not found'
    });
  }
  
  if (connection.addresseeId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Cannot reject this request'
    });
  }
  
  connection.status = 'declined';
  connections.set(requestId, connection);
  
  res.json({
    success: true,
    data: connection
  });
});

app.get('/api/messages/conversations', authMiddleware, (req, res) => {
  // Mock conversations data
  const mockConversations = [
    {
      id: 'conv_1',
      type: 'direct',
      participantIds: [req.user.id],
      lastMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: mockConversations
  });
});
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mock API endpoints for testing
app.get('/api/v1/connections', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'No token provided - would normally return user connections',
  });
});

app.post('/api/v1/connections/request', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'mock-id',
      status: 'pending',
      username: req.body.username || 'unknown',
    },
  });
});

app.get('/api/messages/conversations', (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

const PORT = config.port || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🌐 Frontend URLs allowed: http://localhost:5173, http://localhost:5174`
  );
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export { app, server };

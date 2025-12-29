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

// In-memory storage
let users = [];
let conversations = [];
let connections = [];
let messages = [];
let nextUserId = 100;
let nextConversationId = 1;
let nextMessageId = 1;

// Helper functions
const findUser = username => users.find(u => u.username === username);
const findUserById = id => users.find(u => u.id === parseInt(id));
const findConversation = id => conversations.find(c => c.id === parseInt(id));
const getConnection = (userId1, userId2) =>
  connections.find(
    c =>
      (c.fromUserId === userId1 && c.toUserId === userId2) ||
      (c.fromUserId === userId2 && c.toUserId === userId1)
  );

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (findUser(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = 'hashed-' + password;
    const user = {
      id: nextUserId++,
      username,
      displayName: displayName || username,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(user);

    res.json({
      success: true,
      token: 'mock-jwt-token',
      user: { id: user.id, username, displayName: user.displayName },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    let user = findUser(username);

    // Create default user if not exists
    if (!user) {
      const hashedPassword = 'hashed-' + password;
      user = {
        id: nextUserId++,
        username,
        displayName: username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    }

    const validPassword = user.password === 'hashed-' + password;
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: 'mock-jwt-token',
      user: { id: user.id, username, displayName: user.displayName },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// User search
app.get('/api/users/search', (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json([]);
  }

  // Add some default users if none exist
  if (users.length <= 1) {
    users.push(
      { id: 2, username: 'alice', displayName: 'Alice' },
      { id: 3, username: 'bob', displayName: 'Bob' },
      { id: 4, username: 'charlie', displayName: 'Charlie' }
    );
  }

  const results = users
    .filter(
      u =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.displayName.toLowerCase().includes(query.toLowerCase())
    )
    .map(u => ({ id: u.id, username: u.username, displayName: u.displayName }));

  res.json(results);
});

// Helper to get current user ID from header or default to 1
function getCurrentUserId(req) {
  // In a real app, this would come from JWT token
  // For testing, we'll use a header or default to 1
  return parseInt(req.headers['x-user-id']) || 1;
}

// Connection endpoints
app.get('/api/connections', (req, res) => {
  const currentUserId = getCurrentUserId(req); // Mock current user ID

  const userConnections = connections.filter(
    c => c.fromUserId === currentUserId || c.toUserId === currentUserId
  );

  const result = userConnections
    .map(c => {
      const otherUserId =
        c.fromUserId === currentUserId ? c.toUserId : c.fromUserId;
      const otherUser = findUserById(otherUserId);

      if (!otherUser) return null;

      return {
        id: c.id,
        user: {
          id: otherUser.id,
          username: otherUser.username,
          displayName: otherUser.displayName,
        },
        status: c.status,
        direction: c.fromUserId === currentUserId ? 'sent' : 'received',
        createdAt: c.createdAt,
      };
    })
    .filter(Boolean);

  res.json(result);
});

app.get('/api/connections/pending', (req, res) => {
  const currentUserId = getCurrentUserId(req); // Mock current user ID

  const pendingConnections = connections.filter(
    c => c.toUserId === currentUserId && c.status === 'pending'
  );

  const result = pendingConnections
    .map(c => {
      const fromUser = findUserById(c.fromUserId);

      return fromUser
        ? {
            id: c.id,
            user: {
              id: fromUser.id,
              username: fromUser.username,
              displayName: fromUser.displayName,
            },
            createdAt: c.createdAt,
          }
        : null;
    })
    .filter(Boolean);

  res.json(result);
});

app.post('/api/connections/request', (req, res) => {
  const { username } = req.body;
  const currentUserId = getCurrentUserId(req); // Mock current user ID

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  const targetUser = findUser(username);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (targetUser.id === currentUserId) {
    return res.status(400).json({ error: 'Cannot connect to yourself' });
  }

  const existingConnection = getConnection(currentUserId, targetUser.id);
  if (existingConnection) {
    return res.status(400).json({ error: 'Connection already exists' });
  }

  const connection = {
    id: connections.length + 1,
    fromUserId: currentUserId,
    toUserId: targetUser.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  connections.push(connection);

  // Notify via WebSocket
  io.emit('connection-request', {
    fromUserId: currentUserId,
    toUserId: targetUser.id,
    connection,
  });

  res.json({ success: true });
});

app.post('/api/connections/:id/accept', (req, res) => {
  const connectionId = parseInt(req.params.id);
  const currentUserId = getCurrentUserId(req); // Mock current user ID

  const connection = connections.find(
    c =>
      c.id === connectionId &&
      c.toUserId === currentUserId &&
      c.status === 'pending'
  );

  if (!connection) {
    return res.status(404).json({ error: 'Connection request not found' });
  }

  connection.status = 'accepted';
  connection.updatedAt = new Date().toISOString();

  // Notify via WebSocket
  io.emit('connection-accepted', { connection });

  res.json({ success: true });
});

// Conversation endpoints
app.get('/api/conversations', (req, res) => {
  const currentUserId = getCurrentUserId(req); // Mock current user ID

  const userConversations = conversations.filter(c =>
    c.participants.some(p => p.id === currentUserId)
  );

  const result = userConversations.map(c => {
    const otherParticipant = c.participants.find(p => p.id !== currentUserId);
    const lastMessage = messages
      .filter(m => m.conversationId === c.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    return {
      id: c.id,
      type: c.type,
      name:
        c.type === 'direct'
          ? otherParticipant?.displayName || 'Unknown'
          : c.name,
      participants: c.participants,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
          }
        : null,
    };
  });

  res.json(result);
});

app.post('/api/conversations', (req, res) => {
  const { type, name, participantIds } = req.body;
  const currentUserId = getCurrentUserId(req); // Mock current user ID

  if (!type) {
    return res.status(400).json({ error: 'Conversation type required' });
  }

  const allParticipantIds = [currentUserId, ...(participantIds || [])];

  // For direct conversations, check if one already exists
  if (type === 'direct' && participantIds.length === 1) {
    const existingConversation = conversations.find(
      c =>
        c.type === 'direct' &&
        c.participants.length === 2 &&
        c.participants.some(p => p.id === currentUserId) &&
        c.participants.some(p => p.id === participantIds[0])
    );

    if (existingConversation) {
      return res.json(existingConversation);
    }
  }

  const conversation = {
    id: nextConversationId++,
    type,
    name: name || null,
    participants: allParticipantIds
      .map(id => {
        const user = findUserById(id);
        return user
          ? {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
            }
          : null;
      })
      .filter(Boolean),
    createdBy: currentUserId,
    createdAt: new Date().toISOString(),
  };

  conversations.push(conversation);

  res.json(conversation);
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const conversationId = parseInt(req.params.id);

  const conversationMessages = messages.filter(
    m => m.conversationId === conversationId
  );

  const result = conversationMessages.map(m => {
    const sender = findUserById(m.senderId);
    return {
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderUsername: sender?.username || 'unknown',
      createdAt: m.createdAt,
    };
  });

  res.json(result);
});

app.post('/api/conversations/:id/messages', (req, res) => {
  const conversationId = parseInt(req.params.id);
  const { content } = req.body;
  const currentUserId = getCurrentUserId(req); // Mock current user ID

  if (!content) {
    return res.status(400).json({ error: 'Message content required' });
  }

  const conversation = findConversation(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const message = {
    id: nextMessageId++,
    conversationId,
    content,
    senderId: currentUserId,
    createdAt: new Date().toISOString(),
  };

  messages.push(message);

  // Broadcast via WebSocket
  const sender = findUserById(currentUserId);
  const wsMessage = {
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    senderUsername: sender?.username || 'unknown',
    createdAt: message.createdAt,
  };

  io.emit(`conversation-${conversationId}`, {
    type: 'new-message',
    message: wsMessage,
  });

  res.json(message);
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

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join-conversation', conversationId => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('send-message', data => {
    const { conversationId, content } = data;
    const currentUserId = 1; // Mock current user ID

    const conversation = findConversation(conversationId);
    if (!conversation) return;

    const message = {
      id: nextMessageId++,
      conversationId,
      content,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
    };

    messages.push(message);

    // Broadcast to all users in the conversation
    const sender = findUserById(currentUserId);
    const wsMessage = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderUsername: sender?.username || 'unknown',
      createdAt: message.createdAt,
    };

    io.to(conversationId).emit('new-message', wsMessage);
  });

  socket.on('typing', data => {
    const { conversationId, isTyping } = data;
    socket.to(conversationId).emit('user-typing', { userId: 1, isTyping });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Initialize with sample data
function initializeSampleData() {
  try {
    // Add sample users
    if (users.length <= 1) {
      users.push(
        { id: 2, username: 'alice', displayName: 'Alice' },
        { id: 3, username: 'bob', displayName: 'Bob' },
        { id: 4, username: 'charlie', displayName: 'Charlie' }
      );
    }

    // Create sample conversation if none exist
    if (conversations.length === 0) {
      const conversation = {
        id: nextConversationId++,
        type: 'direct',
        name: null,
        participants: [
          { id: 1, username: 'currentuser', displayName: 'Current User' },
          { id: 2, username: 'alice', displayName: 'Alice' },
        ],
        createdBy: 1,
        createdAt: new Date().toISOString(),
      };

      conversations.push(conversation);

      // Create sample message
      const message = {
        id: nextMessageId++,
        conversationId: conversation.id,
        content: 'Hello there!',
        senderId: 2,
        createdAt: new Date().toISOString(),
      };

      messages.push(message);
    }

    console.log('Sample data initialized');
  } catch (error) {
    console.error('Failed to initialize sample data:', error);
  }
}

const PORT = 3000;
initializeSampleData();
server.listen(PORT, () => {
  console.log(`✅ Let's Chat server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `✅ Frontend URLs allowed: http://localhost:5173, http://localhost:5174`
  );
});

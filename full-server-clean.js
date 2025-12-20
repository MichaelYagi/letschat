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

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Configuration
const PORT = 3000;
const JWT_SECRET = 'test-secret-key-change-in-production';
const ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';

// In-memory storage (replace with proper database later)
const users = [];
const conversations = [];
const messages = [];
const files = [];
const connections = []; // User connections/friendships
const notifications = [];
const userSessions = new Map(); // userId -> Set of socket connections
const onlineUsers = new Map(); // userId -> { status, lastSeen }

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3001',
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload setup
const uploadsDir = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper functions
function generateId() {
  return uuidv4();
}

function encrypt(text, key = ENCRYPTION_KEY) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text, key = ENCRYPTION_KEY) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = parts.join(':');
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token required' },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  }
}

// Routes

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

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username and password are required',
        },
      });
    }

    // Check if user exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username already exists',
        },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = {
      id: generateId(),
      username,
      password: hashedPassword,
      displayName: displayName || username,
      status: 'offline',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(user);

    // Create token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          status: user.status,
          createdAt: user.createdAt,
        },
        tokens: {
          accessToken: token,
          refreshToken: token, // Simplified for now
          expiresIn: 86400,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username and password are required',
        },
      });
    }

    // Find user
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

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      });
    }

    // Create token
    const token = generateToken(user);

    // Update user status
    user.status = 'online';
    user.lastSeen = new Date().toISOString();
    onlineUsers.set(user.id, {
      status: 'online',
      lastSeen: new Date().toISOString(),
    });

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
          refreshToken: token,
          expiresIn: 86400,
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

// User profile
app.get('/api/v1/users/profile', verifyToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
      },
    });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      status: user.status,
      lastSeen: user.lastSeen,
      settings: {
        theme: 'light',
        notifications: true,
      },
    },
  });
});

// Conversations
app.get('/api/v1/conversations', verifyToken, (req, res) => {
  const userConversations = conversations.filter(conv =>
    conv.participants.some(p => p.userId === req.user.userId)
  );

  const conversationData = userConversations.map(conv => {
    const convMessages = messages.filter(m => m.conversationId === conv.id);
    const lastMessage = convMessages.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];
    const otherParticipant =
      conv.type === 'direct'
        ? conv.participants.find(p => p.userId !== req.user.userId)
        : null;

    return {
      id: conv.id,
      type: conv.type,
      name: conv.name,
      participant: otherParticipant
        ? {
            username: otherParticipant.username,
            displayName: otherParticipant.displayName,
            status: onlineUsers.has(otherParticipant.userId)
              ? 'online'
              : 'offline',
          }
        : null,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          }
        : null,
      unreadCount: 0, // TODO: Calculate from read receipts
      lastReadAt: conv.participants.find(p => p.userId === req.user.userId)
        ?.lastReadAt,
    };
  });

  res.json({
    success: true,
    data: {
      conversations: conversationData,
      hasMore: false,
    },
  });
});

app.post('/api/v1/conversations', verifyToken, (req, res) => {
  const { type, participantUsername, name, description, participantUsernames } =
    req.body;

  if (
    !type ||
    (type === 'direct' && !participantUsername) ||
    (type === 'group' && !name)
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid conversation parameters',
      },
    });
  }

  let participants = [
    {
      userId: req.user.userId,
      role: 'admin',
      joinedAt: new Date().toISOString(),
    },
  ];

  if (type === 'direct') {
    const otherUser = users.find(u => u.username === participantUsername);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }
    participants.push({
      userId: otherUser.id,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
  } else if (type === 'group' && participantUsernames) {
    participantUsernames.forEach(username => {
      const user = users.find(u => u.username === username);
      if (user) {
        participants.push({
          userId: user.id,
          role: 'member',
          joinedAt: new Date().toISOString(),
        });
      }
    });
  }

  const conversation = {
    id: generateId(),
    type,
    name: name || null,
    description: description || null,
    createdBy: req.user.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants,
  };

  conversations.push(conversation);

  res.status(201).json({
    success: true,
    data: {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      participants: conversation.participants.map(p => ({
        userId: p.userId,
        role: p.role,
        joinedAt: p.joinedAt,
      })),
    },
  });
});

// Messages
app.get(
  '/api/v1/conversations/:conversationId/messages',
  verifyToken,
  (req, res) => {
    const { conversationId } = req.params;
    const { limit = 50, before, after } = req.query;

    // Check if user is participant
    const conversation = conversations.find(
      c =>
        c.id === conversationId &&
        c.participants.some(p => p.userId === req.user.userId)
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      });
    }

    let conversationMessages = messages.filter(
      m => m.conversationId === conversationId
    );

    // Apply pagination
    if (before) {
      const beforeMessage = conversationMessages.find(m => m.id === before);
      if (beforeMessage) {
        conversationMessages = conversationMessages.filter(
          m => new Date(m.createdAt) < new Date(beforeMessage.createdAt)
        );
      }
    }

    conversationMessages.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    conversationMessages = conversationMessages.slice(0, parseInt(limit));

    const messageData = conversationMessages.map(message => ({
      id: message.id,
      content: message.content,
      contentType: message.contentType || 'text',
      sender: {
        id: message.senderId,
        username:
          users.find(u => u.id === message.senderId)?.username || 'Unknown',
        displayName:
          users.find(u => u.id === message.senderId)?.displayName || 'Unknown',
      },
      replyTo: message.replyToId || null,
      threadId: message.threadId || null,
      isEdited: !!message.editedAt,
      status: 'read', // TODO: Implement read receipts
      createdAt: message.createdAt,
      editedAt: message.editedAt || null,
    }));

    res.json({
      success: true,
      data: {
        messages: messageData,
        hasMore: conversationMessages.length === parseInt(limit),
      },
    });
  }
);

app.post(
  '/api/v1/conversations/:conversationId/messages',
  verifyToken,
  (req, res) => {
    const { conversationId } = req.params;
    const { content, contentType = 'text', replyToId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Content is required',
        },
      });
    }

    // Check if user is participant
    const conversation = conversations.find(
      c =>
        c.id === conversationId &&
        c.participants.some(p => p.userId === req.user.userId)
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      });
    }

    const message = {
      id: generateId(),
      conversationId,
      senderId: req.user.userId,
      content,
      contentType,
      replyToId: replyToId || null,
      threadId: null, // TODO: Implement threading
      createdAt: new Date().toISOString(),
    };

    messages.push(message);

    // Update conversation timestamp
    conversation.updatedAt = new Date().toISOString();

    // Send via WebSocket to all participants
    const messageData = {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      contentType: message.contentType,
      sender: {
        id: message.senderId,
        username: req.user.username,
        displayName: req.user.displayName,
      },
      replyTo: message.replyToId,
      threadId: message.threadId,
      createdAt: message.createdAt,
    };

    conversation.participants.forEach(participant => {
      const sockets = userSessions.get(participant.userId);
      if (sockets) {
        sockets.forEach(socket => {
          socket.emit('message_received', messageData);
        });
      }
    });

    res.status(201).json({
      success: true,
      data: messageData,
    });
  }
);

// File upload endpoint
app.post('/api/v1/files/upload', verifyToken, (req, res) => {
  // Note: This is a simplified implementation
  // In production, you'd use multer or similar for proper file handling
  try {
    const { conversationId, filename, fileData, mimeType } = req.body;

    if (!conversationId || !filename || !fileData || !mimeType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required file upload fields',
        },
      });
    }

    // Check if user is participant
    const conversation = conversations.find(
      c =>
        c.id === conversationId &&
        c.participants.some(p => p.userId === req.user.userId)
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      });
    }

    // Create a file record (simplified - in production, save actual file)
    const file = {
      id: generateId(),
      conversationId,
      uploaderId: req.user.userId,
      filename: generateId() + '_' + filename,
      originalFilename: filename,
      mimeType,
      fileSize: Math.floor(Math.random() * 1000000), // Mock file size
      filePath: `/uploads/${generateId()}_${filename}`,
      thumbnailPath: mimeType.startsWith('image/')
        ? `/thumbnails/${generateId()}.jpg`
        : null,
      createdAt: new Date().toISOString(),
    };

    // Save file record
    files.push(file);

    // Create a message for file
    const message = {
      id: generateId(),
      conversationId,
      senderId: req.user.userId,
      content: `Shared a file: ${filename}`,
      contentType: 'file',
      fileData: {
        id: file.id,
        filename: file.originalFilename,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        downloadUrl: `/api/v1/files/${file.id}/download`,
        thumbnailUrl: file.thumbnailPath
          ? `/api/v1/files/${file.id}/thumbnail`
          : null,
      },
      createdAt: new Date().toISOString(),
    };

    messages.push(message);
    conversation.updatedAt = new Date().toISOString();

    // Send via WebSocket to all participants
    const messageData = {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      contentType: message.contentType,
      fileData: message.fileData,
      sender: {
        id: message.senderId,
        username: req.user.username,
        displayName: req.user.displayName,
      },
      createdAt: message.createdAt,
    };

    conversation.participants.forEach(participant => {
      const sockets = userSessions.get(participant.userId);
      if (sockets) {
        sockets.forEach(socket => {
          socket.emit('message_received', messageData);
        });
      }
    });

    res.status(201).json({
      success: true,
      data: {
        file: {
          id: file.id,
          filename: file.originalFilename,
          originalFilename: file.originalFilename,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
          downloadUrl: `/api/v1/files/${file.id}/download`,
          thumbnailUrl: file.thumbnailPath
            ? `/api/v1/files/${file.id}/thumbnail`
            : null,
          createdAt: file.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'File upload failed',
      },
    });
  }
});

// File download endpoint
app.get('/api/v1/files/:fileId/download', verifyToken, (req, res) => {
  const { fileId } = req.params;

  const file = files.find(f => f.id === fileId);
  if (!file) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'File not found',
      },
    });
  }

  // Check if user has access to this file
  const conversation = conversations.find(c => c.id === file.conversationId);
  const hasAccess = conversation?.participants.some(
    p => p.userId === req.user.userId
  );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
      },
    });
  }

  // For now, just return a mock response
  res.set({
    'Content-Type': file.mimeType,
    'Content-Disposition': `attachment; filename="${file.originalFilename}"`,
    'Content-Length': file.fileSize.toString(),
  });

  // In production, you'd stream actual file
  res.send('Mock file content for ' + file.originalFilename);
});

// File thumbnail endpoint
app.get('/api/v1/files/:fileId/thumbnail', verifyToken, (req, res) => {
  const { fileId } = req.params;

  const file = files.find(f => f.id === fileId);
  if (!file || !file.thumbnailPath) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Thumbnail not found',
      },
    });
  }

  // Check if user has access
  const conversation = conversations.find(c => c.id === file.conversationId);
  const hasAccess = conversation?.participants.some(
    p => p.userId === req.user.userId
  );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
      },
    });
  }

  // For now, just return a mock thumbnail
  res.set('Content-Type', 'image/jpeg');
  res.send('Mock thumbnail data');
});

// Connections endpoints
app.get('/api/v1/connections', verifyToken, (req, res) => {
  const userConnections = connections.filter(
    c => c.requesterId === req.user.userId || c.recipientId === req.user.userId
  );

  const connectionsList = userConnections.map(conn => {
    const otherUserId =
      conn.requesterId === req.user.userId
        ? conn.recipientId
        : conn.requesterId;
    const otherUser = users.find(u => u.id === otherUserId);

    return {
      id: conn.id,
      user: {
        id: otherUser?.id,
        username: otherUser?.username,
        displayName: otherUser?.displayName,
      },
      status: conn.status,
      type: conn.requesterId === req.user.userId ? 'sent' : 'received',
      createdAt: conn.createdAt,
    };
  });

  const accepted = connectionsList.filter(c => c.status === 'accepted');
  const pending = connectionsList.filter(c => c.status === 'pending');

  res.json({
    success: true,
    data: {
      connections: accepted,
      pendingRequests: pending,
    },
  });
});

app.post('/api/v1/connections/request', verifyToken, (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Username is required',
      },
    });
  }

  const targetUser = users.find(u => u.username === username);
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
      },
    });
  }

  if (targetUser.id === req.user.userId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Cannot connect to yourself',
      },
    });
  }

  // Check if connection already exists
  const existingConnection = connections.find(
    c =>
      (c.requesterId === req.user.userId && c.recipientId === targetUser.id) ||
      (c.requesterId === targetUser.id && c.recipientId === req.user.userId)
  );

  if (existingConnection) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Connection already exists',
      },
    });
  }

  const connection = {
    id: generateId(),
    requesterId: req.user.userId,
    recipientId: targetUser.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  connections.push(connection);

  // Send notification to recipient
  const notification = {
    id: generateId(),
    userId: targetUser.id,
    type: 'connection_request',
    title: 'New connection request',
    message: `${req.user.displayName} wants to connect with you`,
    data: {
      connectionId: connection.id,
      requesterId: req.user.userId,
    },
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  notifications.push(notification);

  // Send real-time notification
  const recipientSockets = userSessions.get(targetUser.id);
  if (recipientSockets) {
    recipientSockets.forEach(socket => {
      socket.emit('notification_received', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt,
      });
    });
  }

  res.status(201).json({
    success: true,
    data: {
      id: connection.id,
      status: 'pending',
    },
  });
});

app.put('/api/v1/connections/:requestId/accept', verifyToken, (req, res) => {
  const { requestId } = req.params;

  const connection = connections.find(
    c =>
      c.id === requestId &&
      c.recipientId === req.user.userId &&
      c.status === 'pending'
  );

  if (!connection) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Connection request not found',
      },
    });
  }

  connection.status = 'accepted';
  connection.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: {
      id: connection.id,
      status: 'accepted',
    },
  });
});

app.put('/api/v1/connections/:requestId/reject', verifyToken, (req, res) => {
  const { requestId } = req.params;

  const connectionIndex = connections.findIndex(
    c =>
      c.id === requestId &&
      c.recipientId === req.user.userId &&
      c.status === 'pending'
  );

  if (connectionIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Connection request not found',
      },
    });
  }

  connections.splice(connectionIndex, 1);

  res.json({
    success: true,
    data: { message: 'Connection request rejected' },
  });
});

// Notifications
app.get('/api/v1/notifications', verifyToken, (req, res) => {
  const userNotifications = notifications.filter(
    n => n.userId === req.user.userId
  );

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  res.json({
    success: true,
    data: {
      notifications: userNotifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.message,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
      hasMore: false,
    },
  });
});

// WebSocket handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userData = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', socket => {
  console.log(`User ${socket.userData.username} connected (${socket.userId})`);

  // Add to user sessions
  if (!userSessions.has(socket.userId)) {
    userSessions.set(socket.userId, new Set());
  }
  userSessions.get(socket.userId).add(socket);

  // Update user status
  onlineUsers.set(socket.userId, {
    status: 'online',
    lastSeen: new Date().toISOString(),
  });

  // Join user to their conversation rooms
  const userConversations = conversations.filter(c =>
    c.participants.some(p => p.userId === socket.userId)
  );

  userConversations.forEach(conversation => {
    socket.join(conversation.id);
  });

  // Handle join conversation
  socket.on('join_conversation', data => {
    const { conversationId } = data;
    const conversation = conversations.find(
      c =>
        c.id === conversationId &&
        c.participants.some(p => p.userId === socket.userId)
    );

    if (conversation) {
      socket.join(conversationId);
      socket.emit('joined_conversation', { conversationId });
    }
  });

  // Handle send message (redundant with HTTP but for real-time)
  socket.on('send_message', async data => {
    const { conversationId, content, contentType = 'text', replyToId } = data;

    if (!content) return;

    // Check if user is participant
    const conversation = conversations.find(
      c =>
        c.id === conversationId &&
        c.participants.some(p => p.userId === socket.userId)
    );

    if (!conversation) {
      socket.emit('error', {
        code: 'NOT_FOUND',
        message: 'Conversation not found',
      });
      return;
    }

    const message = {
      id: generateId(),
      conversationId,
      senderId: socket.userId,
      content,
      contentType,
      replyToId: replyToId || null,
      threadId: null,
      createdAt: new Date().toISOString(),
    };

    messages.push(message);
    conversation.updatedAt = new Date().toISOString();

    const messageData = {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      contentType: message.contentType,
      sender: {
        id: message.senderId,
        username: socket.userData.username,
        displayName: socket.userData.displayName,
      },
      replyTo: message.replyToId,
      threadId: message.threadId,
      createdAt: message.createdAt,
    };

    // Send to all participants
    conversation.participants.forEach(participant => {
      const sockets = userSessions.get(participant.userId);
      if (sockets) {
        sockets.forEach(s => {
          s.emit('message_received', messageData);
        });
      }
    });
  });

  // Handle typing indicators
  socket.on('typing_start', data => {
    const { conversationId } = data;
    socket.to(conversationId).emit('user_typing', {
      conversationId,
      userId: socket.userId,
      username: socket.userData.username,
      isTyping: true,
    });
  });

  socket.on('typing_stop', data => {
    const { conversationId } = data;
    socket.to(conversationId).emit('user_typing', {
      conversationId,
      userId: socket.userId,
      username: socket.userData.username,
      isTyping: false,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userData.username} disconnected`);

    // Remove from user sessions
    const sessions = userSessions.get(socket.userId);
    if (sessions) {
      sessions.delete(socket);
      if (sessions.size === 0) {
        userSessions.delete(socket.userId);
        // User is completely offline
        onlineUsers.set(socket.userId, {
          status: 'offline',
          lastSeen: new Date().toISOString(),
        });

        // Notify others of status change
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          status: 'offline',
          lastSeen: new Date().toISOString(),
        });
      }
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Full chat server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket server ready`);
});

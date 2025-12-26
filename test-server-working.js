const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

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

// Database
const db = new sqlite3.Database('./data/chat.db');

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = 'test-secret-key';

// Helper functions
const generateToken = userId => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
};

// Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          c.id,
          c.type,
          c.name,
          c.created_by,
          c.created_at,
          c.updated_at,
          CASE 
            WHEN c.type = 'direct' THEN (
              SELECT u.username
              FROM conversation_participants cp
              JOIN users u ON cp.user_id = u.id
              WHERE cp.conversation_id = c.id AND cp.user_id != ?
              LIMIT 1
            )
            ELSE c.name
          END as participant_username,
          CASE 
            WHEN c.type = 'direct' THEN (
              SELECT u.status
              FROM conversation_participants cp
              JOIN users u ON cp.user_id = u.id
              WHERE cp.conversation_id = c.id AND cp.user_id != ?
              LIMIT 1
            )
            ELSE 'online'
          END as participant_status
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE cp.user_id = ?
        ORDER BY c.updated_at DESC
      `,
        [req.user.userId, req.user.userId, req.user.userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const conversationsWithDetails = conversations.map(conv => ({
      id: conv.id,
      type: conv.type,
      name: conv.name,
      participant: conv.participant_username
        ? {
            username: conv.participant_username,
            status: conv.participant_status || 'offline',
          }
        : null,
      lastMessage: null,
      unreadCount: 0,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    }));

    res.json({
      success: true,
      data: conversationsWithDetails,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations',
    });
  }
});

app.post('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const { type, participantIds } = req.body;

    // Check if conversation already exists
    const existingConv = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT c.id
        FROM conversations c
        JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
        JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
        WHERE c.type = 'direct' 
        AND cp1.user_id = ?
        AND cp2.user_id = ?
        AND cp1.user_id != cp2.user_id
      `,
        [req.user.userId, participantIds[0]],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingConv) {
      return res.json({
        success: true,
        data: existingConv,
      });
    }

    // Create new conversation
    const conversationId = Date.now().toString();

    await new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO conversations (id, type, created_by, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `,
        [conversationId, type, req.user.userId],
        err => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Add participants
    const participants = [
      [conversationId, req.user.userId, 'member'],
      [conversationId, participantIds[0], 'member'],
    ];

    for (const [convId, userId, role] of participants) {
      await new Promise((resolve, reject) => {
        db.run(
          `
          INSERT INTO conversation_participants (id, conversation_id, user_id, role, joined_at, last_read_at)
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `,
          [Date.now().toString() + Math.random(), convId, userId, role],
          err => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    // Return conversation details
    const conversation = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT 
          c.id,
          c.type,
          c.name,
          CASE 
            WHEN c.type = 'direct' THEN (
              SELECT u.username
              FROM conversation_participants cp
              JOIN users u ON cp.user_id = u.id
              WHERE cp.conversation_id = c.id AND cp.user_id != ?
              LIMIT 1
            )
          END as participant_username,
          CASE 
            WHEN c.type = 'direct' THEN (
              SELECT u.status
              FROM conversation_participants cp
              JOIN users u ON cp.user_id = u.id
              WHERE cp.conversation_id = c.id AND cp.user_id != ?
              LIMIT 1
            )
          END as participant_status
        FROM conversations c
        WHERE c.id = ?
      `,
        [req.user.userId, req.user.userId, conversationId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const response = {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      participant: conversation.participant_username
        ? {
            username: conversation.participant_username,
            status: conversation.participant_status || 'offline',
          }
        : null,
      lastMessage: null,
      unreadCount: 0,
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation',
    });
  }
});

// WebSocket connection handling
io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join_conversation', ({ conversationId }) => {
    socket.join(conversationId);
    console.log('User joined conversation:', conversationId);
  });

  socket.on('send_message', ({ conversationId, content }) => {
    const message = {
      id: Date.now().toString(),
      conversationId,
      content,
      senderId: socket.userId,
      createdAt: new Date(),
    };

    io.to(conversationId).emit('new_message', message);
  });

  socket.on('typing', ({ conversationId, isTyping }) => {
    socket.to(conversationId).emit('typing', {
      conversationId,
      userId: socket.userId,
      isTyping,
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    db.close(() => {
      console.log('📦 Database connection closed');
      process.exit(0);
    });
  });
});

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Database setup
let db;

async function setupDatabase() {
  db = await open({
    filename: './data/chat-test.db',
    driver: sqlite3.Database,
  });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
      name TEXT,
      description TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS conversation_participants (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_read_at DATETIME,
      FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(conversation_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'text',
      reply_to_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users (id),
      FOREIGN KEY (reply_to_id) REFERENCES messages (id)
    );
  `);

  console.log('Database setup complete');
}

// JWT Config
const JWT_SECRET = 'test-secret-key';

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })
);
app.use(express.json());

// Helper functions
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Test data setup
async function setupTestData() {
  // Create test users
  const hashedPassword1 = await bcrypt.hash('password123', 12);
  const hashedPassword2 = await bcrypt.hash('password123', 12);

  await db.run(
    `
    INSERT OR IGNORE INTO users (id, username, email, password_hash, display_name)
    VALUES (?, ?, ?, ?, ?)
  `,
    [uuidv4(), 'testuser1', 'user1@test.com', hashedPassword1, 'Test User 1']
  );

  await db.run(
    `
    INSERT OR IGNORE INTO users (id, username, email, password_hash, display_name)
    VALUES (?, ?, ?, ?, ?)
  `,
    [uuidv4(), 'testuser2', 'user2@test.com', hashedPassword2, 'Test User 2']
  );

  console.log('Test data setup complete');
}

// Auth middleware
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
  next();
}

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Create user
    await db.run(
      `
      INSERT INTO users (id, username, email, password_hash, display_name)
      VALUES (?, ?, ?, ?, ?)
    `,
      [userId, username, email, passwordHash, displayName || username]
    );

    // Get created user
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
        },
        token,
      },
    });

    console.log(`User registered successfully: ${username}`);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await db.get('SELECT * FROM users WHERE username = ?', [
    username,
  ]);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user.id);
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
      },
      token,
    },
  });
});

app.get('/api/messages/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await db.all(
      `
      SELECT c.*, 
             cp.last_read_at,
             (SELECT COUNT(*) FROM messages m 
              WHERE m.conversation_id = c.id 
              AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')
              AND m.sender_id != ?) as unread_count,
             (SELECT m.content FROM messages m 
              WHERE m.conversation_id = c.id 
              ORDER BY m.created_at DESC 
              LIMIT 1) as last_message_content,
             (SELECT m.created_at FROM messages m 
              WHERE m.conversation_id = c.id 
              ORDER BY m.created_at DESC 
              LIMIT 1) as last_message_time
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = ?
      ORDER BY c.updated_at DESC
    `,
      [req.user.id, req.user.id]
    );

    // Get participants and format conversations for frontend
    for (const conv of conversations) {
      // Get all participants
      conv.participants = await db.all(
        `
        SELECT u.id, u.username, u.display_name, u.avatar_url, cp.role
        FROM users u
        JOIN conversation_participants cp ON u.id = cp.user_id
        WHERE cp.conversation_id = ?
      `,
        [conv.id]
      );

      // For direct messages, set the other participant as the main participant
      if (conv.type === 'direct' && conv.participants.length === 2) {
        const otherParticipant = conv.participants.find(
          p => p.id !== req.user.id
        );
        conv.participant = otherParticipant || null;

        // Set participant status (simulated)
        if (conv.participant) {
          conv.participant.status = 'online'; // Could be enhanced with real online tracking
        }
      }

      // Format lastMessage for frontend
      if (conv.last_message_content) {
        conv.lastMessage = {
          content: conv.last_message_content,
          senderId: req.user.id, // This should be actual sender ID, but simplified
          createdAt: conv.last_message_time,
        };
      }

      // Clean up temporary fields
      delete conv.last_message_content;
      delete conv.last_message_time;

      // Ensure unreadCount exists
      conv.unreadCount = conv.unread_count || 0;
      delete conv.unread_count;
    }

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

app.post('/api/messages/conversations', authMiddleware, async (req, res) => {
  try {
    const { type, name, participantIds } = req.body;
    const conversationId = uuidv4();

    await db.run(
      `
      INSERT INTO conversations (id, type, name, created_by)
      VALUES (?, ?, ?, ?)
    `,
      [conversationId, type, name, req.user.id]
    );

    // Add creator and participants
    await db.run(
      `
      INSERT INTO conversation_participants (id, conversation_id, user_id, role)
      VALUES (?, ?, ?, 'admin')
    `,
      [uuidv4(), conversationId, req.user.id]
    );

    for (const participantId of participantIds) {
      await db.run(
        `
        INSERT INTO conversation_participants (id, conversation_id, user_id, role)
        VALUES (?, ?, ?, 'member')
      `,
        [uuidv4(), conversationId, participantId]
      );
    }

    const conversation = await db.get(
      'SELECT * FROM conversations WHERE id = ?',
      [conversationId]
    );
    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(400).json({ error: 'Failed to create conversation' });
  }
});

app.get(
  '/api/messages/conversations/:conversationId/messages',
  authMiddleware,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      // Verify user is participant
      const participant = await db.get(
        `
      SELECT * FROM conversation_participants 
      WHERE conversation_id = ? AND user_id = ?
    `,
        [conversationId, req.user.id]
      );

      if (!participant) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const messages = await db.all(
        `
      SELECT m.*, u.username, u.display_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ? AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC
      LIMIT ?
    `,
        [conversationId, limit]
      );

      res.json({ success: true, data: messages.reverse() });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  }
);

app.post('/api/messages/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId, content, replyToId } = req.body;
    const messageId = uuidv4();

    // Verify user is participant
    const participant = await db.get(
      `
      SELECT * FROM conversation_participants 
      WHERE conversation_id = ? AND user_id = ?
    `,
      [conversationId, req.user.id]
    );

    if (!participant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.run(
      `
      INSERT INTO messages (id, conversation_id, sender_id, content, reply_to_id)
      VALUES (?, ?, ?, ?, ?)
    `,
      [messageId, conversationId, req.user.id, content, replyToId]
    );

    // Update conversation timestamp
    await db.run(
      `
      UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `,
      [conversationId]
    );

    const message = await db.get(
      `
      SELECT m.*, u.username, u.display_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `,
      [messageId]
    );

    // Broadcast via WebSocket
    io.to(conversationId).emit('new_message', message);

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(400).json({ error: 'Failed to send message' });
  }
});

// WebSocket handling
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [
      decoded.userId,
    ]);
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user.id;
    socket.username = user.username;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', socket => {
  console.log(`User ${socket.username} connected`);

  socket.on('join_conversation', async data => {
    try {
      const { conversationId } = data;

      // Verify participant
      const participant = await db.get(
        `
        SELECT * FROM conversation_participants 
        WHERE conversation_id = ? AND user_id = ?
      `,
        [conversationId, socket.userId]
      );

      if (!participant) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      socket.join(conversationId);
      socket.emit('joined_conversation', { conversationId });
      console.log(
        `User ${socket.username} joined conversation ${conversationId}`
      );
    } catch (error) {
      console.error('Join conversation error:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  socket.on('send_message', async data => {
    try {
      const { conversationId, content, replyToId } = data;
      const messageId = uuidv4();

      // Verify participant
      const participant = await db.get(
        `
        SELECT * FROM conversation_participants 
        WHERE conversation_id = ? AND user_id = ?
      `,
        [conversationId, socket.userId]
      );

      if (!participant) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      await db.run(
        `
        INSERT INTO messages (id, conversation_id, sender_id, content, reply_to_id)
        VALUES (?, ?, ?, ?, ?)
      `,
        [messageId, conversationId, socket.userId, content, replyToId]
      );

      // Update conversation timestamp
      await db.run(
        `
        UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `,
        [conversationId]
      );

      const message = await db.get(
        `
        SELECT m.*, u.username, u.display_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `,
        [messageId]
      );

      // Broadcast to conversation room
      io.to(conversationId).emit('new_message', message);
      console.log(
        `Message sent in conversation ${conversationId} by ${socket.username}`
      );
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', data => {
    const { conversationId, isTyping } = data;
    socket.to(conversationId).emit('typing', [
      {
        conversationId,
        userId: socket.userId,
        isTyping,
      },
    ]);
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.username} disconnected`);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Start server
const PORT = 3000;

async function start() {
  try {
    await setupDatabase();
    await setupTestData();

    server.listen(PORT, () => {
      console.log(`Conversation server running on port ${PORT}`);
      console.log('Test users created:');
      console.log('  Username: testuser1, Password: password123');
      console.log('  Username: testuser2, Password: password123');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const knex = require('knex');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Database configuration
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './data/chat.db',
  },
  useNullAsDefault: true,
});

// Create express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = 'your-secret-key-change-in-production';

// In-memory users for testing
const users = new Map();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Helper functions
const createToken = user => {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '24h',
  });
};

const createDefaultUsers = async () => {
  try {
    // Check if alice exists
    const aliceExists = await db('users').where('username', 'alice').first();

    if (!aliceExists) {
      // Create default users
      const defaultUsers = [
        { username: 'alice', password: 'password123' },
        { username: 'bob', password: 'password123' },
        { username: 'charlie', password: 'password123' },
      ];

      for (const userData of defaultUsers) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await db('users').insert({
          id: uuidv4(),
          username: userData.username,
          password_hash: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      console.log(
        'Default users created: alice, bob, charlie (password: password123)'
      );
    }
  } catch (error) {
    console.error('Error creating default users:', error);
  }
};

const createDefaultConversation = async () => {
  try {
    // Check if conversation exists
    const existingConv = await db('conversations').first();

    if (!existingConv) {
      // Get users
      const alice = await db('users').where('username', 'alice').first();
      const bob = await db('users').where('username', 'bob').first();

      if (alice && bob) {
        // Create conversation
        const conversationId = uuidv4();
        await db('conversations').insert({
          id: conversationId,
          type: 'direct',
          created_by: alice.id,
          created_at: new Date(),
          updated_at: new Date(),
        });

        // Add participants
        await db('conversation_participants').insert([
          {
            id: uuidv4(),
            conversation_id: conversationId,
            user_id: alice.id,
            role: 'member',
            joined_at: new Date(),
            last_read_at: new Date(),
          },
          {
            id: uuidv4(),
            conversation_id: conversationId,
            user_id: bob.id,
            role: 'member',
            joined_at: new Date(),
            last_read_at: new Date(),
          },
        ]);

        console.log('Default conversation created between Alice and Bob');
      }
    }
  } catch (error) {
    console.error('Error creating default conversation:', error);
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    // Create tables if they don't exist
    (await db.schema.hasTable('users')) ||
      (await db.schema.createTable('users', table => {
        table.string('id').primary();
        table.string('username').unique().notNullable();
        table.string('display_name');
        table.string('email').unique();
        table.string('password_hash').notNullable();
        table.string('avatar_url');
        table
          .enum('status', ['online', 'offline', 'away', 'busy'])
          .defaultTo('offline');
        table.text('bio');
        table.datetime('last_seen');
        table.timestamps(true, true);
      }));

    (await db.schema.hasTable('conversations')) ||
      (await db.schema.createTable('conversations', table => {
        table.string('id').primary();
        table.enum('type', ['direct', 'group']).notNullable();
        table.string('name');
        table.text('description');
        table.string('avatar_url');
        table.string('created_by').notNullable();
        table.timestamps(true, true);
      }));

    (await db.schema.hasTable('conversation_participants')) ||
      (await db.schema.createTable('conversation_participants', table => {
        table.string('id').primary();
        table.string('conversation_id').notNullable();
        table.string('user_id').notNullable();
        table.enum('role', ['admin', 'member']).defaultTo('member');
        table.datetime('joined_at').defaultTo(db.fn.now());
        table.datetime('last_read_at').defaultTo(db.fn.now());
        table.timestamps(true, true);
      }));

    (await db.schema.hasTable('messages')) ||
      (await db.schema.createTable('messages', table => {
        table.string('id').primary();
        table.string('conversation_id').notNullable();
        table.string('sender_id').notNullable();
        table.text('content').notNullable();
        table
          .enum('content_type', ['text', 'image', 'file', 'system'])
          .defaultTo('text');
        table.text('encrypted_content');
        table.text('signature');
        table.string('reply_to_id');
        table.string('thread_id');
        table.datetime('edited_at');
        table.datetime('deleted_at');
        table.timestamps(true, true);
      }));

    await createDefaultUsers();
    await createDefaultConversation();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await db('users').where('username', username).first();

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.username,
          avatarUrl: user.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await db('conversations')
      .join(
        'conversation_participants',
        'conversations.id',
        'conversation_participants.conversation_id'
      )
      .where('conversation_participants.user_id', req.user.id)
      .select('conversations.*')
      .orderBy('conversations.updated_at', 'desc');

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get(
  '/api/messages/conversations/:conversationId/messages',
  authenticateToken,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      // Verify user is participant
      const participant = await db('conversation_participants')
        .where({
          conversation_id: conversationId,
          user_id: req.user.id,
        })
        .first();

      if (!participant) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const messages = await db('messages')
        .leftJoin('users', 'messages.sender_id', 'users.id')
        .where('conversation_id', conversationId)
        .whereNull('deleted_at')
        .select('messages.*', 'users.username as sender_username')
        .orderBy('messages.created_at', 'desc')
        .limit(limit);

      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        sender: {
          id: msg.sender_id,
          username: msg.sender_username || msg.sender_id,
          displayName: msg.sender_username || msg.sender_id,
        },
        content: msg.content,
        contentType: msg.content_type,
        timestamp: msg.created_at,
        isOwn: msg.sender_id === req.user.id,
        isEdited: !!msg.edited_at,
        isRead: true,
      }));

      res.json({ success: true, data: formattedMessages.reverse() });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

app.post('/api/messages/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId, content, contentType = 'text' } = req.body;

    if (!conversationId || !content) {
      return res
        .status(400)
        .json({ error: 'Conversation ID and content required' });
    }

    // Verify user is participant
    const participant = await db('conversation_participants')
      .where({
        conversation_id: conversationId,
        user_id: req.user.id,
      })
      .first();

    if (!participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create message
    const messageId = uuidv4();
    const [message] = await db('messages')
      .insert({
        id: messageId,
        conversation_id: conversationId,
        sender_id: req.user.id,
        content,
        content_type: contentType,
        created_at: new Date(),
      })
      .returning('*');

    // Update conversation timestamp
    await db('conversations')
      .where('id', conversationId)
      .update({ updated_at: new Date() });

    // Get sender info
    const sender = await db('users').where('id', req.user.id).first();

    const formattedMessage = {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      sender: {
        id: sender.id,
        username: sender.username,
        displayName: sender.username,
      },
      content: message.content,
      contentType: message.content_type,
      timestamp: message.created_at,
      isOwn: false,
      isRead: false,
    };

    // Broadcast to conversation
    io.to(conversationId).emit('new_message', formattedMessage);

    res.status(201).json({ success: true, data: formattedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebSocket connection handling
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', socket => {
  console.log(`User ${socket.username} connected`);

  socket.on('join_conversation', async ({ conversationId }) => {
    try {
      // Verify user is participant
      const participant = await db('conversation_participants')
        .where({
          conversation_id: conversationId,
          user_id: socket.userId,
        })
        .first();

      if (!participant) {
        socket.emit('error', {
          message: 'Not authorized to join this conversation',
        });
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
      const { conversationId, content } = data;

      // Verify user is participant
      const participant = await db('conversation_participants')
        .where({
          conversation_id: conversationId,
          user_id: socket.userId,
        })
        .first();

      if (!participant) {
        socket.emit('error', {
          message: 'Not authorized to send messages to this conversation',
        });
        return;
      }

      // Create message
      const messageId = uuidv4();
      const [message] = await db('messages')
        .insert({
          id: messageId,
          conversation_id: conversationId,
          sender_id: socket.userId,
          content,
          content_type: 'text',
          created_at: new Date(),
        })
        .returning('*');

      // Get sender info
      const sender = await db('users').where('id', socket.userId).first();

      const formattedMessage = {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        sender: {
          id: sender.id,
          username: sender.username,
          displayName: sender.username,
        },
        content: message.content,
        contentType: message.content_type,
        timestamp: message.created_at,
        isOwn: false,
        isRead: false,
      };

      // Broadcast to conversation
      io.to(conversationId).emit('new_message', formattedMessage);
      console.log(
        `Message sent in conversation ${conversationId} by ${socket.username}`
      );
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', ({ conversationId, isTyping }) => {
    socket.to(conversationId).emit('typing', {
      conversationId,
      userId: socket.userId,
      username: socket.username,
      isTyping,
    });
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.username} disconnected`);
  });
});

// Serve static files
app.get('/test-chat.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-chat.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
initializeDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Chat server running on port ${PORT}`);
    console.log('Default users:');
    console.log('  alice:password123');
    console.log('  bob:password123');
    console.log('  charlie:password123');
  });
});

module.exports = { app, server, io };

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Database connection
const db = new sqlite3.Database('./data/chat.db', err => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
  },
});

// Security middleware
const helmet = require('helmet');
const compression = require('compression');
app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: "Let's Chat API", version: '1.0.0' });
});

// Auth routes with real database
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId =
      'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Insert user with a dummy email (required by schema)
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (id, username, email, password, display_name, status) VALUES (?, ?, ?, ?, ?, ?)',
        [
          userId,
          username,
          username + '@example.com',
          hashedPassword,
          displayName || username,
          'offline',
        ],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log('✅ User registered successfully:', {
      id: userId,
      username,
      displayName: displayName || username,
    });
    res.status(201).json({
      data: {
        user: {
          id: userId,
          username,
          displayName: displayName || username,
          status: 'online',
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: 'mock-jwt-token',
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user by username
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, password, display_name, status FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update user status to online
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET status = ? WHERE id = ?',
        ['online', user.id],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log('✅ User logged in successfully:', {
      id: user.id,
      username: user.username,
    });
    res.json({
      data: {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name || user.username,
          status: 'online',
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: 'mock-jwt-token',
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Mock conversation endpoints
app.get('/api/v1/conversations', (req, res) => {
  console.log('📝 Loading conversations...');
  res.json({
    data: {
      conversations: [], // Return empty array for now
    },
  });
});

app.get('/api/v1/users/profile', (req, res) => {
  res.json({
    data: {
      id: '1',
      username: 'user',
      displayName: 'User',
      status: 'online',
      lastSeen: new Date().toISOString(),
    },
  });
});

// Basic websocket setup
io.on('connection', socket => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Add database test endpoint
app.get('/api/test-db-users', (req, res) => {
  db.all(
    "SELECT id, username, display_name, created_at FROM users WHERE username LIKE 'ui_%' OR username LIKE 'final_%' ORDER BY created_at DESC LIMIT 5",
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          users: rows,
          latestUser: rows.length > 0 ? rows[0].username : null,
        });
      }
    }
  );
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database: ./data/chat.db`);
  console.log('🧪 Frontend endpoints ready for UI testing');
});

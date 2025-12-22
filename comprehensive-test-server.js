const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
  })
);
app.use(express.json());

// Database connection
const db = new sqlite3.Database('./data/chat.db', err => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT DEFAULT 'offline',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    participants TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

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

// Registration
app.post('/api/auth/register', async (req, res) => {
  const { username, password, displayName } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId =
      'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    db.run(
      'INSERT INTO users (id, username, password, display_name, status) VALUES (?, ?, ?, ?, ?)',
      [userId, username, hashedPassword, displayName, 'online'],
      function (err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({
              success: false,
              error: { message: 'Username already exists' },
            });
          }
          return res.status(500).json({
            success: false,
            error: { message: 'Registration failed' },
          });
        }

        const token = 'mock-jwt-token-' + userId;

        res.json({
          success: true,
          data: {
            user: {
              id: userId,
              username: username,
              displayName: displayName,
              status: 'online',
              createdAt: new Date().toISOString(),
            },
            tokens: { accessToken: token },
          },
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Server error' },
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { message: 'Database error' },
        });
      }

      if (!user) {
        // Try fallback test users
        const testUsers = [
          {
            id: '1',
            username: 'alice',
            password: 'password123',
            displayName: 'Alice',
          },
          {
            id: '2',
            username: 'bob',
            password: 'password456',
            displayName: 'Bob',
          },
        ];

        const testUser = testUsers.find(u => u.username === username);
        if (!testUser || testUser.password !== password) {
          return res.status(401).json({
            success: false,
            error: { message: 'Invalid credentials' },
          });
        }

        const token = 'mock-jwt-token-' + testUser.id;
        return res.json({
          success: true,
          data: {
            user: {
              id: testUser.id,
              username: testUser.username,
              displayName: testUser.displayName,
              status: 'online',
            },
            tokens: { accessToken: token },
          },
        });
      }

      // Check password for database user
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid credentials' },
        });
      }

      // Update status to online
      db.run('UPDATE users SET status = ? WHERE id = ?', ['online', user.id]);

      const token = 'mock-jwt-token-' + user.id;

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.display_name,
            status: 'online',
            createdAt: user.created_at,
          },
          tokens: { accessToken: token },
        },
      });
    }
  );
});

// Search users
app.get('/api/auth/search', (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: { message: 'Query parameter q is required' },
    });
  }

  db.all(
    'SELECT id, username, display_name as displayName, status FROM users WHERE username LIKE ? OR display_name LIKE ? LIMIT ?',
    [`%${q}%`, `%${q}%`, parseInt(limit)],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { message: 'Database error' },
        });
      }

      res.json({
        success: true,
        data: rows,
      });
    }
  );
});

// Create conversation
app.post('/api/v1/conversations', (req, res) => {
  const { participantId, message } = req.body;

  if (!participantId) {
    return res.status(400).json({
      success: false,
      error: { message: 'participantId is required' },
    });
  }

  const conversationId = 'conv_' + Date.now();

  res.json({
    success: true,
    data: {
      id: conversationId,
      type: 'direct',
      participants: ['current-user', participantId],
      createdAt: new Date().toISOString(),
      lastMessage: message || null,
    },
  });
});

// Get conversations
app.get('/api/v1/conversations', (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

// User profile
app.get('/api/v1/users/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: '1',
      username: 'user',
      displayName: 'User',
      status: 'online',
      lastSeen: new Date().toISOString(),
    },
  });
});

// Test database users endpoint
app.get('/api/test-db-users', (req, res) => {
  db.all(
    'SELECT id, username, display_name, created_at FROM users ORDER BY created_at DESC LIMIT 10',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        data: {
          users: rows,
          count: rows.length,
        },
      });
    }
  );
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`✅ Comprehensive test server on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`👥 Test users: alice/password123, bob/password456`);
  console.log(`💾 Database: ./data/chat.db`);
});

module.exports = app;

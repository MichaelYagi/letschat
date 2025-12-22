const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Database connection - use the same database as real app
const db = new sqlite3.Database('./data/chat.db');

// Mock JWT token generation
const generateToken = user => {
  return 'mock-jwt-token';
};

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Simple password check (no bcrypt for simplicity)
    if (password !== 'TestPass123!' && user.password_hash !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.username,
          status: user.status || 'online',
        },
        token: token,
      },
    });
  });
});

app.post('/api/auth/register', (req, res) => {
  console.log('Registration request:', req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password required',
    });
  }

  // Validate username
  if (
    username.length < 3 ||
    username.length > 20 ||
    !/^[a-zA-Z0-9_]+$/.test(username)
  ) {
    return res.status(400).json({
      success: false,
      error:
        'Username must be 3-20 characters, alphanumeric and underscores only',
    });
  }

  // Validate password
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long',
    });
  }

  const userId = Date.now().toString();
  const passwordHash = 'hashed_' + password; // Simple hashing for demo

  db.run(
    'INSERT INTO users (id, username, password_hash, status) VALUES (?, ?, ?, ?)',
    [userId, username, passwordHash, 'online'],
    function (err) {
      if (err) {
        console.error('Database error:', err);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({
            success: false,
            error: 'Username already exists',
          });
        }
        return res.status(500).json({
          success: false,
          error: 'Registration failed: ' + err.message,
        });
      }

      console.log('User registered successfully:', { userId, username });

      const token = generateToken({ id: userId, username });
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: userId,
            username,
            displayName: username,
            status: 'online',
          },
          token: token,
        },
      });
    }
  );
});

app.get('/api/auth/verify', (req, res) => {
  res.json({
    success: true,
    data: { valid: true },
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Database: ./data/chat.db`);
  console.log(`🔗 Frontend: http://localhost:5173`);
});

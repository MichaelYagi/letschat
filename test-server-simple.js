const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Database connection
const db = new sqlite3.Database('./data/chat.db');

// Mock JWT token generation
const generateToken = user => {
  return 'mock-jwt-token';
};

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user || user.password !== password) {
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
          displayName: user.display_name,
          status: user.status,
        },
        tokens: { accessToken: token },
      },
    });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, displayName } = req.body;

  const userId = Date.now().toString();
  const finalDisplayName = displayName || username;

  db.run(
    'INSERT INTO users (id, username, password, display_name, status) VALUES (?, ?, ?, ?, ?)',
    [userId, username, password, finalDisplayName, 'online'],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({
            success: false,
            error: 'Username already exists',
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Registration failed',
        });
      }

      const token = generateToken({ id: userId, username });
      res.json({
        success: true,
        data: {
          user: {
            id: userId,
            username,
            displayName: finalDisplayName,
            status: 'online',
          },
          tokens: { accessToken: token },
        },
      });
    }
  );
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.get('/api/auth/search', (req, res) => {
  const { q, limit = 20 } = req.query;

  if (!q || q.length < 2) {
    return res.json({
      success: true,
      data: [],
    });
  }

  db.all(
    'SELECT id, username, display_name as displayName, status FROM users WHERE username LIKE ? AND id != 1 LIMIT ?',
    [`%${q}%`, limit],
    (err, users) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Search failed',
        });
      }

      res.json({
        success: true,
        data: users,
      });
    }
  );
});

// Conversation endpoints
app.get('/api/messages/conversations', (req, res) => {
  const conversations = [
    {
      id: '1',
      type: 'direct',
      name: null,
      participant: {
        id: '2',
        username: 'bob',
        displayName: 'Bob',
        status: 'online',
      },
      lastMessage: null,
      unreadCount: 0,
    },
  ];

  res.json({
    success: true,
    data: { conversations },
  });
});

app.post('/api/messages/conversations', (req, res) => {
  const { type, participantIds } = req.body;
  const conversationId = Date.now().toString();

  // Get participant details
  db.get(
    'SELECT id, username, display_name as displayName, status FROM users WHERE id = ?',
    [participantIds[0]],
    (err, participant) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create conversation',
        });
      }

      const conversation = {
        id: conversationId,
        type,
        name: null,
        participant,
        lastMessage: null,
        unreadCount: 0,
      };

      res.json({
        success: true,
        data: { conversation },
      });
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});

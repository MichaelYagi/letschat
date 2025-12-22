const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = require('http').createServer(app);

const db = new sqlite3.Database('./data/chat.db');

// Simple hardcoded users
const users = [
  {
    id: '1',
    username: 'alice',
    password: 'password123',
    displayName: 'Alice',
    status: 'online',
  },
  {
    id: '2',
    username: 'bob',
    password: 'password456',
    displayName: 'Bob',
    status: 'online',
  },
];

// Initialize database and insert users
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, display_name TEXT, status TEXT DEFAULT 'offline', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
  );

  users.forEach(user => {
    db.run(
      'INSERT OR REPLACE INTO users (id, username, password, display_name, status) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.username, user.password, user.displayName, user.status]
    );
  });
});

// Initialize Socket.IO
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
});

app.use(
  cors({
    origin: 'http://localhost:3001',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // Get user from database
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (err, user) => {
        if (err || !user) {
          return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
          });
        }

        // Simple password check
        if (user.password !== password) {
          return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
          });
        }

        // Generate token
        const token = jwt.sign(
          { id: user.id, username: user.username },
          'secret-key'
        );

        // Update user status to online
        db.run("UPDATE users SET status = 'online' WHERE id = ?", [user.id]);

        console.log('Login successful:', username);

        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              status: 'online',
            },
            tokens: { accessToken: token, refreshToken: token },
          },
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
});

// Get conversations
app.get('/api/conversations', (req, res) => {
  db.all(
    'SELECT c.*, p.username as participant_username FROM conversations c JOIN conversation_participants cp ON c.id = cp.conversation_id JOIN users p ON cp.user_id = p.id WHERE c.id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = ?)',
    [users[0].id],
    (err, conversations) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
        });
      }

      res.json({
        success: true,
        data: conversations.map(conv => ({
          id: conv.id,
          type: conv.type,
          name: conv.name || `${conv.participant_username} & You`,
          participants: [],
        })),
      });
    }
  );
});

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

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`✅ FINAL FIXED SERVER RUNNING ON http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`🔑 Users: alice/password123, bob/password456`);
  console.log(`🗄️ Database: SQLite with live data`);
});

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3');

const app = express();
const server = require('http').createServer(app);

// Database setup
const db = new sqlite3.Database('./data/chat.db');

// Initialize database with test users and proper connection handling
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, display_name TEXT, status TEXT DEFAULT 'offline', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
  
  // Clear existing users and insert test users
  db.run("DELETE FROM users");
  
  const testUsers = [
    { id: '1', username: 'alice', password: 'password123', display_name: 'Alice', status: 'online' },
    { id: '2', username: 'bob', password: 'password456', display_name: 'Bob', status: 'online' }
  ];
  
  testUsers.forEach(user => {
    db.run("INSERT INTO users (id, username, password, display_name, status) VALUES (?, ?, ?, ?, ?)", 
      [user.id, user.username, user.password, user.display_name, user.status]);
  });
  
  db.run("CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, type TEXT NOT NULL CHECK (type IN ('direct', 'group')), name TEXT, description TEXT, created_by TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE)");
  
  db.run("CREATE TABLE IF NOT EXISTS conversation_participants (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT DEFAULT 'member', joined_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE(conversation_id, user_id))");
  
  console.log('Database initialized with test users');
});

// Create conversation for Alice and Bob
db.run("INSERT INTO conversations (id, type, created_by) VALUES (?, ?, ?)", 
  ['1', 'direct', '1']);

db.run("INSERT INTO conversation_participants (id, conversation_id, user_id, role, joined_at, last_read_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
  ['1', '1', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP]);

db.run("INSERT INTO conversation_participants (id, conversation_id, user_id, role, joined_at, last_read_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
  ['2', '1', '2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP]);

console.log('Sample conversation created');

  db.run(
    'CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, type TEXT NOT NULL, name TEXT, created_by TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)'
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS conversation_participants (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT DEFAULT 'member', joined_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
  );

  console.log('Database initialized with test users');
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

        if (user.password !== password) {
          return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
          });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username },
          'secret-key'
        );

        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              username: user.username,
              display_name: user.display_name,
              status: user.status,
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

// Register endpoint
app.post('/api/auth/register', (req, res) => {
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

    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (err, existingUser) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
          });
        }

        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Username already exists',
            },
          });
        }

        const userId = 'user_' + Date.now();
        db.run(
          'INSERT INTO users (id, username, password, display_name, status) VALUES (?, ?, ?, ?, ?)',
          [userId, username, password, displayName || username, 'offline']
        );

        res.json({
          success: true,
          data: {
            user: {
              id: userId,
              username,
              username,
              display_name: displayName || username,
              status: 'offline',
            },
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
  db.all('SELECT * FROM conversations', (err, conversations) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      });
    }

    res.json({
      success: true,
      data: conversations || [],
    });
  });
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

// Serve frontend static files
app.use(express.static('./client/dist'));

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`✅ COMPLETE CHAT SERVER RUNNING ON http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`🎨 Frontend: http://localhost:${PORT}/`);
  console.log(`🗄️ Database: ./data/chat.db`);
  console.log(`👥 Test Users: alice/password123, bob/password456`);
});

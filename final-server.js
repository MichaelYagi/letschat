const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3');

const app = express();
const server = require('http').createServer(app);

// Initialize database
const db = new sqlite3.Database('./data/chat.db');

// Test users
const testUsers = [
  { id: '1', username: 'alice', password: 'password123', displayName: 'Alice', status: 'online' },
  { id: '2', username: 'bob', password: 'password456', displayName: 'Bob', status: 'online' }
];

// Initialize database with proper schema
db.serialize(() => {
  // Users table
  db.run("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, display_name TEXT, status TEXT DEFAULT 'offline', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
  
  // Insert test users
  testUsers.forEach(user => {
    db.run("INSERT INTO users (id, username, password, display_name, status) VALUES (?, ?, ?, ?, ?)", 
      [user.id, user.username, user.password, user.displayName, user.status]);
  });
  
  console.log('Database initialized with test users');
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }
  
  try {
    const decoded = jwt.verify(token, 'secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
}));

app.use(express.json());
app.use(authenticateToken);

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Username and password are required' } });
    }

    // Check if user exists
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, existingUser) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Database error' } });
      }

      if (existingUser) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Username already exists' } });
      }

      // Create new user
      const userId = 'user_' + Date.now();
      db.run("INSERT INTO users (id, username, password, display_name, status) VALUES (?, ?, ?, ?, ?)", 
        [userId, username, password, displayName || username, 'offline']);
      
      res.json({
        success: true,
        data: {
          user: { id: userId, username, username, displayName: displayName || username, status: 'offline' }
        }
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Registration error' } });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Get user from database
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
      if (err || !user) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
      }

      if (user.password !== password) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
      }

      // Generate token
      const token = jwt.sign({ id: user.id, username: user.username }, 'secret-key');
      
      console.log('Login successful:', username);
      res.json({
        success: true,
        data: {
          user: { id: user.id, username: user.username, displayName: user.displayName, status: 'online' },
          tokens: { accessToken: token, refreshToken: token }
        }
      });
    };
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Login error' } });
  }
});

// Get conversations endpoint
app.get('/api/conversations', (req, res) => {
  const userId = req.user.id;
  
  if (!userId) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }
  
// Get conversations where user is participant
  db.all(\`
    SELECT DISTINCT c.*,
           GROUP_CONCAT(p.username, ', ') as participants
    FROM conversations c
    LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id 
    JOIN users p ON p.user_id = p.id 
    WHERE p.user_id = ?
  `, [userId], (err, conversations) => {
    if (err) {
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Database error' } });
    }
    
    res.json({
      success: true,
      data: conversations || []
    });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() }
  });
});

// Serve frontend static files
app.use(express.static('./client/dist'));

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`✅ FINAL CHAT SERVER RUNNING ON http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`🎨 Frontend: http://localhost:${PORT}/`);
  console.log(`🗄️ Database: ./data/chat.db`);
  console.log(`👥 Test Users: alice/password123, bob/password456`);
});
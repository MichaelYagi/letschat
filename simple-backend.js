const express = require('express');
const cors = require('cors');

const app = express();
app.use(
  cors({
    origin: 'http://localhost:3001',
    credentials: true,
  })
);

// Database users - will load from SQLite
let users = [];
  { id: '1', username: 'alice', password: 'password123', displayName: 'Alice' },
  { id: '2', username: 'bob', password: 'password456', displayName: 'Bob' },
];

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  console.log('Login request:', { username, password });

  // Database user lookup
      const user = users.find(u => u.username === username);
  if (user) {
    console.log('Database user found:', user);
  }
  if (!user) {
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

  const token = Buffer.from(`${username}:${password}`).toString('base64');

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
      tokens: { accessToken: token, refreshToken: token },
    },
  });
});

app.get('/api/conversations', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        type: 'direct',
        name: 'Alice & Bob',
        participants: ['1', '2'],
      },
    ],
  });
});

// Add database initialization
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/chat.db');

// Initialize database on startup
db.serialize(() => {
  console.log('Database initialized');
});

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
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`✅ SIMPLE SERVER RUNNING on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`🔑 Users: alice/password123, bob/password456`);
});

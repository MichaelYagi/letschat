const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(
  cors({
    origin: 'http://localhost:3001',
    credentials: true,
  })
);

app.use(express.json());

// Simple database users
const users = [
  {
    id: '1',
    username: 'alice',
    password: 'password123',
    displayName: 'Alice',
  },
  { id: '2', username: 'bob', password: 'password456', displayName: 'Bob' },
];

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  console.log('Login request:', { username, password });

  // Check database for user first, then fall back to test users
  let user = users.find(u => u.username === username);
  if (!user) {
    // Fallback to test users if database empty
    const testUsers = [
      {
        id: '1',
        username: 'alice',
        password: 'password123',
        displayName: 'Alice',
      },
      { id: '2', username: 'bob', password: 'password456', displayName: 'Bob' },
    ];
    user = testUsers.find(u => u.username === username);
  }
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
    });
  }

  // Password check
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

  console.log('Login successful for:', username);

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

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`✅ WORKING CHAT SERVER ON http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`🔑 Users: alice/password123, bob/password456`);
});

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

app.use(express.json({
  verify: false,
  strict: false
}));

// Simple test users with clear text passwords
const users = [
  { id: '1', username: 'alice', password: 'password123', displayName: 'Alice' },
  { id: '2', username: 'bob', password: 'password456', displayName: 'Bob' },
];

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login request:', { username, password, body: req.body });

  const user = users.find(u => u.username === username);
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
        displayName: user.displayName,
      },
      tokens: { accessToken: token, refreshToken: token },
    },
  });
});

app.get('/api/conversations', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Working server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
});

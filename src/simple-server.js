const express = require('express');
const cors = require('cors');
const app = express();

// Enable all CORS for testing
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// All required endpoints for frontend
app.get('/api/auth/search', (req, res) => {
  const q = req.query.q || '';
  const results = [
    { id: 'user1', username: 'user1', status: 'online' },
    { id: 'user2', username: 'user2', status: 'offline' },
    { id: 'user3', username: 'user3', status: 'online' },
    { id: 'user4', username: 'user4', status: 'online' },
    { id: 'user5', username: 'user5', status: 'online' },
    { id: 'user6', username: 'user6', status: 'online' },
  ]
    .filter(
      u => u.username.toLowerCase().includes(q.toLowerCase()) && q.length > 0
    )
    .slice(0, 10);
  res.json({ success: true, data: results });
});

app.get('/api/v1/connections', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'conn1',
        user: { id: 'friend1', username: 'friend1', status: 'online' },
        status: 'accepted',
      },
      {
        id: 'conn2',
        user: { id: 'friend2', username: 'friend2', status: 'online' },
        status: 'accepted',
      },
    ],
  });
});

app.listen(3000, () => {
  console.log('✅ Simple server running on port 3000');
});

app.get('/api/v1/connections/pending', (req, res) => {
  res.json({ success: true, data: [] });
});

app.post('/api/v1/connections/request', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res
      .status(400)
      .json({ success: false, error: 'Username is required' });
  }

  const success = Math.random() < 0.5; // 50% success rate
  res.status(success ? 201 : 400).json({
    success,
    data: success
      ? {
          id: 'req-' + Date.now(),
          requesterId: 'current-user-id',
          addresseeId: 'target-user-id',
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
      : { error: 'User not found or request already exists' },
  });
});

app.listen(3000, () => {
  console.log('✅ Simple server running on port 3000');
  console.log('Endpoints ready for frontend testing');
});

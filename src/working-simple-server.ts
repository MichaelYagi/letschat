import express from 'express';
import cors from 'cors';

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

// Basic body parsing
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// User search
app.get('/api/auth/search', (req, res) => {
  const q = (req.query.q as string) || '';
  console.log('Search query:', q);

  res.json({
    success: true,
    data: [
      { id: 'mock-user-1', username: 'user1', status: 'online' },
      { id: 'mock-user-2', username: 'user2', status: 'offline' },
    ].filter(
      u => u.username.toLowerCase().includes(q.toLowerCase()) && q.length > 0
    ),
  });
});

// Connections list
app.get('/api/v1/connections', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'mock-connection-1',
        user: { id: 'mock-friend-1', username: 'friend1', status: 'online' },
        status: 'accepted',
      },
    ],
  });
});

// Pending requests
app.get('/api/v1/connections/pending', (req, res) => {
  res.json({ success: true, data: [] });
});

// Send connection request
app.post('/api/v1/connections/request', (req, res) => {
  const { username } = req.body;
  console.log('Received friend request for:', username);

  if (!username) {
    return res
      .status(400)
      .json({ success: false, error: 'Username is required' });
  }

  res.status(201).json({
    success: true,
    data: {
      id: `request-${Date.now()}`,
      requesterId: 'current-user-id',
      addresseeId: 'target-user-id',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(
    'Endpoints working: /health, /api/auth/search, /api/v1/connections*'
  );
});

import express from 'express';
import cors from 'cors';

const app = express();

// Basic CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Body parsing
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Search endpoint
app.get('/api/auth/search', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'mock-user-1', username: 'user1', status: 'online' },
      { id: 'mock-user-2', username: 'user2', status: 'offline' },
      { id: 'mock-user-3', username: 'user3', status: 'online' },
    ],
  });
});

// Get connections
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

// Get pending requests
app.get('/api/v1/connections/pending', (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

// Send connection request
app.post('/api/v1/connections/request', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      success: false,
      error: 'Username is required',
    });
  }

  console.log('Received request for:', username);
  res.status(201).json({
    success: true,
    data: {
      id: 'mock-request-id',
      requesterId: 'current-user-id',
      addresseeId: 'target-user-id',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
});

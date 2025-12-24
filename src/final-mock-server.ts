import express from 'express';
import cors from 'cors';

const app = express();

// CORS for all routes
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
app.use(express.json());

// Mock data
const mockUsers = [
  { id: 'mock-user-1', username: 'user1', status: 'online' },
  { id: 'mock-user-2', username: 'user2', status: 'offline' },
  { id: 'mock-user-3', username: 'user3', status: 'online' },
  { id: 'mock-user-4', username: 'user4', status: 'online' },
];

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// User search endpoint
app.get('/api/auth/search', (req, res) => {
  try {
    const q = req.query.q as string;
    const searchQuery = String(q || '').toLowerCase();

    const results = mockUsers.filter(
      user =>
        user.username.toLowerCase().includes(searchQuery) &&
        user.username !== 'current-user'
    );

    console.log('Search query:', q, 'Results:', results.length);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
    });
  }
});

// Get pending requests
app.get('/api/v1/connections/pending', (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get pending requests',
    });
  }
});

// Get user connections
app.get('/api/v1/connections', (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 'mock-connection-1',
          user: { id: 'mock-friend-1', username: 'friend1', status: 'online' },
          status: 'accepted',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get connections',
    });
  }
});

// Send connection request
app.post('/api/v1/connections/request', (req, res) => {
  try {
    const { username } = req.body;
    console.log('Request body:', req.body);

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required',
      });
    }

    const targetUser = mockUsers.find(u => u.username === username);
    if (!targetUser) {
      return res.status(400).json({
        success: false,
        error: 'User not found',
      });
    }

    // Simple success response
    res.status(201).json({
      success: true,
      data: {
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requesterId: 'current-user-id',
        addresseeId: targetUser.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Connection request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send request',
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Mock server running on port ${PORT}`);
  console.log('Endpoints:');
  console.log('  GET /health');
  console.log('  GET /api/auth/search?q=...');
  console.log('  GET /api/v1/connections');
  console.log('  GET /api/v1/connections/pending');
  console.log('  POST /api/v1/connections/request');
});

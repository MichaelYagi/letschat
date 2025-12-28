import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const app = express();

// Mock user data
const mockUsers = [
  { id: 'mock-user-1', username: 'user1', status: 'online' },
  { id: 'mock-user-2', username: 'user2', status: 'offline' },
  { id: 'mock-user-3', username: 'user3', status: 'online' },
];

// Mock connection data
const mockConnections = [
  {
    id: 'mock-connection-1',
    user: { id: 'mock-friend-1', username: 'friend1', status: 'online' },
    status: 'accepted',
    createdAt: new Date().toISOString(),
  },
];

const mockPendingRequests = [
  {
    id: 'mock-pending-1',
    requesterProfile: {
      id: 'mock-user-4',
      username: 'user4',
      status: 'online',
      avatarUrl: null,
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// CORS preflight handler
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

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
    const limit = parseInt(req.query.limit as string) || 10;

    const searchQuery = String(q || '').toLowerCase();
    const results = mockUsers
      .filter(user => user.username.toLowerCase().includes(searchQuery))
      .filter(user => user.username !== 'current-user')
      .slice(0, limit);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// Get pending connection requests
app.get('/api/v1/connections/pending', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockPendingRequests,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: 'Failed to get pending requests' });
  }
});

// Get user connections
app.get('/api/v1/connections', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockConnections,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: 'Failed to get connections' });
  }
});

// Send connection request
app.post('/api/v1/connections/request', express.json(), (req, res) => {
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

    // Simulate checking for existing requests
    const existingRequest = mockPendingRequests.find(
      pr =>
        pr.requesterProfile?.username === username ||
        mockConnections.some(c => c.user?.username === username)
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'Connection request already exists',
      });
    }

    // Create new request
    const newRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requesterProfile: {
        id: 'current-user',
        username: 'current-user',
        status: 'online',
        avatarUrl: null,
      },
      addresseeId: targetUser.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockPendingRequests.push(newRequest);

    console.log('Created connection request:', newRequest);

    res.status(201).json({
      success: true,
      data: newRequest,
    });
  } catch (error) {
    console.error('Connection request error:', error);
    res.status(500).json({ success: false, error: 'Failed to send request' });
  }
});

// Accept connection request
app.put('/api/v1/connections/:requestId/accept', (req, res) => {
  try {
    const { requestId } = req.params;
    console.log('Accepting request:', requestId);

    // Find and update the request
    const requestIndex = mockPendingRequests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) {
      return res.status(400).json({ error: 'Request not found' });
    }

    mockPendingRequests[requestIndex].status = 'accepted';

    // Create accepted connection
    const acceptedConnection = {
      id: requestId,
      user: mockUsers.find(
        u =>
          u.username ===
          mockPendingRequests[requestIndex].requesterProfile?.username
      ),
      status: 'accepted',
      createdAt: new Date().toISOString(),
    };

    mockConnections.push(acceptedConnection);

    res.json({
      success: true,
      data: {
        id: requestId,
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to accept request' });
  }
});

const PORT = 3000;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Complete mock server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /health - Health check');
  console.log('  GET /api/auth/search?q=... - User search');
  console.log('  GET /api/v1/connections - Get connections');
  console.log('  GET /api/v1/connections/pending - Get pending requests');
  console.log('  POST /api/v1/connections/request - Send friend request');
  console.log('  PUT /api/v1/connections/:id/accept - Accept request');
});

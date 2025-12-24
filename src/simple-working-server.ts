import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const app = express();
const server = createServer(app);

// Mock user data
const mockUsers = [
  { id: 'mock-user-1', username: 'user1', status: 'online' },
  { id: 'mock-user-2', username: 'user2', status: 'offline' },
  { id: 'mock-user-3', username: 'user3', status: 'online' },
];

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// User search endpoint (for frontend user search)
app.get('/api/auth/search', (req, res) => {
  try {
    const q = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;
    console.log('Searching for users:', q);

    // Mock user search - exclude current user and return matching users
    const searchQuery = String(q || '').toLowerCase();
    const allMockUsers = mockUsers.filter(
      user =>
        user.username.toLowerCase().includes(searchQuery) &&
        user.username !== 'current-user'
    );

    res.json({
      success: true,
      data: allMockUsers.slice(0, parseInt(limit.toString())),
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('OPTIONS request to:', req.path, 'from origin:', origin);
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Get pending connection requests
app.get('/api/v1/connections/pending', async (req, res) => {
  try {
    // Mock pending requests
    res.json({
      success: true,
      data: [
        {
          id: 'mock-pending-1',
          requesterProfile: {
            id: 'mock-user-1',
            username: 'user1',
            status: 'online',
            avatarUrl: null,
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user connections
app.get('/api/v1/connections', async (req, res) => {
  try {
    // Mock user connections
    res.json({
      success: true,
      data: [
        {
          id: 'mock-connection-1',
          user: {
            id: 'mock-friend-1',
            username: 'friend1',
            status: 'online',
          },
          status: 'accepted',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error('Error getting connections:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Accept connection request
app.put('/api/v1/connections/:requestId/accept', async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log('Accepting request:', requestId);

    res.json({
      success: true,
      data: {
        id: requestId,
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Simple friend request endpoint
app.post(
  '/api/v1/connections/request',
  express.json({ type: '*' }),
  async (req, res) => {
    try {
      const { username } = req.body;
      console.log('Received friend request for:', username);

      // Check if user exists and get their ID
      const targetUser = mockUsers.find(u => u.username === username);
      if (!targetUser) {
        return res.status(400).json({
          success: false,
          error: 'User not found',
        });
      }

      // Check if request already exists
      if (Math.random() < 0.3) {
        // 30% chance of already existing
        return res.status(400).json({
          success: false,
          error: 'Connection request already exists',
        });
      }

      // Create new connection request
      const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      res.status(201).json({
        success: true,
        data: {
          id: connectionId,
          requesterId: 'current-user-id',
          addresseeId: targetUser.id,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error in friend request:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Add CORS and body parsing BEFORE routes
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Simple server running on port ${PORT}`);
});

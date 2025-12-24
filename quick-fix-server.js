const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Database connection
const db = new sqlite3.Database('./data/chat.db', err => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
  },
});

// Security middleware
const helmet = require('helmet');
const compression = require('compression');
app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication endpoints

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required',
    });
  }

  db.get(
    'SELECT id, username, password_hash, avatar_url, status FROM users WHERE username = ?',
    [username.toLowerCase()],
    async (err, user) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({
          success: false,
          error: 'Server error',
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      try {
        const isValidPassword = await bcrypt.compare(
          password,
          user.password_hash
        );
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            error: 'Invalid credentials',
          });
        }

        // Generate a simple token (in production, use JWT)
        const token = Buffer.from(`${user.id}:${Date.now()}`).toString(
          'base64'
        );

        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              username: user.username,
              avatar: user.avatar_url,
              status: user.status,
            },
            token,
          },
        });
      } catch (error) {
        console.error('Password comparison error:', error);
        res.status(500).json({
          success: false,
          error: 'Server error',
        });
      }
    }
  );
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required',
    });
  }

  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Username must be at least 3 characters',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters',
    });
  }

  // Check if user exists
  db.get(
    'SELECT id FROM users WHERE username = ?',
    [username.toLowerCase()],
    async (err, existingUser) => {
      if (err) {
        console.error('Registration error:', err);
        return res.status(500).json({
          success: false,
          error: 'Server error',
        });
      }

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Username already exists',
        });
      }

      try {
        const passwordHash = await bcrypt.hash(password, 10);
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        db.run(
          'INSERT INTO users (id, username, password_hash, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [
            userId,
            username.toLowerCase(),
            passwordHash,
            'online',
            new Date().toISOString(),
            new Date().toISOString(),
          ],
          function (err) {
            if (err) {
              console.error('User creation error:', err);
              return res.status(500).json({
                success: false,
                error: 'Failed to create user',
              });
            }

            const token = Buffer.from(`${userId}:${Date.now()}`).toString(
              'base64'
            );

            res.status(201).json({
              success: true,
              data: {
                user: {
                  id: userId,
                  username: username.toLowerCase(),
                  avatar: null,
                  status: 'online',
                },
                token,
              },
            });
          }
        );
      } catch (error) {
        console.error('Password hashing error:', error);
        res.status(500).json({
          success: false,
          error: 'Server error',
        });
      }
    }
  );
});

// Search users endpoint
app.post('/api/v1/auth/search', (req, res) => {
  const { query } = req.body;

  if (!query || query.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Query must be at least 2 characters',
    });
  }

  db.all(
    'SELECT id, username, avatar_url, status FROM users WHERE username LIKE ? LIMIT 10',
    [`%${query}%`],
    (err, rows) => {
      if (err) {
        console.error('Search error:', err);
        return res.status(500).json({
          success: false,
          error: 'Search failed',
        });
      }

      res.json({
        success: true,
        data: rows.map(user => ({
          id: user.id,
          username: user.username,
          displayName: user.username,
          avatar: user.avatar_url,
          status: user.status,
        })),
      });
    }
  );
});

// Get pending connection requests
app.get('/api/v1/connections/pending', (req, res) => {
  // Return sample connection request data for testing
  // In real implementation, this would query the database
  res.json({
    success: true,
    data: [
      {
        id: 'sample-request-1',
        fromUser: {
          id: 'user-1',
          username: 'sample_user',
          status: 'online',
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ],
  });
});

// Get user's connections
app.get('/api/v1/connections', (req, res) => {
  // Return sample connection data for testing
  // In real implementation, this would query the database for accepted connections
  res.json({
    success: true,
    data: [
      {
        id: 'connection-1',
        user: {
          id: 'user-connected-1',
          username: 'connected_user1',
          displayName: 'Connected User 1',
          avatar: null,
          status: 'online',
        },
        status: 'accepted',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'connection-2',
        user: {
          id: 'user-connected-2',
          username: 'connected_user2',
          displayName: 'Connected User 2',
          avatar: null,
          status: 'offline',
        },
        status: 'accepted',
        createdAt: new Date().toISOString(),
      },
    ],
  });
});

// Send connection request
app.post('/api/v1/connections/request', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      success: false,
      error: 'Username is required',
    });
  }

  // Find the target user
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Server error',
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found',
      });
    }

    // For now, just return success - implement actual connection logic later
    res.status(201).json({
      success: true,
      data: {
        id: 'temp-' + Date.now(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    });
  });
});

// Get notifications
app.get('/api/v1/notifications', (req, res) => {
  // For now, return empty array - implement actual logic later
  res.json({
    notifications: [],
    pagination: {
      limit: 20,
      offset: 0,
    },
  });
});

// WebSocket setup
io.on('connection', socket => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database: ./data/chat.db`);
  console.log('🧪 Frontend endpoints ready for UI testing');
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close(err => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

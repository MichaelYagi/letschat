const express = require('express');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('./data/chat.db');

// Store real-time errors and network requests
let errorLog = [];
let networkLog = [];
let userActions = [];

// Create HTTP interceptor to monitor requests
app.use(
  express.json({
    type: '*/*',
    limit: '10mb',
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const oldSend = res.json;

  res.json = function (data) {
    const end = Date.now();

    networkLog.push({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode || 200,
      duration: end - start,
      responseData: data,
    });

    if (req.url && req.url.includes('/api/auth')) {
      console.log(`🌐 API Request: ${req.method} ${req.url}`);

      if (req.method === 'POST') {
        if (req.url.includes('register')) {
          console.log(`📝 Registration attempt:`, req.body);
        } else if (req.url.includes('login')) {
          console.log(`🔑 Login attempt:`, req.body);
        }
      }
    }

    return oldSend.call(this, data);
  };

  next();
});

// WebSocket for real-time monitoring
const io = new Server({
  cors: { origin: '*' },
});

// Store user connections
const userConnections = new Map();

io.on('connection', socket => {
  console.log(`🔌 User connected via WebSocket: ${socket.id}`);

  // Monitor for auth events
  socket.on('register_attempt', data => {
    userActions.push({
      type: 'register_attempt',
      data,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
    });
    console.log(`📝 Frontend Registration Attempt:`, data);
  });

  socket.on('login_attempt', data => {
    userActions.push({
      type: 'login_attempt',
      data,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
    });
    console.log(`🔑 Frontend Login Attempt:`, data);
  });

  socket.on('register_success', data => {
    userActions.push({
      type: 'register_success',
      data,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
    });
    console.log(`✅ Frontend Registration Success:`, data);
  });

  socket.on('login_success', data => {
    userActions.push({
      type: 'login_success',
      data,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
    });
    console.log(`✅ Frontend Login Success:`, data);
  });

  socket.on('frontend_error', data => {
    errorLog.push({
      type: 'frontend_error',
      error: data.error,
      stack: data.stack,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
    });
    console.log(`❌ Frontend Error:`, data);
  });

  socket.on('navigation_error', data => {
    errorLog.push({
      type: 'navigation_error',
      error: data.error,
      from: data.from,
      to: data.to,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
    });
    console.log(`🧭 Frontend Navigation Error:`, data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    userConnections.delete(socket.id);
  });
});

// API endpoints for checking database
app.get('/api/error-log', (req, res) => {
  res.json({
    errors: errorLog,
    network: networkLog,
    userActions: userActions,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/user-count', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ userCount: row.count });
    }
  });
});

app.get('/api/recent-users', (req, res) => {
  db.all(
    'SELECT id, username, display_name, status, created_at FROM users ORDER BY created_at DESC LIMIT 5',
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ users: rows });
      }
    }
  );
});

app.get('/api/clear-errors', (req, res) => {
  errorLog = [];
  networkLog = [];
  userActions = [];

  // Clear recent test users from database
  db.run(
    "DELETE FROM users WHERE username LIKE '%test%' OR username LIKE '%ui%'",
    [],
    err => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Test data cleared' });
      }
    }
  );
});

// Test endpoint to verify frontend components
app.get('/api/test-frontend', (req, res) => {
  res.json({
    message: 'Frontend Error Test Interface',
    instructions: [
      '1. Open http://localhost:3001/register',
      '2. Fill out registration form and submit',
      '3. Check browser console for JavaScript errors',
      '4. Monitor this server at /api/error-log for real-time error tracking',
      '5. Verify database persistence at /api/user-count',
      '6. Check real-time network requests in networkLog',
    ],
    endpoints: {
      errorLog: '/api/error-log',
      userCount: '/api/user-count',
      recentUsers: '/api/recent-users',
      clearTestData: '/api/clear-errors',
    },
  });
});

const PORT = 3003;
const server = app.listen(PORT, () => {
  console.log(
    `🔍 Frontend Error Monitor Server running on http://localhost:${PORT}`
  );
  console.log(`📊 Test Interface: http://localhost:${PORT}/api/test-frontend`);
  console.log(`🌐 Real-time API monitoring active`);
  console.log(`💡 Open http://localhost:3001/register to begin testing`);
  console.log(`📝 Check browser console (F12) for JavaScript errors`);
  console.log(`🔍 Check Network tab for failed requests`);
  console.log(`🗃️ Monitor: http://localhost:${PORT}/api/error-log`);
});

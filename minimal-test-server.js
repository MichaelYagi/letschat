const express = require('express');
const cors = require('cors');

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Registration endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Registration request:', req.body);

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password required',
    });
  }

  // Mock successful registration
  res.status(201).json({
    success: true,
    data: {
      user: {
        id: Date.now().toString(),
        username,
        displayName: username,
        status: 'online',
      },
      token: 'mock-jwt-token',
    },
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
});

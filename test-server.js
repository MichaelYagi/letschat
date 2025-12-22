const express = require('express');
const cors = require('cors');
const { createServer } = require('http');

const app = express();
const server = createServer(app);

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic API info
app.get('/api', (req, res) => {
  res.json({ message: "Let's Chat API", version: '1.0.0' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

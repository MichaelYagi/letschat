const express = require('express');
const { createServer } = require('http');

const app = express();
const server = createServer(app);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Simple server is working' });
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Test at http://localhost:${PORT}/health`);
});

import express from 'express';
import cors from 'cors';

const app = express();

// CORS
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

// Simple test endpoint
app.post('/test', (req, res) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  res.json({
    success: true,
    headers: req.headers,
    body: req.body,
    query: req.query,
  });
});

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
});

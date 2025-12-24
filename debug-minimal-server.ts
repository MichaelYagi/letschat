import express from 'express';
import cors from 'cors';
import { config } from './src/config';

const app = express();
const PORT = config.port;

app.use(
  cors({
    origin: Array.isArray(config.cors.origin)
      ? config.cors.origin
      : [config.cors.origin],
    credentials: true,
  })
);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
  console.log(`CORS origins:`, config.cors.origin);
});

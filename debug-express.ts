import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

console.log('Step 1: Basic imports done');

const app = express();
const server = createServer(app);

console.log('Step 2: Express server created');

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('Step 3: Middleware added');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

console.log('Step 4: Health endpoint added');

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Step 5: Server running on port ${PORT}`);
});

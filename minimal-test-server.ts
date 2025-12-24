import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal server working' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});

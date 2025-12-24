import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './src/config';
import { specs } from './src/config/swagger';

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

// Swagger documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Let's Chat API Documentation",
  })
);

app.listen(PORT, () => {
  console.log(`Server with swagger running on port ${PORT}`);
  console.log(`CORS origins:`, config.cors.origin);
});

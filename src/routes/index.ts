import { Router } from 'express';

export const setupRoutes = (_authMiddleware: any): Router => {
  const router = Router();

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Placeholder for future routes
  router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
  });

  return router;
};

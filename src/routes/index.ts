import { Router } from 'express';
import authRoutes from './auth';
import messageRoutes from './messages';
import fileRoutes from './files';
import connectionRoutes from './connections';
import reactionRoutes from './reactions';
import readReceiptRoutes from './readReceipts';

export const setupRoutes = (): Router => {
  const router = Router();

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  router.use('/auth', authRoutes);
  router.use('/messages', messageRoutes);
  router.use('/files', fileRoutes);
  router.use('/connections', connectionRoutes);
  router.use('/messages', reactionRoutes);
  router.use('/messages', readReceiptRoutes);

  // Placeholder for future routes
  router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
  });

  return router;
};

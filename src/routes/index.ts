import { Router } from 'express';
import authRoutes from './auth';
import messageRoutes from './messages';
import fileRoutes from './files';
import connectionRoutes from './connections';
import reactionRoutes from './reactions';
import readReceiptRoutes from './readReceipts';
import notificationRoutes from './notifications';

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
  router.use('/notifications', notificationRoutes);

  // v1 routes for frontend compatibility
  router.use('/v1/connections', connectionRoutes);
  router.use('/v1/auth', authRoutes);
  router.use('/v1/messages', messageRoutes);
  router.use('/v1/notifications', notificationRoutes);

  // Placeholder for future routes
  router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
  });

  return router;
};

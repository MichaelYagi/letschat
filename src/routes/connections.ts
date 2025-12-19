import { Router } from 'express';
import { ConnectionController } from '../controllers/ConnectionController';
import { authMiddleware } from '../config/jwt';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Send connection request
router.post('/request', ConnectionController.sendRequest);

// Get pending requests
router.get('/pending', ConnectionController.getPendingRequests);

// Get user's connections
router.get('/', ConnectionController.getConnections);

// Get connection status with user
router.get('/status', ConnectionController.getConnectionStatus);

// Accept connection request
router.post('/accept', ConnectionController.acceptRequest);

// Decline connection request
router.post('/decline', ConnectionController.declineRequest);

// Remove connection
router.delete('/remove', ConnectionController.removeConnection);

// Block user
router.post('/block', ConnectionController.blockUser);

// Unblock user
router.post('/unblock', ConnectionController.unblockUser);

// Get blocked users
router.get('/blocked', ConnectionController.getBlockedUsers);

// Search users for connections
router.get('/search', ConnectionController.searchUsers);

export default router;
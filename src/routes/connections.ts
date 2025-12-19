import { Router } from 'express';
import { ConnectionController } from '../controllers/ConnectionController';
import { authMiddleware } from '../config/jwt';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/connections/request:
 *   post:
 *     summary: Send connection request
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username to send request to
 *     responses:
 *       201:
 *         description: Connection request sent
 *       400:
 *         description: Invalid request or user not found
 */
router.post('/request', ConnectionController.sendRequest);

/**
 * @swagger
 * /api/connections/pending:
 *   get:
 *     summary: Get pending connection requests
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending requests retrieved successfully
 */
router.get('/pending', ConnectionController.getPendingRequests);

/**
 * @swagger
 * /api/connections:
 *   get:
 *     summary: Get user's connections
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [accepted, pending, blocked]
 *         description: Filter by connection status
 *     responses:
 *       200:
 *         description: Connections retrieved successfully
 */
router.get('/', ConnectionController.getConnections);

/**
 * @swagger
 * /api/connections/status:
 *   get:
 *     summary: Get connection status with user
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username to check status with
 *     responses:
 *       200:
 *         description: Connection status retrieved successfully
 */
router.get('/status', ConnectionController.getConnectionStatus);

/**
 * @swagger
 * /api/connections/accept:
 *   post:
 *     summary: Accept connection request
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               connectionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Connection request accepted
 */
router.post('/accept', ConnectionController.acceptRequest);

/**
 * @swagger
 * /api/connections/decline:
 *   post:
 *     summary: Decline connection request
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               connectionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Connection request declined
 */
router.post('/decline', ConnectionController.declineRequest);

/**
 * @swagger
 * /api/connections/remove:
 *   delete:
 *     summary: Remove connection
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Connection removed successfully
 */
router.delete('/remove', ConnectionController.removeConnection);

/**
 * @swagger
 * /api/connections/block:
 *   post:
 *     summary: Block user
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: User blocked successfully
 */
router.post('/block', ConnectionController.blockUser);

/**
 * @swagger
 * /api/connections/unblock:
 *   post:
 *     summary: Unblock user
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: User unblocked successfully
 */
router.post('/unblock', ConnectionController.unblockUser);

/**
 * @swagger
 * /api/connections/blocked:
 *   get:
 *     summary: Get blocked users
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blocked users retrieved successfully
 */
router.get('/blocked', ConnectionController.getBlockedUsers);

/**
 * @swagger
 * /api/connections/search:
 *   get:
 *     summary: Search users for connections
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', ConnectionController.searchUsers);

export default router;

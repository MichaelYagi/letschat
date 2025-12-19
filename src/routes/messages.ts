import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { authMiddleware } from '../config/jwt';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Get user conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 */
router.get('/conversations', MessageController.getConversations);

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateConversationRequest:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           enum: [direct, group]
 *         name:
 *           type: string
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *         participantIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 */

/**
 * @swagger
 * /api/messages/conversations:
 *   post:
 *     summary: Create new conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateConversationRequest'
 *     responses:
 *       201:
 *         description: Conversation created successfully
 */
router.post('/conversations', MessageController.createConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get conversation messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get(
  '/conversations/:conversationId/messages',
  MessageController.getMessages
);

/**
 * @swagger
 * components:
 *   schemas:
 *     SendMessageRequest:
 *       type: object
 *       required:
 *         - conversationId
 *         - content
 *       properties:
 *         conversationId:
 *           type: string
 *           format: uuid
 *         content:
 *           type: string
 *           maxLength: 2000
 *         contentType:
 *           type: string
 *           enum: [text, image, file]
 *           default: text
 *         replyToId:
 *           type: string
 *           format: uuid
 *           nullable: true
 */

/**
 * @swagger
 * /api/messages/messages:
 *   post:
 *     summary: Send message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/messages', MessageController.sendMessage);

/**
 * @swagger
 * /api/messages/messages/{messageId}:
 *   put:
 *     summary: Edit message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: Message edited successfully
 */
router.put('/messages/:messageId', MessageController.editMessage);

/**
 * @swagger
 * /api/messages/messages/{messageId}:
 *   delete:
 *     summary: Delete message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Message deleted successfully
 */
router.delete('/messages/:messageId', MessageController.deleteMessage);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/participants:
 *   post:
 *     summary: Add participants to conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Participants added successfully
 */
router.post(
  '/conversations/:conversationId/participants',
  MessageController.addParticipants
);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/participants:
 *   delete:
 *     summary: Remove participant from conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: participantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Participant removed successfully
 */
router.delete(
  '/conversations/:conversationId/participants',
  MessageController.removeParticipant
);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/read:
 *   post:
 *     summary: Mark messages as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.post(
  '/conversations/:conversationId/read',
  MessageController.markAsRead
);

export default router;

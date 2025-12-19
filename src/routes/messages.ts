import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { authMiddleware } from '../config/jwt';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get conversations
router.get('/conversations', MessageController.getConversations);

// Create conversation
router.post('/conversations', MessageController.createConversation);

// Get conversation messages
router.get('/conversations/:conversationId/messages', MessageController.getMessages);

// Send message
router.post('/messages', MessageController.sendMessage);

// Edit message
router.put('/messages/:messageId', MessageController.editMessage);

// Delete message
router.delete('/messages/:messageId', MessageController.deleteMessage);

// Add participants to conversation
router.post('/conversations/:conversationId/participants', MessageController.addParticipants);

// Remove participant from conversation
router.delete('/conversations/:conversationId/participants', MessageController.removeParticipant);

// Mark messages as read
router.post('/conversations/:conversationId/read', MessageController.markAsRead);

export default router;
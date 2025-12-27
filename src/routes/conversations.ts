import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { authMiddleware } from '../config/jwt';

console.log('🔧 Conversation routes module loaded');

const router = Router();
console.log('🔧 Conversation router created');

// All routes require authentication
router.use(authMiddleware);

// Get conversations
router.get('/', MessageController.getConversations);

// Create conversation
router.post('/', MessageController.createConversation);

// Get conversation messages
router.get('/:conversationId/messages', MessageController.getMessages);

// Add participants to conversation
router.post('/:conversationId/participants', MessageController.addParticipants);

// Remove participant from conversation
router.delete(
  '/:conversationId/participants',
  MessageController.removeParticipant
);

// Mark messages as read
router.post('/:conversationId/read', MessageController.markAsRead);

export default router;

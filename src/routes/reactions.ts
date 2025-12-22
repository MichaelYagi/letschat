import { Router } from 'express';
import { ReactionController } from '../controllers/ReactionController';
import { authenticateToken } from '../middleware/auth';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const reactionController = new ReactionController();

// Add reaction to message
router.post(
  '/reactions',
  authenticateToken,
  [
    body('messageId').notEmpty().withMessage('Message ID is required'),
    body('emoji').notEmpty().withMessage('Emoji is required'),
    body('conversationId')
      .notEmpty()
      .withMessage('Conversation ID is required'),
  ],
  validateRequest,
  reactionController.addReaction
);

// Remove reaction from message
router.delete(
  '/reactions',
  authenticateToken,
  [
    body('messageId').notEmpty().withMessage('Message ID is required'),
    body('emoji').notEmpty().withMessage('Emoji is required'),
    body('conversationId')
      .notEmpty()
      .withMessage('Conversation ID is required'),
  ],
  validateRequest,
  reactionController.removeReaction
);

// Get reactions for a message
router.get(
  '/:messageId/reactions',
  authenticateToken,
  [param('messageId').notEmpty().withMessage('Message ID is required')],
  validateRequest,
  reactionController.getMessageReactions
);

export default router;

import { Router } from 'express';
import { ReadReceiptController } from '../controllers/ReadReceiptController';
import { authenticateToken } from '../middleware/auth';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const readReceiptController = new ReadReceiptController();

// Add read receipt for a message
router.post(
  '/read-receipts',
  authenticateToken,
  [
    body('messageId').notEmpty().withMessage('Message ID is required'),
    body('conversationId')
      .notEmpty()
      .withMessage('Conversation ID is required'),
  ],
  validateRequest,
  readReceiptController.addReadReceipt
);

// Mark conversation as read
router.post(
  '/mark-read',
  authenticateToken,
  [
    body('conversationId')
      .notEmpty()
      .withMessage('Conversation ID is required'),
  ],
  validateRequest,
  readReceiptController.markConversationAsRead
);

// Get read receipts for a message
router.get(
  '/:messageId/read-receipts',
  authenticateToken,
  [param('messageId').notEmpty().withMessage('Message ID is required')],
  validateRequest,
  readReceiptController.getMessageReadReceipts
);

// Update delivery status for a message
router.put(
  '/delivery-status',
  authenticateToken,
  [
    body('messageId').notEmpty().withMessage('Message ID is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('status')
      .isIn(['sent', 'delivered', 'read', 'failed'])
      .withMessage('Invalid status'),
  ],
  validateRequest,
  readReceiptController.updateDeliveryStatus
);

// Get read status for a conversation
router.get(
  '/conversations/:conversationId/read-status',
  authenticateToken,
  [
    param('conversationId')
      .notEmpty()
      .withMessage('Conversation ID is required'),
  ],
  validateRequest,
  readReceiptController.getConversationReadStatus
);

export default router;

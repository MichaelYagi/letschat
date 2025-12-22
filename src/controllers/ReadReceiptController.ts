import { Request, Response } from 'express';
import { ReadReceiptRepository } from '../database/repositories/ReadReceiptRepository';
import { MessageRepository } from '../database/repositories/MessageRepository';
import { logger } from '../utils/logger';
import {
  AddReadReceiptRequest,
  UpdateDeliveryStatusRequest,
} from '../types/Message';

export class ReadReceiptController {
  private readReceiptRepository = new ReadReceiptRepository();

  addReadReceipt = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId, conversationId }: AddReadReceiptRequest = req.body;
      const userId = req.user!.id;

      if (!messageId || !conversationId) {
        res
          .status(400)
          .json({ error: 'Message ID and conversation ID are required' });
        return;
      }

      // Verify message exists and user is part of the conversation
      const message = await MessageRepository.findById(messageId);
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      // Don't allow read receipt for own messages
      if (message.senderId === userId) {
        res.status(400).json({ error: 'Cannot mark own message as read' });
        return;
      }

      const readReceipt = await this.readReceiptRepository.addReadReceipt(
        messageId,
        userId
      );

      // Update delivery status to 'read'
      await this.readReceiptRepository.updateDeliveryStatus(
        messageId,
        userId,
        'read'
      );

      res.status(201).json({
        readReceipt,
        message: 'Read receipt added successfully',
      });

      // Emit WebSocket event
      const io = (req as any).io;
      if (io) {
        io.to(conversationId).emit('message_read', {
          messageId,
          userId,
          timestamp: readReceipt.readAt,
        });
      }
    } catch (error) {
      logger.error('Error adding read receipt:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  markConversationAsRead = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { conversationId } = req.body;
      const userId = req.user!.id;

      if (!conversationId) {
        res.status(400).json({ error: 'Conversation ID is required' });
        return;
      }

      await this.readReceiptRepository.markConversationAsRead(
        conversationId,
        userId
      );

      res.status(200).json({
        message: 'Conversation marked as read successfully',
      });

      // Emit WebSocket event
      const io = (req as any).io;
      if (io) {
        io.to(conversationId).emit('conversation_read', {
          conversationId,
          userId,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error marking conversation as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getMessageReadReceipts = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;

      if (!messageId) {
        res.status(400).json({ error: 'Message ID is required' });
        return;
      }

      // Verify message exists and user is part of the conversation
      const message = await MessageRepository.findById(messageId);
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      const readReceipts =
        await this.readReceiptRepository.getMessageReadReceipts(messageId);
      const deliveryStatus =
        await this.readReceiptRepository.getMessageDeliveryStatus(messageId);

      res.status(200).json({
        readReceipts,
        deliveryStatus,
      });
    } catch (error) {
      logger.error('Error getting message read receipts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateDeliveryStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId, userId, status }: UpdateDeliveryStatusRequest =
        req.body;
      const currentUserId = req.user!.id;

      if (!messageId || !userId || !status) {
        res
          .status(400)
          .json({ error: 'Message ID, user ID, and status are required' });
        return;
      }

      // Only the sender can update delivery status for their messages
      const message = await MessageRepository.findById(messageId);
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      if (message.senderId !== currentUserId) {
        res
          .status(403)
          .json({ error: 'Only message sender can update delivery status' });
        return;
      }

      const deliveryStatus =
        await this.readReceiptRepository.updateDeliveryStatus(
          messageId,
          userId,
          status
        );

      res.status(200).json({
        deliveryStatus,
        message: 'Delivery status updated successfully',
      });

      // Emit WebSocket event
      const io = (req as any).io;
      if (io) {
        io.to(message.conversationId).emit('delivery_status_updated', {
          messageId,
          userId,
          status,
          timestamp: deliveryStatus.timestamp,
        });
      }
    } catch (error) {
      logger.error('Error updating delivery status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getConversationReadStatus = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const userId = req.user!.id;

      if (!conversationId) {
        res.status(400).json({ error: 'Conversation ID is required' });
        return;
      }

      const readReceipts =
        await this.readReceiptRepository.getConversationReadReceipts(
          conversationId,
          userId
        );

      res.status(200).json({
        readReceipts,
      });
    } catch (error) {
      logger.error('Error getting conversation read status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

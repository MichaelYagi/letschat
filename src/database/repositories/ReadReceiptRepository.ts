import db from '../connection';
import { MessageReadReceipt, MessageDeliveryStatus } from '../../types/Message';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ReadReceiptRepository {
  async addReadReceipt(
    messageId: string,
    userId: string
  ): Promise<MessageReadReceipt> {
    try {
      const readReceipt = {
        id: uuidv4(),
        message_id: messageId,
        user_id: userId,
        read_at: new Date(),
      };

      await db('message_read_receipts')
        .insert(readReceipt)
        .onConflict(['message_id', 'user_id'])
        .ignore();

      const result = await db('message_read_receipts')
        .where('id', readReceipt.id)
        .first();

      logger.info(
        `Added read receipt for message ${messageId} by user ${userId}`
      );
      return {
        id: result.id,
        messageId: result.message_id,
        userId: result.user_id,
        readAt: new Date(result.read_at),
      };
    } catch (error) {
      logger.error('Error adding read receipt:', error);
      throw error;
    }
  }

  async updateDeliveryStatus(
    messageId: string,
    userId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed'
  ): Promise<MessageDeliveryStatus> {
    try {
      const deliveryStatus = {
        id: uuidv4(),
        message_id: messageId,
        user_id: userId,
        status,
        timestamp: new Date(),
      };

      await db('message_delivery_status')
        .insert(deliveryStatus)
        .onConflict(['message_id', 'user_id'])
        .merge();

      const result = await db('message_delivery_status')
        .where('id', deliveryStatus.id)
        .first();

      logger.info(
        `Updated delivery status for message ${messageId} to ${status} for user ${userId}`
      );
      return {
        id: result.id,
        messageId: result.message_id,
        userId: result.user_id,
        status: result.status,
        timestamp: new Date(result.timestamp),
      };
    } catch (error) {
      logger.error('Error updating delivery status:', error);
      throw error;
    }
  }

  async getMessageReadReceipts(
    messageId: string
  ): Promise<MessageReadReceipt[]> {
    try {
      const receipts = await db('message_read_receipts')
        .where('message_id', messageId)
        .orderBy('read_at', 'asc');

      return receipts.map(receipt => ({
        id: receipt.id,
        messageId: receipt.message_id,
        userId: receipt.user_id,
        readAt: new Date(receipt.read_at),
      }));
    } catch (error) {
      logger.error('Error getting message read receipts:', error);
      throw error;
    }
  }

  async getMessageDeliveryStatus(
    messageId: string
  ): Promise<MessageDeliveryStatus[]> {
    try {
      const statuses = await db('message_delivery_status')
        .where('message_id', messageId)
        .orderBy('timestamp', 'asc');

      return statuses.map(status => ({
        id: status.id,
        messageId: status.message_id,
        userId: status.user_id,
        status: status.status,
        timestamp: new Date(status.timestamp),
      }));
    } catch (error) {
      logger.error('Error getting message delivery status:', error);
      throw error;
    }
  }

  async getConversationReadReceipts(
    conversationId: string,
    userId: string
  ): Promise<{ messageId: string; readAt: Date }[]> {
    try {
      const receipts = await db('message_read_receipts')
        .join(
          'messages',
          'message_read_receipts.message_id',
          '=',
          'messages.id'
        )
        .where('messages.conversation_id', conversationId)
        .where('message_read_receipts.user_id', userId)
        .select(
          'message_read_receipts.message_id',
          'message_read_receipts.read_at'
        );

      return receipts.map(receipt => ({
        messageId: receipt.message_id,
        readAt: new Date(receipt.read_at),
      }));
    } catch (error) {
      logger.error('Error getting conversation read receipts:', error);
      throw error;
    }
  }

  async markConversationAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      const messages = await db('messages')
        .where('conversation_id', conversationId)
        .where('sender_id', '!=', userId)
        .select('id');

      for (const message of messages) {
        await this.addReadReceipt(message.id, userId);
      }

      logger.info(
        `Marked all messages in conversation ${conversationId} as read for user ${userId}`
      );
    } catch (error) {
      logger.error('Error marking conversation as read:', error);
      throw error;
    }
  }

  async deleteMessageReadReceipts(messageId: string): Promise<void> {
    try {
      await db('message_read_receipts').where('message_id', messageId).del();

      logger.info(`Deleted read receipts for message ${messageId}`);
    } catch (error) {
      logger.error('Error deleting message read receipts:', error);
      throw error;
    }
  }

  async deleteMessageDeliveryStatus(messageId: string): Promise<void> {
    try {
      await db('message_delivery_status').where('message_id', messageId).del();

      logger.info(`Deleted delivery status for message ${messageId}`);
    } catch (error) {
      logger.error('Error deleting message delivery status:', error);
      throw error;
    }
  }
}

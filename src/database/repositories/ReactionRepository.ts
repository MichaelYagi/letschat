import db from '../connection';
import { MessageReaction, MessageReactionSummary } from '../../types/Message';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ReactionRepository {
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<MessageReaction> {
    try {
      const reaction = {
        id: uuidv4(),
        message_id: messageId,
        user_id: userId,
        emoji,
        created_at: new Date(),
      };

      await db('message_reactions').insert(reaction);

      const result = await db('message_reactions')
        .where('id', reaction.id)
        .first();

      logger.info(
        `Added reaction ${emoji} to message ${messageId} by user ${userId}`
      );
      return {
        id: result.id,
        messageId: result.message_id,
        userId: result.user_id,
        emoji: result.emoji,
        createdAt: new Date(result.created_at),
      };
    } catch (error) {
      logger.error('Error adding reaction:', error);
      throw error;
    }
  }

  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    try {
      await db('message_reactions')
        .where({
          message_id: messageId,
          user_id: userId,
          emoji,
        })
        .del();

      logger.info(
        `Removed reaction ${emoji} from message ${messageId} by user ${userId}`
      );
    } catch (error) {
      logger.error('Error removing reaction:', error);
      throw error;
    }
  }

  async getMessageReactions(
    messageId: string
  ): Promise<MessageReactionSummary[]> {
    try {
      const reactions = await db('message_reactions')
        .where('message_id', messageId)
        .select(
          'emoji',
          db.raw('COUNT(*) as count'),
          db.raw('GROUP_CONCAT(user_id) as user_ids')
        )
        .groupBy('emoji');

      return reactions.map(reaction => ({
        emoji: reaction.emoji,
        count: reaction.count,
        currentUserReacted: false, // Will be set by caller
      }));
    } catch (error) {
      logger.error('Error getting message reactions:', error);
      throw error;
    }
  }

  async getUserReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<MessageReaction | null> {
    try {
      const reaction = await db('message_reactions')
        .where({
          message_id: messageId,
          user_id: userId,
          emoji,
        })
        .first();

      if (!reaction) return null;

      return {
        id: reaction.id,
        messageId: reaction.message_id,
        userId: reaction.user_id,
        emoji: reaction.emoji,
        createdAt: new Date(reaction.created_at),
      };
    } catch (error) {
      logger.error('Error getting user reaction:', error);
      throw error;
    }
  }

  async getAllMessageReactions(messageId: string): Promise<MessageReaction[]> {
    try {
      const reactions = await db('message_reactions')
        .where('message_id', messageId)
        .orderBy('created_at', 'asc');

      return reactions.map(reaction => ({
        id: reaction.id,
        messageId: reaction.message_id,
        userId: reaction.user_id,
        emoji: reaction.emoji,
        createdAt: new Date(reaction.created_at),
      }));
    } catch (error) {
      logger.error('Error getting all message reactions:', error);
      throw error;
    }
  }

  async deleteMessageReactions(messageId: string): Promise<void> {
    try {
      await db('message_reactions').where('message_id', messageId).del();

      logger.info(`Deleted all reactions for message ${messageId}`);
    } catch (error) {
      logger.error('Error deleting message reactions:', error);
      throw error;
    }
  }
}

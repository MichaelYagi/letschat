import { Request, Response } from 'express';
import { ReactionRepository } from '../database/repositories/ReactionRepository';
import { logger } from '../utils/logger';
import { AddReactionRequest, RemoveReactionRequest } from '../types/Message';

export class ReactionController {
  private reactionRepository: ReactionRepository;

  constructor() {
    this.reactionRepository = new ReactionRepository();
  }

  addReaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId, emoji }: AddReactionRequest = req.body;
      const userId = req.user!.id;

      if (!messageId || !emoji) {
        res.status(400).json({ error: 'Message ID and emoji are required' });
        return;
      }

      // Check if reaction already exists
      const existingReaction = await this.reactionRepository.getUserReaction(
        messageId,
        userId,
        emoji
      );

      if (existingReaction) {
        res.status(409).json({ error: 'Reaction already exists' });
        return;
      }

      const reaction = await this.reactionRepository.addReaction(
        messageId,
        userId,
        emoji
      );

      // Get updated reaction summaries for the message
      const reactions =
        await this.reactionRepository.getMessageReactions(messageId);

      // Mark which reactions belong to current user
      const reactionsWithUserStatus = reactions.map(r => ({
        ...r,
        currentUserReacted: r.emoji === emoji,
      }));

      res.status(201).json({
        reaction,
        messageReactions: reactionsWithUserStatus,
      });

      // Emit WebSocket event
      const io = (req as any).io;
      if (io) {
        io.to(`conversation:${req.body.conversationId}`).emit(
          'message_reaction',
          {
            messageId,
            emoji,
            userId,
            action: 'add',
            reactions: reactionsWithUserStatus,
          }
        );
      }
    } catch (error) {
      logger.error('Error adding reaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  removeReaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId, emoji }: RemoveReactionRequest = req.body;
      const userId = req.user!.id;

      if (!messageId || !emoji) {
        res.status(400).json({ error: 'Message ID and emoji are required' });
        return;
      }

      // Check if reaction exists
      const existingReaction = await this.reactionRepository.getUserReaction(
        messageId,
        userId,
        emoji
      );

      if (!existingReaction) {
        res.status(404).json({ error: 'Reaction not found' });
        return;
      }

      await this.reactionRepository.removeReaction(messageId, userId, emoji);

      // Get updated reaction summaries for the message
      const reactions =
        await this.reactionRepository.getMessageReactions(messageId);

      res.status(200).json({
        message: 'Reaction removed successfully',
        messageReactions: reactions,
      });

      // Emit WebSocket event
      const io = (req as any).io;
      if (io) {
        io.to(`conversation:${req.body.conversationId}`).emit(
          'message_reaction',
          {
            messageId,
            emoji,
            userId,
            action: 'remove',
            reactions,
          }
        );
      }
    } catch (error) {
      logger.error('Error removing reaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getMessageReactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;

      if (!messageId) {
        res.status(400).json({ error: 'Message ID is required' });
        return;
      }

      const reactions =
        await this.reactionRepository.getMessageReactions(messageId);
      const userReactions =
        await this.reactionRepository.getAllMessageReactions(messageId);

      // Mark which reactions belong to current user
      const reactionsWithUserStatus = reactions.map(r => ({
        ...r,
        currentUserReacted: userReactions.some(
          userReaction =>
            userReaction.userId === userId && userReaction.emoji === r.emoji
        ),
      }));

      res.status(200).json({ reactions: reactionsWithUserStatus });
    } catch (error) {
      logger.error('Error getting message reactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

import { Request, Response } from 'express';
import { MessageService } from '../services/MessageService';
import { CreateMessageRequest, UpdateMessageRequest, CreateConversationRequest, AddParticipantRequest } from '../types/Message';

export class MessageController {
  /**
   * Get conversations
   */
  static async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      const conversations = await MessageService.getConversations(userId);
      
      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get conversations',
      });
    }
  }
  
  /**
   * Create conversation
   */
  static async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const conversationData: CreateConversationRequest = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      const conversation = await MessageService.createConversation(conversationData, userId);
      
      res.status(201).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create conversation',
      });
    }
  }
  
  /**
   * Get conversation messages
   */
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const conversationId = req.params.conversationId;
      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before ? new Date(req.query.before as string) : undefined;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      const messages = await MessageService.getMessages(conversationId, userId, limit, before);
      
      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get messages',
      });
    }
  }
  
  /**
   * Send message
   */
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const messageData: CreateMessageRequest = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      const messageEvent = await MessageService.sendMessage(messageData, userId);
      
      res.status(201).json({
        success: true,
        data: messageEvent,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      });
    }
  }
  
  /**
   * Edit message
   */
  static async editMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const messageId = req.params.messageId;
      const updates: UpdateMessageRequest = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      const message = await MessageService.editMessage(messageId, updates, userId);
      
      res.status(200).json({
        success: true,
        data: message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to edit message',
      });
    }
  }
  
  /**
   * Delete message
   */
  static async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const messageId = req.params.messageId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      const deleted = await MessageService.deleteMessage(messageId, userId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Message not found',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete message',
      });
    }
  }
  
  /**
   * Add participants to conversation
   */
  static async addParticipants(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const data: AddParticipantRequest = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      await MessageService.addParticipants(data, userId);
      
      res.status(200).json({
        success: true,
        message: 'Participants added successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add participants',
      });
    }
  }
  
  /**
   * Remove participant from conversation
   */
  static async removeParticipant(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { conversationId, participantId } = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      await MessageService.removeParticipant(conversationId, participantId || userId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Participant removed successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove participant',
      });
    }
  }
  
  /**
   * Mark messages as read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { conversationId } = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      await MessageService.markAsRead(conversationId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Messages marked as read',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to mark messages as read',
      });
    }
  }
}
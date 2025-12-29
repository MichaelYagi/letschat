import {
  MessageRepository,
  ConversationRepository,
} from '../database/repositories/MessageRepository';
import { KeyService } from './KeyService';
import { ConversationEncryptionService } from './ConversationEncryptionService';
import {
  Message,
  CreateMessageRequest,
  UpdateMessageRequest,
  Conversation,
  CreateConversationRequest,
  AddParticipantRequest,
  WebSocketMessage,
  MessageEvent,
  TypingEvent,
  UserStatusEvent,
  ConversationUpdateEvent,
} from '../types/Message';
import { EncryptionService } from '../utils/encryption';

export class MessageService {
  /**
   * Send a message
   */
  static async sendMessage(
    messageData: CreateMessageRequest,
    senderId: string
  ): Promise<MessageEvent> {
    // Validate participant
    const isParticipant = await this.isUserInConversation(
      messageData.conversationId,
      senderId
    );

    if (!isParticipant) {
      // Provide more detailed error for debugging
      console.error(
        `[DEBUG] User ${senderId} not found in conversation ${messageData.conversationId}`
      );
      throw new Error('User is not a participant in this conversation');
    }

    // Get conversation encryption key
    const encryptionKey = await KeyService.getConversationKey(
      messageData.conversationId,
      senderId
    );

    if (!encryptionKey) {
      throw new Error('Conversation encryption key not found');
    }

    // Encrypt message content with conversation key
    const encrypted = ConversationEncryptionService.encryptMessageContent(
      messageData.content,
      encryptionKey
    );

    // Create message with encrypted content
    const message = await MessageRepository.create(
      {
        ...messageData,
        encryptedContent: encrypted.encryptedContent,
        iv: encrypted.iv,
        tag: encrypted.tag,
      },
      senderId
    );

    // Update conversation timestamp
    await this.updateConversationTimestamp(messageData.conversationId);

    // Return message with decrypted content for sender
    const decryptedMessage = {
      ...message,
      content: messageData.content, // Show plain text to sender
    };

    return {
      message: decryptedMessage,
      attachments: [],
    };
  }

  /**
   * Get messages for conversation
   */
  static async getMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    before?: Date
  ): Promise<Message[]> {
    // Validate participant
    const isParticipant = await this.isUserInConversation(
      conversationId,
      userId
    );

    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Get conversation encryption key
    const encryptionKey = await KeyService.getConversationKey(
      conversationId,
      userId
    );

    if (!encryptionKey) {
      throw new Error('Conversation encryption key not found');
    }

    const messages = await MessageRepository.getByConversationId(
      conversationId,
      limit,
      before
    );

    // Decrypt messages for this user using conversation key
    return messages.map(message => {
      if (message.encryptedContent && message.iv && message.tag) {
        try {
          const decryptedContent =
            ConversationEncryptionService.decryptMessageContent(
              message.encryptedContent,
              message.iv,
              message.tag,
              encryptionKey
            );

          return {
            ...message,
            content: decryptedContent, // Show decrypted content
          };
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return {
            ...message,
            content: '[Decryption failed]',
          };
        }
      } else if (message.content) {
        // Legacy message with plain content
        return message;
      } else {
        return {
          ...message,
          content: '[Encrypted Message]',
        };
      }
    });
  }

  /**
   * Edit a message
   */
  static async editMessage(
    messageId: string,
    updates: UpdateMessageRequest,
    userId: string
  ): Promise<Message | null> {
    // Check if message exists and user is sender
    const message = await MessageRepository.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Only the sender can edit their messages');
    }

    if (message.deletedAt) {
      throw new Error('Cannot edit deleted messages');
    }

    return await MessageRepository.update(messageId, updates);
  }

  /**
   * Delete a message
   */
  static async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<boolean> {
    // Check if message exists and user is sender
    const message = await MessageRepository.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Only the sender can delete their messages');
    }

    return await MessageRepository.softDelete(messageId);
  }

  /**
   * Create a conversation
   */
  static async createConversation(
    conversationData: CreateConversationRequest,
    createdBy: string
  ): Promise<Conversation> {
    // Validate participants
    if (
      conversationData.type === 'group' &&
      (!conversationData.name || conversationData.name.trim().length === 0)
    ) {
      throw new Error('Group conversations require a name');
    }

    if (conversationData.participantIds.length === 0) {
      throw new Error('At least one participant is required');
    }

    // For direct messages, ensure only 1 participant
    if (
      conversationData.type === 'direct' &&
      conversationData.participantIds.length > 1
    ) {
      throw new Error('Direct messages can only have one participant');
    }

    // Check if direct conversation already exists
    if (conversationData.type === 'direct') {
      const existingConversation = await this.findDirectConversation(
        createdBy,
        conversationData.participantIds[0]
      );

      if (existingConversation) {
        return existingConversation;
      }
    }

    // Create conversation with encryption key
    return await ConversationRepository.create(
      {
        ...conversationData,
        encryptionKey: KeyService.generateConversationKey(),
      },
      createdBy
    );
  }

  /**
   * Get user's conversations
   */
  static async getConversations(userId: string): Promise<Conversation[]> {
    return await ConversationRepository.getByUserId(userId);
  }

  /**
   * Add participants to conversation
   */
  static async addParticipants(
    data: AddParticipantRequest,
    requestorId: string
  ): Promise<void> {
    // Validate that requestor is participant
    const conversation = await ConversationRepository.findById(
      data.conversationId,
      requestorId
    );

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Only admins can add participants to group conversations
    if (conversation.type === 'group') {
      const participants = await ConversationRepository.getParticipants(
        data.conversationId
      );
      const requestorParticipant = participants.find(
        p => p.userId === requestorId
      );

      if (!requestorParticipant || requestorParticipant.role !== 'admin') {
        throw new Error(
          'Only admins can add participants to group conversations'
        );
      }
    }

    await ConversationRepository.addParticipants(data);
  }

  /**
   * Remove participant from conversation
   */
  static async removeParticipant(
    conversationId: string,
    userId: string,
    requestorId: string
  ): Promise<void> {
    // Validate that requestor is participant or the user themselves
    const conversation = await ConversationRepository.findById(
      conversationId,
      requestorId
    );

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    if (conversation.type === 'group') {
      const participants =
        await ConversationRepository.getParticipants(conversationId);
      const requestorParticipant = participants.find(
        p => p.userId === requestorId
      );

      // Users can remove themselves, only admins can remove others
      if (
        userId !== requestorId &&
        (!requestorParticipant || requestorParticipant.role !== 'admin')
      ) {
        throw new Error(
          'Only admins can remove participants from group conversations'
        );
      }
    }

    await ConversationRepository.removeParticipant(conversationId, userId);
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    await ConversationRepository.updateLastRead(conversationId, userId);
  }

  /**
   * Create WebSocket message
   */
  static createWebSocketMessage(
    type: WebSocketMessage['type'],
    data: any,
    from?: string
  ): WebSocketMessage {
    return {
      type,
      data,
      timestamp: new Date(),
      from,
    };
  }

  /**
   * Check if user is in conversation
   */
  private static async isUserInConversation(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    // First check if user is explicitly a participant
    const db = require('../database/connection').default;
    const participant = await db('conversation_participants')
      .where('conversation_id', conversationId)
      .where('user_id', userId)
      .first();

    if (!participant) {
      return false;
    }

    // Also verify conversation exists
    const conversation = await ConversationRepository.findById(
      conversationId,
      userId
    );

    return !!conversation;
  }

  /**
   * Find existing direct conversation between two users
   */
  private static async findDirectConversation(
    user1Id: string,
    user2Id: string
  ): Promise<Conversation | null> {
    const conversations = await ConversationRepository.getByUserId(user1Id);

    return (
      conversations.find(conv => {
        if (conv.type !== 'direct') return false;

        // Check if user2 is a participant in this conversation
        return conv.participants?.some(p => p.userId === user2Id);
      }) || null
    );
  }

  /**
   * Update conversation timestamp
   */
  private static async updateConversationTimestamp(
    conversationId: string
  ): Promise<void> {
    // This would be implemented to update the conversation's updated_at timestamp
    // For now, the database trigger handles this
  }
}

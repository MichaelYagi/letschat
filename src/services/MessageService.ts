import {
  MessageRepository,
  ConversationRepository,
} from '../database/repositories/MessageRepository';
import { KeyService } from './KeyService';
import { MessageDecryptionService } from './MessageDecryptionService';
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
import { EncryptionService, MessageEncryption } from '../utils/encryption';

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
      throw new Error('User is not a participant in this conversation');
    }

    let content = messageData.content;
    let encryptedContent: string | undefined;
    let signature: string | undefined;

    // Get conversation participants for encryption
    const participants = await ConversationRepository.getParticipants(
      messageData.conversationId
    );

    // For direct messages, encrypt for the recipient if both have keys
    if (participants.length === 2) {
      const recipient = participants.find(p => p.userId !== senderId);
      if (recipient) {
        const recipientPublicKey = await KeyService.getPublicKey(
          recipient.userId
        );
        const senderPrivateKey = await KeyService.getPrivateKey(senderId);

        // Only encrypt if both sender and recipient have keys
        if (
          recipientPublicKey &&
          senderPrivateKey &&
          recipientPublicKey.length > 100 &&
          senderPrivateKey.length > 100
        ) {
          const encrypted = MessageEncryption.encryptMessage(
            content,
            recipientPublicKey,
            senderPrivateKey
          );
          encryptedContent = encrypted.encryptedContent;
          signature = encrypted.signature;
          // Keep original content for database, encryption is handled separately
        }
      }
    }

    // Create message
    const message = await MessageRepository.create(
      {
        ...messageData,
        content,
        encryptedContent,
      },
      senderId
    );

    // Signature is stored with the message in the database

    // Update conversation timestamp
    await this.updateConversationTimestamp(messageData.conversationId);

    return {
      message,
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

    const messages = await MessageRepository.getByConversationId(
      conversationId,
      limit,
      before
    );

    // Decrypt messages for this user
    return await MessageDecryptionService.decryptMessages(messages, userId);
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

    return await ConversationRepository.create(conversationData, createdBy);
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
        return conv.type === 'direct';
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

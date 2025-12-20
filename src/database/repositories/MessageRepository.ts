import db from '../connection';
import {
  Message,
  CreateMessageRequest,
  UpdateMessageRequest,
  MessageAttachment,
  Conversation,
  CreateConversationRequest,
  ConversationParticipant,
  AddParticipantRequest,
} from '../../types/Message';
import { EncryptionService } from '../../utils/encryption';

export class MessageRepository {
  /**
   * Create a new message
   */
  static async create(
    messageData: CreateMessageRequest,
    senderId: string
  ): Promise<Message> {
    const messageId = EncryptionService.generateUUID();

    const [message] = await db('messages')
      .insert({
        id: messageId,
        conversation_id: messageData.conversationId,
        sender_id: senderId,
        content: messageData.content,
        content_type: messageData.contentType || 'text',
        encrypted_content: messageData.encryptedContent,
        signature: messageData.signature,
        reply_to_id: messageData.replyToId,
        thread_id: messageData.threadId,
        created_at: new Date(),
      })
      .returning('*');

    return this.mapDbMessageToMessage(message);
  }

  /**
   * Find message by ID
   */
  static async findById(id: string): Promise<Message | null> {
    const message = await db('messages').where('id', id).first();

    return message ? this.mapDbMessageToMessage(message) : null;
  }

  /**
   * Get messages for conversation with pagination
   */
  static async getByConversationId(
    conversationId: string,
    limit: number = 50,
    before?: Date
  ): Promise<Message[]> {
    let query = db('messages')
      .where('conversation_id', conversationId)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .limit(limit);

    if (before) {
      query = query.andWhere('created_at', '<', before);
    }

    const messages = await query;
    return messages.map(this.mapDbMessageToMessage);
  }

  /**
   * Update message
   */
  static async update(
    id: string,
    updates: UpdateMessageRequest
  ): Promise<Message | null> {
    const [message] = await db('messages')
      .where('id', id)
      .whereNull('deleted_at')
      .update({
        content: updates.content,
        edited_at: new Date(),
      })
      .returning('*');

    return message ? this.mapDbMessageToMessage(message) : null;
  }

  /**
   * Soft delete message
   */
  static async softDelete(id: string): Promise<boolean> {
    const deletedCount = await db('messages').where('id', id).update({
      deleted_at: new Date(),
    });

    return deletedCount > 0;
  }

  /**
   * Get message count for conversation
   */
  static async getCountByConversationId(
    conversationId: string
  ): Promise<number> {
    const result = await db('messages')
      .where('conversation_id', conversationId)
      .whereNull('deleted_at')
      .count('* as count')
      .first();

    return parseInt(String(result?.count || '0'));
  }

  /**
   * Map database message to Message model
   */
  private static mapDbMessageToMessage(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversation_id,
      senderId: dbMessage.sender_id,
      content: dbMessage.content,
      contentType: dbMessage.content_type,
      encryptedContent: dbMessage.encrypted_content,
      signature: dbMessage.signature,
      replyToId: dbMessage.reply_to_id,
      threadId: dbMessage.thread_id,
      editedAt: dbMessage.edited_at ? new Date(dbMessage.edited_at) : undefined,
      deletedAt: dbMessage.deleted_at
        ? new Date(dbMessage.deleted_at)
        : undefined,
      createdAt: new Date(dbMessage.created_at),
    };
  }
}

export class ConversationRepository {
  /**
   * Create a new conversation
   */
  static async create(
    conversationData: CreateConversationRequest,
    createdBy: string
  ): Promise<Conversation> {
    const conversationId = EncryptionService.generateUUID();

    const [conversation] = await db('conversations')
      .insert({
        id: conversationId,
        type: conversationData.type,
        name: conversationData.type === 'group' ? conversationData.name : null,
        description: conversationData.description,
        avatar_url: conversationData.avatarUrl,
        created_by: createdBy,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    // Add participants
    const participants = [
      ...conversationData.participantIds.map(userId => ({
        id: EncryptionService.generateUUID(),
        conversation_id: conversationId,
        user_id: userId,
        role: conversationData.type === 'group' ? 'member' : 'member',
        joined_at: new Date(),
        last_read_at: new Date(),
      })),
      {
        id: EncryptionService.generateUUID(),
        conversation_id: conversationId,
        user_id: createdBy,
        role: conversationData.type === 'group' ? 'admin' : 'member',
        joined_at: new Date(),
        last_read_at: new Date(),
      },
    ];

    await db('conversation_participants').insert(participants);

    return this.mapDbConversationToConversation(conversation);
  }

  /**
   * Find conversation by ID
   */
  static async findById(
    id: string,
    userId: string
  ): Promise<Conversation | null> {
    const conversation = await db('conversations')
      .join(
        'conversation_participants',
        'conversations.id',
        'conversation_participants.conversation_id'
      )
      .where('conversations.id', id)
      .where('conversation_participants.user_id', userId)
      .select('conversations.*')
      .first();

    return conversation
      ? this.mapDbConversationToConversation(conversation)
      : null;
  }

  /**
   * Get user's conversations
   */
  static async getByUserId(userId: string): Promise<Conversation[]> {
    const conversations = await db('conversations')
      .join(
        'conversation_participants',
        'conversations.id',
        'conversation_participants.conversation_id'
      )
      .where('conversation_participants.user_id', userId)
      .select('conversations.*')
      .orderBy('conversations.updated_at', 'desc');

    return conversations.map(this.mapDbConversationToConversation);
  }

  /**
   * Get conversation participants
   */
  static async getParticipants(
    conversationId: string
  ): Promise<ConversationParticipant[]> {
    const participants = await db('conversation_participants')
      .join('users', 'conversation_participants.user_id', 'users.id')
      .where('conversation_participants.conversation_id', conversationId)
      .select(
        'conversation_participants.id',
        'conversation_participants.conversation_id',
        'conversation_participants.user_id',
        'conversation_participants.role',
        'conversation_participants.joined_at',
        'conversation_participants.last_read_at'
      )
      .orderBy('conversation_participants.joined_at');

    return participants.map(this.mapDbParticipantToParticipant);
  }

  /**
   * Add participants to conversation
   */
  static async addParticipants(
    data: AddParticipantRequest
  ): Promise<ConversationParticipant[]> {
    const participants = data.userIds.map(userId => ({
      id: EncryptionService.generateUUID(),
      conversation_id: data.conversationId,
      user_id: userId,
      role: 'member',
      joined_at: new Date(),
      last_read_at: new Date(),
    }));

    const inserted = await db('conversation_participants')
      .insert(participants)
      .returning('*');

    return inserted.map(this.mapDbParticipantToParticipant);
  }

  /**
   * Remove participant from conversation
   */
  static async removeParticipant(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    const deletedCount = await db('conversation_participants')
      .where('conversation_id', conversationId)
      .where('user_id', userId)
      .del();

    return deletedCount > 0;
  }

  /**
   * Update last read timestamp
   */
  static async updateLastRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    await db('conversation_participants')
      .where('conversation_id', conversationId)
      .where('user_id', userId)
      .update({
        last_read_at: new Date(),
      });
  }

  /**
   * Map database conversation to Conversation model
   */
  private static mapDbConversationToConversation(
    dbConversation: any
  ): Conversation {
    return {
      id: dbConversation.id,
      type: dbConversation.type,
      name: dbConversation.name,
      description: dbConversation.description,
      avatarUrl: dbConversation.avatar_url,
      createdBy: dbConversation.created_by,
      createdAt: new Date(dbConversation.created_at),
      updatedAt: new Date(dbConversation.updated_at),
    };
  }

  /**
   * Map database participant to ConversationParticipant model
   */
  private static mapDbParticipantToParticipant(
    dbParticipant: any
  ): ConversationParticipant {
    return {
      id: dbParticipant.id,
      conversationId: dbParticipant.conversation_id,
      userId: dbParticipant.user_id,
      role: dbParticipant.role,
      joinedAt: new Date(dbParticipant.joined_at),
      lastReadAt: new Date(dbParticipant.last_read_at),
    };
  }
}

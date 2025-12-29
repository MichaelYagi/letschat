import db from '../connection';
import {
  Conversation,
  ConversationParticipant,
  CreateConversationRequest,
} from '../../types/Message';
import { ConversationEncryptionService } from '../../services/ConversationEncryptionService';
import { EncryptionService } from '../../utils/encryption';

export class ConversationRepository {
  /**
   * Create a new conversation
   */
  static async create(
    conversationData: CreateConversationRequest,
    createdBy: string
  ): Promise<Conversation> {
    const encryptionKey = ConversationEncryptionService.generateEncryptionKey();
    console.log('🔍 Repository Debug - Generated key:', encryptionKey);

    const conversation = await db('conversations')
      .insert({
        id: EncryptionService.generateUUID(),
        type: conversationData.type,
        name: conversationData.name,
        description: conversationData.description,
        avatar_url: conversationData.avatarUrl,
        created_by: createdBy,
        encryption_key: encryptionKey,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    // Verify the key was actually saved
    const verifyConv = await db('conversations')
      .where('id', conversation[0].id)
      .first();
    if (!verifyConv.encryption_key) {
      console.error(
        '❌ CRITICAL: Encryption key was not saved! Insert succeeded but key missing in DB'
      );
      throw new Error('Encryption key save failure');
    }

    // Add participants (avoid duplicates)
    const participants = [
      { userId: createdBy, role: 'admin' as const },
      ...conversationData.participantIds
        .filter(userId => userId !== createdBy)
        .map(userId => ({
          userId,
          role: 'member' as const,
        })),
    ];

    await this.addParticipants({
      conversationId: conversation[0].id,
      userIds: participants.map(p => p.userId),
    });

    return {
      id: conversation[0].id,
      type: conversation[0].type,
      name: conversation[0].name,
      description: conversation[0].description,
      avatarUrl: conversation[0].avatar_url,
      createdBy: conversation[0].created_by,
      encryptionKey: conversation[0].encryption_key,
      createdAt: conversation[0].created_at,
      updatedAt: conversation[0].updated_at,
    };
  }

  /**
   * Get conversation by ID
   */
  static async findById(
    id: string,
    userId?: string
  ): Promise<Conversation | null> {
    let query = db('conversations').where({ id });

    if (userId) {
      // Only return conversations where user is a participant
      query = query.whereExists(
        db('conversation_participants').where({
          conversation_id: id,
          user_id: userId,
        })
      );
    }

    const conversation = await query.first();

    if (!conversation) {
      return null;
    }

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      description: conversation.description,
      avatarUrl: conversation.avatar_url,
      createdBy: conversation.created_by,
      encryptionKey: conversation.encryption_key,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };
  }

  /**
   * Get conversations for a user
   */
  static async getByUserId(userId: string): Promise<any[]> {
    const conversations = await db('conversations')
      .select('conversations.*')
      .join(
        'conversation_participants',
        'conversations.id',
        'conversation_participants.conversation_id'
      )
      .where('conversation_participants.user_id', userId)
      .orderBy('conversations.updated_at', 'desc');

    // For each conversation, get participants and last message
    const conversationsWithDetails = await Promise.all(
      conversations.map(async conv => {
        // Get participants with user details
        const participants = await db('conversation_participants')
          .where('conversation_id', conv.id)
          .join('users', 'conversation_participants.user_id', 'users.id')
          .select(
            'users.id',
            'users.username',
            'users.display_name',
            'conversation_participants.role'
          );

        // Get last message
        const lastMessage = await db('messages')
          .where('conversation_id', conv.id)
          .join('users', 'messages.sender_id', 'users.id')
          .select(
            'messages.id',
            'messages.content',
            'messages.encrypted_content',
            'messages.sender_id',
            'messages.created_at',
            'messages.content_type'
          )
          .orderBy('messages.created_at', 'desc')
          .first();

        // Get unread count
        const unreadCount = await db('messages')
          .where('conversation_id', conv.id)
          .where('sender_id', '!=', userId)
          .whereRaw(
            'messages.created_at > COALESCE((SELECT last_read_at FROM conversation_participants WHERE conversation_id = ? AND user_id = ?), ?)',
            [conv.id, userId, new Date(0)]
          )
          .count('* as count')
          .first();

        // For direct conversations, set name to other participant's display name if not already set
        let conversationName = conv.name;
        if (conv.type === 'direct' && !conv.name) {
          const otherParticipant = participants.find(p => p.id !== userId);
          if (otherParticipant) {
            conversationName =
              otherParticipant.display_name || otherParticipant.username;
          }
        }

        return {
          id: conv.id,
          type: conv.type,
          name: conversationName,
          description: conv.description,
          avatarUrl: conv.avatar_url,
          createdBy: conv.created_by,
          encryptionKey: conv.encryption_key,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          participants: participants.map(p => ({
            id: p.id,
            username: p.username,
            displayName: p.display_name || p.username,
          })),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content || '[Encrypted Message]',
                senderId: lastMessage.sender_id,
                createdAt: lastMessage.created_at,
                contentType: lastMessage.content_type || 'text',
              }
            : null,
          unreadCount: parseInt(String(unreadCount?.count || '0')),
        };
      })
    );

    return conversationsWithDetails;
  }

  /**
   * Get participants for a conversation
   */
  static async getParticipants(
    conversationId: string
  ): Promise<ConversationParticipant[]> {
    const participants = await db('conversation_participants')
      .where({ conversation_id: conversationId })
      .join('users', 'conversation_participants.user_id', 'users.id')
      .select(
        'conversation_participants.*',
        'users.username',
        'users.display_name'
      );

    return participants.map(p => ({
      id: p.id,
      conversationId: p.conversation_id,
      userId: p.user_id,
      role: p.role,
      joinedAt: p.joined_at,
      lastReadAt: p.last_read_at,
    }));
  }

  /**
   * Add participants to a conversation
   */
  static async addParticipants(data: {
    conversationId: string;
    userIds: string[];
  }): Promise<void> {
    const participants = data.userIds.map(userId => ({
      conversation_id: data.conversationId,
      user_id: userId,
      role: 'member',
      joined_at: new Date(),
      last_read_at: new Date(),
    }));

    await db('conversation_participants')
      .insert(participants)
      .onConflict(['conversation_id', 'user_id'])
      .ignore();
  }

  /**
   * Remove a participant from a conversation
   */
  static async removeParticipant(
    conversationId: string,
    userId: string
  ): Promise<void> {
    await db('conversation_participants')
      .where({
        conversation_id: conversationId,
        user_id: userId,
      })
      .del();
  }

  /**
   * Update last read timestamp for a user in a conversation
   */
  static async updateLastRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    await db('conversation_participants')
      .where({
        conversation_id: conversationId,
        user_id: userId,
      })
      .update({
        last_read_at: new Date(),
      });
  }

  /**
   * Update conversation details
   */
  static async update(
    id: string,
    updates: Partial<{
      name: string;
      description: string;
      avatarUrl: string;
    }>
  ): Promise<Conversation> {
    const [conversation] = await db('conversations')
      .where({ id })
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.avatarUrl && { avatar_url: updates.avatarUrl }),
        updated_at: new Date(),
      })
      .returning('*');

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      description: conversation.description,
      avatarUrl: conversation.avatar_url,
      createdBy: conversation.created_by,
      encryptionKey: conversation.encryption_key,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };
  }
}

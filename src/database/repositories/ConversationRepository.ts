import db from '../connection';
import {
  Conversation,
  ConversationParticipant,
  CreateConversationRequest,
} from '../../types/Message';

export class ConversationRepository {
  /**
   * Create a new conversation
   */
  static async create(
    conversationData: CreateConversationRequest,
    createdBy: string
  ): Promise<Conversation> {
    const conversation = await db('conversations')
      .insert({
        type: conversationData.type,
        name: conversationData.name,
        description: conversationData.description,
        avatar_url: conversationData.avatarUrl,
        created_by: createdBy,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    // Add participants
    const participants = [
      { userId: createdBy, role: 'admin' as const },
      ...conversationData.participantIds.map(userId => ({
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
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };
  }

  /**
   * Get conversations by user ID
   */
  static async getByUserId(userId: string): Promise<Conversation[]> {
    const conversations = await db('conversations')
      .select('conversations.*')
      .join(
        'conversation_participants',
        'conversations.id',
        'conversation_participants.conversation_id'
      )
      .where('conversation_participants.user_id', userId)
      .orderBy('conversations.updated_at', 'desc');

    return conversations.map(conv => ({
      id: conv.id,
      type: conv.type,
      name: conv.name,
      description: conv.description,
      avatarUrl: conv.avatar_url,
      createdBy: conv.created_by,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    }));
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
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };
  }
}

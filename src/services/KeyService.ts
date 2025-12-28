import { ConversationRepository } from '../database/repositories/ConversationRepository';
import { EncryptionService } from '../utils/encryption';

export class KeyService {
  /**
   * Get conversation encryption key (only for participants)
   */
  static async getConversationKey(
    conversationId: string,
    userId: string
  ): Promise<string | null> {
    const conversation = await ConversationRepository.findById(
      conversationId,
      userId
    );

    if (!conversation) {
      return null;
    }

    // If conversation exists but has no encryption key, generate one
    if (!conversation.encryptionKey) {
      const newKey = this.generateConversationKey();

      // Update database with new key
      const db = require('../database/connection').default;
      await db('conversations')
        .where('id', conversationId)
        .update({ encryption_key: newKey });

      return newKey;
    }

    return conversation.encryptionKey;
  }

  /**
   * Generate a new conversation encryption key
   */
  static generateConversationKey(): string {
    return EncryptionService.generateRandomString(32);
  }

  /**
   * Check if conversation has encryption key
   */
  static async hasConversationKey(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    const key = await this.getConversationKey(conversationId, userId);
    return !!key;
  }

  /**
   * Update conversation encryption key (for admin use)
   */
  static async updateConversationKey(
    conversationId: string,
    userId: string
  ): Promise<string | null> {
    // Verify user is participant
    const conversation = await ConversationRepository.findById(
      conversationId,
      userId
    );
    if (!conversation) {
      return null;
    }

    const newKey = this.generateConversationKey();

    // Update database with new key
    const db = require('../database/connection').default;
    await db('conversations')
      .where('id', conversationId)
      .update({ encryption_key: newKey });

    return newKey;
  }
}

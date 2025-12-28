import { EncryptionService } from '../utils/encryption';
import { ConversationRepository } from '../database/repositories/ConversationRepository';

export class ConversationEncryptionService {
  /**
   * Generate a new encryption key for a conversation
   */
  static generateEncryptionKey(): string {
    return EncryptionService.generateRandomString(32);
  }

  /**
   * Create a conversation with encryption key
   */
  static async createConversationWithEncryption(
    conversationData: any,
    createdBy: string
  ): Promise<any> {
    const encryptionKey = this.generateEncryptionKey();

    // Create conversation with encryption key
    const conversation = await ConversationRepository.create(
      {
        ...conversationData,
        encryptionKey,
      },
      createdBy
    );

    return {
      ...conversation,
      encryptionKey,
    };
  }

  /**
   * Get encryption key for a conversation (only for participants)
   */
  static async getConversationEncryptionKey(
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

    // Get encryption key from database
    const dbConversation = await (ConversationRepository as any)
      .db('conversations')
      .where('id', conversationId)
      .first('encryption_key');

    return dbConversation?.encryption_key || null;
  }

  /**
   * Encrypt message content using conversation key
   */
  static encryptMessageContent(
    content: string,
    encryptionKey: string
  ): {
    encryptedContent: string;
    iv: string;
    tag: string;
  } {
    const encrypted = EncryptionService.encrypt(content);
    return {
      encryptedContent: encrypted.encrypted,
      iv: encrypted.iv,
      tag: encrypted.tag,
    };
  }

  /**
   * Decrypt message content using conversation key
   */
  static decryptMessageContent(
    encryptedContent: string,
    iv: string,
    tag: string,
    encryptionKey: string
  ): string {
    return EncryptionService.decrypt(encryptedContent, tag, iv);
  }

  /**
   * Update existing conversations to have encryption keys
   */
  static async migrateExistingConversations(): Promise<void> {
    const { db } = require('../database/connection');

    // Get all conversations without encryption keys
    const conversations = await db('conversations')
      .whereNull('encryption_key')
      .select('id');

    for (const conversation of conversations) {
      const encryptionKey = this.generateEncryptionKey();
      await db('conversations')
        .where('id', conversation.id)
        .update({ encryption_key: encryptionKey });
    }
  }
}

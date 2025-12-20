import { KeyService } from './KeyService';
import { Message } from '../types/Message';
import { MessageEncryption } from '../utils/encryption';

export class MessageDecryptionService {
  /**
   * Decrypt message for user
   */
  static async decryptMessage(
    message: Message,
    userId: string
  ): Promise<Message> {
    // If message is not encrypted, return as-is
    if (!message.encryptedContent || !message.signature) {
      return message;
    }

    // Get user's private key and sender's public key
    const userPrivateKey = await KeyService.getPrivateKey(userId);
    const senderPublicKey = await KeyService.getPublicKey(message.senderId);

    if (!userPrivateKey || !senderPublicKey) {
      // Cannot decrypt, return placeholder
      return {
        ...message,
        content: '[Unable to decrypt - keys missing]',
      };
    }

    try {
      // Decrypt the message
      const decryptedContent = MessageEncryption.decryptMessage(
        message.encryptedContent,
        message.signature,
        userPrivateKey,
        senderPublicKey
      );

      return {
        ...message,
        content: decryptedContent,
      };
    } catch (error) {
      // Decryption failed
      return {
        ...message,
        content: '[Decryption failed]',
      };
    }
  }

  /**
   * Decrypt multiple messages
   */
  static async decryptMessages(
    messages: Message[],
    userId: string
  ): Promise<Message[]> {
    const decryptedMessages = await Promise.all(
      messages.map(message => this.decryptMessage(message, userId))
    );
    return decryptedMessages;
  }
}

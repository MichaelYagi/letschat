import { UserRepository } from '../database/repositories/UserRepository';
import { EncryptionService } from '../utils/encryption';

export class KeyService {
  /**
   * Get user's public key
   */
  static async getPublicKey(userId: string): Promise<string | null> {
    const user = await UserRepository.findById(userId);
    return user?.publicKey || null;
  }

  /**
   * Get user's private key (for decryption)
   */
  static async getPrivateKey(userId: string): Promise<string | null> {
    const user = await UserRepository.findById(userId);
    return user?.privateKey || null;
  }

  /**
   * Generate and save new key pair for user
   */
  static async regenerateKeys(userId: string): Promise<{
    publicKey: string;
    privateKey: string;
  }> {
    const keyPair = EncryptionService.generateKeyPair();

    await UserRepository.update(userId, {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    } as any);

    return keyPair;
  }

  /**
   * Get public keys for multiple users
   */
  static async getPublicKeys(userIds: string[]): Promise<Map<string, string>> {
    const keyMap = new Map<string, string>();

    for (const userId of userIds) {
      const publicKey = await this.getPublicKey(userId);
      if (publicKey) {
        keyMap.set(userId, publicKey);
      }
    }

    return keyMap;
  }

  /**
   * Check if user has encryption keys
   */
  static async hasKeys(userId: string): Promise<boolean> {
    const user = await UserRepository.findById(userId);
    return !!(user?.publicKey && user?.privateKey);
  }
}

import forge from 'node-forge';
import crypto from 'crypto';
import { config } from '../config';

export class EncryptionService {
  private static readonly algorithm = config.encryption.algorithm;
  private static readonly key = Buffer.from(config.encryption.key, 'utf8');
  private static readonly iv = Buffer.from(config.encryption.iv, 'utf8');

  /**
   * Encrypt data using AES-256-GCM
   */
  static encrypt(data: string): { encrypted: string; tag: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    (cipher as any).setAAD(Buffer.from('letschat', 'utf8'));

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = (cipher as any).getAuthTag().toString('hex');

    return { encrypted, tag, iv: iv.toString('hex') };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(encryptedData: string, tag: string, iv: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    (decipher as any).setAAD(Buffer.from('letschat', 'utf8'));
    (decipher as any).setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate a key pair for asymmetric encryption (RSA)
   */
  static generateKeyPair(): {
    publicKey: string;
    privateKey: string;
  } {
    const { publicKey, privateKey } = forge.pki.rsa.generateKeyPair(2048);

    return {
      publicKey: forge.pki.publicKeyToPem(publicKey),
      privateKey: forge.pki.privateKeyToPem(privateKey),
    };
  }

  /**
   * Encrypt data with public key (RSA)
   */
  static encryptWithPublicKey(data: string, publicKeyPem: string): string {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encrypted = publicKey.encrypt(data, 'RSA-OAEP');
    return forge.util.encode64(encrypted);
  }

  /**
   * Decrypt data with private key (RSA)
   */
  static decryptWithPrivateKey(
    encryptedData: string,
    privateKeyPem: string
  ): string {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const encrypted = forge.util.decode64(encryptedData);
    const decrypted = privateKey.decrypt(encrypted, 'RSA-OAEP');
    return decrypted;
  }

  /**
   * Generate a secure random string
   */
  static generateRandomString(length: number): string {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
  }

  /**
   * Generate a UUID
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Create a hash of data (SHA-256)
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity with HMAC
   */
  static createHMAC(data: string, key: string): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC
   */
  static verifyHMAC(data: string, key: string, hmac: string): boolean {
    const expectedHMAC = this.createHMAC(data, key);
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(expectedHMAC, 'hex')
    );
  }
}

/**
 * Message encryption for end-to-end encryption
 */
export class MessageEncryption {
  /**
   * Encrypt a message for a specific recipient
   */
  static encryptMessage(
    content: string,
    recipientPublicKey: string,
    senderPrivateKey: string
  ): {
    encryptedContent: string;
    signature: string;
  } {
    // Encrypt the message content with recipient's public key
    const encryptedContent = EncryptionService.encryptWithPublicKey(
      content,
      recipientPublicKey
    );

    // Sign the original content with sender's private key
    const messageHash = EncryptionService.hash(content);
    const signature = this.sign(messageHash, senderPrivateKey);

    return {
      encryptedContent,
      signature,
    };
  }

  /**
   * Decrypt a message received from a sender
   */
  static decryptMessage(
    encryptedContent: string,
    signature: string,
    recipientPrivateKey: string,
    senderPublicKey: string
  ): string {
    // Decrypt the content
    const decryptedContent = EncryptionService.decryptWithPrivateKey(
      encryptedContent,
      recipientPrivateKey
    );

    // Verify the signature
    const messageHash = EncryptionService.hash(decryptedContent);
    const isSignatureValid = this.verifySignature(
      messageHash,
      signature,
      senderPublicKey
    );

    if (!isSignatureValid) {
      throw new Error('Invalid message signature');
    }

    return decryptedContent;
  }

  /**
   * Create digital signature
   */
  static sign(data: string, privateKeyPem: string): string {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const md = forge.md.sha256.create();
    md.update(data, 'utf8');
    const signature = privateKey.sign(md);
    return forge.util.encode64(signature);
  }

  /**
   * Verify digital signature
   */
  static verifySignature(
    data: string,
    signature: string,
    publicKeyPem: string
  ): boolean {
    try {
      const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
      const md = forge.md.sha256.create();
      md.update(data, 'utf8');
      const sig = forge.util.decode64(signature);
      return publicKey.verify(md.digest().bytes(), sig);
    } catch {
      return false;
    }
  }
}

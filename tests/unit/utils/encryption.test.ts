import {
  EncryptionService,
  MessageEncryption,
} from '../../../src/utils/encryption';

describe('EncryptionService', () => {
  describe('encrypt/decrypt', () => {
    test('should encrypt and decrypt text correctly', () => {
      const originalText = 'Hello, World!';
      const { encrypted, tag, iv } = EncryptionService.encrypt(originalText);
      const decrypted = EncryptionService.decrypt(encrypted, tag, iv);

      expect(decrypted).toBe(originalText);
    });

    test('should produce different outputs for same input', () => {
      const text = 'Test message';
      const result1 = EncryptionService.encrypt(text);
      const result2 = EncryptionService.encrypt(text);

      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
      expect(
        EncryptionService.decrypt(result1.encrypted, result1.tag, result1.iv)
      ).toBe(text);
      expect(
        EncryptionService.decrypt(result2.encrypted, result2.tag, result2.iv)
      ).toBe(text);
    });
  });

  describe('key pair generation', () => {
    test('should generate valid RSA key pair', () => {
      const { publicKey, privateKey } = EncryptionService.generateKeyPair();

      expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
      expect(publicKey).toContain('-----END PUBLIC KEY-----');
      expect(privateKey).toContain('-----BEGIN RSA PRIVATE KEY-----');
      expect(privateKey).toContain('-----END RSA PRIVATE KEY-----');
    });
  });

  describe('asymmetric encryption', () => {
    test('should encrypt and decrypt with RSA key pair', () => {
      const { publicKey, privateKey } = EncryptionService.generateKeyPair();
      const originalText = 'Secret message';

      const encrypted = EncryptionService.encryptWithPublicKey(
        originalText,
        publicKey
      );
      const decrypted = EncryptionService.decryptWithPrivateKey(
        encrypted,
        privateKey
      );

      expect(decrypted).toBe(originalText);
    });
  });

  describe('utility functions', () => {
    test('should generate random string', () => {
      const random1 = EncryptionService.generateRandomString(16);
      const random2 = EncryptionService.generateRandomString(16);

      expect(random1).toHaveLength(16);
      expect(random2).toHaveLength(16);
      expect(random1).not.toBe(random2);
    });

    test('should generate valid UUID', () => {
      const uuid = EncryptionService.generateUUID();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidRegex);
    });

    test('should create consistent hash', () => {
      const data = 'test data';
      const hash1 = EncryptionService.hash(data);
      const hash2 = EncryptionService.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });
  });
});

describe('MessageEncryption', () => {
  test('should encrypt and decrypt messages with proper signing', () => {
    const senderKeys = EncryptionService.generateKeyPair();
    const recipientKeys = EncryptionService.generateKeyPair();
    const originalMessage = 'End-to-end encrypted message';

    // Encrypt message for recipient
    const { encryptedContent, signature } = MessageEncryption.encryptMessage(
      originalMessage,
      recipientKeys.publicKey,
      senderKeys.privateKey
    );

    // Decrypt message as recipient
    const decryptedMessage = MessageEncryption.decryptMessage(
      encryptedContent,
      signature,
      recipientKeys.privateKey,
      senderKeys.publicKey
    );

    expect(decryptedMessage).toBe(originalMessage);
  });

  test('should fail to decrypt with wrong private key', () => {
    const senderKeys = EncryptionService.generateKeyPair();
    const recipientKeys = EncryptionService.generateKeyPair();
    const wrongKeys = EncryptionService.generateKeyPair();

    const { encryptedContent, signature } = MessageEncryption.encryptMessage(
      'Secret message',
      recipientKeys.publicKey,
      senderKeys.privateKey
    );

    expect(() => {
      MessageEncryption.decryptMessage(
        encryptedContent,
        signature,
        wrongKeys.privateKey,
        senderKeys.publicKey
      );
    }).toThrow();
  });

  test('should fail to verify with wrong public key', () => {
    const senderKeys = EncryptionService.generateKeyPair();
    const recipientKeys = EncryptionService.generateKeyPair();
    const wrongKeys = EncryptionService.generateKeyPair();

    const { encryptedContent, signature } = MessageEncryption.encryptMessage(
      'Secret message',
      recipientKeys.publicKey,
      senderKeys.privateKey
    );

    expect(() => {
      MessageEncryption.decryptMessage(
        encryptedContent,
        signature,
        recipientKeys.privateKey,
        wrongKeys.publicKey
      );
    }).toThrow('Invalid message signature');
  });
});

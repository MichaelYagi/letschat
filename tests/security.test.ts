import { EncryptionService, MessageEncryption } from '../src/utils/encryption';
import { SecurityService } from '../src/utils/security';

describe('Security Tests', () => {
  describe('Encryption Service', () => {
    test('Symmetric encryption works', () => {
      const message = 'Hello, this is a secret message!';
      const { encrypted, tag, iv } = EncryptionService.encrypt(message);
      const decrypted = EncryptionService.decrypt(encrypted, tag, iv);

      expect(encrypted).toBeDefined();
      expect(tag).toBeDefined();
      expect(iv).toBeDefined();
      expect(decrypted).toBe(message);
    });

    test('Asymmetric encryption works', () => {
      const message = 'Hello, this is a secret message!';
      const { publicKey, privateKey } = EncryptionService.generateKeyPair();
      const asymEncrypted = EncryptionService.encryptWithPublicKey(
        message,
        publicKey
      );
      const asymDecrypted = EncryptionService.decryptWithPrivateKey(
        asymEncrypted,
        privateKey
      );

      expect(asymEncrypted).toBeDefined();
      expect(asymDecrypted).toBe(message);
    });

    test('End-to-end encryption works', () => {
      const message = 'Hello, this is a secret message!';
      const senderKeys = EncryptionService.generateKeyPair();
      const recipientKeys = EncryptionService.generateKeyPair();

      const e2eEncrypted = MessageEncryption.encryptMessage(
        message,
        recipientKeys.publicKey,
        senderKeys.privateKey
      );

      const e2eDecrypted = MessageEncryption.decryptMessage(
        e2eEncrypted.encryptedContent,
        e2eEncrypted.signature,
        recipientKeys.privateKey,
        senderKeys.publicKey
      );

      expect(e2eEncrypted.encryptedContent).toBeDefined();
      expect(e2eEncrypted.signature).toBeDefined();
      expect(e2eDecrypted).toBe(message);
    });
  });

  describe('Security Service', () => {
    test('Password hashing and verification works', async () => {
      const password = 'SecurePassword123!';
      const hash = await SecurityService.hashPassword(password);
      const isValid = await SecurityService.verifyPassword(password, hash);
      const isInvalid = await SecurityService.verifyPassword(
        'wrongpassword',
        hash
      );

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    test('Input validation works', () => {
      const validUsername = SecurityService.isValidUsername('user123');
      const invalidUsername = SecurityService.isValidUsername('us');

      expect(validUsername).toBe(true);
      expect(invalidUsername).toBe(false);
    });

    test('Password strength validation works', () => {
      const strongPass = SecurityService.validatePassword('StrongPass123!');
      const weakPass = SecurityService.validatePassword('weak');

      expect(strongPass.isValid).toBe(true);
      expect(weakPass.isValid).toBe(false);
      expect(weakPass.errors.length).toBeGreaterThan(0);
    });

    test('XSS sanitization works', () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = SecurityService.sanitizeInput(malicious);

      expect(sanitized).not.toBe(malicious);
      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('JWT Service', () => {
    test('JWT token generation and verification works', () => {
      const { generateToken, verifyToken } = require('../src/config/jwt');

      const payload = {
        userId: 'user-123',
        username: 'testuser',
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(token).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
    });

    test('JWT properly rejects invalid tokens', () => {
      const { verifyToken } = require('../src/config/jwt');

      expect(() => {
        verifyToken('invalid-token');
      }).toThrow();
    });
  });
});

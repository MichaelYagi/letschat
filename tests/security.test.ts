import { EncryptionService, MessageEncryption } from '../src/utils/encryption';
import { SecurityService } from '../src/utils/security';

async function testEncryption() {
  console.log('🔐 Testing Encryption Service...');

  try {
    // Test symmetric encryption
    const message = 'Hello, this is a secret message!';
    const { encrypted, tag } = EncryptionService.encrypt(message);
    const decrypted = EncryptionService.decrypt(encrypted, tag);

    console.log('✅ Symmetric encryption works');
    console.log(`   Original: ${message}`);
    console.log(`   Decrypted: ${decrypted}`);
    console.log(`   Match: ${message === decrypted}`);

    // Test asymmetric encryption
    const { publicKey, privateKey } = EncryptionService.generateKeyPair();
    const asymEncrypted = EncryptionService.encryptWithPublicKey(
      message,
      publicKey
    );
    const asymDecrypted = EncryptionService.decryptWithPrivateKey(
      asymEncrypted,
      privateKey
    );

    console.log('✅ Asymmetric encryption works');
    console.log(`   Original: ${message}`);
    console.log(`   Decrypted: ${asymDecrypted}`);
    console.log(`   Match: ${message === asymDecrypted}`);

    // Test end-to-end encryption
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

    console.log('✅ End-to-end encryption works');
    console.log(`   Original: ${message}`);
    console.log(`   Decrypted: ${e2eDecrypted}`);
    console.log(`   Match: ${message === e2eDecrypted}`);

    return true;
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    return false;
  }
}

async function testSecurity() {
  console.log('\n🛡️  Testing Security Service...');

  try {
    // Test password hashing
    const password = 'SecurePassword123!';
    const hash = await SecurityService.hashPassword(password);
    const isValid = await SecurityService.verifyPassword(password, hash);
    const isInvalid = await SecurityService.verifyPassword(
      'wrongpassword',
      hash
    );

    console.log('✅ Password hashing works');
    console.log(`   Hash length: ${hash.length}`);
    console.log(`   Valid password: ${isValid}`);
    console.log(`   Invalid password: ${isInvalid}`);

    // Test input validation
    const validUsername = SecurityService.isValidUsername('user123');
    const invalidUsername = SecurityService.isValidUsername('us');

    console.log('✅ Input validation works');
    console.log(`   Valid username: ${validUsername}`);
    console.log(`   Invalid username: ${invalidUsername}`);

    // Test password strength validation
    const strongPass = SecurityService.validatePassword('StrongPass123!');
    const weakPass = SecurityService.validatePassword('weak');

    console.log('✅ Password validation works');
    console.log(`   Strong password: ${strongPass.isValid}`);
    console.log(`   Weak password: ${weakPass.isValid}`);
    if (!weakPass.isValid) {
      console.log(`   Errors: ${weakPass.errors.join(', ')}`);
    }

    // Test XSS sanitization
    const malicious = '<script>alert("xss")</script>';
    const sanitized = SecurityService.sanitizeInput(malicious);

    console.log('✅ XSS sanitization works');
    console.log(`   Original: ${malicious}`);
    console.log(`   Sanitized: ${sanitized}`);
    console.log(`   Sanitized: ${!sanitized.includes('<script>')}`);

    return true;
  } catch (error) {
    console.error('❌ Security test failed:', error);
    return false;
  }
}

async function testJWT() {
  console.log('\n🎫 Testing JWT Service...');

  try {
    const { generateToken, verifyToken } = require('../src/config/jwt');

    const payload = {
      userId: 'user-123',
      username: 'testuser',
    };

    const token = generateToken(payload);
    const decoded = verifyToken(token);

    console.log('✅ JWT token generation and verification works');
    console.log(`   Original user ID: ${payload.userId}`);
    console.log(`   Decoded user ID: ${decoded.userId}`);
    console.log(`   Original username: ${payload.username}`);
    console.log(`   Decoded username: ${decoded.username}`);
    console.log(
      `   Token matches: ${payload.userId === decoded.userId && payload.username === decoded.username}`
    );

    // Test malformed token
    try {
      verifyToken('invalid-token');
      console.log('❌ Should have thrown error for invalid token');
      return false;
    } catch {
      console.log('✅ JWT properly rejects invalid tokens');
    }

    return true;
  } catch (error) {
    console.error('❌ JWT test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Running security tests...\n');

  const results = await Promise.all([
    testEncryption(),
    testSecurity(),
    testJWT(),
  ]);

  const allPassed = results.every(result => result === true);

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 All security tests passed! ✨');
    process.exit(0);
  } else {
    console.log('💥 Some security tests failed! ❌');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});

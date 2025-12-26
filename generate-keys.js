const {
  UserRepository,
} = require('./src/database/repositories/UserRepository');
const { EncryptionService } = require('./src/utils/encryption');

async function generateKeys() {
  console.log('Generating encryption keys for Alice and Bob...');
  try {
    // Generate keys for Alice
    await UserRepository.update('343e1beb-a3cb-4b75-888a-b1a7820ad3b3', {
      publicKey: EncryptionService.generateKeyPair().publicKey,
      privateKey: EncryptionService.generateKeyPair().privateKey,
    });
    console.log('✅ Keys generated for Alice');

    // Generate keys for Bob
    await UserRepository.update('d25656d6-d455-4ca1-8165-63540b97c51c', {
      publicKey: EncryptionService.generateKeyPair().publicKey,
      privateKey: EncryptionService.generateKeyPair().privateKey,
    });
    console.log('✅ Keys generated for Bob');

    // Generate keys for Charlie
    await UserRepository.update('d87cdda8-09a1-4e50-ac4f-bd6dc6c9c203', {
      publicKey: EncryptionService.generateKeyPair().publicKey,
      privateKey: EncryptionService.generateKeyPair().privateKey,
    });
    console.log('✅ Keys generated for Charlie');

    console.log('🔐 All encryption keys generated successfully!');
  } catch (error) {
    console.error('❌ Error generating keys:', error.message);
  }
}

generateKeys();

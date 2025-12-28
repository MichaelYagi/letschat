const {
  ConversationEncryptionService,
} = require('./dist/services/ConversationEncryptionService');
const db = require('./dist/database/connection').default;

async function debugKeyGeneration() {
  try {
    console.log('🔑 Debugging Key Generation');
    console.log('=============================');

    // Test key generation directly
    const testKey = ConversationEncryptionService.generateEncryptionKey();
    console.log('✅ Direct test key:', testKey);
    console.log('📏 Key length:', testKey ? testKey.length : 'null');

    // Test conversation creation with debug
    console.log('\n🏗️ Testing conversation creation...');
    const debugKey = 'DEBUG_KEY_' + Date.now();
    console.log('🔑 Using debug key:', debugKey);

    const result = await db('conversations')
      .insert({
        type: 'direct',
        created_by: 'test-user-id',
        encryption_key: debugKey,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    console.log('📝 Insert result:', result[0]);
    console.log('🔑 Key in result:', result[0]?.encryption_key);

    // Test ConversationRepository.create
    console.log('\n🏗️ Testing ConversationRepository...');
    const {
      ConversationRepository,
    } = require('./dist/database/repositories/MessageRepository');
    const {
      UserRepository,
    } = require('./dist/database/repositories/UserRepository');

    const user = await UserRepository.create({
      username: 'debuguser_' + Math.random().toString(36).substr(2, 5),
      password: 'testpassword123',
    });

    console.log('👤 Created user:', user.id);

    const repoResult = await ConversationRepository.create(
      { type: 'direct', participantIds: [] },
      user.id
    );

    console.log('📝 Repo result:', repoResult);
    console.log('🔑 Key in repo result:', repoResult.encryptionKey);

    // Check database directly
    const allConvs = await db('conversations')
      .where('created_by', user.id)
      .select('*');
    console.log('📊 User conversations in DB:');
    allConvs.forEach(conv => {
      console.log(
        `  - ID: ${conv.id}, Key: ${conv.encryption_key ? 'YES (' + conv.encryption_key + ')' : 'NO'}`
      );
    });
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await db.destroy();
  }
}

debugKeyGeneration();

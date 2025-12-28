const {
  ConversationRepository,
} = require('./dist/database/repositories/MessageRepository');
const {
  UserRepository,
} = require('./dist/database/repositories/UserRepository');

async function debugConversation() {
  console.log('🔍 Debugging Conversation Creation');
  console.log('===================================');

  try {
    // Create test user
    const testUser = await UserRepository.create({
      username: 'debuguser_' + Math.random().toString(36).substr(2, 9),
      password: 'testpassword123',
    });
    console.log('✅ User created:', testUser.id);

    // Direct database test
    const db = require('./dist/database/connection').default;
    console.log('📊 Testing direct DB insert...');

    const testEncryptionKey = 'TEST_KEY_' + Math.random().toString(36);
    console.log('🔑 Using test key:', testEncryptionKey);

    const [result] = await db('conversations')
      .insert({
        type: 'direct',
        created_by: testUser.id,
        encryption_key: testEncryptionKey,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    console.log('📝 Direct insert result:', result);
    console.log('🔑 Key in result:', result.encryption_key);

    // Test ConversationRepository.create
    console.log('\n🏗️ Testing ConversationRepository.create...');
    const repoConversation = await ConversationRepository.create(
      {
        type: 'direct',
        name: 'Repo Test',
        participantIds: [],
      },
      testUser.id
    );
    console.log('📝 Repo conversation:', repoConversation);
    console.log('🔑 Key in repo conversation:', repoConversation.encryptionKey);

    // Check database
    const allConversations = await db('conversations').select('*');
    console.log('\n📊 All conversations in DB:');
    allConversations.forEach(conv => {
      console.log(
        `  - ID: ${conv.id}, Key: ${conv.encryption_key ? 'YES' : 'NO'}`
      );
    });
  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Stack:', error.stack);
  }
}

debugConversation()
  .then(() => process.exit(0))
  .catch(console.error);

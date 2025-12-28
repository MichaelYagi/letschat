const {
  ConversationRepository,
} = require('./dist/database/repositories/MessageRepository');
const {
  UserRepository,
} = require('./dist/database/repositories/UserRepository');
const {
  ConversationEncryptionService,
} = require('./dist/services/ConversationEncryptionService');

async function finalDebug() {
  try {
    console.log('🔍 Final Debug - Manual Test');
    console.log('===============================');

    const db = require('./dist/database/connection').default;

    // Clear the database
    await db('conversation_participants').del();
    await db('conversations').del();
    await db('users').del();

    // Create user
    const user = await UserRepository.create({
      username: 'testuser_' + Math.random().toString(36).substr(2, 5),
      password: 'testpassword123',
    });
    console.log('✅ User created:', user.id);

    // Manually create conversation with encryption
    const encryptionKey = ConversationEncryptionService.generateEncryptionKey();
    console.log('🔑 Generated key:', encryptionKey);

    console.log('\n📝 Manual insert...');
    const [manualConv] = await db('conversations')
      .insert({
        type: 'direct',
        created_by: user.id,
        encryption_key: encryptionKey,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    console.log('✅ Manual conversation:', manualConv.id);
    console.log('🔑 Manual has key:', !!manualConv.encryption_key);

    // Now test ConversationRepository
    console.log('\n🏗️ Repository create...');
    const repoConv = await ConversationRepository.create(
      { type: 'direct', participantIds: [] },
      user.id
    );

    console.log('✅ Repo conversation:', repoConv.id);
    console.log('🔑 Repo has key:', !!repoConv.encryptionKey);

    // Verify database
    const allConvs = await db('conversations').select('*');
    console.log('\n📊 All conversations:');
    allConvs.forEach(conv => {
      console.log(`  - ${conv.id}: key=${conv.encryption_key ? 'YES' : 'NO'}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    const db = require('./dist/database/connection').default;
    await db.destroy();
  }
}

finalDebug();

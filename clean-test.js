const {
  ConversationRepository,
} = require('./dist/database/repositories/MessageRepository');
const {
  UserRepository,
} = require('./dist/database/repositories/UserRepository');

async function cleanTest() {
  try {
    console.log('🧹 Clean Test - Only ConversationRepository');
    console.log('========================================');

    const db = require('./dist/database/connection').default;

    // Clear and create just one test
    await db('conversation_participants').del();
    await db('conversations').del();
    await db('users').del();

    // Create user
    const user = await UserRepository.create({
      username: 'cleanuser_' + Math.random().toString(36).substr(2, 5),
      password: 'testpassword123',
    });
    console.log('✅ User:', user.id);

    // Test only ConversationRepository
    console.log('\n🏗️ Creating conversation...');
    const conversation = await ConversationRepository.create(
      { type: 'direct', participantIds: [] },
      user.id
    );

    console.log('📝 Result:', {
      id: conversation.id,
      hasKey: !!conversation.encryptionKey,
      keyLength: conversation.encryptionKey
        ? conversation.encryptionKey.length
        : 0,
    });

    // Check database
    const dbConv = await db('conversations')
      .where('id', conversation.id)
      .first();
    console.log('🗃️  Database reality:', {
      id: dbConv.id,
      hasKey: !!dbConv.encryption_key,
      keyLength: dbConv.encryption_key ? dbConv.encryption_key.length : 0,
    });

    // Success criteria
    const success =
      conversation.id &&
      conversation.encryptionKey &&
      dbConv.id &&
      dbConv.encryption_key &&
      conversation.id === dbConv.id;

    console.log('\n🎯 SUCCESS?', success);
    if (success) {
      console.log('✅ Conversation encryption working!');
    } else {
      console.log('❌ Conversation encryption FAILED!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    const db = require('./dist/database/connection').default;
    await db.destroy();
  }
}

cleanTest();

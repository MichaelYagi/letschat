const {
  ConversationRepository,
} = require('./dist/database/repositories/MessageRepository');
const {
  UserRepository,
} = require('./dist/database/repositories/UserRepository');

async function debugCreate() {
  try {
    // Clear database first
    const db = require('./dist/database/connection').default;
    await db('conversation_participants').del();
    await db('conversations').del();
    await db('users').del();

    console.log('🗃️ Database cleared');

    // Create user
    const user1 = await UserRepository.create({
      username: 'testuser1_' + Math.random().toString(36).substr(2, 5),
      password: 'testpassword123',
    });
    console.log('✅ User created:', user1.id);

    // Test 1: Create conversation with no participants
    console.log('\n🏗️ Test 1: Creating conversation with no participants...');
    const conv1 = await ConversationRepository.create(
      {
        type: 'direct',
        participantIds: [], // No additional participants
      },
      user1.id
    );
    console.log('✅ Conv1 created:', conv1.id);
    console.log('🔑 Has key:', !!conv1.encryptionKey);

    // Check participants
    const participants1 = await db('conversation_participants')
      .where('conversation_id', conv1.id)
      .select('*');
    console.log('👥 Participants count:', participants1.length);

    // Test 2: Create conversation with one participant
    console.log('\n🏗️ Test 2: Creating conversation with 1 participant...');
    const user2 = await UserRepository.create({
      username: 'testuser2_' + Math.random().toString(36).substr(2, 5),
      password: 'testpassword123',
    });

    const conv2 = await ConversationRepository.create(
      {
        type: 'direct',
        participantIds: [user2.id], // One additional participant
      },
      user1.id
    );
    console.log('✅ Conv2 created:', conv2.id);
    console.log('🔑 Has key:', !!conv2.encryptionKey);

    // Check participants
    const participants2 = await db('conversation_participants')
      .where('conversation_id', conv2.id)
      .select('*');
    console.log('👥 Participants count:', participants2.length);
    console.log(
      '📋 Participants:',
      participants2.map(p => `${p.user_id} (${p.role})`)
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    const db = require('./dist/database/connection').default;
    await db.destroy();
  }
}

debugCreate();

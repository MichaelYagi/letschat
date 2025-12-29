const knex = require('knex');
const config = require('./src/config/database').development;

const db = knex(config);

async function testConversations() {
  try {
    console.log('Testing conversations query...');

    const userId = 'test-user-1'; // Replace with actual user ID
    const conversations = await db('conversations')
      .select('conversations.*')
      .join(
        'conversation_participants',
        'conversations.id',
        'conversation_participants.conversation_id'
      )
      .where('conversation_participants.user_id', userId)
      .orderBy('conversations.updated_at', 'desc');

    console.log('Found conversations:', conversations.length);

    for (const conv of conversations) {
      console.log('\nConversation:', conv.id, conv.type, conv.name);

      // Get participants
      const participants = await db('conversation_participants')
        .where('conversation_id', conv.id)
        .join('users', 'conversation_participants.user_id', 'users.id')
        .select(
          'users.id',
          'users.username',
          'users.display_name',
          'conversation_participants.role'
        );

      console.log('Participants:', participants);

      // Get last message
      const lastMessage = await db('messages')
        .where('conversation_id', conv.id)
        .select(
          'messages.id',
          'messages.content',
          'messages.sender_id',
          'messages.created_at',
          'messages.content_type'
        )
        .orderBy('messages.created_at', 'desc')
        .first();

      console.log('Last message:', lastMessage);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

testConversations();

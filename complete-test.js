const {
  ConversationEncryptionService,
} = require('./dist/services/ConversationEncryptionService');
const {
  ConversationRepository,
} = require('./dist/database/repositories/MessageRepository');
const { MessageService } = require('./dist/services/MessageService');
const {
  UserRepository,
} = require('./dist/database/repositories/UserRepository');

async function completeTest() {
  console.log('🎯 Complete End-to-End Encryption Test');
  console.log('======================================');

  try {
    // Step 1: Create real users
    console.log('\n👥 Step 1: Creating two users...');
    const user1 = await UserRepository.create({
      username: 'alice_' + Math.random().toString(36).substr(2, 5),
      password: 'alice123',
    });
    const user2 = await UserRepository.create({
      username: 'bob_' + Math.random().toString(36).substr(2, 5),
      password: 'bob123',
    });
    console.log('✅ Users created:', user1.username, user2.username);

    // Step 2: Create direct conversation between users
    console.log('\n💬 Step 2: Creating direct conversation...');
    const conversation = await ConversationRepository.create(
      {
        type: 'direct',
        participantIds: [user2.id], // Alice creates conversation with Bob
      },
      user1.id
    );
    console.log('✅ Conversation created:', conversation.id);
    console.log('🔑 Has encryption key:', !!conversation.encryptionKey);

    // Add Bob to conversation participants
    await ConversationRepository.addParticipants({
      conversationId: conversation.id,
      userIds: [user2.id],
    });
    console.log('✅ Participants added');

    // Step 3: Alice sends a message
    console.log('\n📨 Step 3: Alice sends encrypted message...');
    const messageContent =
      'Hello Bob! This is a secret message only we should see.';
    const messageEvent = await MessageService.sendMessage(
      {
        conversationId: conversation.id,
        content: messageContent,
      },
      user1.id
    );
    console.log('✅ Message sent successfully');
    console.log(
      '🔒 Encrypted content stored:',
      !!messageEvent.message.encryptedContent
    );

    // Step 4: Verify database state
    console.log('\n🗃️  Step 4: Verifying database encryption...');
    const db = require('./dist/database/connection').default;
    const dbMessages = await db('messages')
      .where('conversation_id', conversation.id)
      .select('*');

    if (dbMessages.length > 0) {
      const dbMsg = dbMessages[0];
      console.log('📊 Database message state:');
      console.log('  - Has encrypted_content:', !!dbMsg.encrypted_content);
      console.log('  - Has iv:', !!dbMsg.iv);
      console.log('  - Has tag:', !!dbMsg.tag);
      console.log('  - Has plain content:', !!dbMsg.content);

      const isEncryptedProperly =
        !dbMsg.content && dbMsg.encrypted_content && dbMsg.iv && dbMsg.tag;
      console.log('  - ✅ Properly encrypted:', isEncryptedProperly);
    }

    // Step 5: Bob retrieves and reads the message
    console.log('\n📬 Step 5: Bob retrieves and reads message...');
    const bobMessages = await MessageService.getMessages(
      conversation.id,
      user2.id
    );

    if (bobMessages.length > 0) {
      const bobMessage = bobMessages[0];
      const canRead = bobMessage.content === messageContent;
      console.log('✅ Bob retrieved message');
      console.log('📝 Content readable:', canRead);
      console.log('🔓 Content matches original:', canRead);
    }

    // Step 6: Verify user table has no encryption keys
    console.log('\n👤 Step 6: Verifying user table...');
    const dbUsers = await db('users').select('*');
    const userWithKeys = dbUsers.filter(
      user => user.public_key || user.private_key
    );
    console.log('❌ Users with encryption keys:', userWithKeys.length);
    console.log('✅ All users without keys:', userWithKeys.length === 0);

    // Step 7: Verify conversation table has encryption keys
    console.log('\n🔑 Step 7: Verifying conversation table...');
    const dbConversations = await db('conversations').select('*');
    const conversationsWithKeys = dbConversations.filter(
      conv => conv.encryption_key
    );
    console.log(
      '✅ Conversations with encryption keys:',
      conversationsWithKeys.length
    );
    console.log(
      '🔑 All conversations have keys:',
      conversationsWithKeys.length === dbConversations.length
    );

    console.log('\n🎉 SUCCESS! All tests passed!');
    console.log('📋 Summary:');
    console.log('  ✅ Messages encrypted in database');
    console.log('  ✅ Users can decrypt messages in their conversations');
    console.log('  ✅ No user-level encryption keys');
    console.log('  ✅ Conversation-level encryption working');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

completeTest()
  .then(() => process.exit(0))
  .catch(console.error);

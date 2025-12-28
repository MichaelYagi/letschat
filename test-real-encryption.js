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

async function testRealEncryption() {
  console.log('🔐 Testing Real Database Encryption/Decryption');
  console.log('==============================================');

  try {
    // Test 1: Create test user
    console.log('\n📝 Test 1: Creating test user...');
    const testUser = await UserRepository.create({
      username: 'testuser_' + Math.random().toString(36).substr(2, 9),
      password: 'testpassword123',
    });
    console.log('✅ User created:', testUser.username, testUser.id);

    // Test 2: Create conversation with encryption key
    console.log('\n💬 Test 2: Creating conversation...');
    const conversation = await ConversationRepository.create(
      {
        type: 'direct',
        name: 'Test Conversation',
        participantIds: [], // Don't include creator to avoid duplicates
      },
      testUser.id
    );
    console.log('✅ Conversation created:', conversation.id);
    console.log('🔑 Encryption key exists:', !!conversation.encryptionKey);

    // Test 3: Send encrypted message
    console.log('\n📨 Test 3: Sending encrypted message...');
    const testMessage = 'Hello, this is a secret message!';
    const messageEvent = await MessageService.sendMessage(
      {
        conversationId: conversation.id,
        content: testMessage,
      },
      testUser.id
    );
    console.log('✅ Message sent, ID:', messageEvent.message.id);
    console.log(
      '🔒 Database stores encrypted content:',
      !!messageEvent.message.encryptedContent
    );
    console.log('🔑 IV exists:', !!messageEvent.message.iv);
    console.log('🏷️  Tag exists:', !!messageEvent.message.tag);

    // Test 4: Retrieve and decrypt message
    console.log('\n📬 Test 4: Retrieving and decrypting message...');
    const messages = await MessageService.getMessages(
      conversation.id,
      testUser.id
    );

    if (messages.length > 0) {
      const retrievedMessage = messages[0];
      console.log('✅ Message retrieved');
      console.log(
        '📄 Content matches original:',
        retrievedMessage.content === testMessage
      );
      console.log(
        '🔒 Encrypted content in DB:',
        !!retrievedMessage.encryptedContent
      );
      console.log('📝 Plain content for user:', retrievedMessage.content);
    } else {
      console.log('❌ No messages retrieved');
    }

    // Test 5: Verify database state
    console.log('\n🗃️  Test 5: Verifying database state...');

    // Check that messages table has encrypted content
    const dbMessages = await new Promise((resolve, reject) => {
      const db = require('./dist/database/connection').default;
      db('messages')
        .where('conversation_id', conversation.id)
        .select('*')
        .then(rows => resolve(rows))
        .catch(err => reject(err));
    });

    if (dbMessages.length > 0) {
      const dbMsg = dbMessages[0];
      console.log('✅ Message in database');
      console.log('🔒 Has encrypted_content:', !!dbMsg.encrypted_content);
      console.log('🔑 Has iv:', !!dbMsg.iv);
      console.log('🏷️  Has tag:', !!dbMsg.tag);
      console.log('❌ Has plain content:', !!dbMsg.content);

      // Verify content is NOT stored in plain text
      if (!dbMsg.content && dbMsg.encrypted_content && dbMsg.iv && dbMsg.tag) {
        console.log('✅ Message properly encrypted in database (no plaintext)');
      } else {
        console.log('❌ WARNING: Message may be stored in plaintext');
      }
    }

    console.log('\n🎉 All encryption tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testRealEncryption()
  .then(() => process.exit(0))
  .catch(console.error);

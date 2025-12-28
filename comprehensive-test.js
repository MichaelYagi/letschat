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
const { EncryptionService } = require('./dist/utils/encryption');

async function comprehensiveFinalTest() {
  console.log('🎯 COMPREHENSIVE FINAL TEST');
  console.log('============================');

  try {
    const db = require('./dist/database/connection').default;

    // Clear everything for clean test
    await db('conversation_participants').del();
    await db('conversations').del();
    await db('users').del();

    // Step 1: Create users
    const alice = await UserRepository.create({
      username: 'alice_' + Math.random().toString(36).substr(2, 5),
      password: 'alice123',
    });
    const bob = await UserRepository.create({
      username: 'bob_' + Math.random().toString(36).substr(2, 5),
      password: 'bob123',
    });
    console.log('✅ Users created:', alice.username, bob.username);

    // Step 2: Create conversation
    const conversation = await ConversationRepository.create(
      {
        type: 'direct',
        participantIds: [bob.id],
      },
      alice.id
    );
    console.log('✅ Conversation created:', conversation.id);
    console.log('🔑 Has encryption key:', !!conversation.encryptionKey);

    // Step 3: Verify database directly
    const dbConv = await db('conversations')
      .where('id', conversation.id)
      .first();
    console.log('🗃️  Database check:');
    console.log('  - ID:', dbConv.id);
    console.log('  - Key exists:', !!dbConv.encryption_key);
    console.log('  - Key value:', dbConv.encryption_key);

    // Step 4: Send encrypted message
    const messageContent = 'Hello Bob! This should be encrypted in DB.';
    const messageEvent = await MessageService.sendMessage(
      {
        conversationId: conversation.id,
        content: messageContent,
      },
      alice.id
    );
    console.log('✅ Message sent:', messageEvent.message.id);
    console.log('🔒 Encrypted in DB:', !!messageEvent.message.encryptedContent);

    // Step 5: Verify message encryption in database
    const dbMessages = await db('messages')
      .where('conversation_id', conversation.id)
      .select('*');
    if (dbMessages.length > 0) {
      const dbMsg = dbMessages[0];
      const isProperlyEncrypted =
        !dbMsg.content && dbMsg.encrypted_content && dbMsg.iv && dbMsg.tag;
      console.log('🔐 Message encryption verification:');
      console.log('  - Has encrypted_content:', !!dbMsg.encrypted_content);
      console.log('  - Has iv:', !!dbMsg.iv);
      console.log('  - Has tag:', !!dbMsg.tag);
      console.log('  - NO plain content:', !dbMsg.content);
      console.log('  - ✅ Properly encrypted:', isProperlyEncrypted);
    }

    // Step 6: Bob retrieves and decrypts message
    const bobMessages = await MessageService.getMessages(
      conversation.id,
      bob.id
    );
    const canRead =
      bobMessages.length > 0 && bobMessages[0].content === messageContent;
    console.log('📬 Bob message retrieval:');
    console.log('  - Can read:', canRead);
    console.log('  - Content matches:', canRead);

    // Step 7: Verify no user encryption keys
    const dbUsers = await db('users').select('*');
    const usersWithKeys = dbUsers.filter(u => u.public_key || u.private_key);
    console.log('👤 User key verification:');
    console.log('  - Users with keys:', usersWithKeys.length);
    console.log('  - ✅ No user keys:', usersWithKeys.length === 0);

    // Final verdict
    const encryptionWorking =
      !!conversation.encryptionKey &&
      isProperlyEncrypted &&
      canRead &&
      usersWithKeys.length === 0;

    console.log('\n🏁 FINAL VERDICT:');
    console.log('===================');
    if (encryptionWorking) {
      console.log(
        '🎉 SUCCESS: Conversation-level encryption is working perfectly!'
      );
      console.log('✅ Messages encrypted in database');
      console.log('✅ Participants can decrypt messages');
      console.log('✅ No user-level encryption keys');
      console.log('✅ All requirements met');
    } else {
      console.log('❌ FAILURE: Encryption system has issues');
      console.log('  - Conversation has key:', !!conversation.encryptionKey);
      console.log('  - Messages encrypted:', isProperlyEncrypted);
      console.log('  - Messages readable:', canRead);
      console.log('  - No user keys:', usersWithKeys.length === 0);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    const db = require('./dist/database/connection').default;
    await db.destroy();
  }
}

comprehensiveFinalTest();

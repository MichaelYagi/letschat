const db = require('./dist/database/connection').default;

async function checkParticipants() {
  try {
    const participants = await db('conversation_participants').select('*');
    console.log('Conversation participants:');
    participants.forEach(part => {
      console.log(
        `Conversation ID: ${part.conversation_id}, User ID: ${part.user_id}, Joined: ${part.created_at}`
      );
    });

    // Find conversations for our test users
    const user1Id = '00f613f7-ee4f-424a-aafa-4739b347c9af'; // testing
    const user2Id = '41d76971-4b4c-4eec-985f-2f001b2c253e'; // testing1

    const user1Convs = participants.filter(p => p.user_id === user1Id);
    const user2Convs = participants.filter(p => p.user_id === user2Id);

    console.log(`\nUser1 (${user1Id}) conversations:`);
    user1Convs.forEach(p => console.log(`  - ${p.conversation_id}`));

    console.log(`\nUser2 (${user2Id}) conversations:`);
    user2Convs.forEach(p => console.log(`  - ${p.conversation_id}`));

    // Find common conversations
    const user1ConvIds = new Set(user1Convs.map(p => p.conversation_id));
    const commonConvs = user2Convs.filter(p =>
      user1ConvIds.has(p.conversation_id)
    );

    console.log(`\nCommon conversations:`);
    commonConvs.forEach(p => console.log(`  - ${p.conversation_id}`));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkParticipants();

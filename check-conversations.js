const db = require('./dist/database/connection').default;

async function checkConversations() {
  try {
    const conversations = await db('conversations').select('*');
    console.log('Available conversations:');
    conversations.forEach(conv => {
      console.log(
        `ID: ${conv.id}, Type: ${conv.type}, Created: ${conv.created_at}`
      );
    });

    if (conversations.length === 0) {
      console.log('No conversations found.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkConversations();

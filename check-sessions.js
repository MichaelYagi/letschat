const db = require('./dist/database/connection').default;

async function checkSessions() {
  try {
    const sessions = await db('user_sessions').select('*');
    console.log('Available sessions:');
    sessions.forEach(session => {
      console.log(
        `ID: ${session.id}, User ID: ${session.user_id}, Token Hash: ${session.token_hash.substring(0, 20)}...`
      );
    });

    if (sessions.length === 0) {
      console.log('No sessions found. Users need to login first.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkSessions();

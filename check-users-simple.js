const db = require('./dist/database/connection').default;

async function checkUsers() {
  try {
    const users = await db('users').select('id', 'username');
    console.log('Available users:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();

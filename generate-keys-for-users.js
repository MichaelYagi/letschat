const { KeyService } = require('./dist/services/KeyService.js');

async function generateKeysForUsers() {
  const { db } = require('./dist/database/connection.js');

  const users = await db('users').select('id');

  for (const user of users) {
    try {
      console.log(`Generating keys for user ${user.id}`);
      await KeyService.regenerateKeys(user.id);
    } catch (error) {
      console.error(`Failed to generate keys for user ${user.id}:`, error);
    }
  }

  console.log('Key generation complete');
  process.exit(0);
}

generateKeysForUsers();

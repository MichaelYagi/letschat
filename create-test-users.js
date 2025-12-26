const bcrypt = require('bcryptjs');

async function createTestUsers() {
  console.log('Creating bcrypt password hashes...');

  // Hash alice password
  const alicePassword = 'password123';
  const aliceHash = await bcrypt.hash(alicePassword, 12);
  console.log('Alice hash:', aliceHash);

  // Hash bob password
  const bobPassword = 'password456';
  const bobHash = await bcrypt.hash(bobPassword, 12);
  console.log('Bob hash:', bobHash);

  // Generate unique IDs
  const aliceId = 'alice-' + Date.now();
  const bobId = 'bob-' + Date.now();

  console.log('\nSQL to create users:');
  console.log(
    `INSERT OR REPLACE INTO users (id, username, password_hash, status, created_at, updated_at) VALUES ('${aliceId}', 'alice', '${aliceHash}', 'online', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`
  );
  console.log(
    `INSERT OR REPLACE INTO users (id, username, password_hash, status, created_at, updated_at) VALUES ('${bobId}', 'bob', '${bobHash}', 'online', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`
  );
}

createTestUsers();

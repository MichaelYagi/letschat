const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/chat.db');

console.log('📋 Checking existing users in database...');

db.all(
  'SELECT id, username, status, created_at, last_seen FROM users ORDER BY created_at DESC LIMIT 10',
  [],
  (err, rows) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      return;
    }

    console.log('\n👥 Existing Users:');
    rows.forEach((user, index) => {
      console.log(
        `${index + 1}. Username: ${user.username}, ID: ${user.id}, Status: ${user.status}`
      );
      console.log(`   Last Seen: ${user.last_seen || 'Never'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });

    if (rows.length === 0) {
      console.log('   No users found in database');
    } else {
      console.log(`   Found ${rows.length} user(s) in database`);
      console.log('   Use one of these usernames for login testing');
    }

    db.close();
  }
);

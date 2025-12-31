// Test script to verify the backend functionality
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./data/chat.db');

console.log('=== Testing Database Setup ===');

// Test 1: Check users exist
db.all('SELECT * FROM users', (err, users) => {
  if (err) {
    console.error('Error fetching users:', err);
    return;
  }

  console.log('✅ Users found:', users.length);
  users.forEach(user => {
    console.log(`  - ${user.username} (${user.display_name}) - ${user.status}`);
  });
});

// Test 2: Check conversations exist
db.all('SELECT * FROM conversations', (err, conversations) => {
  if (err) {
    console.error('Error fetching conversations:', err);
    return;
  }

  console.log('✅ Conversations found:', conversations.length);
  conversations.forEach(conv => {
    console.log(`  - ${conv.type} conversation (ID: ${conv.id})`);
  });
});

// Test 3: Check conversation participants
db.all(
  'SELECT cp.*, u.username FROM conversation_participants cp JOIN users u ON cp.user_id = u.id',
  (err, participants) => {
    if (err) {
      console.error('Error fetching participants:', err);
      return;
    }

    console.log('✅ Participants found:', participants.length);
    participants.forEach(part => {
      console.log(
        `  - ${part.username} in conversation ${part.conversation_id}`
      );
    });
  }
);

// Test 4: Simulate user search functionality
console.log('\n=== Testing User Search Logic ===');
const searchQuery = 'a';
db.all(
  'SELECT id, username, display_name, status FROM users WHERE username LIKE ? AND id != 1',
  [`%${searchQuery}%`],
  (err, users) => {
    if (err) {
      console.error('Error in search:', err);
      return;
    }

    console.log(`✅ Search for "${searchQuery}" results:`, users.length);
    users.forEach(user => {
      console.log(`  - Found: ${user.username} (${user.display_name})`);
    });
  }
);

db.close(err => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('\n✅ Database tests completed successfully!');
  }
});

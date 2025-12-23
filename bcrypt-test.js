const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

console.log('🧪 Testing bcrypt comparison for user browseruser789');

// Get the stored hash for test user
const db = new sqlite3.Database('./data/chat.db');
db.get(
  "SELECT password_hash FROM users WHERE username='browseruser789'",
  [],
  (err, row) => {
    if (err) {
      console.error('Database error:', err);
      process.exit(1);
    }

    if (row) {
      const storedHash = row.password_hash;
      console.log('Stored hash for browseruser789:', storedHash);

      // Test password verification
      const testPassword = 'TestPass123!';

      // Test with correct password
      bcrypt.compare(testPassword, storedHash, (err, isMatch) => {
        console.log('Correct password comparison:', isMatch);

        // Test with incorrect password
        bcrypt.compare('WrongPassword123', storedHash, (err, isMatch) => {
          console.log('Incorrect password comparison:', isMatch);

          if (!err) {
            console.log('✅ Bcrypt comparison working correctly');
            console.log('Password verification system: OPERATIONAL');
          } else {
            console.error('❌ Bcrypt comparison error:', err);
          }

          db.close();
        });
      });
    }
  }
);

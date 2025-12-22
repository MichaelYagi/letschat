const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/chat.db');

console.log('🗃️ Real-time Database Monitor Started');
console.log('Monitoring users table for changes...');
console.log('='.repeat(50));

// Watch database changes
setInterval(() => {
  db.all(
    'SELECT id, username, display_name, status, created_at FROM users ORDER BY created_at DESC LIMIT 3',
    [],
    (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        return;
      }

      console.log('\n📊 Recent Users:');
      rows.forEach((row, index) => {
        console.log(
          `${index + 1}. [${row.id}] ${row.display_name || row.username} (${row.status}) - Created: ${row.created_at}`
        );
      });

      console.log('\n💡 Test Instructions:');
      console.log('1. Visit: http://localhost:3001/register');
      console.log('2. Fill out the registration form');
      console.log('3. After registration, should be redirected to login');
      console.log('4. Login with the same credentials');
      console.log('5. Check this monitor for new user entries');
      console.log('\n🔍 Watch for new entries above...');
    }
  );
}, 3000);

console.log('🕐 Press Ctrl+C to stop monitoring');
console.log('='.repeat(50));

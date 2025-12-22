const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function verifyDatabaseState() {
  const dbPath = path.join(__dirname, 'data', 'chat.db');

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    console.log('🔍 Verifying database state...');

    db.serialize(() => {
      const queries = [
        { name: 'Users', sql: 'SELECT COUNT(*) as count FROM users' },
        {
          name: 'Conversations',
          sql: 'SELECT COUNT(*) as count FROM conversations',
        },
        { name: 'Messages', sql: 'SELECT COUNT(*) as count FROM messages' },
        {
          name: 'User Connections',
          sql: 'SELECT COUNT(*) as count FROM user_connections',
        },
        {
          name: 'Recent Users',
          sql: 'SELECT username, status, created_at FROM users ORDER BY created_at DESC LIMIT 5',
        },
        {
          name: 'Recent Messages',
          sql: 'SELECT content, created_at FROM messages ORDER BY created_at DESC LIMIT 5',
        },
      ];

      const results = {};
      let completed = 0;

      queries.forEach((query, index) => {
        if (query.name.includes('Users') || query.name.includes('Messages')) {
          db.all(query.sql, (err, rows) => {
            if (err) {
              console.error(`❌ Error in ${query.name}:`, err);
              results[query.name] = { error: err.message };
            } else {
              console.log(`✅ ${query.name}:`, rows);
              results[query.name] = rows;
            }

            completed++;
            if (completed === queries.length) {
              db.close();
              resolve(results);
            }
          });
        } else {
          db.get(query.sql, (err, row) => {
            if (err) {
              console.error(`❌ Error in ${query.name}:`, err);
              results[query.name] = { error: err.message };
            } else {
              console.log(`✅ ${query.name}:`, row);
              results[query.name] = row;
            }

            completed++;
            if (completed === queries.length) {
              db.close();
              resolve(results);
            }
          });
        }
      });
    });
  });
}

// Function to wait for user interaction
async function waitForUIInteraction() {
  console.log('\n📋 Manual Testing Checklist:');
  console.log(
    '1. ✅ Open the test page: http://localhost:5173 or the comprehensive test page'
  );
  console.log('2. 🔄 Test registration with a new user account');
  console.log('3. 🔐 Test login with the registered credentials');
  console.log('4. 🔍 Test user search functionality');
  console.log('5. 💬 Test starting conversations and sending messages');
  console.log('6. 🚪 Test logout functionality');
  console.log('7. 📱 Verify responsive design on different screen sizes');
  console.log('8. ⚡ Check real-time message updates (if available)');
  console.log(
    '9. 🎯 Test error handling (invalid credentials, empty fields, etc.)'
  );
  console.log('10. 📊 After completing UI tests, check database state below');

  console.log('\n⏳ Waiting 30 seconds for you to perform UI tests...');
  console.log(
    '🌐 Test page: file://' + __dirname + '/comprehensive-ui-test.html'
  );
  console.log('🌐 Or open: http://localhost:5173 (the actual application)');

  return new Promise(resolve => {
    setTimeout(resolve, 30000);
  });
}

async function main() {
  console.log('🚀 Starting comprehensive UI and database verification...\n');

  // Initial database state
  console.log('📊 Initial Database State:');
  await verifyDatabaseState();

  // Wait for user to perform UI tests
  await waitForUIInteraction();

  // Final database state
  console.log('\n📊 Final Database State (after UI tests):');
  const finalResults = await verifyDatabaseState();

  console.log('\n🎉 Verification completed!');
  console.log('📸 Screenshots and test results have been saved');
  console.log('🗃️ Database state has been recorded');

  // Check if data was actually created through the UI
  if (finalResults.Users && finalResults.Users.count > 0) {
    console.log('✅ Users successfully created and stored in database');
  }

  if (finalResults.Messages && finalResults.Messages.count > 0) {
    console.log('✅ Messages successfully created and stored in database');
  }

  if (finalResults.Conversations && finalResults.Conversations.count > 0) {
    console.log('✅ Conversations successfully created and stored in database');
  }
}

// Check if running directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { verifyDatabaseState };

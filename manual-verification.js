// Quick verification without browser automation
const http = require('http');

async function quickVerification() {
  console.log('⚡ Quick verification...');

  try {
    // Test frontend accessibility
    const frontendResponse = await fetch('http://localhost:5173');
    const frontendText = await frontendResponse.text();

    console.log('✅ Frontend is accessible');
    console.log('📄 Response length:', frontendText.length);

    // Check if it's a valid HTML page
    if (frontendText.includes('<html') && frontendText.includes('<body')) {
      console.log('✅ Valid HTML structure detected');
    }

    // Check for React app indicators
    if (
      frontendText.includes('react') ||
      frontendText.includes('root') ||
      frontendText.includes('app')
    ) {
      console.log('✅ React app detected');
    }

    // Test backend API
    const backendResponse = await fetch('http://localhost:3000/health');
    const backendData = await backendResponse.json();

    console.log('✅ Backend API is accessible');
    console.log('🏥 Health check:', backendData);

    // Test API endpoints exist
    const apiDocsResponse = await fetch('http://localhost:3000/api-docs/');
    if (apiDocsResponse.ok) {
      console.log('✅ API documentation is accessible');
    }

    console.log('\n🌐 Manual testing instructions:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Test registration: create a new user account');
    console.log('3. Test login: use the credentials you just created');
    console.log('4. Test user search: look for other users');
    console.log('5. Test chat: start a conversation and send messages');
    console.log('6. Test logout: verify you can log out successfully');
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

// Database verification function
async function verifyDatabase() {
  console.log('\n🗄️  Verifying database...');

  try {
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./data/chat.db');

    // Check tables exist
    const tables = await new Promise((resolve, reject) => {
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table'",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(
      '📋 Database tables:',
      tables.map(t => t.name)
    );

    // Check users table
    const userCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    console.log('👥 Total users in database:', userCount);

    db.close();
    console.log('✅ Database verification completed');
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
  }
}

// Run verifications
quickVerification()
  .then(() => {
    return verifyDatabase();
  })
  .catch(console.error);

// Test login with another user to verify consistency
const { default: fetch } = require('node-fetch');

async function testDifferentUser() {
  console.log('🔄 TESTING LOGIN WITH DIFFERENT USER\n');

  const username = 'testing';
  const password = 'TestPassword123!';

  try {
    console.log('1. Testing login with user:', username);

    const response = await fetch('http://localhost:5174/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok && data.data?.token) {
      console.log('✅ SECOND USER LOGIN SUCCESSFUL');
      console.log(`   Username: ${data.data.user.username}`);
      console.log(`   User ID: ${data.data.user.id}`);
      console.log(`   Status: ${data.data.user.status}`);

      // Verify session creation
      const { execSync } = require('child_process');
      const sessionCheck = execSync(
        `sqlite3 ./data/chat.db "SELECT COUNT(*) FROM user_sessions WHERE user_id = '${data.data.user.id}'"`
      )
        .toString()
        .trim();

      console.log(`   Sessions in DB: ${sessionCheck}`);

      if (sessionCheck === '1') {
        console.log('✅ SESSION CREATED SUCCESSFULLY');
      } else {
        console.log('❌ SESSION CREATION ISSUE');
      }
    } else {
      console.log('❌ SECOND USER LOGIN FAILED');
      console.log(JSON.stringify(data, null, 2));
    }

    // Test password verification with wrong password
    console.log('\\n2. Testing wrong password...');
    const wrongResponse = await fetch('http://localhost:5174/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password: 'WrongPassword!' }),
    });

    if (wrongResponse.status === 401 || wrongResponse.status === 400) {
      console.log('✅ WRONG PASSWORD CORRECTLY REJECTED');
    } else {
      console.log('❌ WRONG PASSWORD SHOULD BE REJECTED');
    }

    console.log('\\n🎯 LOGIN CONSISTENCY VERIFICATION COMPLETE');
  } catch (error) {
    console.log('❌ TEST ERROR:', error.message);
  }
}

testDifferentUser();

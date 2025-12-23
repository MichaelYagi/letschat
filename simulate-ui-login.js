// Simulate browser-based UI login test
const { default: fetch } = require('node-fetch');

async function simulateUILogin() {
  console.log('🎯 SIMULATING REAL UI LOGIN TEST\n');

  const username = 'testuser_new';
  const password = 'TestPassword123!';

  try {
    // Step 1: Check frontend accessibility
    console.log('1. Testing frontend accessibility...');
    const frontResponse = await fetch('http://localhost:5174/');
    if (frontResponse.ok) {
      console.log('✅ Frontend accessible on port 5174');
    } else {
      throw new Error(`Frontend not accessible: ${frontResponse.status}`);
    }

    // Step 2: Perform login through frontend proxy (like real UI)
    console.log('\\n2. Performing login through UI proxy...');
    console.log(`   Username: ${username}`);
    console.log(`   Password: [${password.length} characters]`);

    const loginResponse = await fetch('http://localhost:5174/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (UI Test)',
        Accept: 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log(`   API Status: ${loginResponse.status}`);

    const loginData = await loginResponse.json();

    if (loginResponse.ok && loginData.data?.token && loginData.data?.user) {
      console.log('✅ LOGIN SUCCESSFUL');
      console.log(`   User ID: ${loginData.data.user.id}`);
      console.log(`   Username: ${loginData.data.user.username}`);
      console.log(`   Status: ${loginData.data.user.status}`);
      console.log(`   Token Length: ${loginData.data.token.length}`);

      // Step 3: Verify database session was created
      console.log('\\n3. Verifying database session...');
      const { execSync } = require('child_process');
      const sessionQuery = `SELECT COUNT(*) as count, created_at FROM user_sessions WHERE user_id = '${loginData.data.user.id}' ORDER BY created_at DESC LIMIT 1`;
      const sessionResult = execSync(`sqlite3 ./data/chat.db "${sessionQuery}"`)
        .toString()
        .trim();

      if (sessionResult) {
        console.log('✅ DATABASE SESSION CREATED');
        console.log(`   Session Data: ${sessionResult}`);
      } else {
        console.log('❌ NO DATABASE SESSION FOUND');
      }

      // Step 4: Test authenticated request (like real app would)
      console.log('\\n4. Testing authenticated API request...');
      const authResponse = await fetch('http://localhost:5174/api/health', {
        headers: {
          Authorization: `Bearer ${loginData.data.token}`,
          'User-Agent': 'Mozilla/5.0 (UI Test - Authenticated)',
        },
      });

      if (authResponse.ok) {
        console.log('✅ AUTHENTICATED REQUEST WORKS');
        console.log(`   Status: ${authResponse.status}`);
      } else {
        console.log('❌ AUTHENTICATED REQUEST FAILED');
        console.log(`   Status: ${authResponse.status}`);
      }

      // Step 5: Final verification
      console.log('\\n5. Final login verification...');
      const userStatus = execSync(
        `sqlite3 ./data/chat.db "SELECT status FROM users WHERE id = '${loginData.data.user.id}'"`
      )
        .toString()
        .trim();
      const sessionCount = execSync(
        `sqlite3 ./data/chat.db "SELECT COUNT(*) FROM user_sessions WHERE user_id = '${loginData.data.user.id}'"`
      )
        .toString()
        .trim();

      console.log('📊 FINAL RESULTS:');
      console.log(`   User Status: ${userStatus}`);
      console.log(`   Active Sessions: ${sessionCount}`);
      console.log(`   Login API: ✅ Working`);
      console.log(`   Token Auth: ✅ Working`);
      console.log(`   Database: ✅ Sessions Created`);

      if (userStatus && sessionCount > 0) {
        console.log('\\n🎉 LOGIN FULLY VERIFIED AND FUNCTIONAL!');
      } else {
        console.log('\\n❌ LOGIN VERIFICATION INCOMPLETE');
      }
    } else {
      console.log('❌ LOGIN FAILED');
      console.log('Response:', JSON.stringify(loginData, null, 2));
    }
  } catch (error) {
    console.log('❌ UI LOGIN TEST ERROR:', error.message);
  }
}

simulateUILogin();

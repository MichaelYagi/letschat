// Simplified login verification test
const { default: fetch } = require('node-fetch');

async function verifyLoginSystem() {
  console.log('🧪 VERIFICATION TEST\n');

  const testUsername = 'testuser_' + Date.now().toString().slice(-6);
  const testPassword = 'TestPassword123!';

  try {
    // Step 1: Register user
    console.log('1. Creating test user...');
    const registerResponse = await fetch(
      'http://localhost:5173/api/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testUsername,
          email: testUsername + '@test.com',
          password: testPassword,
        }),
      }
    );

    const registerData = await registerResponse.json();
    if (!registerData.success) {
      console.log('❌ User registration failed');
      console.log('   Error:', registerData.error);
      return false;
    }

    console.log('✅ User created');

    // Step 2: Login with user
    console.log('\n2. Testing login...');
    const loginResponse = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword,
      }),
    });

    const loginData = await loginResponse.json();
    if (!loginData.success || !loginData.data?.token) {
      console.log('❌ Login failed');
      console.log('   Error:', loginData.error);
      return false;
    }

    console.log('✅ Login successful');
    const token = loginData.data.token;
    const user = loginData.data.user;

    // Step 3: Store in localStorage (simulate React app)
    localStorage.setItem('letschat_token', token);
    localStorage.setItem('letschat_user', JSON.stringify(user));

    // Step 4: Test authenticated request
    console.log('\n3. Testing authenticated request...');
    const authResponse = await fetch('http://localhost:5173/api/health', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const authData = await authResponse.json();

    // Step 5: Check database
    console.log('\n4. Checking database...');
    const { execSync } = require('child_process');

    const userInDb = execSync(
      `sqlite3 ./data/chat.db "SELECT COUNT(*) FROM users WHERE username = '${testUsername}'"`
    )
      .toString()
      .trim();
    const sessionCount = execSync(
      `sqlite3 ./data/chat.db "SELECT COUNT(*) FROM user_sessions WHERE user_id = '${user.id}'"`
    )
      .toString()
      .trim();

    console.log(`   User in database: ${userInDb === '1' ? 'YES' : 'NO'}`);
    console.log(`   Session count: ${sessionCount}`);

    const allWorking =
      loginData.success &&
      authData.success &&
      userInDb === '1' &&
      sessionCount > 0;

    console.log('\n📋 FINAL RESULTS:');
    console.log(`   User Registration: ${registerData.success ? '✅' : '❌'}`);
    console.log(`   User Login: ${loginData.success ? '✅' : '❌'}`);
    console.log(`   Token Storage: ${token ? '✅' : '❌'}`);
    console.log(`   Authenticated API: ${authData.success ? '✅' : '❌'}`);
    console.log(`   Database User: ${userInDb ? '✅' : '❌'}`);
    console.log(`   Database Session: ${sessionCount > 0 ? '✅' : '❌'}`);

    if (allWorking) {
      console.log('\n🎉 LOGIN SYSTEM IS FULLY FUNCTIONAL AND VERIFIED');
      console.log('\n🔧 COMPONENTS WORKING:');
      console.log('   ✅ User registration API');
      console.log('   ✅ User login API');
      console.log('   ✅ Token storage');
      console.log('   ✅ Authenticated API');
      console.log('   ✅ Database user creation');
      console.log('   ✅ Database session management');
    } else {
      console.log('\n❌ LOGIN SYSTEM HAS ISSUES');
    }

    console.log('\n🧪 TEST COMPLETE');
    return allWorking;
  } catch (error) {
    console.log('❌ VERIFICATION ERROR:', error.message);
    return false;
  }
}

verifyLoginSystem();

// Direct API testing script - using Node.js built-in fetch

const API_BASE = 'http://localhost:3000/api';
let authToken = null;
let testUser = {
  username: `test_${Date.now()}`,
  password: 'TestPassword123!',
};

async function testAPI() {
  console.log('🚀 Testing API directly...\n');

  try {
    // 1. Test health endpoint
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);

    // 2. Test registration
    console.log('\n2️⃣ Testing registration...');
    const regResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        email: `${testUser.username}@test.com`,
        password: testUser.password,
      }),
    });

    const regData = await regResponse.json();
    console.log(
      'Registration response:',
      regData.status,
      regData.success ? '✅' : '❌'
    );

    if (regData.success && regData.token) {
      authToken = regData.token;
      console.log('✅ User registered successfully');
    }

    // 3. Test login
    console.log('\n3️⃣ Testing login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password,
      }),
    });

    const loginData = await loginResponse.json();
    console.log(
      'Login response:',
      loginData.status || loginData.success ? '✅' : '❌'
    );

    if (loginData.success && loginData.token) {
      authToken = loginData.token;
      console.log('✅ User logged in successfully');
    }

    // 4. Test user search (requires auth)
    if (authToken) {
      console.log('\n4️⃣ Testing user search...');
      const searchResponse = await fetch(`${API_BASE}/users/search?q=test`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const searchData = await searchResponse.json();
      console.log('Search response:', searchData.success ? '✅' : '❌');

      if (searchData.success && searchData.data) {
        console.log(`✅ Found ${searchData.data.length} users`);
      }

      // 5. Test conversations
      console.log('\n5️⃣ Testing conversations...');
      const convResponse = await fetch(`${API_BASE}/conversations`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const convData = await convResponse.json();
      console.log('Conversations response:', convData.success ? '✅' : '❌');

      if (convData.success && convData.data) {
        console.log(`✅ Found ${convData.data.length} conversations`);
      }
    }

    console.log('\n🎉 API testing completed!');
    console.log('🌐 Now test the UI at: http://localhost:5173');
    console.log('📝 Use these credentials:');
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Password: ${testUser.password}`);
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Test if servers are running
async function checkServers() {
  console.log('🔍 Checking servers...');

  try {
    const frontend = await fetch('http://localhost:5173');
    console.log('✅ Frontend running on port 5173');
  } catch (error) {
    console.log('❌ Frontend not running on port 5173');
  }

  try {
    const backend = await fetch('http://localhost:3000/health');
    console.log('✅ Backend running on port 3000');
  } catch (error) {
    console.log('❌ Backend not running on port 3000');
  }
}

// Run the tests
checkServers()
  .then(() => {
    return testAPI();
  })
  .catch(console.error);

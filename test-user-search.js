const axios = require('axios');

async function testUserSearch() {
  console.log('🧪 Testing User Search API...\n');

  const API_BASE = 'http://localhost:3000/api';

  try {
    // First login as test user
    console.log('1. Logging in as test user...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'testing',
      password: 'password123',
    });

    const token = loginResponse.data.data.token;
    console.log(`✅ Logged in successfully!`);

    // Set up axios with auth
    const authAxios = axios.create({
      baseURL: API_BASE,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Test user search
    console.log('\n2. Testing user search for "testing1"...');
    const searchResponse = await authAxios.get('/auth/search', {
      params: { q: 'testing1', limit: 10 },
    });

    console.log(
      '📥 Raw search response:',
      JSON.stringify(searchResponse.data, null, 2)
    );
    console.log('✅ User search API works!');

    const users = searchResponse.data.data || searchResponse.data;
    if (Array.isArray(users) && users.length > 0) {
      console.log(`👥 Found ${users.length} user(s):`);
      users.forEach(user => {
        console.log(`  - ${user.username} (ID: ${user.id})`);
      });
    } else {
      console.log('⚠️  No users found in search results');
    }
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUserSearch();

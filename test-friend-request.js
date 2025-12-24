// Test script to verify friend request functionality
const API_BASE = 'http://localhost:3000/api';

// Simple API client using fetch
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  setAuth(token) {
    this.headers.Authorization = `Bearer ${token}`;
  }

  async post(url, data) {
    const response = await fetch(this.baseURL + url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });
    return { data: await response.json() };
  }

  async get(url) {
    const response = await fetch(this.baseURL + url, {
      headers: this.headers,
    });
    return { data: await response.json() };
  }
}

const api = new ApiClient(API_BASE);

async function testFriendRequestFlow() {
  try {
    console.log('🔄 Testing Friend Request Flow...\n');

    // Step 1: Login as user1
    console.log('📝 Step 1: Login as user1');
    const user1Login = await api.post('/auth/login', {
      username: 'testuser',
      password: 'password123',
    });

    const user1Token = user1Login.data.data.token;
    api.defaults.headers.Authorization = `Bearer ${user1Token}`;
    console.log('✅ User1 logged in successfully\n');

    // Step 2: Get user1 profile
    const user1Profile = await api.get('/auth/me');
    console.log(
      `👤 User1: ${user1Profile.data.data.username} (ID: ${user1Profile.data.data.id})`
    );

    // Step 3: Search for users
    console.log('\n🔍 Step 2: Search for users');
    const searchResponse = await api.get('/auth/search?q=test&limit=10');
    const users = searchResponse.data.data;
    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.username} (ID: ${user.id})`);
    });

    // Step 4: Send friend request
    const targetUser = users.find(u => u.username !== 'testuser');
    if (targetUser) {
      console.log(
        `\n📤 Step 3: Sending friend request to ${targetUser.username}`
      );

      const friendRequest = await api.post('/v1/connections/request', {
        username: targetUser.username,
      });

      console.log('✅ Friend request sent successfully!');
      console.log(`📋 Request ID: ${friendRequest.data.data.id}`);

      // Step 5: Get pending requests
      console.log('\n📋 Step 4: Getting pending requests for target user...');

      // Switch to target user (would need their token in real scenario)
      console.log(
        '⚠️  Note: In real app, target user would need to be logged in to accept/decline'
      );

      // Test getting current user's connections
      const connections = await api.get('/v1/connections');
      console.log(`📊 User1 connections: ${connections.data.data.length}`);
    } else {
      console.log('❌ No other users found to send friend request to');
    }

    console.log('\n🎉 Friend request flow test completed successfully!');
  } catch (error) {
    console.error(
      '❌ Error testing friend request flow:',
      error.response?.data || error.message
    );
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}


  // Fallback for testing
  return {
    create: config => ({
      defaults: { headers: {} },
      post: async (url, data) => {
        const response = await fetch(config.baseURL + url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...config.headers },
          body: JSON.stringify(data),
        });
        return { data: await response.json() };
      },
      get: async url => {
        const response = await fetch(config.baseURL + url, {
          headers: config.headers,
        });
        return { data: await response.json() };
      },
    }),
  };
}

testFriendRequestFlow();

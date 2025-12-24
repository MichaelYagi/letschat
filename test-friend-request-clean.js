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
    const text = await response.text();
    try {
      return { data: JSON.parse(text) };
    } catch (error) {
      console.error(`Response text: ${text.substring(0, 200)}...`);
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  }
}

const api = new ApiClient(API_BASE);

async function testFriendRequestFlow() {
  try {
    console.log('🔄 Testing Friend Request Flow...\n');

    // Step 1: Register test users if they don't exist
    console.log('📝 Step 1: Register test users');
    try {
      await api.post('/v1/auth/register', {
        username: 'testuser',
        password: 'Password123!',
        displayName: 'Test User',
      });
      console.log('✅ User1 registered successfully');
    } catch (error) {
      console.log('ℹ️  User1 already exists or failed:', error.message);
    }

    try {
      await api.post('/v1/auth/register', {
        username: 'testfriend',
        password: 'Password123!',
        displayName: 'Test Friend',
      });
      console.log('✅ User2 registered successfully');
    } catch (error) {
      console.log('ℹ️  User2 already exists or failed:', error.message);
    }

    // Step 2: Login as user1
    console.log('\n📝 Step 2: Login as user1');
    const user1Login = await api.post('/v1/auth/login', {
      username: 'testuser',
      password: 'Password123!',
    });

    const user1Token = user1Login.data.data.token;
    api.setAuth(user1Token);
    console.log('✅ User1 logged in successfully\n');

    // Step 2: Get user1 profile
    const user1Profile = await api.get('/v1/auth/profile');
    console.log(
      `👤 User1: ${user1Profile.data.data.username} (ID: ${user1Profile.data.data.id})`
    );

    // Step 3: Search for users
    console.log('\n🔍 Step 2: Search for users');
    const searchResponse = await api.get('/v1/auth/search?q=test&limit=10');
    console.log(
      'Search response:',
      JSON.stringify(searchResponse.data, null, 2)
    );
    const users = searchResponse.data.data || [];
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
    console.error('❌ Error testing friend request flow:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testFriendRequestFlow();

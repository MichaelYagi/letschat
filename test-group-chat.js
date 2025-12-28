const axios = require('axios');

async function testGroupChat() {
  console.log('🧪 Testing Group Chat Creation...\n');

  const API_BASE = 'http://localhost:3000/api';

  try {
    // First login as test user
    console.log('1. Logging in as test user...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'testing',
      password: 'password123',
    });

    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;

    console.log(`✅ Logged in as user ${userId}`);

    // Set up axios with auth
    const authAxios = axios.create({
      baseURL: API_BASE,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Test creating a group conversation
    console.log('\n2. Creating group conversation...');
    const groupData = {
      type: 'group',
      name: 'Test Group Chat',
      description: 'A test group for verification',
      participantIds: ['27f31f8f-e28d-4c12-89c3-a9aad3ded508'], // testing1 user ID
    };

    const createResponse = await authAxios.post(
      '/messages/conversations',
      groupData
    );

    console.log('✅ Group conversation created successfully!');
    console.log('Conversation ID:', createResponse.data.data.id);
    console.log('Group Name:', createResponse.data.data.name);
    console.log('Type:', createResponse.data.data.type);
    console.log('Description:', createResponse.data.data.description);

    // Test getting conversations to verify group appears
    console.log('\n3. Verifying group appears in conversation list...');
    const conversationsResponse = await authAxios.get(
      '/messages/conversations'
    );

    const groupConversation = conversationsResponse.data.data.find(
      c => c.type === 'group'
    );
    if (groupConversation) {
      console.log('✅ Group conversation found in list!');
      console.log('Group Name:', groupConversation.name);
      console.log('Type:', groupConversation.type);
    } else {
      console.log('❌ Group conversation not found in list');
    }

    console.log('\n🎉 Group chat functionality test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testGroupChat();

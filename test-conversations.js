const axios = require('axios');

async function testAPI() {
  try {
    // Test login as alice
    console.log('Testing login...');
    const loginResponse = await axios.post(
      'http://localhost:3000/api/auth/login',
      {
        username: 'alice',
        password: 'password123',
      }
    );

    const token = loginResponse.data.data.token;
    console.log('Login successful, token:', token ? 'received' : 'missing');

    // Test get conversations
    console.log('\nTesting get conversations...');
    const convResponse = await axios.get(
      'http://localhost:3000/api/messages/conversations',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      'Conversations response:',
      JSON.stringify(convResponse.data, null, 2)
    );

    // Test create conversation
    console.log('\nTesting create conversation...');
    try {
      const createResponse = await axios.post(
        'http://localhost:3000/api/messages/conversations',
        {
          type: 'direct',
          participantIds: ['2'], // bob's ID
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        'Create conversation response:',
        JSON.stringify(createResponse.data, null, 2)
      );
    } catch (createError) {
      console.log(
        'Create conversation error:',
        createError.response?.data || createError.message
      );
    }
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testAPI();

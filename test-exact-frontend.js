const axios = require('axios');

// Simulate exact frontend axios configuration
const api = axios.create({
  baseURL: 'http://localhost:5173/api', // This goes through Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

async function testRegistration() {
  console.log(
    '🧪 Testing frontend registration with exact same configuration...\n'
  );

  try {
    console.log('📤 Sending registration request...');
    const response = await api.post('/auth/register', {
      username: `test_${Date.now()}`,
      password: 'TestPassword123!',
    });

    console.log(
      '✅ Success! Response:',
      JSON.stringify(response.data, null, 2)
    );
    console.log(
      '🔑 Token:',
      response.data.data?.token?.substring(0, 50) + '...'
    );

    // Test login right after
    console.log('\n📤 Testing login immediately after registration...');
    const loginResponse = await api.post('/auth/login', {
      username: response.data.data.user.username,
      password: 'TestPassword123!',
    });

    console.log(
      '✅ Login successful! Response:',
      JSON.stringify(loginResponse.data, null, 2)
    );
  } catch (error) {
    console.log('❌ Error Details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Data:', error.response?.data);
    console.log('Headers:', error.response?.headers);
    console.log('Message:', error.message);

    // Test if it's a network issue
    if (!error.response) {
      console.log('💥 Network Error - checking if servers are running...');
      try {
        const healthCheck = await axios.get('http://localhost:5173');
        console.log('✅ Frontend accessible');
      } catch (e) {
        console.log('❌ Frontend not accessible:', e.message);
      }

      try {
        const backendHealth = await axios.get('http://localhost:3000/health');
        console.log('✅ Backend accessible');
      } catch (e) {
        console.log('❌ Backend not accessible:', e.message);
      }
    }
  }
}

testRegistration();

import axios from 'axios';

const API_BASE = 'http://localhost:3000';

async function testAuthFlow() {
  console.log('=== Testing Auth Flow ===\n');

  const timestamp = Date.now().toString().slice(-6); // Last 6 digits
  const testUser = {
    username: `testuser_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: 'TestPassword123!',
  };

  try {
    // Step 1: Test Registration
    console.log('1. Testing Registration...');
    const regResponse = await axios.post(
      `${API_BASE}/api/auth/register`,
      testUser
    );

    console.log('Registration Response:', {
      status: regResponse.status,
      data: regResponse.data,
    });

    if (regResponse.data.data?.token) {
      console.log('✓ Registration successful, token received');
      console.log('Token length:', regResponse.data.data.token.length);
    } else {
      console.log('✗ Registration failed - no token received');
      console.log(
        'Response structure:',
        JSON.stringify(regResponse.data, null, 2)
      );
      return;
    }

    // Step 2: Test Login with same credentials
    console.log('\n2. Testing Login...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      username: testUser.username,
      password: testUser.password,
    });

    console.log('Login Response:', {
      status: loginResponse.status,
      data: loginResponse.data,
    });

    if (loginResponse.data.data?.token) {
      console.log('✓ Login successful, token received');
      console.log('Token length:', loginResponse.data.data.token.length);

      // Verify tokens match
      if (regResponse.data.data.token === loginResponse.data.data.token) {
        console.log('✓ Registration and login tokens match');
      } else {
        console.log(
          '⚠ Registration and login tokens differ (expected behavior)'
        );
      }
    } else {
      console.log('✗ Login failed - no token received');
      console.log(
        'Response structure:',
        JSON.stringify(loginResponse.data, null, 2)
      );
    }

    console.log('\n✓ Auth flow test completed successfully!');
  } catch (error) {
    console.log('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

testAuthFlow();

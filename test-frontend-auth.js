import axios from 'axios';

const API_BASE = 'http://localhost:3000';

async function testFrontendAuthFlow() {
  console.log('=== Testing Frontend Auth Flow ===\n');

  const testUser = {
    username: `testuser_${Date.now().toString().slice(-6)}`,
    email: `test_${Date.now().toString().slice(-6)}@example.com`,
    password: 'TestPassword123!',
  };

  try {
    // Step 1: Test Registration (same as frontend API call)
    console.log('1. Testing Registration API...');
    const regResponse = await axios.post(
      `${API_BASE}/api/auth/register`,
      testUser
    );

    console.log('Registration Success:', {
      status: regResponse.status,
      hasUser: !!regResponse.data.data?.user,
      hasToken: !!regResponse.data.data?.token,
      username: regResponse.data.data?.user?.username,
      userId: regResponse.data.data?.user?.id,
    });

    // Test the token format that would be stored in localStorage
    const token = regResponse.data.data.token;
    console.log('\n2. Testing Token Format...');
    const tokenParts = token.split('.');
    console.log('Token structure:', {
      hasThreeParts: tokenParts.length === 3,
      headerLength: tokenParts[0].length,
      payloadLength: tokenParts[1].length,
      signatureLength: tokenParts[2].length,
    });

    // Test token decoding (same as AuthContext)
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('Token payload:', {
        id: payload.id,
        username: payload.username,
        iat: payload.iat,
        exp: payload.exp,
      });

      // Test the exact validation logic from AuthContext
      if (payload.id && payload.username) {
        console.log('✅ Token validation would succeed');

        // Simulate localStorage storage
        localStorage.setItem('letschat_token', token);
        console.log('✅ Token stored to localStorage');

        // Test retrieval and validation
        const storedToken = localStorage.getItem('letschat_token');
        if (storedToken && storedToken === token) {
          console.log('✅ Token retrieved successfully from localStorage');
        } else {
          console.log('❌ Token retrieval failed');
        }
      } else {
        console.log('❌ Token validation would fail - missing required fields');
      }
    } catch (decodeError) {
      console.log('❌ Token decode failed:', decodeError.message);
    }

    // Step 3: Test Login (same as frontend API call)
    console.log('\n3. Testing Login API...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      username: testUser.username,
      password: testUser.password,
    });

    console.log('Login Success:', {
      status: loginResponse.status,
      hasUser: !!loginResponse.data.data?.user,
      hasToken: !!loginResponse.data.data?.token,
      username: loginResponse.data.data?.user?.username,
      userId: loginResponse.data.data?.user?.id,
      sameUser: loginResponse.data.data?.user?.username === testUser.username,
    });

    console.log('\n✅ Frontend auth flow test completed successfully!');
  } catch (error) {
    console.log('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

testFrontendAuthFlow();

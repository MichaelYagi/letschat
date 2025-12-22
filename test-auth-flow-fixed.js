const axios = require('axios');

async function testAuthFlow() {
  console.log('🔐 Testing Authentication Flow');
  console.log('==================================');

  try {
    // Test 1: Register with strong password
    console.log('\n📍 Test 1: User Registration');
    const registerData = {
      username: 'testuser789',
      email: 'test789@example.com',
      password: 'Password123!',
    };

    try {
      const registerResponse = await axios.post(
        'http://localhost:5173/api/auth/register',
        registerData,
        {
          validateStatus: status => status < 500,
        }
      );

      if (registerResponse.status === 201) {
        console.log('✅ Registration successful');
        console.log('Response data:', registerResponse.data.data);
        console.log('User data:', registerResponse.data.data?.user);
        console.log('Token received:', !!registerResponse.data.data?.token);

        // Test 2: Login with same user
        console.log('\n📍 Test 2: User Login');
        const loginResponse = await axios.post(
          'http://localhost:5173/api/auth/login',
          {
            username: 'testuser789',
            password: 'Password123!',
          },
          {
            validateStatus: status => status < 500,
          }
        );

        if (loginResponse.status === 200) {
          console.log('✅ Login successful');
          console.log('Response data:', loginResponse.data.data);
          console.log('User data:', loginResponse.data.data?.user);
          console.log('Token received:', !!loginResponse.data.data?.token);

          // Test 3: Access protected route with token
          console.log('\n📍 Test 3: Protected Route Access');
          const token = loginResponse.data.data?.token;

          if (token) {
            try {
              const profileResponse = await axios.get(
                'http://localhost:3000/api/v1/users/profile',
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  validateStatus: status => status < 500,
                }
              );
              console.log('✅ Profile access:', profileResponse.status);
              console.log('Profile data:', profileResponse.data);
            } catch (error) {
              console.log(
                '⚠️  Profile endpoint may not exist:',
                error.response?.status
              );
            }
          } else {
            console.log('❌ No token received from login');
          }
        } else {
          console.log('❌ Login failed:', loginResponse.status);
          console.log('Response:', loginResponse.data);
        }
      } else {
        console.log('❌ Registration failed:', registerResponse.status);
        console.log('Response:', registerResponse.data);
      }
    } catch (error) {
      console.log('❌ Auth flow error:', error.response?.data || error.message);
    }

    console.log('\n📊 Authentication Flow Test Complete');
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
  }
}

testAuthFlow();

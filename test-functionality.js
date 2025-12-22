const axios = require('axios');

async function testFrontendFunctionality() {
  console.log('🧪 Testing Frontend Functionality');
  console.log('=====================================');

  try {
    // Test 1: Check frontend accessibility
    console.log('\n📍 Test 1: Frontend Accessibility');
    const frontendResponse = await axios.get('http://localhost:5173', {
      validateStatus: status => status < 500,
    });
    console.log('✅ Frontend accessible:', frontendResponse.status);

    // Test 2: Test API proxy through frontend
    console.log('\n📍 Test 2: API Proxy Test');
    try {
      const registerResponse = await axios.post(
        'http://localhost:5173/api/auth/register',
        {
          username: 'testuser123',
          email: 'test123@example.com',
          password: 'password123',
        },
        {
          validateStatus: status => status < 500,
        }
      );

      console.log('✅ Register API proxy working:', registerResponse.status);
      console.log('Response:', registerResponse.data);
    } catch (error) {
      console.log('❌ Register API proxy failed:', error.message);
    }

    // Test 3: Test login API
    console.log('\n📍 Test 3: Login API Test');
    try {
      const loginResponse = await axios.post(
        'http://localhost:5173/api/auth/login',
        {
          username: 'testuser123',
          password: 'password123',
        },
        {
          validateStatus: status => status < 500,
        }
      );

      console.log('✅ Login API proxy working:', loginResponse.status);
      console.log('Response:', loginResponse.data);
    } catch (error) {
      console.log('❌ Login API proxy failed:', error.message);
    }

    // Test 4: Test backend directly
    console.log('\n📍 Test 4: Direct Backend Test');
    try {
      const backendResponse = await axios.get('http://localhost:3000/health');
      console.log('✅ Backend health check:', backendResponse.status);
      console.log('Response:', backendResponse.data);
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
    }

    // Test 5: Test auth endpoints directly on backend
    console.log('\n📍 Test 5: Backend Auth Endpoints');
    try {
      const directRegister = await axios.post(
        'http://localhost:3000/api/auth/register',
        {
          username: 'directuser',
          email: 'direct@example.com',
          password: 'password123',
        },
        {
          validateStatus: status => status < 500,
        }
      );

      console.log('✅ Direct register working:', directRegister.status);
      console.log('Response data:', directRegister.data);
    } catch (error) {
      console.log('❌ Direct register failed:', error.message);
    }

    console.log('\n📊 Frontend Functionality Test Complete');
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

testFrontendFunctionality();

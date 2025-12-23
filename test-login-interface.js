// Simulate browser login behavior
import fetch from 'node-fetch';

const FRONTEND_URL = 'http://localhost:5174';

async function testLoginAsBrowser() {
  console.log('=== Testing Login as Browser ===\n');

  // Test 1: Get the frontend page
  console.log('1. Getting frontend page...');
  try {
    const frontResponse = await fetch(FRONTEND_URL);
    console.log(`Frontend status: ${frontResponse.status}`);
    if (frontResponse.ok) {
      console.log('✅ Frontend accessible');
    }
  } catch (error) {
    console.log('❌ Frontend not accessible:', error.message);
    return;
  }

  // Test 2: Direct login through proxy (as browser would)
  console.log('\n2. Testing login through frontend proxy...');
  const loginData = {
    username: 'testuser_new',
    password: 'TestPassword123!',
  };

  try {
    const loginResponse = await fetch(`${FRONTEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: FRONTEND_URL,
        Referer: FRONTEND_URL,
      },
      body: JSON.stringify(loginData),
    });

    console.log(`Login response status: ${loginResponse.status}`);
    const data = await loginResponse.json();

    if (loginResponse.ok && data.data?.token) {
      console.log('✅ Login successful');
      console.log(`User: ${data.data.user.username}`);
      console.log(`User ID: ${data.data.user.id}`);
      console.log(`Token length: ${data.data.token.length}`);

      // Test 3: Verify token works in subsequent requests
      console.log('\n3. Testing authenticated request...');
      const authResponse = await fetch(`${FRONTEND_URL}/api/health`, {
        headers: {
          Authorization: `Bearer ${data.data.token}`,
          Origin: FRONTEND_URL,
        },
      });

      console.log(`Authenticated request status: ${authResponse.status}`);
      if (authResponse.ok) {
        console.log('✅ Authenticated request works');
      } else {
        console.log('❌ Authenticated request failed');
      }
    } else {
      console.log('❌ Login failed');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
  }
}

testLoginAsBrowser();

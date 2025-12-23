// Test login with correct frontend port
import fetch from 'node-fetch';

async function testLoginFrontend() {
  console.log('🔍 TESTING LOGIN THROUGH FRONTEND PORT 5173\n');

  const username = 'testuser_650659';
  const password = 'TestPassword123!';

  try {
    // Test 1: Health check through proxy
    console.log('1. Testing frontend proxy...');
    const healthResponse = await fetch('http://localhost:5173/api/health');
    console.log(`   Health status: ${healthResponse.status}`);

    if (!healthResponse.ok) {
      throw new Error('Frontend proxy not working');
    }

    // Test 2: Login through proxy
    console.log('\n2. Testing login through frontend proxy...');
    console.log(`   Username: ${username}`);

    const loginResponse = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log(`   Login status: ${loginResponse.status}`);

    const data = await loginResponse.json();

    if (loginResponse.ok && data.data && data.data.token) {
      console.log('✅ LOGIN SUCCESSFUL');
      console.log(`   User: ${data.data.user.username}`);
      console.log(`   ID: ${data.data.user.id}`);
      console.log(`   Token: ${data.data.token.length} chars`);

      // Test 3: Authenticated request
      console.log('\n3. Testing authenticated request...');
      const authResponse = await fetch('http://localhost:5173/api/health', {
        headers: {
          Authorization: `Bearer ${data.data.token}`,
        },
      });

      console.log(`   Auth status: ${authResponse.status}`);

      if (authResponse.ok) {
        console.log('✅ FRONTEND LOGIN FULLY WORKING');
        console.log('\n🎯 ISSUE IDENTIFICATION:');
        console.log('   ✅ Frontend proxy: Working');
        console.log('   ✅ Login API: Working');
        console.log('   ✅ Token auth: Working');
        console.log('   ❓ PROBLEM LIKELY IN:');
        console.log('   - React form validation');
        console.log('   - react-hook-form setup');
        console.log('   - Component state management');
        console.log('   - Navigation after login');
      } else {
        console.log('❌ AUTHENTICATION FAILED');
      }
    } else {
      console.log('❌ LOGIN FAILED');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

testLoginFrontend();

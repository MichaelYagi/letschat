// Test the exact same flow as React app but with better logging
import fetch from 'node-fetch';

async function testExactFlow() {
  console.log('🔍 TESTING EXACT REACT APP FLOW\n');

  const username = 'testuser_650659';
  const password = 'TestPassword123!';

  try {
    // Test 1: Basic connectivity test
    console.log('1. Testing basic connectivity...');
    const healthResponse = await fetch('http://localhost:5173/api/health');
    console.log(`   Health check: ${healthResponse.status}`);

    // Test 2: Exact same headers and body as browser
    console.log('\n2. Testing login with exact browser simulation...');
    const loginResponse = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log(`   Login status: ${loginResponse.status}`);
    console.log(`   Login ok: ${loginResponse.ok}`);

    const data = await loginResponse.json();
    console.log('   Response data:', JSON.stringify(data, null, 2));

    if (loginResponse.ok && data.data && data.data.token) {
      console.log('✅ LOGIN SUCCESSFUL');
      console.log(`   Username: ${data.data.user.username}`);
      console.log(`   User ID: ${data.data.user.id}`);
      console.log(`   Token: ${data.data.token.substring(0, 50)}...`);

      // Test 3: Try accessing protected route like app would after login
      console.log('\n3. Testing access to protected route...');
      const authResponse = await fetch('http://localhost:5174/api/health', {
        headers: {
          Authorization: `Bearer ${data.data.token}`,
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      console.log(`   Authenticated request: ${authResponse.status}`);
      console.log(`   Authenticated ok: ${authResponse.ok}`);

      if (authResponse.ok) {
        console.log('✅ AUTHENTICATION WORKING');
        console.log('\n🎯 ISSUE MIGHT BE IN FRONTEND NAVIGATION');
        console.log('   Backend is working correctly');
        console.log('   Login API is working');
        console.log('   Token authentication is working');
        console.log('   Problem might be:');
        console.log('   - React form validation blocking submission');
        console.log('   - react-hook-form configuration issue');
        console.log('   - Navigation redirect not working');
        console.log('   - localStorage access issue');
      } else {
        console.log('❌ AUTHENTICATION FAILED');
      }
    } else {
      console.log('❌ LOGIN FAILED');
      console.log('   Possible issues:');
      console.log('   - Network connectivity');
      console.log('   - CORS issues');
      console.log('   - Backend server down');
      console.log('   - Request format mismatch');
    }
  } catch (error) {
    console.log('❌ TEST ERROR:', error.message);
    console.log('   Stack:', error.stack);
  }
}

testExactFlow();

// Test the exact React application URL and behavior
const { default: fetch } = require('node-fetch');

async function testReactApp() {
  console.log('🔍 TESTING ACTUAL REACT APPLICATION\n');

  const username = 'testuser_650659';
  const password = 'TestPassword123!';

  try {
    // Step 1: Check if React app is accessible
    console.log('1. Testing React app accessibility...');
    const reactResponse = await fetch('http://localhost:5173/', {
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    console.log(`   React app status: ${reactResponse.status}`);
    if (!reactResponse.ok) {
      throw new Error('React app not accessible');
    }

    // Step 2: Check if the login route is accessible
    console.log('\n2. Testing login page route...');
    const loginPageResponse = await fetch('http://localhost:5173/login', {
      headers: {
        Accept: 'text/html',
        Referer: 'http://localhost:5173/',
      },
    });

    console.log(`   Login page status: ${loginPageResponse.status}`);
    if (!loginPageResponse.ok) {
      console.log('   ⚠️ Login page not directly accessible, trying via root');
    }

    // Step 3: Test the login API that React app uses
    console.log('\n3. Testing login API as React app calls it...');

    // This simulates exactly what the LoginForm component does
    const loginResponse = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: 'http://localhost:5173',
        Referer: 'http://localhost:5173/login',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log(`   Login API status: ${loginResponse.status}`);
    console.log(`   Login OK: ${loginResponse.ok}`);

    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('   Response data structure:', JSON.stringify(data, null, 2));

      if (data.success && data.data && data.data.token && data.data.user) {
        console.log('✅ LOGIN API CALL SUCCESSFUL');
        console.log(`   Username: ${data.data.user.username}`);
        console.log(`   User ID: ${data.data.user.id}`);
        console.log(`   Token length: ${data.data.token.length}`);

        // Step 4: Test if React app state would update correctly
        console.log('\n4. Simulating React app state update...');

        // This simulates what happens in AuthContext after successful login
        const token = data.data.token;
        const user = data.data.user;

        // Test if localStorage can be set (React app behavior)
        try {
          localStorage.setItem('letschat_token', token);
          localStorage.setItem('letschat_user', JSON.stringify(user));
          console.log('✅ LocalStorage update successful');

          // Test if token can be retrieved (AuthContext init behavior)
          const storedToken = localStorage.getItem('letschat_token');
          const storedUser = localStorage.getItem('letschat_user');

          if (storedToken === token && storedUser) {
            console.log('✅ AuthContext would receive valid data');

            // Step 5: Test navigation protection (what happens after login)
            console.log('\n5. Testing React app route protection...');

            // Test if the app would redirect correctly
            const mainPageResponse = await fetch('http://localhost:5173/', {
              headers: {
                Cookie: 'letschat_token=' + token,
              },
            });

            console.log(`   Main page access: ${mainPageResponse.status}`);

            // Step 6: Test authenticated API calls (post-login behavior)
            console.log('\n6. Testing authenticated API calls...');
            const authResponse = await fetch(
              'http://localhost:5173/api/health',
              {
                headers: {
                  Authorization: 'Bearer ' + token,
                  'Content-Type': 'application/json',
                },
              }
            );

            console.log(`   Authenticated API status: ${authResponse.status}`);

            if (authResponse.ok) {
              console.log('✅ REACT APP LOGIN FLOW COMPLETE');
              console.log('\n🎯 ISSUE ANALYSIS:');
              console.log(
                '   If login still not working in browser, possible causes:'
              );
              console.log(
                '   1. React Hook Form validation blocking submission'
              );
              console.log('   2. Component state not updating after login');
              console.log('   3. Router navigation not working');
              console.log('   4. Browser localStorage/security restrictions');
              console.log('   5. CORS or cookie issues');
              console.log(
                '   6. Authentication token not being passed to subsequent requests'
              );
            } else {
              console.log('❌ Authenticated API calls failing');
            }
          } else {
            console.log('❌ LocalStorage retrieval failed');
          }
        } catch (storageError) {
          console.log('❌ LocalStorage error:', storageError.message);
        }
      } else {
        console.log('❌ LOGIN API RETURNED INVALID STRUCTURE');
        console.log('   Expected: {success: true, data: {user, token}}');
        console.log('   Actual:', JSON.stringify(data, null, 2));
      }
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ LOGIN API FAILED');
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Response: ${errorText}`);
    }
  } catch (error) {
    console.log('❌ REACT APP TEST ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

testReactApp();

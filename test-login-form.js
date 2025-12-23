// Simulate the LoginForm component behavior
async function simulateLogin(username, password) {
  console.log(`   🔑 Simulating login for: ${username}`);

  try {
    // This simulates the exact API call from LoginForm component
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok && data.success && data.data && data.data.token) {
      console.log('   ✅ Login API successful');
      console.log(`   Username: ${data.data.user.username}`);
      console.log(`   User ID: ${data.data.user.id}`);

      // Simulate localStorage operations
      try {
        localStorage.setItem('letschat_token', data.data.token);
        localStorage.setItem('letschat_user', JSON.stringify(data.data.user));
        console.log('   ✅ LocalStorage operations successful');
        console.log(`   Token length: ${data.data.token.length}`);

        return {
          success: true,
          hasToken: true,
          hasUserData: true,
          localStorageSet: true,
        };
      } catch (storageError) {
        console.log(`   ❌ LocalStorage error: ${storageError.message}`);
        return {
          success: false,
          error: 'LocalStorage failed',
          localStorageSet: false,
        };
      }
    } else {
      const errorMsg = data.error || 'Login failed';
      console.log(`   ❌ Login failed: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
        hasToken: false,
        hasUserData: false,
      };
    }
  } catch (error) {
    console.log(`   ❌ Login exception: ${error.message}`);
    return {
      success: false,
      error: error.message,
      hasToken: false,
      hasUserData: false,
    };
  }
}

module.exports = { simulateLogin };

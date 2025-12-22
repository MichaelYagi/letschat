// Test the exact API call the frontend makes
const testRegistration = async () => {
  try {
    console.log('Testing registration...');

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser999',
        password: 'Test123!',
      }),
    });

    console.log('Response status:', response.status);
    console.log(
      'Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      console.error('Registration failed:', data.error);
    } else {
      console.log('Registration successful:', data);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Auto-run test
testRegistration();

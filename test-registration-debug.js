// Test exact frontend registration flow
async function testFrontendRegistration() {
  console.log('🧪 Testing frontend registration flow...\n');

  try {
    // Test the exact request the frontend makes
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: `test_${Date.now()}`,
        password: 'TestPassword123!',
      }),
    });

    console.log('📡 Response status:', response.status);
    console.log(
      '📋 Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    const data = await response.text();
    console.log('📄 Response body:', data);

    try {
      const jsonData = JSON.parse(data);
      console.log('✅ Parsed JSON:', jsonData);
    } catch (e) {
      console.log('❌ Failed to parse JSON:', e.message);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Test both direct and proxied
console.log('1️⃣ Testing from frontend (via Vite proxy):');
await testFrontendRegistration();

console.log('\n2️⃣ Testing direct to backend:');
try {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: `direct_test_${Date.now()}`,
      password: 'TestPassword123!',
    }),
  });

  console.log('📡 Direct response status:', response.status);
  const data = await response.text();
  console.log('📄 Direct response body:', data);
} catch (error) {
  console.error('❌ Direct request failed:', error);
}

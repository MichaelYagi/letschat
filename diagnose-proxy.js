// Test direct vs proxied requests to identify the issue
const { default: fetch } = require('node-fetch');

async function testProxyIssue() {
  console.log('🔍 DIAGNOSING PROXY ISSUE\n');

  const username = 'testuser_650659';
  const password = 'TestPassword123!';
  const requestBody = JSON.stringify({ username, password });

  try {
    // Test 1: Direct request to backend (should work)
    console.log('1. Testing direct backend request...');
    const directResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Host: 'localhost:3000',
      },
      body: requestBody,
    });

    console.log(`   Direct status: ${directResponse.status}`);
    const directData = await directResponse.json();
    console.log(`   Direct success: ${directData.success ? 'YES' : 'NO'}`);

    // Test 2: Proxied request (currently failing)
    console.log('\n2. Testing proxied request...');
    const proxyResponse = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Host: 'localhost:5173',
      },
      body: requestBody,
    });

    console.log(`   Proxy status: ${proxyResponse.status}`);

    let proxyData;
    try {
      proxyData = await proxyResponse.json();
      console.log(`   Proxy success: ${proxyData.success ? 'YES' : 'NO'}`);

      if (proxyResponse.status >= 500) {
        console.log('❌ PROXY RETURNING 500+ ERROR');
        console.log('   Proxy response body:');
        console.log(JSON.stringify(proxyData, null, 2));
      }
    } catch (parseError) {
      const responseText = await proxyResponse.text();
      console.log('❌ PROXY RESPONSE NOT VALID JSON');
      console.log(`   Status: ${proxyResponse.status}`);
      console.log(`   Response text: ${responseText}`);
    }

    // Test 3: Check health endpoints
    console.log('\n3. Testing health endpoints...');

    try {
      const directHealth = await fetch('http://localhost:3000/health');
      console.log(`   Direct health: ${directHealth.status}`);
    } catch (e) {
      console.log(`   Direct health error: ${e.message}`);
    }

    try {
      const proxyHealth = await fetch('http://localhost:5173/api/health');
      console.log(`   Proxy health: ${proxyHealth.status}`);
    } catch (e) {
      console.log(`   Proxy health error: ${e.message}`);
    }

    console.log('\n🎯 ANALYSIS:');
    if (directData.success && !proxyData.success) {
      console.log('❌ PROXY IS CORRUPTING REQUESTS');
      console.log('   Backend works directly');
      console.log('   Proxy fails');
      console.log('   Issue likely in Vite proxy configuration');
    } else if (directData.success && proxyData.success) {
      console.log('✅ BOTH DIRECT AND PROXY WORKING');
      console.log('   Issue might be in React app');
    } else {
      console.log('❌ BOTH DIRECT AND PROXY FAILING');
      console.log('   Backend server issue');
    }
  } catch (error) {
    console.log('❌ DIAGNOSTIC ERROR:', error.message);
  }
}

testProxyIssue();

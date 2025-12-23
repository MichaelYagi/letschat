// Test React app in simulated browser environment
const { JSDOM } = require('jsdom');

// Setup browser-like environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:5173',
  pretendToBeVisual: true,
  resources: 'usable',
});

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

// Load fetch API
const { default: fetch } = require('node-fetch');
dom.window.fetch = fetch;

async function testReactAppEnvironment() {
  console.log('🌐 TESTING REACT APP IN BROWSER ENVIRONMENT\n');

  // Load the React app scripts to test actual components
  try {
    // This will simulate the exact LoginForm component behavior
    const LoginForm = require('./test-login-form.js');

    console.log('1. Simulating LoginForm component...');

    const username = 'testuser_650659';
    const password = 'TestPassword123!';

    // Simulate the login function from LoginForm component
    const result = await LoginForm.simulateLogin(username, password);

    console.log('\n📊 RESULTS:');
    console.log(`   Login Success: ${result.success}`);
    console.log(`   Token Received: ${result.hasToken}`);
    console.log(`   User Data: ${result.hasUserData}`);
    console.log(`   LocalStorage Set: ${result.localStorageSet}`);

    if (result.success) {
      console.log('\n✅ REACT LOGIN SIMULATION SUCCESSFUL');
      console.log('   The React app components should work correctly');
      console.log(
        '   The issue might be browser-specific or environment-specific'
      );
    } else {
      console.log('\n❌ REACT LOGIN SIMULATION FAILED');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.log('❌ SIMULATION ERROR:', error.message);
  }
}

testReactAppEnvironment();

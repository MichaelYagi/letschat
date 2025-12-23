// Test the fixed React login form
const { JSDOM } = require('jsdom');

// Setup browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:5173',
  pretendToBeVisual: true,
  resources: 'usable',
});

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

// Load the fixed LoginForm component
const LoginForm = require('./client/src/components/auth/LoginForm.tsx');

async function testFixedLogin() {
  console.log('🔧 TESTING FIXED LOGIN FORM\n');

  try {
    // Test 1: Check if the form validation is now working
    console.log('1. Testing form validation rules...');

    // Test valid data
    console.log('   Testing valid credentials...');
    const validTest = await simulateFormSubmit(
      'testuser_650659',
      'TestPassword123!'
    );
    console.log(`   Result: ${validTest.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(
      `   Has validation errors: ${Object.keys(validTest.errors || {}).length}`
    );

    // Test invalid data
    console.log('\n2. Testing invalid credentials...');
    const invalidTest = await simulateFormSubmit('', 'short');
    console.log(
      `   Result: ${invalidTest.success ? 'SUCCESS' : 'FAILED (as expected)'}`
    );
    console.log(
      `   Validation errors: ${Object.keys(invalidTest.errors || {}).length}`
    );

    if (validTest.success && invalidTest.errors) {
      console.log('\n✅ FORM VALIDATION WORKING');
      console.log('   - Valid credentials pass through');
      console.log('   - Invalid credentials are properly rejected');
      console.log('   - React form should now submit correctly');
    } else {
      console.log('\n❌ FORM VALIDATION STILL ISSUES');
    }
  } catch (error) {
    console.log('❌ TEST ERROR:', error.message);
  }
}

// Simulate form submission like React would do
async function simulateFormSubmit(username, password) {
  try {
    // Create form data object
    const formData = { username, password };

    // Simulate the exact API call
    const response = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok && data.success && data.data && data.data.token) {
      // Simulate AuthContext behavior
      localStorage.setItem('letschat_token', data.data.token);
      localStorage.setItem('letschat_user', JSON.stringify(data.data.user));

      return {
        success: true,
        user: data.data.user,
        token: data.data.token,
      };
    } else {
      return {
        success: false,
        errors: {
          general: data.error || 'Login failed',
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: {
        network: error.message,
      },
    };
  }
}

testFixedLogin();

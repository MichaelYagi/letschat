// Test both direct and proxy connections
import axios from 'axios';

const PROXY_URL = 'http://localhost:5174/api';
const DIRECT_URL = 'http://localhost:3000/api';

async function testBothConnections() {
  const testUser = {
    username: 'testuser_new',
    password: 'TestPassword123!',
  };

  console.log('=== Testing Both Connection Methods ===\n');

  // Test 1: Direct connection to backend
  console.log('1. Testing direct connection to backend...');
  try {
    const response = await axios.post(`${DIRECT_URL}/auth/login`, testUser);
    console.log('✅ Direct connection SUCCESS:', response.status);
  } catch (error) {
    console.log('❌ Direct connection FAILED:', error.code, error.message);
  }

  // Test 2: Proxy connection through frontend
  console.log('\n2. Testing proxy connection through frontend...');
  try {
    const response = await axios.post(`${PROXY_URL}/auth/login`, testUser);
    console.log('✅ Proxy connection SUCCESS:', response.status);
  } catch (error) {
    console.log(
      '❌ Proxy connection FAILED:',
      error.response?.status,
      error.message
    );
  }

  // Test 3: Backend health
  console.log('\n3. Testing backend health...');
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✅ Backend health SUCCESS:', response.status);
  } catch (error) {
    console.log('❌ Backend health FAILED:', error.code, error.message);
  }

  // Test 4: Frontend health
  console.log('\n4. Testing frontend health...');
  try {
    const response = await axios.get('http://localhost:5174/');
    console.log('✅ Frontend health SUCCESS:', response.status);
  } catch (error) {
    console.log('❌ Frontend health FAILED:', error.code, error.message);
  }
}

testBothConnections();

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Store test results
let testResults = {
  startTime: new Date().toISOString(),
  registration: { success: false, errors: [], userData: null },
  login: { success: false, errors: [], userData: null },
  navigation: { success: false, errors: [] },
  database: { beforeCount: 0, afterCount: 0 },
};

// Import the server to check database
const { checkDatabase } = require('./simple-working-server.js');

async function testFrontendRegistration() {
  console.log('🔍 Testing Frontend Registration...');

  try {
    // Simulate frontend registration request
    const testUser = {
      username: `ui_test_${Date.now()}`,
      password: 'TestPassword123!',
      displayName: 'UI Test User',
    };

    const response = await axios.post(
      'http://localhost:3001/api/auth/register',
      testUser,
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3001',
        },
      }
    );

    if (response.status === 201 && response.data && response.data.user) {
      testResults.registration.success = true;
      testResults.registration.userData = response.data.user;
      console.log('✅ Registration successful:', response.data.user);
    } else {
      testResults.registration.errors.push(
        `HTTP ${response.status}: ${response.data?.error || 'Unknown error'}`
      );
      console.log(
        '❌ Registration failed:',
        response.data?.error || response.statusText
      );
    }
  } catch (error) {
    testResults.registration.errors.push(error.message);
    console.log('❌ Registration network error:', error.message);
  }
}

async function testFrontendLogin() {
  console.log('🔍 Testing Frontend Login...');

  if (!testResults.registration.userData) {
    console.log('❌ Cannot test login - registration failed');
    return;
  }

  try {
    // Simulate frontend login request
    const response = await axios.post(
      'http://localhost:3001/api/auth/login',
      {
        username: testResults.registration.userData.username,
        password: 'TestPassword123!',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3001',
        },
      }
    );

    if (response.status === 200 && response.data && response.data.user) {
      testResults.login.success = true;
      testResults.login.userData = response.data.user;
      console.log('✅ Login successful:', response.data.user);
    } else {
      testResults.login.errors.push(
        `HTTP ${response.status}: ${response.data?.error || 'Unknown error'}`
      );
      console.log(
        '❌ Login failed:',
        response.data?.error || response.statusText
      );
    }
  } catch (error) {
    testResults.login.errors.push(error.message);
    console.log('❌ Login network error:', error.message);
  }
}

async function testDatabaseChanges() {
  console.log('🔍 Verifying Database Changes...');

  // Check database before
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('./data/chat.db');

  const usersBefore = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });

  testResults.database.beforeCount = usersBefore;
  console.log(`Users before test: ${usersBefore}`);

  // Check database after
  const usersAfter = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });

  testResults.database.afterCount = usersAfter;
  console.log(`Users after test: ${usersAfter}`);
  console.log(`New users created: ${usersAfter - usersBefore}`);

  db.close();
}

async function testPageNavigation() {
  console.log('🔍 Testing Page Navigation...');

  try {
    // Test if authenticated page loads after login
    const response = await axios.get('http://localhost:3001/', {
      headers: {
        Origin: 'http://localhost:3001',
      },
    });

    if (response.status === 200) {
      testResults.navigation.success = true;
      console.log('✅ Authenticated page loads successfully');
    } else {
      testResults.navigation.errors.push(
        `HTTP ${response.status}: Page failed to load`
      );
      console.log('❌ Authenticated page failed to load');
    }
  } catch (error) {
    testResults.navigation.errors.push(error.message);
    console.log('❌ Navigation test failed:', error.message);
  }
}

// Run comprehensive test
async function runComprehensiveTest() {
  console.log('🧪 STARTING COMPREHENSIVE FRONTEND TEST');
  console.log('='.repeat(50));

  await testFrontendRegistration();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testFrontendLogin();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testPageNavigation();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testDatabaseChanges();

  console.log('='.repeat(50));
  console.log('🎉 TEST COMPLETE');

  testResults.endTime = new Date().toISOString();
  testResults.duration =
    (new Date(testResults.endTime) - new Date(testResults.startTime)) / 1000;

  console.log('\n📊 FINAL RESULTS:');
  console.log(
    `Registration: ${testResults.registration.success ? '✅ SUCCESS' : '❌ FAILED'}`
  );
  console.log(
    `Login: ${testResults.login.success ? '✅ SUCCESS' : '❌ FAILED'}`
  );
  console.log(
    `Navigation: ${testResults.navigation.success ? '✅ SUCCESS' : '❌ FAILED'}`
  );
  console.log(
    `Database: ${testResults.database.afterCount > testResults.database.beforeCount ? '✅ USERS ADDED' : '❌ NO CHANGES'}`
  );

  if (testResults.registration.errors.length > 0) {
    console.log('Registration Errors:', testResults.registration.errors);
  }

  if (testResults.login.errors.length > 0) {
    console.log('Login Errors:', testResults.login.errors);
  }

  if (testResults.navigation.errors.length > 0) {
    console.log('Navigation Errors:', testResults.navigation.errors);
  }
}

// API endpoints
app.get('/api/comprehensive-test', async (req, res) => {
  await runComprehensiveTest();
  res.json(testResults);
});

app.get('/api/test-summary', (req, res) => {
  res.json({
    message: 'Run comprehensive test at /api/comprehensive-test',
    usage: 'This simulates real user registration/login through frontend API',
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(
    `🧪 Comprehensive Test Server running on http://localhost:${PORT}`
  );
  console.log(`📊 Run: curl http://localhost:${PORT}/api/comprehensive-test`);
  console.log(`📋 Results: curl http://localhost:${PORT}/api/test-summary`);
});

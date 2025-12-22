const express = require('express');
const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('./data/chat.db');

// Test results storage
let testResults = {
  registrationPage: { loaded: false, errors: [] },
  loginPage: { loaded: false, errors: [] },
  authenticatedPage: { loaded: false, errors: [] },
  database: { usersBefore: 0, usersAfter: 0, newUserId: null },
};

app.use(express.json());
app.use(express.static('client'));

// API to get test results
app.get('/api/test-results', (req, res) => {
  res.json(testResults);
});

// API to check database state
app.get('/api/db-check', (req, res) => {
  db.all(
    'SELECT id, username, display_name, status FROM users ORDER BY created_at DESC LIMIT 3',
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ users: rows });
      }
    }
  );
});

async function runFrontendTests() {
  console.log('🧪 Starting comprehensive frontend UI tests...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Capture console errors
  page.on('console', msg => {
    const errorTypes = ['error', 'warning'];
    if (errorTypes.some(type => msg.type().includes(type))) {
      console.log('❌ Frontend Console Error:', msg.text());

      if (
        msg.text().includes('register') ||
        msg.text().includes('RegisterForm')
      ) {
        testResults.registrationPage.errors.push(msg.text());
      } else if (
        msg.text().includes('login') ||
        msg.text().includes('LoginForm')
      ) {
        testResults.loginPage.errors.push(msg.text());
      } else if (
        msg.text().includes('conversation') ||
        msg.text().includes('ChatPage')
      ) {
        testResults.authenticatedPage.errors.push(msg.text());
      }
    }
  });

  try {
    // Get database state before test
    const usersBefore = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    testResults.database.usersBefore = usersBefore;

    console.log(`📊 Database state before test: ${usersBefore} users`);

    // Test 1: Registration page loads
    console.log('🔍 Test 1: Registration page loading...');
    try {
      await page.goto('http://localhost:3001/register', {
        waitUntil: 'networkidle0',
      });
      await page.waitForSelector('form', { timeout: 5000 });

      const pageTitle = await page.title();
      const formExists = await page.$('form');
      const usernameInput = await page.$('input[name="username"]');
      const passwordInput = await page.$('input[name="password"]');
      const displayNameInput = await page.$('input[name="displayName"]');

      if (
        pageTitle.includes("Let's Chat") &&
        formExists &&
        usernameInput &&
        passwordInput &&
        displayNameInput
      ) {
        testResults.registrationPage.loaded = true;
        console.log('✅ Registration page loaded successfully');
      } else {
        testResults.registrationPage.errors.push(
          'Page or form elements not found'
        );
      }
    } catch (error) {
      testResults.registrationPage.errors.push(error.message);
      console.log('❌ Registration page test failed:', error.message);
    }

    // Test 2: Login page loads
    console.log('🔍 Test 2: Login page loading...');
    try {
      await page.goto('http://localhost:3001/login', {
        waitUntil: 'networkidle0',
      });
      await page.waitForSelector('form', { timeout: 5000 });

      const formExists = await page.$('form');
      const inputs = await page.$$('input');

      if (formExists && inputs.length >= 2) {
        testResults.loginPage.loaded = true;
        console.log('✅ Login page loaded successfully');
      } else {
        testResults.loginPage.errors.push('Login form not found');
      }
    } catch (error) {
      testResults.loginPage.errors.push(error.message);
      console.log('❌ Login page test failed:', error.message);
    }

    // Test 3: Registration with real user interaction
    console.log('🔍 Test 3: Real user registration...');
    try {
      await page.goto('http://localhost:3001/register', {
        waitUntil: 'networkidle0',
      });

      // Fill form
      await page.type('input[name="username"]', `test_ui_user_${Date.now()}`);
      await page.type('input[name="password"]', 'TestPassword123!');
      await page.type('input[name="displayName"]', 'UI Test User');

      // Submit form
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
      ]);

      // Check if redirected (indicates success)
      const currentUrl = page.url();
      if (
        currentUrl.includes('localhost:3001/') &&
        !currentUrl.includes('register')
      ) {
        console.log('✅ Registration successful, redirected to main page');

        // Extract user data from localStorage
        const userData = await page.evaluate(() => {
          const token = localStorage.getItem('letschat_token');
          const user = localStorage.getItem('letschat_user');
          return { token, user: user ? JSON.parse(user) : null };
        });

        if (userData.token && userData.user) {
          testResults.database.newUserId = userData.user.id;
          console.log(
            '✅ User data stored in localStorage:',
            userData.user.username
          );
        }
      } else {
        testResults.registrationPage.errors.push(
          'Registration did not redirect properly'
        );
      }
    } catch (error) {
      testResults.registrationPage.errors.push(
        `Registration interaction error: ${error.message}`
      );
      console.log('❌ Registration interaction test failed:', error.message);
    }

    // Test 4: Login with the newly created user
    console.log('🔍 Test 4: Login with created user...');
    try {
      await page.goto('http://localhost:3001/login', {
        waitUntil: 'networkidle0',
      });

      // Fill login form (we need to get the username from registration)
      await page
        .evaluate(() => {
          const user = localStorage.getItem('letschat_user');
          return user ? JSON.parse(user).username : null;
        })
        .then(username => {
          if (username) {
            return page.type('input[name="username"]', username);
          }
        });

      await page.type('input[name="password"]', 'TestPassword123!');

      // Submit login form
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
      ]);

      const loginUrl = page.url();
      if (loginUrl.includes('localhost:3001/') && !loginUrl.includes('login')) {
        console.log('✅ Login successful, redirected to main page');

        // Test authenticated page loading
        await page.waitForSelector('body', { timeout: 5000 });
        const bodyText = await page.evaluate(() => document.body.innerText);

        if (
          bodyText &&
          !bodyText.includes('error') &&
          !bodyText.includes('Error')
        ) {
          testResults.authenticatedPage.loaded = true;
          console.log('✅ Authenticated page loaded successfully');
        } else {
          testResults.authenticatedPage.errors.push(
            'Authenticated page has errors'
          );
        }
      } else {
        testResults.loginPage.errors.push('Login did not redirect properly');
      }
    } catch (error) {
      testResults.loginPage.errors.push(
        `Login interaction error: ${error.message}`
      );
      console.log('❌ Login interaction test failed:', error.message);
    }

    // Get final database state
    const usersAfter = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    testResults.database.usersAfter = usersAfter;

    console.log(`📊 Database state after test: ${usersAfter} users`);
    console.log(`👤 New users created: ${usersAfter - usersBefore}`);
  } catch (error) {
    console.error('❌ Frontend test automation failed:', error);
  } finally {
    await browser.close();
  }

  console.log('🎉 Frontend tests completed!');
  console.log('📋 Test Results:', JSON.stringify(testResults, null, 2));
}

// Start the test
runFrontendTests().catch(console.error);

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 Frontend Test Server running on http://localhost:${PORT}`);
  console.log(`📊 View results at http://localhost:${PORT}/api/test-results`);
  console.log(`🗃️ Database check at http://localhost:${PORT}/api/db-check`);
});

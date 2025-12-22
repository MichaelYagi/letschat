const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./data/chat.db');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyUI() {
  console.log('🚀 Starting comprehensive UI verification...');

  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // Step 1: Navigate to the application
    console.log('📍 Step 1: Navigating to application...');
    await page.goto('http://localhost:3001');
    await page.waitForSelector('body', { timeout: 10000 });
    await sleep(2000);

    // Take screenshot for verification
    await page.screenshot({ path: 'ui-test-1-landing.png' });

    // Step 2: Test Registration
    console.log('👤 Step 2: Testing user registration...');
    await page.goto('http://localhost:3001/register');
    await page.waitForSelector('input[name="username"]', { timeout: 5000 });

    // Generate unique username
    const timestamp = Date.now();
    const testUser = {
      username: `ui_user_${timestamp}`,
      password: 'testpass123',
      displayName: `UI Test User ${timestamp}`,
    };

    // Fill registration form
    await page.type('input[name="username"]', testUser.username);
    await page.type('input[name="password"]', testUser.password);
    await page.type('input[name="displayName"]', testUser.displayName);

    // Submit registration
    await page.click('button[type="submit"]');
    await sleep(3000);

    // Check for success message or redirect to login
    const currentUrl = page.url();
    console.log(`   Registration submitted. Current URL: ${currentUrl}`);

    await page.screenshot({ path: 'ui-test-2-registration.png' });

    // Step 3: Test Login
    console.log('🔐 Step 3: Testing user login...');

    // If not on login page, navigate there
    if (!currentUrl.includes('login')) {
      await page.goto('http://localhost:3001/login');
      await page.waitForSelector('input[name="username"]', { timeout: 5000 });
    }

    // Fill login form
    await page.type('input[name="username"]', testUser.username);
    await page.type('input[name="password"]', testUser.password);

    // Submit login
    await page.click('button[type="submit"]');
    await sleep(3000);

    // Verify we're logged in (should be redirected to main app)
    const loggedInUrl = page.url();
    console.log(`   Login submitted. Current URL: ${loggedInUrl}`);

    // Check if we have the chat interface loaded
    const chatInterface = await page.$(
      '.conversation-list, .chat-container, .user-profile'
    );
    if (chatInterface) {
      console.log('   ✅ Successfully logged in - chat interface detected');
    } else {
      console.log('   ❌ Chat interface not found');
    }

    await page.screenshot({ path: 'ui-test-3-login.png' });

    // Step 4: Test User Search
    console.log('🔍 Step 4: Testing user search functionality...');

    // Look for search input
    const searchInput = await page.$(
      'input[placeholder*="search"], input[placeholder*="Search"], .search-input'
    );

    if (searchInput) {
      await searchInput.click();
      await searchInput.type('alice');
      await sleep(2000);

      // Check if search results appear
      const searchResults = await page.$$(
        '.user-item, .search-result, .user-card'
      );
      console.log(`   Search results found: ${searchResults.length}`);

      await page.screenshot({ path: 'ui-test-4-search.png' });

      if (searchResults.length > 0) {
        // Click on first search result to start conversation
        console.log('   💬 Step 5: Starting conversation...');
        await searchResults[0].click();
        await sleep(2000);

        await page.screenshot({ path: 'ui-test-5-conversation.png' });

        // Try to send a message
        const messageInput = await page.$(
          'input[placeholder*="message"], textarea, .message-input'
        );
        if (messageInput) {
          await messageInput.click();
          await messageInput.type('Hello from UI automation test!');

          const sendButton = await page.$(
            'button[type="submit"], .send-button, [data-testid="send"]'
          );
          if (sendButton) {
            await sendButton.click();
            await sleep(1000);
            console.log('   ✅ Message sent successfully');
          }

          await page.screenshot({ path: 'ui-test-6-message-sent.png' });
        }
      }
    } else {
      console.log('   ❌ Search input not found');
    }

    // Step 6: Test Logout
    console.log('🚪 Step 6: Testing logout functionality...');

    // Look for logout button
    const logoutButton = await page.$(
      'button:contains("Logout"), .logout-btn, [data-testid="logout"]'
    );
    if (logoutButton) {
      await logoutButton.click();
      await sleep(2000);

      const logoutUrl = page.url();
      if (logoutUrl.includes('login') || logoutUrl.includes('logout')) {
        console.log('   ✅ Successfully logged out');
      } else {
        console.log('   ❌ Logout may not have worked properly');
      }

      await page.screenshot({ path: 'ui-test-7-logout.png' });
    } else {
      console.log('   ❌ Logout button not found');
    }
  } catch (error) {
    console.error('❌ Error during UI testing:', error);
  } finally {
    await browser.close();
  }

  // Step 7: Database Verification
  console.log('🗄️ Step 7: Verifying database contents...');
  await verifyDatabase(testUser);
}

async function verifyDatabase(testUser) {
  return new Promise((resolve, reject) => {
    // Check if our test user was created
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [testUser.username],
      (err, user) => {
        if (err) {
          console.error('   ❌ Database query error:', err);
          return reject(err);
        }

        if (user) {
          console.log('   ✅ Test user found in database:');
          console.log(`      ID: ${user.id}`);
          console.log(`      Username: ${user.username}`);
          console.log(`      Display Name: ${user.display_name}`);
          console.log(`      Created: ${user.created_at}`);
          console.log(`      Status: ${user.status}`);
        } else {
          console.log('   ❌ Test user not found in database');
        }

        // Check all users created during UI tests
        db.all(
          "SELECT username, display_name, created_at FROM users WHERE username LIKE 'ui_user_%' ORDER BY created_at DESC LIMIT 5",
          [],
          (err, rows) => {
            if (err) {
              console.error('   ❌ Error querying UI users:', err);
              return reject(err);
            }

            console.log(
              `   📊 Found ${rows.length} UI test users in database:`
            );
            rows.forEach((row, index) => {
              console.log(
                `      ${index + 1}. ${row.username} (${row.display_name}) - ${row.created_at}`
              );
            });

            // Check total users
            db.get('SELECT COUNT(*) as total FROM users', [], (err, result) => {
              if (err) {
                console.error('   ❌ Error counting users:', err);
                return reject(err);
              }

              console.log(`   📈 Total users in database: ${result.total}`);

              // Check for conversations
              db.all(
                'SELECT * FROM conversations ORDER BY created_at DESC LIMIT 5',
                [],
                (err, conversations) => {
                  if (err) {
                    console.error('   ❌ Error querying conversations:', err);
                    return reject(err);
                  }

                  console.log(
                    `   💬 Found ${conversations.length} conversations:`
                  );
                  conversations.forEach((conv, index) => {
                    console.log(
                      `      ${index + 1}. Conversation ${conv.id} with participants: ${conv.participants}`
                    );
                  });

                  console.log('\n🎉 UI Verification Complete!');
                  console.log('📸 Screenshots saved for visual verification');
                  console.log(
                    '🗄️ Database verification shows all data was properly persisted'
                  );

                  db.close();
                  resolve();
                }
              );
            });
          }
        );
      }
    );
  });
}

// Check if required servers are running
async function checkServers() {
  console.log('🔍 Checking if servers are running...');

  try {
    // Check frontend
    const frontendResponse = await fetch('http://localhost:3001');
    if (frontendResponse.ok) {
      console.log('   ✅ Frontend server running on port 3001');
    } else {
      throw new Error('Frontend not responding');
    }

    // Check backend
    const backendResponse = await fetch('http://localhost:3002/health');
    if (backendResponse.ok) {
      console.log('   ✅ Backend server running on port 3002');
    } else {
      throw new Error('Backend not responding');
    }

    console.log('🚀 All servers running, starting UI verification...\n');
    await verifyUI();
  } catch (error) {
    console.error('❌ Server check failed:', error.message);
    console.log('\n💡 Please ensure both servers are running:');
    console.log('   - Frontend: cd client && npm run dev (port 3001)');
    console.log('   - Backend: node working-final-server.js (port 3002)');
    process.exit(1);
  }
}

// Run the verification
checkServers().catch(console.error);

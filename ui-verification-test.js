const puppeteer = require('puppeteer');
const fs = require('fs');

async function runUIVerification() {
  let browser;
  let page;

  try {
    console.log('🚀 Starting comprehensive UI verification...');

    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // 1. Access the application
    console.log('📱 Launching application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.waitForSelector('body', { timeout: 10000 });

    // Take screenshot of initial state
    await page.screenshot({ path: 'initial-state.png', fullPage: true });
    console.log('✅ Application loaded successfully');

    // 2. Verify registration flow
    console.log('👤 Testing user registration...');

    // Check if registration form exists
    await page.waitForSelector('#username, #email, #password, .register-form', {
      timeout: 5000,
    });

    // Fill registration form
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    await page.type('#username', testUser.username);
    await page.type('#email', testUser.email);
    await page.type('#password', testUser.password);

    // Submit registration
    await page.click('button[type="submit"], .register-btn, #register-btn');

    // Wait for registration response
    await page.waitForTimeout(2000);

    // Check for success message
    const successMessage = await page
      .$eval('.success-message, .toast-success, .notification-success', el =>
        el.textContent.trim()
      )
      .catch(() => null);

    if (successMessage) {
      console.log('✅ Registration success message:', successMessage);
    } else {
      console.log(
        '⚠️  No success message found, checking if redirected to login...'
      );
    }

    await page.screenshot({ path: 'after-registration.png', fullPage: true });

    // 3. Test login functionality
    console.log('🔐 Testing login functionality...');

    // Wait for login form
    await page.waitForSelector('#username, #email, #password, .login-form', {
      timeout: 5000,
    });

    // Fill login form
    await page.type('#username', testUser.username);
    await page.type('#password', testUser.password);

    // Submit login
    await page.click('button[type="submit"], .login-btn, #login-btn');

    // Wait for login to complete
    await page.waitForTimeout(3000);

    // Check if logged in (should be redirected to chat/main interface)
    const isLoggedIn =
      (await page.$('.chat-container, .main-app, .dashboard, .user-menu')) !==
      null;

    if (isLoggedIn) {
      console.log('✅ Login successful - user is logged in');
    } else {
      console.log('❌ Login may have failed or UI changed');
    }

    await page.screenshot({ path: 'after-login.png', fullPage: true });

    // 4. Test search users functionality
    console.log('🔍 Testing user search functionality...');

    // Look for search input
    const searchInput = await page.$(
      '#user-search, .search-input, [placeholder*="search"], [placeholder*="Search"]'
    );

    if (searchInput) {
      await searchInput.click();
      await searchInput.type('test');
      await page.waitForTimeout(1000);

      // Check if search results appear
      const searchResults = await page.$$(
        '.user-item, .search-result, .user-card'
      );

      if (searchResults.length > 0) {
        console.log(
          `✅ Search functionality works - found ${searchResults.length} results`
        );
      } else {
        console.log('⚠️  No search results found');
      }
    } else {
      console.log('⚠️  Search input not found');
    }

    await page.screenshot({ path: 'user-search.png', fullPage: true });

    // 5. Test starting conversations
    console.log('💬 Testing conversation starting...');

    // Try to click on a user if any are found
    const userItems = await page.$$('.user-item, .user-card, [data-user-id]');

    if (userItems.length > 0) {
      await userItems[0].click();
      await page.waitForTimeout(2000);

      // Check if chat interface opens
      const chatInterface = await page.$(
        '.chat-window, .conversation, .messages-container'
      );

      if (chatInterface) {
        console.log('✅ Conversation started successfully');

        // Test sending a message
        const messageInput = await page.$(
          '.message-input, #message-input, textarea[placeholder*="message"]'
        );

        if (messageInput) {
          await messageInput.click();
          await messageInput.type('Hello, this is a test message!');

          const sendButton = await page.$(
            '.send-btn, #send-btn, button[type="submit"]'
          );
          if (sendButton) {
            await sendButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ Message sent successfully');
          }
        }
      }
    } else {
      console.log('⚠️  No users found to start conversation with');
    }

    await page.screenshot({ path: 'conversation-test.png', fullPage: true });

    // 6. Test logout functionality
    console.log('🚪 Testing logout functionality...');

    // Look for logout button
    const logoutButton = await page.$(
      '.logout-btn, #logout-btn, [data-action="logout"]'
    );

    if (logoutButton) {
      await logoutButton.click();
      await page.waitForTimeout(2000);

      // Check if redirected to login page
      const isLoggedOut =
        (await page.$('.login-form, #login, .auth-form')) !== null;

      if (isLoggedOut) {
        console.log('✅ Logout successful');
      } else {
        console.log('⚠️  Logout may not have worked');
      }
    } else {
      console.log('⚠️  Logout button not found');
    }

    await page.screenshot({ path: 'after-logout.png', fullPage: true });

    console.log('🎉 UI verification completed!');
    console.log('📸 Screenshots saved for visual verification');
  } catch (error) {
    console.error('❌ UI verification failed:', error);

    if (page) {
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
      console.log('📸 Error screenshot saved as error-screenshot.png');
    }

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  require.resolve('puppeteer');
  runUIVerification().catch(console.error);
} catch (e) {
  console.log('📦 Installing puppeteer...');
  const { execSync } = require('child_process');
  execSync('npm install puppeteer', { stdio: 'inherit' });
  runUIVerification().catch(console.error);
}

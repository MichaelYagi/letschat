const puppeteer = require('puppeteer');

async function testConversationFlow() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    slowMo: 100, // Slow down for visibility
    defaultViewport: { width: 1200, height: 800 },
  });

  try {
    const page = await browser.newPage();

    console.log('🚀 Starting conversation flow test...');

    // Navigate to app
    console.log('📍 Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForSelector('body', { timeout: 10000 });

    // Test Login
    console.log('🔐 Testing login...');
    await page.waitForSelector(
      'input[type="email"], input[name="username"], input[placeholder*="username"]',
      { timeout: 10000 }
    );

    // Fill login form
    const usernameInput = await page.$(
      'input[type="email"], input[name="username"], input[placeholder*="username"]'
    );
    const passwordInput = await page.$('input[type="password"]');

    if (usernameInput && passwordInput) {
      await usernameInput.type('alice');
      await passwordInput.type('password123');

      // Find and click login button
      const loginButton = await page.$(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")'
      );
      if (loginButton) {
        await loginButton.click();
        console.log('✅ Login form submitted');
        await page.waitForTimeout(3000);
      } else {
        console.log('❌ Login button not found');
      }
    } else {
      console.log('❌ Login inputs not found');
    }

    // Check for login success or error
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('🌐 Current URL after login:', currentUrl);

    // Test Conversation List
    console.log('📋 Testing conversation list...');
    try {
      await page.waitForSelector(
        '[data-testid="conversation-list"], .conversation-list, .flex-col',
        { timeout: 10000 }
      );
      console.log('✅ Conversation list loaded');
    } catch (error) {
      console.log('❌ Conversation list not found:', error.message);
    }

    // Test Creating Conversation (if available)
    console.log('🆕 Testing conversation creation...');
    try {
      const newConversationButton = await page.$(
        'button:has-text("New Conversation"), button:has-text("+"), button[aria-label*="conversation"]'
      );
      if (newConversationButton) {
        await newConversationButton.click();
        console.log('✅ New conversation button clicked');
        await page.waitForTimeout(2000);

        // Try to create a direct message
        const usernameField = await page.$(
          'input[placeholder*="username"], input[placeholder*="search"]'
        );
        if (usernameField) {
          await usernameField.type('bob');
          console.log('✅ Username entered in conversation');
        }
      } else {
        console.log('⚠️ No new conversation button found');
      }
    } catch (error) {
      console.log('❌ Conversation creation error:', error.message);
    }

    // Test Message Sending (if conversation exists)
    console.log('💬 Testing message sending...');
    try {
      const messageInput = await page.$(
        'textarea[placeholder*="message"], input[placeholder*="message"], .message-input'
      );
      if (messageInput) {
        await messageInput.type('Test message from automation');
        console.log('✅ Message typed');

        // Try to send message (Enter key or send button)
        await page.keyboard.press('Enter');
        console.log('✅ Message sent (Enter key)');
        await page.waitForTimeout(2000);
      } else {
        console.log('⚠️ No message input found');
      }
    } catch (error) {
      console.log('❌ Message sending error:', error.message);
    }

    // Take screenshot for debugging
    await page.screenshot({
      path: 'conversation-test-screenshot.png',
      fullPage: true,
    });
    console.log('📸 Screenshot saved as conversation-test-screenshot.png');

    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser console error:', msg.text());
      }
    });

    await page.waitForTimeout(5000);
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Check if required packages are available
try {
  require('puppeteer');
  testConversationFlow();
} catch (error) {
  console.log('❌ Puppeteer not available, installing...');
  console.log('Please run: npm install puppeteer');
  console.log('Alternatively, test manually by:');
  console.log('1. Opening http://localhost:5173');
  console.log('2. Login with alice/password123');
  console.log('3. Try to view conversations');
  console.log('4. Try to create new conversation');
  console.log('5. Try to send messages');
}

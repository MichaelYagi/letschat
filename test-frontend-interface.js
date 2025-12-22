const puppeteer = require('puppeteer');

async function testFrontend() {
  console.log('🚀 Starting frontend interface test...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Capture console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      } else if (msg.type() === 'warning') {
        console.log('⚠️  Console Warning:', msg.text());
      }
    });

    // Capture network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ Network Error: ${response.status()} ${response.url()}`);
      }
    });

    console.log('📱 Navigating to frontend...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Check if the page loaded properly
    const title = await page.title();
    console.log('📄 Page title:', title);

    // Check for main app container
    const appElement = await page.$('#root');
    if (appElement) {
      console.log('✅ Root element found');
    } else {
      console.log('❌ Root element not found');
    }

    // Test registration functionality
    console.log('🧪 Testing registration...');

    const usernameInput = await page.$(
      'input[placeholder*="username"], input[name="username"], input[id="username"]'
    );
    const emailInput = await page.$(
      'input[placeholder*="email"], input[name="email"], input[id="email"]'
    );
    const passwordInput = await page.$(
      'input[placeholder*="password"], input[name="password"], input[type="password"]'
    );

    if (usernameInput && emailInput && passwordInput) {
      console.log('✅ Registration form inputs found');

      // Try to fill out the form
      await usernameInput.type('testuser123');
      await emailInput.type('test@example.com');
      await passwordInput.type('password123');

      // Look for submit button
      const submitButton = await page.$(
        'button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")'
      );
      if (submitButton) {
        console.log('✅ Submit button found, clicking...');
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('❌ Registration form not complete');
      console.log('Username input:', !!usernameInput);
      console.log('Email input:', !!emailInput);
      console.log('Password input:', !!passwordInput);
    }

    // Test login functionality
    console.log('🧪 Testing login...');

    // Look for login form elements
    const loginUsernameInput = await page.$(
      'input[placeholder*="username"], input[name="username"], input[id="username"]'
    );
    const loginPasswordInput = await page.$(
      'input[placeholder*="password"], input[name="password"], input[type="password"]'
    );

    if (loginUsernameInput && loginPasswordInput) {
      console.log('✅ Login form inputs found');

      await loginUsernameInput.type('testuser');
      await loginPasswordInput.type('password');

      const loginButton = await page.$(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")'
      );
      if (loginButton) {
        console.log('✅ Login button found, clicking...');
        await loginButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Check page content for any error messages
    const pageText = await page.evaluate(() => document.body.innerText);
    if (
      pageText.includes('error') ||
      pageText.includes('Error') ||
      pageText.includes('failed')
    ) {
      console.log(
        '❌ Error messages found on page:',
        pageText.substring(0, 200)
      );
    }

    console.log('\n📊 Test Results Summary:');
    console.log('- Console Errors:', consoleErrors.length);
    console.log('- Page loaded successfully:', title.length > 0);

    if (consoleErrors.length > 0) {
      console.log('\n❌ Frontend Issues Found:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      return false;
    } else {
      console.log('\n✅ No frontend errors detected!');
      return true;
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testFrontend()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });

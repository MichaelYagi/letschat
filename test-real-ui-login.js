// Real UI login test - simulating actual user behavior
const puppeteer = require('puppeteer');
const { chromium } = require('puppeteer');

async function testRealUILogin() {
  console.log('🎯 REAL UI LOGIN TEST STARTED\n');
  console.log('This will test the actual React application interface...\n');

  let browser;
  let page;

  try {
    console.log('1. Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('2. Opening React application...');
    page = await browser.newPage();

    // Navigate to login page
    await page.goto('http://localhost:5173/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('3. Checking page loaded...');
    const pageTitle = await page.title();
    console.log(`   Page title: ${pageTitle}`);

    // Check if login form exists
    const loginForm = await page.$('#loginForm');
    if (!loginForm) {
      throw new Error('Login form not found');
    }

    console.log('4. Testing login form interaction...');

    // Fill out login form
    const testUsername = 'testuser_650659';
    const testPassword = 'TestPassword123!';

    await page.type('#username', testUsername, { delay: 100 });
    await page.type('#password', testPassword, { delay: 100 });

    console.log(`   Username entered: ${testUsername}`);
    console.log(`   Password entered: ${testPassword}`);

    // Submit the form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForSelector('div[class*="success"]', { timeout: 5000 }),
    ]);

    console.log('5. Checking for success or error...');

    // Wait and check result
    await page.waitForTimeout(2000);

    // Check if redirected (indicates success)
    const currentUrl = page.url();
    console.log(`   Current URL after login: ${currentUrl}`);

    if (currentUrl.includes('/') && !currentUrl.includes('/login')) {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('   User was redirected to main page');

      // Check for success indicators
      const successElements = await page.$$('div[class*="success"]');
      if (successElements.length > 0) {
        console.log('   Found success indicators on page');

        // Test authenticated request to verify session
        const tokenResponse = await page.evaluate(async () => {
          const token = localStorage.getItem('letschat_token');

          if (token) {
            const response = await fetch('/api/health', {
              headers: { Authorization: `Bearer ${token}` },
            });

            return {
              status: response.status,
              ok: response.ok,
              hasToken: !!token,
            };
          }

          return null;
        });

        console.log('   Authenticated API test result:', tokenResponse);
        if (tokenResponse && tokenResponse.ok) {
          console.log('✅ AUTHENTICATED REQUEST WORKS');
        } else {
          console.log('❌ AUTHENTICATED REQUEST FAILED');
        }
      }

      // Check for error indicators
      const errorElements = await page.$$('div[class*="error"]');
      if (errorElements.length > 0) {
        console.log('   Found error indicators');
        const errorText = await page.$eval(() => {
          const errorDiv = document.querySelector('div[class*="error"]');
          return errorDiv ? errorDiv.textContent : 'No error text found';
        });
        console.log(`   Error message: ${errorText}`);
      }
    } else {
      console.log('❌ LOGIN FAILED');

      // Check for error messages
      const errorText = await page.$eval(() => {
        const errorDiv = document.querySelector('div[class*="error"]');
        return errorDiv ? errorDiv.textContent : 'No error message found';
      });
      console.log(`   Error message: ${errorText}`);
    }

    // Check localStorage for token storage
    const tokenInStorage = await page.evaluate(() => {
      return localStorage.getItem('letschat_token');
    });

    if (tokenInStorage) {
      console.log('✅ TOKEN STORED IN LOCALSTORAGE');
      console.log(`   Token length: ${tokenInStorage.length}`);
    } else {
      console.log('❌ NO TOKEN FOUND IN LOCALSTORAGE');
    }
  } catch (error) {
    console.log('❌ BROWSER AUTOMATION ERROR:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testRealUILogin();

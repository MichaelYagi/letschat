import puppeteer from 'puppeteer';

async function testConversationFunctionality() {
  let browser;
  let pages = [];

  try {
    console.log('🚀 Starting conversation functionality test...');

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Create two browser windows to simulate two users
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    pages = [page1, page2];

    // Navigate to test page for both users
    await page1.goto(
      'file:///mnt/c/Users/micha/Documents/Development/letschat/conversation-test.html'
    );
    await page2.goto(
      'file:///mnt/c/Users/micha/Documents/Development/letschat/conversation-test.html'
    );

    // Wait for pages to load
    await page1.waitForSelector('#userSelect', { timeout: 5000 });
    await page2.waitForSelector('#userSelect', { timeout: 5000 });

    console.log('✅ Test pages loaded successfully');

    // Login as testuser1 on page1
    await page1.select('#userSelect', 'testuser1');
    await page1.click('button[onclick="login()"]');
    await page1.waitForTimeout(2000);

    // Check login success for user1
    const loginStatus1 = await page1.$eval(
      '#loginStatus',
      el => el.textContent
    );
    console.log(`User 1 login status: ${loginStatus1}`);

    if (!loginStatus1.includes('Logged in')) {
      throw new Error('User 1 login failed');
    }

    // Login as testuser2 on page2
    await page2.select('#userSelect', 'testuser2');
    await page2.click('button[onclick="login()"]');
    await page2.waitForTimeout(2000);

    // Check login success for user2
    const loginStatus2 = await page2.$eval(
      '#loginStatus',
      el => el.textContent
    );
    console.log(`User 2 login status: ${loginStatus2}`);

    if (!loginStatus2.includes('Logged in')) {
      throw new Error('User 2 login failed');
    }

    console.log('✅ Both users logged in successfully');

    // Wait for WebSocket connections
    await page1.waitForTimeout(3000);
    await page2.waitForTimeout(3000);

    // Check WebSocket connections
    const wsStatus1 = await page1.$eval('#wsStatus', el => el.textContent);
    const wsStatus2 = await page2.$eval('#wsStatus', el => el.textContent);

    console.log(`User 1 WebSocket: ${wsStatus1}`);
    console.log(`User 2 WebSocket: ${wsStatus2}`);

    if (!wsStatus1.includes('Connected') || !wsStatus2.includes('Connected')) {
      throw new Error('WebSocket connections failed');
    }

    console.log('✅ WebSocket connections established');

    // Test 1: Create conversation from user1
    await page1.click('button[onclick="createTestConversation()"]');
    await page1.waitForTimeout(2000);

    // Load conversations for both users
    await page1.click('button[onclick="loadConversations()"]');
    await page2.click('button[onclick="loadConversations()"]');
    await page1.waitForTimeout(1000);
    await page2.waitForTimeout(1000);

    // Check if conversation was created
    const convStatus1 = await page1.$eval(
      '#conversationStatus',
      el => el.textContent
    );
    const convStatus2 = await page2.$eval(
      '#conversationStatus',
      el => el.textContent
    );

    console.log(`User 1 conversations: ${convStatus1}`);
    console.log(`User 2 conversations: ${convStatus2}`);

    // Test 2: Select conversation for both users
    try {
      await page1.evaluate(() => {
        const firstConv = document.querySelector('.conversation-item');
        if (firstConv) firstConv.click();
      });
      await page1.waitForTimeout(1000);

      await page2.evaluate(() => {
        const firstConv = document.querySelector('.conversation-item');
        if (firstConv) firstConv.click();
      });
      await page2.waitForTimeout(1000);

      console.log('✅ Conversation selected successfully');
    } catch (error) {
      console.log('⚠️  Could not select conversation (might be expected)');
    }

    // Test 3: Send message from user1
    await page1.type('#messageInput', 'Hello from user 1!');
    await page1.click('button[onclick="sendMessage()"]');
    await page1.waitForTimeout(2000);

    // Check message status
    const messageStatus1 = await page1.$eval(
      '#messageStatus',
      el => el.textContent
    );
    console.log(`Message sending status: ${messageStatus1}`);

    // Test 4: Check if message appears in both user interfaces
    const messages1 = await page1.$eval('.messages', el => el.textContent);
    const messages2 = await page2.$eval('.messages', el => el.textContent);

    console.log(`User 1 messages: ${messages1.substring(0, 100)}...`);
    console.log(`User 2 messages: ${messages2.substring(0, 100)}...`);

    // Test 5: Send reply from user2
    await page2.type('#messageInput', 'Hello back from user 2!');
    await page2.click('button[onclick="sendMessage()"]');
    await page2.waitForTimeout(2000);

    // Check final message status
    const finalMessages1 = await page1.$eval('.messages', el => el.textContent);
    const finalMessages2 = await page2.$eval('.messages', el => el.textContent);

    console.log(`Final User 1 messages: ${finalMessages1}`);
    console.log(`Final User 2 messages: ${finalMessages2}`);

    // Validate conversation functionality
    const validations = {
      user1Login: loginStatus1.includes('Logged in'),
      user2Login: loginStatus2.includes('Logged in'),
      websockets:
        wsStatus1.includes('Connected') && wsStatus2.includes('Connected'),
      conversationCreated:
        convStatus1.includes('success') || convStatus1.includes('Loaded'),
      messageExchange:
        finalMessages1.includes('Hello from user 1') &&
        finalMessages1.includes('Hello back from user 2') &&
        finalMessages2.includes('Hello from user 1') &&
        finalMessages2.includes('Hello back from user 2'),
    };

    console.log('\n🔍 VALIDATION RESULTS:');
    Object.entries(validations).forEach(([test, passed]) => {
      console.log(
        `${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`
      );
    });

    const allTestsPassed = Object.values(validations).every(v => v);

    if (allTestsPassed) {
      console.log('\n🎉 ALL CONVERSATION FUNCTIONALITY TESTS PASSED!');
      console.log('✅ User authentication works');
      console.log('✅ WebSocket connections work');
      console.log('✅ Conversation creation works');
      console.log('✅ Real-time messaging works');
      console.log('✅ Message synchronization works');
    } else {
      console.log(
        '\n⚠️  SOME TESTS FAILED - CONVERSATION FUNCTIONALITY NEEDS FIXES'
      );
    }

    return allTestsPassed;
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    return false;
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testConversationFunctionality()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });

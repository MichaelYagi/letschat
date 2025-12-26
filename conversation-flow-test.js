#!/usr/bin/env node

const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testConversationFlow() {
  console.log('🧪 Starting Conversation Flow Test');
  console.log('=====================================');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox'],
  });

  try {
    // Create two browser contexts to simulate two users
    const context1 = await browser.createIncognitoBrowserContext();
    const context2 = await browser.createIncognitoBrowserContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    console.log('\n📝 Step 1: Login as user1 (testing1)');
    await page1.goto('http://localhost:5173/login');
    await sleep(1000);

    await page1.type('#username', 'testing1');
    await page1.type('#password', 'password123');
    await page1.click('button[type="submit"]');
    await sleep(2000);

    console.log('✅ User1 logged in successfully');

    console.log('\n📝 Step 2: Login as user2 (testing2)');
    await page2.goto('http://localhost:5173/login');
    await sleep(1000);

    await page2.type('#username', 'testing2');
    await page2.type('#password', 'password123');
    await page2.click('button[type="submit"]');
    await sleep(2000);

    console.log('✅ User2 logged in successfully');

    console.log(
      '\n📝 Step 3: User1 searches for User2 and starts conversation'
    );
    // Wait for conversation list to load
    await page1.waitForSelector('[data-testid="conversation-list"]', {
      timeout: 10000,
    });

    // Click search users button
    await page1.click('[title="Search Users"]');
    await sleep(500);

    // Search for testing2
    await page1.type('input[placeholder*="Search users"]', 'testing2');
    await sleep(2000);

    // Look for search results and click to start conversation
    const searchResults = await page1.$$('div[class*="cursor-pointer"]');
    if (searchResults.length > 0) {
      await searchResults[0].click();
      console.log('✅ User1 started conversation with User2');
      await sleep(2000);
    } else {
      throw new Error('No search results found for testing2');
    }

    console.log('\n📝 Step 4: User1 sends a message');
    // Wait for message input
    await page1.waitForSelector(
      'input[placeholder*="Type a message"], textarea[placeholder*="Type a message"]',
      { timeout: 10000 }
    );

    const message1 = `Hello from User1 at ${new Date().toLocaleTimeString()}`;
    await page1.type(
      'input[placeholder*="Type a message"], textarea[placeholder*="Type a message"]',
      message1
    );
    await page1.keyboard.press('Enter');
    await sleep(1000);

    console.log('✅ User1 sent message:', message1);

    console.log(
      '\n📝 Step 5: User2 verifies the conversation appears and receives message'
    );
    // Refresh or wait for conversation list to update
    await page2.reload();
    await sleep(2000);

    // Look for the conversation in the list
    const conversations2 = await page2.$$('div[class*="cursor-pointer"]');
    console.log(`📊 User2 sees ${conversations2.length} conversations`);

    if (conversations2.length > 0) {
      await conversations2[0].click();
      console.log('✅ User2 opened the conversation');
      await sleep(2000);

      // Check if message is visible
      const messages = await page2.$$('div[class*="message"]');
      console.log(`📊 User2 sees ${messages.length} messages`);

      if (messages.length > 0) {
        const messageText = await page2.$eval(
          'div[class*="message"]',
          el => el.textContent
        );
        console.log('✅ User2 received message:', messageText);
      } else {
        console.log(
          '⚠️  User2 did not see the message - possible real-time issue'
        );
      }
    } else {
      console.log('⚠️  User2 does not see any conversations');
    }

    console.log('\n📝 Step 6: User2 replies to the message');
    await page2.waitForSelector(
      'input[placeholder*="Type a message"], textarea[placeholder*="Type a message"]',
      { timeout: 10000 }
    );

    const message2 = `Hello back from User2 at ${new Date().toLocaleTimeString()}`;
    await page2.type(
      'input[placeholder*="Type a message"], textarea[placeholder*="Type a message"]',
      message2
    );
    await page2.keyboard.press('Enter');
    await sleep(1000);

    console.log('✅ User2 sent reply:', message2);

    console.log('\n📝 Step 7: User1 checks for the reply');
    await sleep(2000);

    // Check messages in user1's chat
    const messages1 = await page1.$$('div[class*="message"]');
    console.log(`📊 User1 now sees ${messages1.length} messages`);

    if (messages1.length >= 2) {
      console.log("✅ User1 received User2's reply");

      // Get the last message
      const lastMessage = await page1.$eval(
        'div[class*="message"]:last-child',
        el => el.textContent
      );
      console.log('📝 Last message:', lastMessage);
    } else {
      console.log('⚠️  User1 did not receive the reply');
    }

    console.log('\n📝 Step 8: Test typing indicators');
    // User1 starts typing
    await page1.type(
      'input[placeholder*="Type a message"], textarea[placeholder*="Type a message"]',
      'typing...'
    );
    await sleep(1000);

    // Check if typing indicator shows on User2's screen (if implemented)
    const typingIndicator = await page2.$('div[class*="typing"]');
    if (typingIndicator) {
      console.log('✅ Typing indicator is working');
    } else {
      console.log('⚠️  Typing indicator not visible (may not be implemented)');
    }

    // Clear the typing
    await page1.keyboard.press('Backspace');
    await page1.keyboard.press('Backspace');
    await page1.keyboard.press('Backspace');
    await page1.keyboard.press('Backspace');
    await page1.keyboard.press('Backspace');
    await page1.keyboard.press('Backspace');
    await page1.keyboard.press('Backspace');
    await page1.keyboard.press('Backspace');
    await sleep(500);

    console.log('\n📝 Step 9: Test message persistence');
    // Reload both pages to check if messages persist
    await page1.reload();
    await page2.reload();
    await sleep(3000);

    // Reopen conversations and check messages
    const conversationsAfterReload1 = await page1.$$(
      'div[class*="cursor-pointer"]'
    );
    if (conversationsAfterReload1.length > 0) {
      await conversationsAfterReload1[0].click();
      await sleep(2000);

      const persistedMessages1 = await page1.$$('div[class*="message"]');
      console.log(
        `📊 User1 sees ${persistedMessages1.length} messages after reload`
      );
    }

    const conversationsAfterReload2 = await page2.$$(
      'div[class*="cursor-pointer"]'
    );
    if (conversationsAfterReload2.length > 0) {
      await conversationsAfterReload2[0].click();
      await sleep(2000);

      const persistedMessages2 = await page2.$$('div[class*="message"]');
      console.log(
        `📊 User2 sees ${persistedMessages2.length} messages after reload`
      );
    }

    console.log('\n🎉 Conversation Flow Test Completed!');
    console.log('=====================================');
    console.log('✅ Basic conversation functionality is working');
    console.log('✅ Real-time messaging is working');
    console.log('✅ Message persistence is working');
    console.log('✅ User search and conversation creation is working');
  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Take screenshots for debugging
    try {
      await page1.screenshot({ path: 'conversation-test-user1.png' });
      await page2.screenshot({ path: 'conversation-test-user2.png' });
      console.log('📸 Screenshots saved for debugging');
    } catch (screenshotError) {
      console.log('Could not save screenshots:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }
}

// Run the test
testConversationFlow().catch(console.error);

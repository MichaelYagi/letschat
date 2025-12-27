#!/usr/bin/env node

/**
 * Test script to verify offline messaging functionality
 * Uses existing conversation and authenticates via HTTP login first
 */

const io = require('socket.io-client');
const axios = require('axios');

// Configuration
const SERVER_URL = 'http://localhost:3000';

// Use existing users from database with sessions
const USER1 = { username: 'testing', password: 'Password123!' };
const USER2 = { username: 'testing1', password: 'Password123!' };

// Conversation ID from database
const CONVERSATION_ID = '67d99f4d-d81d-4623-945e-7d1fe29b4dcb';

let user1Socket = null;
let user2Socket = null;
let user1Token = null;
let user2Token = null;

let testResults = {
  user1LoggedIn: false,
  user2LoggedIn: false,
  user1Connected: false,
  user2Connected: false,
  messageSent: false,
  messageReceived: false,
  deliveryStatusUpdated: false,
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(username, password) {
  try {
    const response = await axios.post(`${SERVER_URL}/api/auth/login`, {
      username,
      password,
    });

    if (response.data && response.data.token) {
      console.log(`✅ ${username} logged in successfully`);
      return response.data.token;
    } else {
      throw new Error('No token in response');
    }
  } catch (error) {
    console.error(
      `❌ ${username} login failed:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

async function testOfflineMessaging() {
  console.log('🧪 Starting offline messaging test...\n');
  console.log(`Conversation ID: ${CONVERSATION_ID}\n`);

  try {
    // Step 1: Login both users via HTTP to get valid tokens
    console.log('1️⃣ Logging in users...');

    try {
      user1Token = await login(USER1.username, USER1.password);
      testResults.user1LoggedIn = true;
    } catch (error) {
      console.log('⚠️  User1 login failed, trying to register...');
      // Try to register if login fails
      await axios.post(`${SERVER_URL}/api/auth/register`, {
        username: USER1.username,
        password: USER1.password,
      });
      user1Token = await login(USER1.username, USER1.password);
      testResults.user1LoggedIn = true;
    }

    try {
      user2Token = await login(USER2.username, USER2.password);
      testResults.user2LoggedIn = true;
    } catch (error) {
      console.log('⚠️  User2 login failed, trying to register...');
      // Try to register if login fails
      await axios.post(`${SERVER_URL}/api/auth/register`, {
        username: USER2.username,
        password: USER2.password,
      });
      user2Token = await login(USER2.username, USER2.password);
      testResults.user2LoggedIn = true;
    }

    // Step 2: Connect user1 (testing) via WebSocket
    console.log('\n2️⃣ Connecting User 1 (testing) via WebSocket...');
    user1Socket = io(SERVER_URL, {
      auth: { token: user1Token },
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('User1 WebSocket connection timeout'));
      }, 5000);

      user1Socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ User 1 WebSocket connected');
        testResults.user1Connected = true;
        resolve();
      });

      user1Socket.on('connect_error', error => {
        clearTimeout(timeout);
        console.error('❌ User1 WebSocket connection error:', error.message);
        reject(error);
      });
    });

    // Step 3: User 1 sends a message to user 2 (who is not yet connected)
    console.log('\n3️⃣ User 1 sending message to conversation...');

    user1Socket.emit('send_message', {
      conversationId: CONVERSATION_ID,
      content:
        'Hello testing1! This message should be delivered when you come online.',
      contentType: 'text',
    });

    user1Socket.on('message_sent', data => {
      console.log('✅ Message sent successfully:', data.messageId);
      testResults.messageSent = true;
    });

    user1Socket.on('error', error => {
      console.log('❌ User1 error:', error);
    });

    await sleep(2000);

    // Step 4: Connect user2 (testing1) - should receive queued messages
    console.log(
      '\n4️⃣ Connecting User 2 (testing1) - should receive missed message...'
    );
    user2Socket = io(SERVER_URL, {
      auth: { token: user2Token },
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('User2 WebSocket connection timeout'));
      }, 5000);

      user2Socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ User 2 WebSocket connected');
        testResults.user2Connected = true;
        resolve();
      });

      user2Socket.on('connect_error', error => {
        clearTimeout(timeout);
        console.error('❌ User2 WebSocket connection error:', error.message);
        reject(error);
      });
    });

    // Set up message listeners for user2
    user2Socket.on('new_message', message => {
      console.log('✅ User 2 received new_message:', message.content);
      testResults.messageReceived = true;
    });

    user2Socket.on('missed_message', message => {
      console.log('✅ User 2 received missed_message:', message.content);
      testResults.messageReceived = true;
    });

    user2Socket.on('delivery_status_updated', data => {
      console.log('✅ Delivery status updated:', data.status);
      testResults.deliveryStatusUpdated = true;
    });

    user2Socket.on('error', error => {
      console.log('❌ User2 error:', error);
    });

    await sleep(3000);

    // Step 5: Results
    console.log('\n📊 Test Results:');
    console.log('================');
    Object.entries(testResults).forEach(([test, passed]) => {
      console.log(
        `${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`
      );
    });

    const allPassed = Object.values(testResults).every(
      result => result === true
    );
    console.log(
      `\n🎯 Overall Result: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`
    );

    if (allPassed) {
      console.log('\n🎉 Offline messaging is working correctly!');
    } else {
      console.log('\n⚠️  Offline messaging needs some fixes.');
      if (!testResults.messageReceived) {
        console.log('   - Messages are not being delivered to offline users');
      }
      if (!testResults.messageSent) {
        console.log('   - Messages are not being sent successfully');
      }
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Cleanup
    if (user1Socket) user1Socket.disconnect();
    if (user2Socket) user2Socket.disconnect();
    console.log('\n🧹 Test completed, sockets disconnected');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${SERVER_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server is not running on http://localhost:3000');
    console.log('Please start the server with: npm run dev:server');
    process.exit(1);
  }

  await testOfflineMessaging();
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testOfflineMessaging };

#!/usr/bin/env node

/**
 * Test script to verify offline messaging functionality
 * This simulates two users - one sends a message while the other is offline,
 * then the offline user comes back online and should receive the message
 */

const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const JWT_SECRET =
  process.env.JWT_SECRET || 'default-secret-key-for-development';

// Real user IDs from database
const USER1_ID = '00f613f7-ee4f-424a-aafa-4739b347c9af'; // testing
const USER2_ID = '41d76971-4b4c-4eec-985f-2f001b2c253e'; // testing1

// Generate valid JWT tokens with correct format
const USER1_TOKEN = jwt.sign(
  { id: USER1_ID, username: 'testing' },
  JWT_SECRET,
  {
    expiresIn: '24h',
    issuer: 'letschat',
    audience: 'letschat-users',
  }
);
const USER2_TOKEN = jwt.sign(
  { id: USER2_ID, username: 'testing1' },
  JWT_SECRET,
  {
    expiresIn: '24h',
    issuer: 'letschat',
    audience: 'letschat-users',
  }
);

let user1Socket = null;
let user2Socket = null;
let testResults = {
  user1Connected: false,
  user2Connected: false,
  messageSent: false,
  messageReceived: false,
  deliveryStatusUpdated: false,
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testOfflineMessaging() {
  console.log('🧪 Starting offline messaging test...\n');
  console.log(`User1 ID: ${USER1_ID} (testing)`);
  console.log(`User2 ID: ${USER2_ID} (testing1)\n`);

  try {
    // Step 1: Connect user1 (testing)
    console.log('1️⃣ Connecting User 1 (testing)...');
    user1Socket = io(SERVER_URL, {
      auth: { token: USER1_TOKEN },
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('User1 connection timeout'));
      }, 5000);

      user1Socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ User 1 connected');
        testResults.user1Connected = true;
        resolve();
      });

      user1Socket.on('connect_error', error => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Step 2: User 1 sends a message to user 2 (who is offline)
    console.log('\n2️⃣ User 1 sending message to User 2 (who is offline)...');

    // First check if there's a conversation or create one
    user1Socket.emit('send_message', {
      conversationId: USER1_ID + '-' + USER2_ID, // Try using user IDs as conversation ID
      content:
        'Hello testing1! This message should be delivered when you come online.',
      contentType: 'text',
    });

    user1Socket.on('message_sent', data => {
      console.log('✅ Message sent successfully:', data.messageId);
      testResults.messageSent = true;
    });

    user1Socket.on('error', error => {
      console.log('❌ Error from server:', error);
    });

    await sleep(2000);

    // Step 3: Connect user2 (testing1) - should receive queued messages
    console.log(
      '\n3️⃣ Connecting User 2 (testing1) - should receive missed message...'
    );
    user2Socket = io(SERVER_URL, {
      auth: { token: USER2_TOKEN },
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('User2 connection timeout'));
      }, 5000);

      user2Socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ User 2 connected');
        testResults.user2Connected = true;
        resolve();
      });

      user2Socket.on('connect_error', error => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    user2Socket.on('new_message', message => {
      console.log('✅ User 2 received message:', message.content);
      testResults.messageReceived = true;
    });

    user2Socket.on('missed_message', message => {
      console.log('✅ User 2 received missed message:', message.content);
      testResults.messageReceived = true;
    });

    user2Socket.on('delivery_status_updated', data => {
      console.log('✅ Delivery status updated:', data.status);
      testResults.deliveryStatusUpdated = true;
    });

    user2Socket.on('error', error => {
      console.log('❌ User 2 error:', error);
    });

    await sleep(3000);

    // Step 4: Results
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
    const http = require('http');
    await new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:3000/health`, res => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Server returned status ${res.statusCode}`));
        }
      });
      req.on('error', reject);
      req.setTimeout(2000, () => reject(new Error('Request timeout')));
    });
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

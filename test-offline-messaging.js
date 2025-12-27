#!/usr/bin/env node

/**
 * Test script to verify offline messaging functionality
 * This simulates two users - one sends a message while the other is offline,
 * then the offline user comes back online and should receive the message
 */

const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const USER1_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxLCJ1c2VybmFtZSI6ImFsaWNlIn0sImlhdCI6MTc2NjgxMjc0NSwiZXhwIjoxNzY2ODk5MTQ1fQ.D4SGT5XXzsNE_dUcghErR8sVEuOMXz1PL45RZKYwZzI'; // Alice's token
const USER2_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjozLCJ1c2VybmFtZSI6ImNoYXJsaWUifSwiaWF0IjoxNzY2ODEyNzQ1LCJleHAiOjE3NjY4OTkxNDV9.8_s64u49idoCEDc_9_Z-r8GqWu7aOgcoxYPRNd2CrHo'; // Charlie's token

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

  try {
    // Step 1: Connect user1 (Alice)
    console.log('1️⃣ Connecting User 1 (Alice)...');
    user1Socket = io(SERVER_URL, {
      auth: { token: USER1_TOKEN },
    });

    await new Promise(resolve => {
      user1Socket.on('connect', () => {
        console.log('✅ User 1 connected');
        testResults.user1Connected = true;
        resolve();
      });
    });

    // Step 2: User 1 sends a message to user 2 (who is offline)
    console.log('\n2️⃣ User 1 sending message to User 2 (who is offline)...');
    user1Socket.emit('send_message', {
      conversationId: '1',
      content:
        'Hello Charlie! This message should be delivered when you come online.',
      contentType: 'text',
    });

    user1Socket.on('message_sent', data => {
      console.log('✅ Message sent successfully:', data.messageId);
      testResults.messageSent = true;
    });

    await sleep(1000);

    // Step 3: Connect user2 (Charlie) - should receive queued messages
    console.log(
      '\n3️⃣ Connecting User 2 (Charlie) - should receive missed message...'
    );
    user2Socket = io(SERVER_URL, {
      auth: { token: USER2_TOKEN },
    });

    user2Socket.on('connect', () => {
      console.log('✅ User 2 connected');
      testResults.user2Connected = true;
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

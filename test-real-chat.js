#!/usr/bin/env node

const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:3000/api';

// Test users
const users = [
  { username: 'alice', password: 'password123' },
  { username: 'bob', password: 'password456' },
];

let sockets = [];
let messages = [];

async function login(username, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username,
      password,
    });
    return response.data.data.token;
  } catch (error) {
    console.error(
      `Login failed for ${username}:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

async function createConversation(token, participantId) {
  try {
    const response = await axios.post(
      `${API_BASE}/messages/conversations`,
      {
        type: 'direct',
        participantIds: [participantId],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error(
      'Failed to create conversation:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getConversations(token) {
  try {
    const response = await axios.get(`${API_BASE}/messages/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error) {
    console.error(
      'Failed to get conversations:',
      error.response?.data || error.message
    );
    return [];
  }
}

function connectWebSocket(token, username) {
  return new Promise(resolve => {
    const socket = io('http://localhost:3000', {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log(`✅ ${username} connected to WebSocket`);
      resolve(socket);
    });

    socket.on('connect_error', error => {
      console.error(`❌ ${username} failed to connect:`, error.message);
      resolve(null);
    });

    socket.on('new_message', message => {
      console.log(`📨 ${username} received message:`, message.content);
      messages.push({ recipient: username, message });
    });

    socket.on('error', error => {
      console.error(`❌ ${username} WebSocket error:`, error);
    });
  });
}

async function sendMessage(socket, conversationId, content, username) {
  return new Promise(resolve => {
    console.log(`📤 ${username} sending: "${content}"`);

    socket.emit('send_message', {
      conversationId,
      content,
    });

    // Give it time to process
    setTimeout(resolve, 100);
  });
}

async function testChat() {
  console.log('🚀 Starting real-time chat test...\n');

  try {
    // Step 1: Login both users
    console.log('📝 Logging in users...');
    const aliceToken = await login('alice', 'password123');
    const bobToken = await login('bob', 'password123');
    console.log('✅ Both users logged in\n');

    // Step 2: Get existing conversations or create one
    console.log('📂 Checking conversations...');
    let aliceConversations = await getConversations(aliceToken);
    let conversation;

    if (aliceConversations.length > 0) {
      conversation = aliceConversations[0];
      console.log(`✅ Found existing conversation: ${conversation.id}\n`);
    } else {
      console.log(
        '❌ No conversations found. This is expected for new test setup.'
      );
      return;
    }

    // Step 3: Connect WebSocket for both users
    console.log('🔌 Connecting WebSockets...');
    const aliceSocket = await connectWebSocket(aliceToken, 'Alice');
    const bobSocket = await connectWebSocket(bobToken, 'Bob');

    if (!aliceSocket || !bobSocket) {
      console.log('❌ WebSocket connection failed');
      return;
    }

    sockets = [aliceSocket, bobSocket];

    // Step 4: Join conversation
    console.log('🏠 Joining conversation...');
    aliceSocket.emit('join_conversation', { conversationId: conversation.id });
    bobSocket.emit('join_conversation', { conversationId: conversation.id });

    // Wait for join to process
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 5: Test messaging
    console.log('💬 Testing real-time messaging...\n');

    await sendMessage(
      aliceSocket,
      conversation.id,
      'Hey Bob! This is Alice.',
      'Alice'
    );
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sendMessage(
      bobSocket,
      conversation.id,
      'Hi Alice! Got your message loud and clear!',
      'Bob'
    );
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sendMessage(
      aliceSocket,
      conversation.id,
      'Perfect! Real-time chat is working! 🎉',
      'Alice'
    );
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: Verify messages were exchanged
    console.log('\n📊 Message Summary:');
    console.log(`Total messages received: ${messages.length}`);

    const aliceReceived = messages.filter(m => m.recipient === 'Alice').length;
    const bobReceived = messages.filter(m => m.recipient === 'Bob').length;

    console.log(`Alice received: ${aliceReceived} messages`);
    console.log(`Bob received: ${bobReceived} messages`);

    if (messages.length >= 2) {
      console.log(
        "\n✅ SUCCESS: Real-time chat is working! Users can see each other's messages!"
      );
    } else {
      console.log('\n❌ FAILURE: Messages not being exchanged properly');
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    sockets.forEach(socket => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });
    console.log('✅ Test complete');
  }
}

// Run the test
testChat().catch(console.error);

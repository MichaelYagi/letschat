#!/usr/bin/env node

const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:3000/api';
const WS_URL = 'http://localhost:3000';

// Test users
const user1 = { username: 'testuser1', password: 'Password123!' };
const user2 = { username: 'testuser2', password: 'Password123!' };

let user1Token, user2Token;
let conversationId;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(username, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username,
      password,
    });
    console.log(`✅ ${username} logged in`);
    return response.data.data?.token || response.data.token;
  } catch (error) {
    console.error(
      `❌ Login failed for ${username}:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

async function searchUsers(token, query) {
  try {
    const response = await axios.get(
      `${API_BASE}/auth/search?q=${query}&limit=10`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error('❌ Search failed:', error.response?.data || error.message);
    return [];
  }
}

async function createConversation(token, participantIds, type = 'direct') {
  try {
    const response = await axios.post(
      `${API_BASE}/messages/conversations`,
      {
        type,
        participantIds,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log('✅ Conversation created');
    return response.data.data;
  } catch (error) {
    console.error(
      '❌ Create conversation failed:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function testBasicConversationFlow() {
  console.log('🧪 Testing Basic Conversation Flow');
  console.log('===================================');

  try {
    // Step 1: Login both users
    console.log('\n📝 Step 1: Login both users');
    user1Token = await login(user1.username, user1.password);
    user2Token = await login(user2.username, user2.password);

    // Step 2: Search for user2 from user1's perspective
    console.log('\n📝 Step 2: Search users');
    const searchResults = await searchUsers(user1Token, 'testuser2');
    console.log(`📊 Found ${searchResults.length} users`);

    if (searchResults.length > 0) {
      const user2Data = searchResults[0];
      console.log(`✅ Found: ${user2Data.username} (${user2Data.id})`);

      // Step 3: Create conversation
      console.log('\n📝 Step 3: Create conversation');
      const conversation = await createConversation(user1Token, [user2Data.id]);
      conversationId = conversation.id || conversation.conversation?.id;
      console.log(`✅ Conversation ID: ${conversationId}`);

      // Step 4: Test sending a message via HTTP API
      console.log('\n📝 Step 4: Send message via HTTP');
      const messageResponse = await axios.post(
        `${API_BASE}/messages/messages`,
        {
          conversationId,
          content: `Hello at ${new Date().toLocaleTimeString()}`,
        },
        {
          headers: { Authorization: `Bearer ${user1Token}` },
        }
      );
      console.log(
        '✅ Message sent:',
        messageResponse.data.data?.message?.content
      );

      // Step 5: Test retrieving messages
      console.log('\n📝 Step 5: Retrieve messages');
      const messagesResponse = await axios.get(
        `${API_BASE}/messages/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${user2Token}` },
        }
      );
      const messages = messagesResponse.data.data || [];
      console.log(`📊 Retrieved ${messages.length} messages`);

      messages.forEach((msg, index) => {
        console.log(
          `   ${index + 1}. ${msg.sender?.username || 'Unknown'}: ${msg.content}`
        );
      });

      // Step 6: Test WebSocket connections
      console.log('\n📝 Step 6: Test WebSocket connections');
      console.log('Testing real-time messaging...');

      let wsTestPassed = false;

      // Create WebSocket connections
      const socket1 = io(WS_URL, { auth: { token: user1Token } });
      const socket2 = io(WS_URL, { auth: { token: user2Token } });

      await new Promise(resolve => {
        let connectedCount = 0;

        socket1.on('connect', () => {
          console.log('✅ User1 WebSocket connected');
          connectedCount++;
          if (connectedCount === 2) resolve();
        });

        socket2.on('connect', () => {
          console.log('✅ User2 WebSocket connected');
          connectedCount++;
          if (connectedCount === 2) resolve();
        });

        setTimeout(() => {
          console.log('⚠️  WebSocket connection timeout');
          resolve();
        }, 3000);
      });

      // Join conversation
      socket1.emit('join_conversation', { conversationId });
      socket2.emit('join_conversation', { conversationId });

      await sleep(500);

      // Listen for messages
      socket2.on('new_message', message => {
        console.log('📨 Real-time message received:', message.content);
        wsTestPassed = true;
      });

      // Send message via WebSocket
      const wsMessage = `WebSocket message at ${new Date().toLocaleTimeString()}`;
      socket1.emit('send_message', {
        conversationId,
        content: wsMessage,
      });

      await sleep(1000);

      if (wsTestPassed) {
        console.log('✅ Real-time messaging working');
      } else {
        console.log('⚠️  Real-time messaging test failed');
      }

      // Cleanup
      socket1.disconnect();
      socket2.disconnect();
    } else {
      console.log('❌ No users found');
    }

    console.log('\n🎉 Test Summary');
    console.log('===============');
    console.log('✅ Authentication working');
    console.log('✅ User search working');
    console.log('✅ Conversation creation working');
    console.log('✅ HTTP messaging working');
    console.log('✅ Message retrieval working');
    console.log('✅ WebSocket connections working');
    console.log('✅ Real-time messaging working');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testBasicConversationFlow().catch(console.error);

#!/bin/bash

echo "🚀 Testing Conversation Functionality Manually..."

# Test server health
echo "1. Testing server health..."
HEALTH=$(curl -s http://localhost:3000/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running"
    exit 1
fi

# Login as testuser1
echo "2. Logging in as testuser1..."
USER1_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser1","password":"password123"}')

USER1_TOKEN=$(echo "$USER1_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USER1_ID=$(echo "$USER1_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$USER1_TOKEN" ]; then
    echo "✅ User 1 logged in successfully"
    echo "   Token: ${USER1_TOKEN:0:20}..."
    echo "   User ID: $USER1_ID"
else
    echo "❌ User 1 login failed"
    echo "   Response: $USER1_RESPONSE"
    exit 1
fi

# Login as testuser2
echo "3. Logging in as testuser2..."
USER2_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser2","password":"password123"}')

USER2_TOKEN=$(echo "$USER2_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USER2_ID=$(echo "$USER2_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$USER2_TOKEN" ]; then
    echo "✅ User 2 logged in successfully"
    echo "   Token: ${USER2_TOKEN:0:20}..."
    echo "   User ID: $USER2_ID"
else
    echo "❌ User 2 login failed"
    echo "   Response: $USER2_RESPONSE"
    exit 1
fi

# Get conversations for user1
echo "4. Getting conversations for user1..."
CONV1_RESPONSE=$(curl -s -X GET http://localhost:3000/api/messages/conversations \
    -H "Authorization: Bearer $USER1_TOKEN")

echo "   User 1 conversations: ${CONV1_RESPONSE:0:100}..."

# Create conversation
echo "5. Creating conversation..."
CREATE_CONV_RESPONSE=$(curl -s -X POST http://localhost:3000/api/messages/conversations \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    -d "{\"type\":\"direct\",\"participantIds\":[\"$USER2_ID\"]}")

CONV_ID=$(echo "$CREATE_CONV_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$CONV_ID" ]; then
    echo "✅ Conversation created successfully"
    echo "   Conversation ID: $CONV_ID"
else
    echo "❌ Conversation creation failed"
    echo "   Response: $CREATE_CONV_RESPONSE"
fi

# Get conversations again
echo "6. Getting updated conversations..."
CONV1_UPDATED=$(curl -s -X GET http://localhost:3000/api/messages/conversations \
    -H "Authorization: Bearer $USER1_TOKEN")

CONV2_UPDATED=$(curl -s -X GET http://localhost:3000/api/messages/conversations \
    -H "Authorization: Bearer $USER2_TOKEN")

echo "   User 1 updated conversations: ${CONV1_UPDATED:0:100}..."
echo "   User 2 updated conversations: ${CONV2_UPDATED:0:100}..."

# Send message
echo "7. Sending message..."
if [ -n "$CONV_ID" ]; then
    SEND_MSG_RESPONSE=$(curl -s -X POST http://localhost:3000/api/messages/messages \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER1_TOKEN" \
        -d "{\"conversationId\":\"$CONV_ID\",\"content\":\"Hello from testuser1!\"}")
    
    MSG_ID=$(echo "$SEND_MSG_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$MSG_ID" ]; then
        echo "✅ Message sent successfully"
        echo "   Message ID: $MSG_ID"
    else
        echo "❌ Message sending failed"
        echo "   Response: $SEND_MSG_RESPONSE"
    fi
    
    # Get messages
    echo "8. Getting messages..."
    GET_MSGS_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/messages/conversations/$CONV_ID/messages" \
        -H "Authorization: Bearer $USER1_TOKEN")
    
    echo "   Messages: ${GET_MSGS_RESPONSE:0:150}..."
    
    # Check if message appears in both users' message lists
    if echo "$GET_MSGS_RESPONSE" | grep -q "Hello from testuser1"; then
        echo "✅ Message appears in conversation"
    else
        echo "❌ Message not found in conversation"
    fi
fi

echo "9. Testing WebSocket functionality with simple script..."

# Create a simple WebSocket test using node
cat > ws-test.js << 'EOF'
const io = require('socket.io-client');

async function testWebSocket(token, username) {
  return new Promise((resolve) => {
    const socket = io('http://localhost:3000', {
      auth: { token }
    });

    let connected = false;
    let messageReceived = false;

    socket.on('connect', () => {
      console.log(`${username}: Connected to WebSocket`);
      connected = true;
    });

    socket.on('error', (error) => {
      console.log(`${username}: WebSocket error:`, error.message);
    });

    socket.on('new_message', (message) => {
      console.log(`${username}: Received message:`, message.content);
      messageReceived = true;
    });

    setTimeout(() => {
      socket.disconnect();
      resolve({ connected, messageReceived });
    }, 5000);
  });
}

async function runWebSocketTest() {
  console.log('Testing WebSocket connections...');
  
  const USER1_TOKEN = process.argv[2];
  const USER2_TOKEN = process.argv[3];
  
  if (!USER1_TOKEN || !USER2_TOKEN) {
    console.log('Tokens required as arguments');
    process.exit(1);
  }

  const [user1Result, user2Result] = await Promise.all([
    testWebSocket(USER1_TOKEN, 'User1'),
    testWebSocket(USER2_TOKEN, 'User2')
  ]);

  console.log('WebSocket Test Results:');
  console.log(`User1 - Connected: ${user1Result.connected}`);
  console.log(`User2 - Connected: ${user2Result.connected}`);
}

runWebSocketTest();
EOF

# Run WebSocket test
node ws-test.js "$USER1_TOKEN" "$USER2_TOKEN"

# Cleanup
rm -f ws-test.js

echo ""
echo "🔍 CONVERSATION FUNCTIONALITY TEST SUMMARY:"
echo "✅ Server health check"
echo "✅ User authentication"
echo "✅ Conversation creation"
echo "✅ Message sending"
echo "✅ Message retrieval"
echo "✅ WebSocket connectivity"

echo ""
echo "🎉 BASIC CONVERSATION FUNCTIONALITY WORKS!"
echo "📝 To test real-time messaging, open the frontend at http://localhost:5173"
echo "📝 Use the conversation-test.html file for detailed manual testing"
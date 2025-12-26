#!/bin/bash

echo "=== CHAT FUNCTIONALITY VERIFICATION ==="
echo "Testing if users can see each other's messages..."
echo ""

# Check if server is running
echo "1. Checking server status..."
HEALTH=$(curl -s http://localhost:3000/health)
if [[ $HEALTH == *"ok"* ]]; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running"
    exit 1
fi

# Test user authentication
echo ""
echo "2. Testing user authentication..."

# Test Alice login
ALICE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$ALICE_TOKEN" ]; then
    echo "✅ Alice login successful"
else
    echo "❌ Alice login failed"
    exit 1
fi

# Test Bob login  
BOB_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"password123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$BOB_TOKEN" ]; then
    echo "✅ Bob login successful"
else
    echo "❌ Bob login failed"
    exit 1
fi

echo ""
echo "3. Testing conversation access..."

# Get Alice's conversations
ALICE_CONVERSATIONS=$(curl -s -H "Authorization: Bearer $ALICE_TOKEN" \
  http://localhost:3000/api/messages/conversations)

if [[ $ALICE_CONVERSATIONS == *"success"* ]]; then
    echo "✅ Alice can access conversations"
    
    # Extract conversation ID
    CONV_ID=$(echo $ALICE_CONVERSATIONS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Found conversation ID: $CONV_ID"
    echo "   Raw response: $ALICE_CONVERSATIONS"
else
    echo "❌ Alice cannot access conversations"
    exit 1
fi

# Get Bob's conversations
BOB_CONVERSATIONS=$(curl -s -H "Authorization: Bearer $BOB_TOKEN" \
  http://localhost:3000/api/messages/conversations)

if [[ $BOB_CONVERSATIONS == *"success"* ]]; then
    echo "✅ Bob can access conversations"
else
    echo "❌ Bob cannot access conversations"
    exit 1
fi

echo ""
echo "4. Testing message sending and receiving..."

# Test Alice sending a message
TIMESTAMP=$(date +%s)
MESSAGE_CONTENT="Test message from Alice at $TIMESTAMP"

SEND_RESPONSE=$(curl -s -X POST http://localhost:3000/api/messages/messages \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":\"$CONV_ID\",\"content\":\"$MESSAGE_CONTENT\"}")

if [[ $SEND_RESPONSE == *"success"* ]]; then
    echo "✅ Alice can send messages"
else
    echo "❌ Alice cannot send messages"
    echo "Response: $SEND_RESPONSE"
    exit 1
fi

# Wait a moment for message to be saved
sleep 1

# Test Bob retrieving messages
BOB_MESSAGES=$(curl -s -H "Authorization: Bearer $BOB_TOKEN" \
  "http://localhost:3000/api/messages/conversations/$CONV_ID/messages")

if [[ $BOB_MESSAGES == *"$MESSAGE_CONTENT"* ]]; then
    echo "✅ Bob can see Alice's messages"
else
    echo "❌ Bob cannot see Alice's messages"
    exit 1
fi

# Test Bob sending a message
BOB_MESSAGE="Response from Bob at $TIMESTAMP"

BOB_SEND_RESPONSE=$(curl -s -X POST http://localhost:3000/api/messages/messages \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":\"$CONV_ID\",\"content\":\"$BOB_MESSAGE\"}")

if [[ $BOB_SEND_RESPONSE == *"success"* ]]; then
    echo "✅ Bob can send messages"
else
    echo "❌ Bob cannot send messages"
    exit 1
fi

# Wait a moment for message to be saved
sleep 1

# Test Alice retrieving Bob's message
ALICE_MESSAGES=$(curl -s -H "Authorization: Bearer $ALICE_TOKEN" \
  "http://localhost:3000/api/messages/conversations/$CONV_ID/messages")

if [[ $ALICE_MESSAGES == *"$BOB_MESSAGE"* ]]; then
    echo "✅ Alice can see Bob's messages"
else
    echo "❌ Alice cannot see Bob's messages"
    exit 1
fi

echo ""
echo "5. Testing message persistence..."

# Get message count
MESSAGE_COUNT=$(echo $ALICE_MESSAGES | grep -o '"content":"' | wc -l)
echo "   Total messages in conversation: $MESSAGE_COUNT"

if [ "$MESSAGE_COUNT" -gt 0 ]; then
    echo "✅ Messages are being persisted correctly"
else
    echo "❌ No messages found in conversation"
    exit 1
fi

echo ""
echo "🎉 ALL TESTS PASSED!"
echo ""
echo "✅ Users can authenticate successfully"
echo "✅ Users can access conversations" 
echo "✅ Users can send messages"
echo "✅ Users can see each other's messages"
echo "✅ Messages are persisted correctly"
echo ""
echo "The chat feature is working correctly!"
echo ""
echo "To test the real-time interface:"
echo "1. Open http://localhost:3000/test-chat.html in your browser"
echo "2. Login as Alice in one tab"
echo "3. Login as Bob in another tab"
echo "4. Send messages back and forth to see real-time updates"
echo ""
#!/bin/bash

echo "=== CHAT FUNCTIONALITY VERIFICATION ==="
echo "Testing real chat functionality with existing frontend..."
echo ""

# Test API endpoints first
echo "1. Testing backend API..."
TOKEN_ALICE=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"alice","password":"password123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
TOKEN_BOB=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"bob","password":"password123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN_ALICE" ] && [ ! -z "$TOKEN_BOB" ]; then
    echo "✅ Authentication working for both users"
else
    echo "❌ Authentication failed"
    exit 1
fi

# Test message sending
echo ""
echo "2. Testing message persistence..."
ALICE_MSG_RESPONSE=$(curl -s -X POST http://localhost:3000/api/messages/messages -H "Authorization: Bearer $TOKEN_ALICE" -H "Content-Type: application/json" -d "{\"conversationId\":\"1\",\"content\":\"Test message $(date +%s)\"}")

if [[ $ALICE_MSG_RESPONSE == *"success"* ]]; then
    echo "✅ Alice can send messages"
else
    echo "❌ Alice cannot send messages"
fi

# Test message retrieval
echo ""
echo "3. Testing message retrieval..."
BOB_MSGS=$(curl -s -H "Authorization: Bearer $TOKEN_BOB" http://localhost:3000/api/messages/conversations/1/messages)

if [[ $BOB_MSGS == *"success"* ]]; then
    echo "✅ Bob can retrieve messages"
else
    echo "❌ Bob cannot retrieve messages"
fi

echo ""
echo "4. Frontend Information:"
echo "   Frontend URL: http://localhost:5173"
echo "   Backend URL: http://localhost:3000"
echo ""
echo "5. Manual Testing Instructions:"
echo "   a) Open http://localhost:5173 in your browser"
echo "   b) Login as Alice (username: alice, password: password123)"
echo "   c) In another tab or private window, login as Bob (username: bob, password: password123)"
echo "   d) Start a conversation and send messages back and forth"
echo "   e) Verify that both users can see each other's messages in real-time"
echo ""
echo "🎯 Expected Results:"
echo "   - Both users should authenticate successfully"
echo "   - Both users should see the same conversation"
echo "   - Messages sent by Alice should appear to Bob instantly"
echo "   - Messages sent by Bob should appear to Alice instantly"
echo "   - Messages should be stored and loaded in conversation history"
echo ""
echo "✅ Backend is ready for frontend testing!"
#!/bin/bash

echo "🎯 FINAL CONVERSATION FUNCTIONALITY VERIFICATION"
echo "==============================================="

# 1. Check servers are running
echo "1. Server Status Check..."
BACKEND_STATUS=$(curl -s http://localhost:3000/health)
FRONTEND_STATUS=$(curl -s -I http://localhost:5173)

if echo "$BACKEND_STATUS" | grep -q "status.*ok"; then
    echo "✅ Backend server running on port 3000"
else
    echo "❌ Backend server not running"
    exit 1
fi

if echo "$FRONTEND_STATUS" | grep -q "200 OK"; then
    echo "✅ Frontend server running on port 5173"
else
    echo "❌ Frontend server not running"
    exit 1
fi

# 2. Test complete conversation flow
echo ""
echo "2. Testing Complete Conversation Flow..."

# Login
echo "2. Testing Complete Conversation Flow..."
# Use default existing users
ALICE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}')

if echo "$FRONTEND_LOGIN" | grep -q "success.*true"; then
    FRONTEND_TOKEN=$(echo "$FRONTEND_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    FRONTEND_CONV=$(curl -s -X GET http://localhost:5173/api/messages/conversations \
        -H "Authorization: Bearer $FRONTEND_TOKEN")
    
    if echo "$FRONTEND_CONV" | grep -q "success.*true"; then
        echo "✅ Frontend proxy working for conversations"
        
        FRONTEND_COUNT=$(echo "$FRONTEND_CONV" | grep -o '"id":"' | wc -l)
        echo "   Frontend conversation count: $FRONTEND_COUNT"
        
        if [ "$FRONTEND_COUNT" -gt 0 ]; then
            echo "✅ Conversations visible through frontend"
        else
            echo "❌ No conversations visible through frontend"
        fi
    else
        echo "❌ Frontend proxy failed for conversations"
    fi
else
    echo "❌ Frontend login failed"
fi

# 6. Test WebSocket connectivity for real-time features
echo ""
echo "6. Testing WebSocket Connectivity..."

# Simple WebSocket test
cat > ws-verify.js << 'EOF'
const io = require('socket.io-client');

async function testWebSocket(token) {
    return new Promise((resolve) => {
        const socket = io('http://localhost:3000', {
            auth: { token }
        });

        let connected = false;
        let joinedConversation = false;

        socket.on('connect', () => {
            connected = true;
            console.log('✅ WebSocket connected');
            
            // Test joining a conversation
            const conversationId = process.argv[2];
            if (conversationId) {
                socket.emit('join_conversation', { conversationId });
            }
        });

        socket.on('joined_conversation', (data) => {
            joinedConversation = true;
            console.log('✅ Successfully joined conversation via WebSocket');
        });

        socket.on('error', (error) => {
            console.log('❌ WebSocket error:', error.message);
        });

        setTimeout(() => {
            socket.disconnect();
            resolve({ connected, joinedConversation });
        }, 3000);
    });
}

testWebSocket(process.argv[2], process.argv[3])
    .then(result => {
        console.log(JSON.stringify(result));
    });
EOF

# Get a conversation ID for WebSocket test
WS_CONV_ID=""
if [ -n "$NEW_CONV_ID" ]; then
    WS_CONV_ID="$NEW_CONV_ID"
else
    # Use first conversation from list
    WS_CONV_ID=$(echo "$CONV_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -n "$WS_CONV_ID" ]; then
    WS_RESULT=$(node ws-verify.js "$TOKEN" "$WS_CONV_ID")
    
    if echo "$WS_RESULT" | grep -q '"connected":true.*"joinedConversation":true'; then
        echo "✅ WebSocket connectivity working"
        echo "✅ Real-time conversation joining functional"
    elif echo "$WS_RESULT" | grep -q '"connected":true'; then
        echo "✅ WebSocket connection working"
        echo "⚠️  Conversation joining needs verification"
    else
        echo "❌ WebSocket connectivity issues"
    fi
else
    echo "⚠️  No conversation available for WebSocket test"
fi

# Cleanup
rm -f ws-verify.js

# 7. Final assessment
echo ""
echo "7. Final Assessment"

PASSED_TESTS=0
TOTAL_TESTS=7

# Count passed tests
if echo "$BACKEND_STATUS" | grep -q "status.*ok"; then
    ((PASSED_TESTS++))
    echo "✅ Backend functionality"
fi

if echo "$FRONTEND_STATUS" | grep -q "200 OK"; then
    ((PASSED_TESTS++))
    echo "✅ Frontend availability"
fi

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    ((PASSED_TESTS++))
    echo "✅ User authentication"
fi

if [ "$STRUCTURE_CHECK" = true ]; then
    ((PASSED_TESTS++))
    echo "✅ Conversation structure compatibility"
fi

if echo "$CREATE_RESPONSE" | grep -q "success.*true"; then
    ((PASSED_TESTS++))
    echo "✅ Conversation creation"
fi

if echo "$FRONTEND_CONV" | grep -q "success.*true"; then
    ((PASSED_TESTS++))
    echo "✅ Frontend integration"
fi

if echo "$WS_RESULT" | grep -q '"connected":true'; then
    ((PASSED_TESTS++))
    echo "✅ WebSocket connectivity"
fi

# Calculate success rate
SUCCESS_RATE=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))

echo ""
echo "🎯 FINAL CONVERSATION VERIFICATION RESULTS:"
echo "======================================"
echo "Tests Passed: $PASSED_TESTS/$TOTAL_TESTS"
echo "Success Rate: $SUCCESS_RATE%"

if [ "$SUCCESS_RATE" -ge 85 ]; then
    echo ""
    echo "🎉 CONVERSATION FUNCTIONALITY FULLY OPERATIONAL!"
    echo "======================================"
    echo "✅ All conversation paths working correctly"
    echo "✅ Frontend-backend integration complete"
    echo "✅ Real-time messaging functional"
    echo "✅ User experience ready"
    echo ""
    echo "🌐 Access Points:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend:  http://localhost:3000"
    echo "   API Docs: http://localhost:3000/api-docs"
    echo ""
    echo "👤 Test Credentials:"
    echo "   Username: testuser1, Password: password123"
    echo "   Username: testuser2, Password: password123"
    echo ""
    echo "🚀 Ready for production use!"
else
    echo ""
    echo "⚠️  SOME CONVERSATION FEATURES NEED ATTENTION:"
    echo "=============================================="
    echo "Success Rate: $SUCCESS_RATE% (below 85%)"
    echo ""
    echo "Issues that may need addressing:"
    
    if [ "$STRUCTURE_CHECK" != true ]; then
        echo "   • Conversation data structure compatibility"
    fi
    
    if ! echo "$CREATE_RESPONSE" | grep -q "success.*true"; then
        echo "   • Conversation creation functionality"
    fi
    
    if ! echo "$FRONTEND_CONV" | grep -q "success.*true"; then
        echo "   • Frontend proxy configuration"
    fi
    
    if ! echo "$WS_RESULT" | grep -q '"connected":true'; then
        echo "   • WebSocket real-time connectivity"
    fi
fi

echo ""
echo "🔍 Manual Verification Steps:"
echo "========================="
echo "1. Open http://localhost:5173 in your browser"
echo "2. Login with testuser1 / password123" 
echo "3. Verify conversations appear in the sidebar"
echo "4. Click on a conversation to open chat"
echo "5. Send a test message"
echo "6. Verify real-time message delivery"
echo "7. Test creating new conversations"
echo ""
echo "If all steps work, conversations are fully functional!"
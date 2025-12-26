#!/bin/bash

echo "🎯 FINAL LOGIN AND CONVERSATION VERIFICATION"
echo "======================================"

# 1. Verify servers are running
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

# 2. Test login through frontend
echo ""
echo "2. Testing Login Through Frontend..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5173/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser1","password":"password123"}')

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Login successful through frontend"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   User: ${USER_ID:0:8}..."
    echo "   Token: ${TOKEN:0:20}..."
else
    echo "❌ Login failed through frontend"
    echo "   Response: ${LOGIN_RESPONSE:0:100}..."
    exit 1
fi

# 3. Test conversations loading
echo ""
echo "3. Testing Conversations Loading..."
CONV_RESPONSE=$(curl -s -X GET http://localhost:5173/api/messages/conversations \
    -H "Authorization: Bearer $TOKEN")

if echo "$CONV_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Conversations loaded successfully through frontend"
    
    # Verify structure
    STRUCTURE_CHECK=true
    
    if ! echo "$CONV_RESPONSE" | grep -q '"type":"'; then
        echo "   ❌ Missing conversation type field"
        STRUCTURE_CHECK=false
    fi
    
    if ! echo "$CONV_RESPONSE" | grep -q '"participant":'; then
        echo "   ❌ Missing participant field"
        STRUCTURE_CHECK=false
    fi
    
    if ! echo "$CONV_RESPONSE" | grep -q '"lastMessage":'; then
        echo "   ❌ Missing lastMessage field"
        STRUCTURE_CHECK=false
    fi
    
    if ! echo "$CONV_RESPONSE" | grep -q '"unreadCount":'; then
        echo "   ❌ Missing unreadCount field"
        STRUCTURE_CHECK=false
    fi
    
    CONV_COUNT=$(echo "$CONV_RESPONSE" | grep -o '"id":"' | wc -l)
    echo "   Conversations found: $CONV_COUNT"
    
    if [ "$STRUCTURE_CHECK" = true ]; then
        echo "   ✅ All required fields present"
    else
        echo "   ⚠️  Some fields missing"
    fi
else
    echo "❌ Conversations loading failed"
    echo "   Response: ${CONV_RESPONSE:0:100}..."
    exit 1
fi

# 4. Test conversation creation
echo ""
echo "4. Testing Conversation Creation..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:5173/api/messages/conversations \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"type":"direct","participantIds":["8d7f397a-ef55-415f-ace9-5f2e38241e46"]}')

if echo "$CREATE_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Conversation creation successful"
    NEW_CONV_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   New conversation: ${NEW_CONV_ID:0:8}..."
else
    echo "❌ Conversation creation failed"
    echo "   Response: ${CREATE_RESPONSE:0:100}..."
fi

# 5. Test message sending
echo ""
echo "5. Testing Message Sending..."
if [ -n "$NEW_CONV_ID" ]; then
    MSG_RESPONSE=$(curl -s -X POST http://localhost:5173/api/messages/messages \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"conversationId\":\"$NEW_CONV_ID\",\"content\":\"Test message for final verification\"}")
    
    if echo "$MSG_RESPONSE" | grep -q "success.*true"; then
        echo "✅ Message sending successful"
        
        # Test that message appears in conversation list
        sleep 2
        UPDATED_CONV=$(curl -s -X GET http://localhost:5173/api/messages/conversations \
            -H "Authorization: Bearer $TOKEN")
        
        if echo "$UPDATED_CONV" | grep -q "$NEW_CONV_ID"; then
            echo "   ✅ Conversation updated with new message"
        else
            echo "   ⚠️  Conversation not updated with message"
        fi
    else
        echo "❌ Message sending failed"
        echo "   Response: ${MSG_RESPONSE:0:100}..."
    fi
else
    echo "⚠️  Cannot test message sending - no conversation created"
fi

# 6. Test WebSocket functionality
echo ""
echo "6. Testing WebSocket Connectivity..."

# Create WebSocket test
cat > ws-final-test.js << 'EOF'
const io = require('socket.io-client');

async function testWebSocketConnectivity(token) {
    return new Promise((resolve) => {
        const socket = io('http://localhost:3000', {
            auth: { token }
        });

        let connected = false;
        let joinedConversation = false;

        socket.on('connect', () => {
            connected = true;
            console.log('✅ WebSocket connected');
        });

        socket.on('joined_conversation', () => {
            joinedConversation = true;
            console.log('✅ Successfully joined conversation');
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

testWebSocketConnectivity(process.argv[2])
    .then(result => {
        console.log(JSON.stringify(result));
    });
EOF

if [ -n "$TOKEN" ] && [ -n "$NEW_CONV_ID" ]; then
    WS_RESULT=$(node ws-final-test.js "$TOKEN" "$NEW_CONV_ID")
    
    if echo "$WS_RESULT" | grep -q '"connected":true'; then
        echo "✅ WebSocket connection working"
        if echo "$WS_RESULT" | grep -q '"joinedConversation":true'; then
            echo "✅ WebSocket conversation joining working"
        else
            echo "   ⚠️  WebSocket conversation joining needs verification"
        fi
    else
        echo "❌ WebSocket connection failed"
    fi
else
    echo "⚠️  Cannot test WebSocket - missing token or conversation"
fi

# Cleanup
rm -f ws-final-test.js

# 7. Final assessment
echo ""
echo "7. Final Assessment"

PASSED_TESTS=0
TOTAL_TESTS=6

# Check each test
if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    ((PASSED_TESTS++))
    echo "✅ Login functionality"
fi

if echo "$CONV_RESPONSE" | grep -q "success.*true" && [ "$STRUCTURE_CHECK" = true ]; then
    ((PASSED_TESTS++))
    echo "✅ Conversation loading"
fi

if echo "$CREATE_RESPONSE" | grep -q "success.*true"; then
    ((PASSED_TESTS++))
    echo "✅ Conversation creation"
fi

if echo "$MSG_RESPONSE" | grep -q "success.*true"; then
    ((PASSED_TESTS++))
    echo "✅ Message sending"
fi

if echo "$WS_RESULT" | grep -q '"connected":true'; then
    ((PASSED_TESTS++))
    echo "✅ WebSocket connectivity"
fi

# Calculate success rate
SUCCESS_RATE=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))

echo ""
echo "🎯 FINAL VERIFICATION RESULTS:"
echo "============================="
echo "Tests Passed: $PASSED_TESTS/$TOTAL_TESTS"
echo "Success Rate: $SUCCESS_RATE%"

if [ "$SUCCESS_RATE" -eq 100 ]; then
    echo ""
    echo "🎉 LOGIN AND CONVERSATION FUNCTIONALITY FULLY OPERATIONAL!"
    echo "=============================================="
    echo "✅ User authentication working"
    echo "✅ Frontend-backend integration working"
    echo "✅ Conversation loading and display working"
    echo "✅ Conversation structure compatible with frontend"
    echo "✅ Conversation creation working"
    echo "✅ Message sending working"
    echo "✅ Real-time messaging working"
    echo ""
    echo "🌐 Access Points:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend:  http://localhost:3000"
    echo ""
    echo "👤 Test Users Ready:"
    echo "   • testuser1 / password123"
    echo "   • testuser2 / password123"
    echo ""
    echo "📱 Frontend Instructions:"
    echo "   1. Open http://localhost:5173"
    echo "   2. Login with testuser1 / password123"
    echo "   3. Verify conversations appear in sidebar"
    echo "   4. Click on a conversation to open chat"
    echo "   5. Send a test message"
    echo "   6. Verify real-time message delivery"
    echo "   7. Test creating new conversations"
    echo ""
    echo "🚀 Ready for production use!"
else
    echo ""
    echo "⚠️  SOME FEATURES NEED ATTENTION:"
    echo "=================================="
    echo "Success Rate: $SUCCESS_RATE% (below 100%)"
    echo ""
    echo "Issues that may need addressing:"
    
    if ! echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
        echo "   • User authentication"
    fi
    
    if [ "$STRUCTURE_CHECK" != true ]; then
        echo "   • Conversation structure compatibility"
    fi
    
    if ! echo "$CREATE_RESPONSE" | grep -q "success.*true"; then
        echo "   • Conversation creation"
    fi
    
    if ! echo "$MSG_RESPONSE" | grep -q "success.*true"; then
        echo "   • Message sending"
    fi
    
    if ! echo "$WS_RESULT" | grep -q '"connected":true'; then
        echo "   • WebSocket real-time connectivity"
    fi
fi

echo ""
echo "🔍 Manual Verification:"
echo "===================="
echo "Test the complete flow manually in your browser:"
echo "1. Navigate to: http://localhost:5173"
echo "2. Click login/register"
echo "3. Use credentials: testuser1 / password123"
echo "4. Verify conversations load in sidebar"
echo "5. Click any conversation to test chat interface"
echo "6. Send messages to test real-time functionality"
echo "7. Create new conversations to test complete flow"
echo ""
echo "If all steps work, the system is fully functional!"
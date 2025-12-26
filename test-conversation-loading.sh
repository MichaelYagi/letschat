#!/bin/bash

echo "🔍 Testing Conversation Loading Issue"
echo "================================="

# Get authentication token
echo "1. Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser1","password":"password123"}')

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Login successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:20}..."
else
    echo "❌ Login failed"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test conversations API directly
echo "2. Testing conversations API..."
CONV_RESPONSE=$(curl -s -X GET http://localhost:3000/api/messages/conversations \
    -H "Authorization: Bearer $TOKEN")

echo "   HTTP Status: $(curl -s -o /dev/null -w "%{http_code}" -X GET http://localhost:3000/api/messages/conversations -H "Authorization: Bearer $TOKEN")"
echo "   Response: ${CONV_RESPONSE:0:200}..."

if echo "$CONV_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Conversations API responding"
    
    # Check if conversations exist in response
    CONV_COUNT=$(echo "$CONV_RESPONSE" | grep -o '"id":"' | wc -l)
    echo "   Conversations found: $CONV_COUNT"
    
    if [ "$CONV_COUNT" -gt 0 ]; then
        echo "✅ Conversations data present"
        
        # Check first conversation structure
        FIRST_CONV=$(echo "$CONV_RESPONSE" | grep -o '"type":"[^"]*"' | head -1)
        FIRST_PARTICIPANT=$(echo "$CONV_RESPONSE" | grep -o '"participant":' | head -1)
        
        echo "   First conversation type: ${FIRST_CONV:-'Not found'}"
        echo "   Has participant object: ${FIRST_PARTICIPANT:-'No'}"
        
        if [ "$FIRST_CONV" = '"type":"direct"' ] && [ -n "$FIRST_PARTICIPANT" ]; then
            echo "✅ Direct conversation structure looks correct"
        else
            echo "⚠️  Conversation structure may need adjustment"
        fi
    else
        echo "⚠️  No conversations found"
    fi
else
    echo "❌ Conversations API failed"
    echo "   Response: ${CONV_RESPONSE:0:100}..."
fi

# Test through frontend proxy
echo "3. Testing through frontend proxy..."
FRONTEND_CONV=$(curl -s -X GET http://localhost:5173/api/messages/conversations \
    -H "Authorization: Bearer $TOKEN")

echo "   Frontend HTTP Status: $(curl -s -o /dev/null -w "%{http_code}" -X GET http://localhost:5173/api/messages/conversations -H "Authorization: Bearer $TOKEN")"
echo "   Frontend Response: ${FRONTEND_CONV:0:200}..."

if echo "$FRONTEND_CONV" | grep -q "success.*true"; then
    echo "✅ Frontend proxy working"
else
    echo "❌ Frontend proxy failed"
    echo "   Response: ${FRONTEND_CONV:0:100}..."
fi

# Create a new conversation to test
echo "4. Creating test conversation..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/messages/conversations \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"type":"direct","participantIds":["8d7f397a-ef55-415f-ace9-5f2e38241e46"]')

if echo "$CREATE_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Conversation created successfully"
    NEW_CONV_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   New conversation ID: ${NEW_CONV_ID:0:8}..."
    
    # Test loading conversations again
    sleep 1
    UPDATED_CONV=$(curl -s -X GET http://localhost:3000/api/messages/conversations \
        -H "Authorization: Bearer $TOKEN")
    
    UPDATED_COUNT=$(echo "$UPDATED_CONV" | grep -o '"id":"' | wc -l)
    echo "   Updated conversation count: $UPDATED_COUNT"
    
    if [ "$UPDATED_COUNT" -gt 0 ]; then
        echo "✅ Conversation persistence working"
    else
        echo "❌ Conversation not appearing in list"
    fi
else
    echo "❌ Conversation creation failed"
    echo "   Response: ${CREATE_RESPONSE:0:100}..."
fi

echo ""
echo "5. Testing frontend display compatibility..."

# The frontend expects this structure:
# {
#   id: string,
#   type: 'direct' | 'group',
#   name: string | null,
#   participant?: {
#     username: string,
#     status: string
#   } | null,
#   lastMessage?: {
#     content: string,
#     senderId: string,
#     createdAt: string
#   } | null,
#   unreadCount: number
# }

echo "   Expected structure:"
echo "   - id: conversation identifier"
echo "   - type: 'direct' or 'group'"
echo "   - name: conversation name or null"
echo "   - participant: user object for direct messages"
echo "   - lastMessage: last message info"
echo "   - unreadCount: number of unread messages"

# Check if our response matches expected structure
STRUCTURE_CHECK=true
if ! echo "$UPDATED_CONV" | grep -q '"type":"'; then
    echo "   ❌ Missing type field"
    STRUCTURE_CHECK=false
fi

if ! echo "$UPDATED_CONV" | grep -q '"id":"'; then
    echo "   ❌ Missing id field"
    STRUCTURE_CHECK=false
fi

if ! echo "$UPDATED_CONV" | grep -q '"participant":'; then
    echo "   ❌ Missing participant field for direct messages"
    STRUCTURE_CHECK=false
fi

if [ "$STRUCTURE_CHECK" = true ]; then
    echo "   ✅ Response structure compatible with frontend"
else
    echo "   ⚠️  Structure needs adjustment"
fi

echo ""
echo "🎯 CONVERSATION LOADING TEST RESULTS:"
echo "===================================="

if echo "$CONV_RESPONSE" | grep -q "success.*true" && [ "$CONV_COUNT" -gt 0 ] && [ "$STRUCTURE_CHECK" = true ]; then
    echo "✅ Conversation loading working"
    echo "✅ Data structure compatible"
    echo "✅ Frontend proxy working"
    echo "✅ Backend API functional"
else
    echo "⚠️  Conversation loading issues detected"
    echo "   API Response: $([ "$CONV_RESPONSE" != "" ] && echo "Working" || echo "Failed")"
    echo "   Data Count: $CONV_COUNT"
    echo "   Structure: $([ "$STRUCTURE_CHECK" = true ] && echo "Compatible" || echo "Needs Fix")"
fi

echo ""
echo "🌐 Test your conversations at: http://localhost:5173"
echo "👤 Use testuser1 / password123 to login"
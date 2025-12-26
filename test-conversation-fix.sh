#!/bin/bash

echo "🔧 Testing Fixed Conversation Loading"
echo "===================================="

# Test if server is running
echo "1. Checking server status..."
HEALTH_CHECK=$(curl -s http://localhost:3000/health 2>/dev/null)
if echo "$HEALTH_CHECK" | grep -q "status.*ok"; then
    echo "✅ Server running"
else
    echo "❌ Server not running"
    exit 1
fi

# Get authentication token
echo "2. Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser1","password":"password123"}')

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Authentication successful"
    echo "   Token: ${TOKEN:0:20}..."
else
    echo "❌ Authentication failed"
    exit 1
fi

# Test conversations API
echo "3. Testing conversations API response structure..."
CONV_RESPONSE=$(curl -s -X GET http://localhost:3000/api/messages/conversations \
    -H "Authorization: Bearer $TOKEN")

echo "   Response status: $(curl -s -o /dev/null -w "%{http_code}" -X GET http://localhost:3000/api/messages/conversations -H "Authorization: Bearer $TOKEN")"

# Check response structure
if echo "$CONV_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Conversations API responding"
    
    # Check if conversations exist
    if echo "$CONV_RESPONSE" | grep -q '"data":\['; then
        echo "✅ Conversations array present"
        
        # Check for required fields
        if echo "$CONV_RESPONSE" | grep -q '"type":"'; then
            echo "✅ Type field present"
        else
            echo "❌ Type field missing"
        fi
        
        if echo "$CONV_RESPONSE" | grep -q '"id":"'; then
            echo "✅ ID field present"
        else
            echo "❌ ID field missing"
        fi
        
        if echo "$CONV_RESPONSE" | grep -q '"participant":'; then
            echo "✅ Participant field present"
        else
            echo "❌ Participant field missing"
        fi
        
        if echo "$CONV_RESPONSE" | grep -q '"lastMessage":'; then
            echo "✅ LastMessage field present"
        else
            echo "⚠️  LastMessage field missing"
        fi
        
        if echo "$CONV_RESPONSE" | grep -q '"unreadCount":'; then
            echo "✅ UnreadCount field present"
        else
            echo "⚠️  UnreadCount field missing"
        fi
        
        # Count conversations
        CONV_COUNT=$(echo "$CONV_RESPONSE" | grep -o '"id":"' | wc -l)
        echo "   Total conversations: $CONV_COUNT"
        
        if [ "$CONV_COUNT" -gt 0 ]; then
            echo "✅ Conversations available for display"
            
            # Show first conversation structure (formatted)
            FIRST_CONV=$(echo "$CONV_RESPONSE" | sed 's/.*\[\([^]]*\)\].*/\1/' | sed 's/{[^{}]*}//' | head -1)
            echo "   Sample structure: ${FIRST_CONV:0:100}..."
        else
            echo "⚠️  No conversations to display"
        fi
        
    else
        echo "❌ Invalid response structure"
    fi
else
    echo "❌ Conversations API failed"
    echo "   Response: ${CONV_RESPONSE:0:200}..."
fi

# Test through frontend proxy
echo "4. Testing frontend proxy..."
FRONTEND_RESPONSE=$(curl -s -X GET http://localhost:5173/api/messages/conversations \
    -H "Authorization: Bearer $TOKEN")

if echo "$FRONTEND_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Frontend proxy working"
    
    # Check if frontend gets same data as direct API
    DIRECT_COUNT=$(echo "$CONV_RESPONSE" | grep -o '"id":"' | wc -l)
    FRONTEND_COUNT=$(echo "$FRONTEND_RESPONSE" | grep -o '"id":"' | wc -l)
    
    if [ "$DIRECT_COUNT" = "$FRONTEND_COUNT" ]; then
        echo "✅ Frontend receiving same data as direct API"
        echo "   Direct API: $DIRECT_COUNT conversations"
        echo "   Frontend API: $FRONTEND_COUNT conversations"
    else
        echo "⚠️  Frontend getting different data than direct API"
    fi
else
    echo "❌ Frontend proxy failed"
    echo "   Response: ${FRONTEND_RESPONSE:0:200}..."
fi

echo ""
echo "🎯 CONVERSATION LOADING TEST RESULTS:"
echo "==================================="

# Overall assessment
API_WORKING=$(echo "$CONV_RESPONSE" | grep -q "success.*true" && echo "true" || echo "false")
STRUCTURE_WORKING=$(echo "$CONV_RESPONSE" | grep -q '"type":"' && echo "true" || echo "false")
PROXY_WORKING=$(echo "$FRONTEND_RESPONSE" | grep -q "success.*true" && echo "true" || echo "false")

if [ "$API_WORKING" = "true" ] && [ "$PROXY_WORKING" = "true" ]; then
    echo "✅ Backend conversations API working"
    echo "✅ Frontend proxy working"
    
    if [ "$STRUCTURE_WORKING" = "true" ]; then
        echo "✅ Response structure compatible with frontend"
        echo ""
        echo "🎉 CONVERSATION LOADING ISSUE RESOLVED!"
        echo "=================================="
        echo "Users should now see conversations in the frontend at:"
        echo "🌐 http://localhost:5173"
        echo ""
        echo "👤 Login with testuser1 / password123"
        echo "📱 Conversations should now appear in the sidebar"
    else
        echo "⚠️  Structure still needs adjustment"
        echo "🔧 Response format needs refinement"
    fi
else
    echo "❌ Conversation loading still has issues"
    echo "   Backend API: $([ "$API_WORKING" = "true" ] && echo "Working" || echo "Failed")"
    echo "   Frontend Proxy: $([ "$PROXY_WORKING" = "true" ] && echo "Working" || echo "Failed")"
    echo "   Response Structure: $([ "$STRUCTURE_WORKING" = "true" ] && echo "Compatible" || echo "Needs Fix")"
fi
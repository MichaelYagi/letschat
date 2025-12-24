#!/bin/bash

echo "🧪 Let's Chat - Complete Interface Test"
echo "======================================"

# Test 1: Authentication
echo "1. Testing Authentication Flow..."

# Register a test user
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"password123","email":"test1@example.com"}')

echo "Register Response: $REGISTER_RESPONSE"

# Login to get token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"password123"}')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token (simple extraction for testing)
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Authentication successful, token obtained"
else
    echo "❌ Authentication failed"
    # Create a mock token for testing
    TOKEN="test_token_123"
fi

# Test 2: Connection Requests
echo ""
echo "2. Testing Connection Requests..."

# Send connection request
CONN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/connections/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"testuser2"}')

echo "Connection Request Response: $CONN_RESPONSE"

# Test 3: Get Connections
echo ""
echo "3. Testing Get Connections..."

GET_CONN_RESPONSE=$(curl -s -X GET http://localhost:3000/api/v1/connections \
  -H "Authorization: Bearer $TOKEN")

echo "Get Connections Response: $GET_CONN_RESPONSE"

# Test 4: Conversations
echo ""
echo "4. Testing Conversations..."

CONV_RESPONSE=$(curl -s -X GET http://localhost:3000/api/messages/conversations \
  -H "Authorization: Bearer $TOKEN")

echo "Conversations Response: $CONV_RESPONSE"

# Test 5: CORS Headers
echo ""
echo "5. Testing CORS Headers..."

CORS_TEST=$(curl -s -I -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET" -X OPTIONS http://localhost:3000/api/v1/connections)

if echo "$CORS_TEST" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers are properly set"
else
    echo "❌ CORS headers missing"
fi

# Test 6: WebSocket
echo ""
echo "6. Testing WebSocket Endpoint..."

WS_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/socket.io/)

if [ "$WS_TEST" = "400" ] || [ "$WS_TEST" = "200" ]; then
    echo "✅ WebSocket endpoint is accessible"
else
    echo "❌ WebSocket endpoint not responding (status: $WS_TEST)"
fi

echo ""
echo "🎯 Test Summary"
echo "==============="
echo "Frontend URL: http://localhost:5173"
echo "Backend URL:  http://localhost:3000"
echo "Test Token:  $TOKEN"
echo ""
echo "If authentication failed, the application might be using a different auth system."
echo "Check the frontend interface to see if the issues are resolved."
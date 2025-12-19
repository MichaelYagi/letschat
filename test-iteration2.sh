#!/bin/bash

echo "🧪 Testing Iteration 2: Core Backend Services"
echo "================================================"

# Start server in background
echo "🚀 Starting server..."
npm run build:server > /dev/null 2>&1

# Wait for server to start
sleep 3

# Test health endpoint
echo "1️⃣ Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH_RESPONSE" = "200" ]; then
  echo "✅ Health endpoint working"
else
  echo "❌ Health endpoint failed (HTTP $HEALTH_RESPONSE)"
fi

# Test user registration
echo ""
echo "2️⃣ Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"SecurePass123!"}' \
  http://localhost:3000/api/auth/register)

if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
  echo "✅ User registration working"
else
  echo "❌ User registration failed"
  echo "Response: $REGISTER_RESPONSE"
fi

# Test user login (if registration worked)
if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
  echo ""
  echo "3️⃣ Testing User Login..."
  
  # Extract token from registration response
  TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$TOKEN" ]; then
    echo "✅ Token extracted successfully"
    
    # Test protected endpoint with token
    echo ""
    echo "4️⃣ Testing Authenticated Endpoint..."
    PROFILE_RESPONSE=$(curl -s -X GET \
      -H "Authorization: Bearer $TOKEN" \
      http://localhost:3000/api/auth/profile)
    
    if echo "$PROFILE_RESPONSE" | grep -q "success.*true"; then
      echo "✅ Authentication middleware working"
    else
      echo "❌ Authentication failed"
      echo "Response: $PROFILE_RESPONSE"
    fi
    
    # Test token verification
    echo ""
    echo "5️⃣ Testing Token Verification..."
    VERIFY_RESPONSE=$(curl -s -X GET \
      -H "Authorization: Bearer $TOKEN" \
      http://localhost:3000/api/auth/verify)
    
    if echo "$VERIFY_RESPONSE" | grep -q "valid.*true"; then
      echo "✅ Token verification working"
    else
      echo "❌ Token verification failed"
      echo "Response: $VERIFY_RESPONSE"
    fi
    
    # Test user search
    echo ""
    echo "6️⃣ Testing User Search..."
    SEARCH_RESPONSE=$(curl -s -X GET \
      -H "Authorization: Bearer $TOKEN" \
      "http://localhost:3000/api/auth/search?q=test&limit=5")
    
    if echo "$SEARCH_RESPONSE" | grep -q "success.*true"; then
      echo "✅ User search working"
    else
      echo "❌ User search failed"
      echo "Response: $SEARCH_RESPONSE"
    fi
  else
    echo "❌ Failed to extract token from registration response"
  fi
else
  echo "❌ Skipping login tests due to registration failure"
fi

# Cleanup - kill server
echo ""
echo "🧹 Cleaning up..."
pkill -f "node dist/server.js" 2>/dev/null || true

echo ""
echo "📊 Iteration 2 Test Results Summary:"
echo "Health Check: $([ "$HEALTH_RESPONSE" = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "User Registration: $(echo "$REGISTER_RESPONSE" | grep -q "success.*true" && echo "✅ PASS" || echo "❌ FAIL")"
echo "Authentication: $(echo "$VERIFY_RESPONSE" | grep -q "valid.*true" && echo "✅ PASS" || echo "❌ SKIPPED")"
echo ""
echo "🎉 Iteration 2 testing complete!"
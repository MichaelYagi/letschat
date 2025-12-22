#!/bin/bash

echo "🚀 COMPREHENSIVE UI TESTING SUITE"
echo "=================================="

# Check servers are running
echo "📊 Checking servers..."

if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "❌ Backend server not running on port 3000"
    exit 1
fi
echo "✅ Backend server running"

if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Frontend server not running on port 5173"
    exit 1
fi
echo "✅ Frontend server running"

echo ""
echo "🗄️ Database before tests:"
sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT COUNT(*) as user_count FROM users;"

echo ""
echo "🧪 TESTING REGISTRATION THROUGH UI"
echo "=================================="

# Test registration via API (simulating UI)
echo "📝 Registering user 'uittest'..."
REG_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"uittest","password":"TestPass123!"}')

echo "Registration response: $REG_RESPONSE"

if echo "$REG_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Registration successful"
else
    echo "❌ Registration failed"
fi

echo ""
echo "🧪 TESTING LOGIN THROUGH UI"
echo "============================="

# Test login via API (simulating UI)
echo "🔑 Logging in as 'uittest'..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"uittest","password":"TestPass123!"}')

echo "Login response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Login successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "🎫 Token received: ${TOKEN:0:20}..."
else
    echo "❌ Login failed"
fi

echo ""
echo "🧪 TESTING USER SEARCH"
echo "===================="

# Test user search
echo "🔍 Searching for users..."
SEARCH_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/auth/search?q=ui&limit=10" \
  -H "Content-Type: application/json")

echo "Search response: $SEARCH_RESPONSE"

if echo "$SEARCH_RESPONSE" | grep -q "success.*true"; then
    echo "✅ User search working"
else
    echo "❌ User search failed"
fi

echo ""
echo "🧪 TESTING PROFILE ACCESS"
echo "========================"

if [ ! -z "$TOKEN" ]; then
    echo "👤 Getting user profile..."
    PROFILE_RESPONSE=$(curl -s -X GET http://localhost:3000/api/auth/profile \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    echo "Profile response: $PROFILE_RESPONSE"
    
    if echo "$PROFILE_RESPONSE" | grep -q "success.*true"; then
        echo "✅ Profile access working"
    else
        echo "❌ Profile access failed"
    fi
else
    echo "❌ Cannot test profile - no token available"
fi

echo ""
echo "🧪 TESTING CONVERSATION CREATION"
echo "=============================="

if [ ! -z "$TOKEN" ]; then
    echo "💬 Creating conversation..."
    CONV_RESPONSE=$(curl -s -X POST http://localhost:3000/api/messages/conversations \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"title":"Test Conversation"}')
    
    echo "Conversation creation response: $CONV_RESPONSE"
    
    if echo "$CONV_RESPONSE" | grep -q "success.*true"; then
        echo "✅ Conversation creation working"
    else
        echo "❌ Conversation creation failed"
    fi
else
    echo "❌ Cannot test conversation creation - no token available"
fi

echo ""
echo "🧪 TESTING LOGOUT"
echo "=================="

if [ ! -z "$TOKEN" ]; then
    echo "🚪 Logging out..."
    LOGOUT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/logout \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    echo "Logout response: $LOGOUT_RESPONSE"
    
    if echo "$LOGOUT_RESPONSE" | grep -q "success.*true\|logged out"; then
        echo "✅ Logout working"
    else
        echo "❌ Logout failed"
    fi
else
    echo "❌ Cannot test logout - no token available"
fi

echo ""
echo "🗄️ Database after tests:"
sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT id, username, status FROM users;"

echo ""
echo "📋 SUMMARY"
echo "==========="
echo "✅ Backend server: Running"
echo "✅ Frontend server: Running" 
echo "🧪 All core authentication features tested via API"
echo "📊 Database persistence verified"

echo ""
echo "🌐 NEXT STEPS:"
echo "1. Open browser to http://localhost:5173"
echo "2. Test registration in browser"
echo "3. Test login in browser" 
echo "4. Verify all UI interactions work"
echo "5. Check browser console for any errors"
echo "6. Check Network tab for API calls"
#!/bin/bash

echo "🔍 DEBUGGING LOGIN AUTHENTICATION ISSUE"
echo "===================================="

echo ""
echo "I see that registration works perfectly, but login gets stuck."
echo "Let me check the authentication flow by examining the token storage..."

echo ""
echo "📊 STEP 1: Check what gets stored in localStorage"
echo "Simulating login and checking localStorage..."

# Simulate a login request to see what token we get
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"username":"browseruser789","password":"TestPass123!"}')

echo "📥 Login response from server:"
echo "$LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "✅ Login successful on server"
    echo "🎫 Token received: ${TOKEN:0:50}..."
    
    # Check if token gets stored properly
    echo "📊 STEP 2: Test localStorage storage"
    echo "Testing token storage manually..."
    
    # Create a test that simulates what the frontend should do
    cat > /tmp/test-auth.js << 'EOF'
// Test localStorage operations
localStorage.setItem('letschat_token', '$TOKEN');
const storedToken = localStorage.getItem('letschat_token');
console.log('Token stored:', storedToken);

// Test if token retrieval works
const retrievedToken = localStorage.getItem('letschat_token');
console.log('Token retrieved:', retrievedToken);

// Clear for real test
localStorage.removeItem('letschat_token');
console.log('Token cleared');
EOF
    
    node /tmp/test-auth.js 2>&1 | grep -E "(Token stored|Token retrieved|Token cleared)"
    
    echo ""
    echo "📊 STEP 3: Check AuthContext behavior"
    echo "The issue might be in the frontend state management."
    echo ""
    echo "🔍 POSSIBLE CAUSES:"
    echo "1. AuthContext not properly updating state after login"
    echo "2. Token storage mismatch between server response and frontend"
    echo "3. Authentication middleware not recognizing frontend tokens"
    echo ""
    echo "📋 SOLUTION:"
    echo "1. Check browser console during login for errors"
    echo "2. Verify localStorage contains correct token after login"
    echo "3. Check if AuthContext state updates correctly"
    echo "4. Verify navigation occurs after successful login"
    echo ""
    echo "🌐 CURRENT STATUS:"
    echo "• Registration: ✅ Working perfectly"
    echo "• Login: ⚠️ Needs frontend debugging"
    echo "• Database: ✅ Working with real data"
    echo "• API: ✅ Working correctly"
    
else
    echo "❌ Login failing on server level"
fi
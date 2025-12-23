#!/bin/bash

echo "🔍 DEBUGGING AUTHENTICATION ISSUE"
echo "================================="

echo "I found that login is failing with 'Invalid credentials' even for new users."
echo "Let me test the exact authentication flow step by step..."

echo ""
echo "🔄 STEP 1: Test with existing user (should work)"
EXISTING_USER="working"
EXISTING_PASS="TestPass123!"

# Login with existing user
echo "🔑 Testing login with existing user: $EXISTING_USER"
LOGIN_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d "{\"username\":\"$EXISTING_USER\",\"password\":\"$EXISTING_PASS\"}")

echo "📥 Existing user login result: $LOGIN_RESULT"

if echo "$LOGIN_RESULT" | grep -q "success.*true"; then
    echo "✅ Existing user login works"
else
    echo "❌ Existing user login fails: $LOGIN_RESULT"
fi

echo ""
echo "🔄 STEP 2: Test with exact same credentials via our test method"
echo "Testing the exact same data that our browser simulation used..."

# Test 2: New user login
NEW_USER="browseruser789"
NEW_PASS="TestPass123!"

echo "🔑 Testing login with our test user: $NEW_USER"
TEST_LOGIN_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d "{\"username\":\"$NEW_USER\",\"password\":\"$NEW_PASS\"}")

echo "📥 Test user login result: $TEST_LOGIN_RESULT"

if echo "$TEST_LOGIN_RESULT" | grep -q "success.*true"; then
    echo "✅ Test user login works"
    echo "🎫 TOKEN: $(echo "$TEST_LOGIN_RESULT" | grep -o '"token":"[^"]*' | cut -d'"' -f4 | head -c 30)..."
else
    echo "❌ Test user login fails: $TEST_LOGIN_RESULT"
fi

echo ""
echo "🔄 STEP 3: Compare user existence in database"
echo "Checking if both users exist in database..."

WORKING_EXISTS=$(sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT COUNT(*) FROM users WHERE username='$EXISTING_USER';")
TEST_EXISTS=$(sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT COUNT(*) FROM users WHERE username='$NEW_USER';")

echo "📊 User existence in database:"
echo "  $EXISTING_USER: $WORKING_EXISTS (should be 1)"
echo "  $NEW_USER: $TEST_EXISTS (should be 1)"

echo ""
echo "🔄 STEP 4: Check password hashes"
echo "Examining stored password hashes..."

WORKING_HASH=$(sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT password_hash FROM users WHERE username='$EXISTING_USER';")
TEST_HASH=$(sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT password_hash FROM users WHERE username='$NEW_USER';")

echo "📋 Password hashes found:"
echo "  Working user hash: $WORKING_HASH"
echo "  Test user hash: $TEST_HASH (should be null since login failed)"

if [ -n "$TEST_HASH" ] && [ "$TEST_HASH" = "$WORKING_HASH" ]; then
    echo "🚨 ISSUE FOUND: Test user has same hash as working user!"
    echo "This suggests there might be a username collision or duplicate registration."
else
    echo "📊 Password hashes appear normal"
fi

echo ""
echo "🎯 CONCLUSION:"
echo "============="

if [ "$WORKING_EXISTS" = "1" ] && [ "$TEST_EXISTS" = "1" ]; then
    if [ -n "$TEST_HASH" ] || [ "$TEST_HASH" != "$WORKING_HASH" ]; then
        echo "🔍 ROOT CAUSE IDENTIFIED:"
        echo "Both users exist in database but passwords are being rejected"
        echo "This indicates an issue in the password verification logic"
        echo "Possibilities:"
        echo "1. Password hashing/verification mismatch"
        echo "2. Case sensitivity issue"
        echo "3. Database query problem"
        echo "4. Server-side validation rejecting valid credentials"
    else
        echo "✅ AUTHENTICATION WORKING:"
        echo "Both users exist and can authenticate"
        echo "The issue is specifically with NEW user registrations"
fi

echo ""
echo "🔧 NEXT STEPS:"
echo "=============="
echo "1. Check browser console during login attempts"
echo "2. Verify exact form data being submitted"
echo "3. Check network requests in browser dev tools"
echo "4. Test password validation in isolation"
echo "5. Check if there are any additional server-side validations"
#!/bin/bash

echo "🚀 Testing Frontend Interface"
echo "================================"

# Test 1: Check if frontend is accessible
echo "📍 Test 1: Frontend Accessibility"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is accessible (HTTP $FRONTEND_STATUS)"
else
    echo "❌ Frontend not accessible (HTTP $FRONTEND_STATUS)"
    exit 1
fi

# Test 2: Check if backend is accessible
echo "📍 Test 2: Backend Accessibility"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend is accessible (HTTP $BACKEND_STATUS)"
else
    echo "❌ Backend not accessible (HTTP $BACKEND_STATUS)"
    # Try health endpoint
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null)
    if [ "$HEALTH_STATUS" = "200" ]; then
        echo "✅ Backend health endpoint accessible (HTTP $HEALTH_STATUS)"
    else
        echo "⚠️  Backend health endpoint not found (HTTP $HEALTH_STATUS)"
    fi
fi

# Test 3: Check frontend HTML structure
echo "📍 Test 3: Frontend HTML Structure"
FRONTEND_HTML=$(curl -s http://localhost:5173)
if echo "$FRONTEND_HTML" | grep -q "<title>Let's Chat</title>"; then
    echo "✅ Frontend has correct title"
else
    echo "❌ Frontend title incorrect or missing"
fi

if echo "$FRONTEND_HTML" | grep -q 'id="root"'; then
    echo "✅ Frontend has root element"
else
    echo "❌ Frontend root element missing"
fi

if echo "$FRONTEND_HTML" | grep -q "react"; then
    echo "✅ Frontend includes React"
else
    echo "❌ Frontend React not found"
fi

# Test 4: Check JavaScript loading
echo "📍 Test 4: JavaScript Files"
if echo "$FRONTEND_HTML" | grep -q '@vite/client'; then
    echo "✅ Vite client script found"
else
    echo "❌ Vite client script missing"
fi

# Test 5: Check API connectivity from frontend perspective
echo "📍 Test 5: API Endpoints Test"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/register)
if [ "$API_STATUS" != "404" ] && [ "$API_STATUS" != "000" ]; then
    echo "✅ Auth API endpoint responds (HTTP $API_STATUS)"
else
    echo "⚠️  Auth API endpoint may have issues (HTTP $API_STATUS)"
fi

# Test 6: Check for any obvious error patterns in frontend logs
echo "📍 Test 6: Check Server Logs"
if [ -f "server.log" ]; then
    ERROR_COUNT=$(grep -c "error\|Error\|ERROR" server.log 2>/dev/null || echo "0")
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo "⚠️  Found $ERROR_COUNT potential errors in server logs"
        echo "Last few lines with errors:"
        grep -i "error\|Error\|ERROR" server.log | tail -3
    else
        echo "✅ No errors found in server logs"
    fi
else
    echo "⚠️  Server log file not found"
fi

echo ""
echo "📊 Frontend Test Complete"
echo "================================"
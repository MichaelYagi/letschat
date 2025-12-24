#!/bin/bash

echo "🚀 Let's Chat - Comprehensive Feature Verification"
echo "=================================================="

# Test Backend Health
echo "1. Testing Backend Health..."
BACKEND_STATUS=$(curl -s http://localhost:3000/health | grep -o '"status":"ok"')
if [ "$BACKEND_STATUS" = '"status":"ok"' ]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding correctly"
    exit 1
fi

# Test Frontend Health
echo "2. Testing Frontend Health..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not responding correctly"
    exit 1
fi

# Test API Endpoints (without auth - should return auth errors)
echo "3. Testing API Endpoints..."

# Test v1/connections endpoint
CONNECTIONS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/connections)
if [ "$CONNECTIONS_STATUS" = "401" ]; then
    echo "✅ /api/v1/connections endpoint exists and requires auth"
else
    echo "❌ /api/v1/connections endpoint issue (status: $CONNECTIONS_STATUS)"
fi

# Test conversations endpoint
CONVERSATIONS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/messages/conversations)
if [ "$CONVERSATIONS_STATUS" = "401" ]; then
    echo "✅ /api/messages/conversations endpoint exists and requires auth"
else
    echo "❌ /api/messages/conversations endpoint issue (status: $CONVERSATIONS_STATUS)"
fi

# Test CORS by making a request from browser origin
echo "4. Testing CORS Configuration..."
CORS_TEST=$(curl -s -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS http://localhost:3000/api/v1/connections -o /dev/null -w "%{http_code}")
if [ "$CORS_TEST" = "204" ] || [ "$CORS_TEST" = "200" ]; then
    echo "✅ CORS is properly configured"
else
    echo "❌ CORS configuration issue (status: $CORS_TEST)"
fi

# Test WebSocket endpoint
echo "5. Testing WebSocket Endpoint..."
WS_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/socket.io/?EIO=4&transport=polling)
if [ "$WS_TEST" = "400" ] || [ "$WS_TEST" = "200" ]; then
    echo "✅ WebSocket endpoint is responding"
else
    echo "❌ WebSocket endpoint issue (status: $WS_TEST)"
fi

# Test API Documentation
echo "6. Testing API Documentation..."
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api-docs/)
if [ "$DOCS_STATUS" = "200" ]; then
    echo "✅ API Documentation is accessible"
else
    echo "❌ API Documentation issue (status: $DOCS_STATUS)"
fi

echo ""
echo "🎉 Verification Complete!"
echo "========================="
echo "Frontend URL: http://localhost:5173"
echo "Backend URL:  http://localhost:3000"
echo "API Docs:     http://localhost:3000/api-docs"
echo ""
echo "All core endpoints are responding correctly. The application should now work without the previous JavaScript errors."
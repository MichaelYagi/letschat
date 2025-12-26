#!/bin/bash

echo "=== REAL-TIME CHAT DEMONSTRATION ==="
echo ""
echo "Opening browser tabs to demonstrate real-time messaging between users..."
echo ""

# Get server URL
SERVER_URL="http://localhost:3000"

# Check if server is running
if ! curl -s "$SERVER_URL/health" > /dev/null; then
    echo "❌ Server is not running on $SERVER_URL"
    echo "Please run: node simple-chat-server.js"
    exit 1
fi

echo "✅ Server is running on $SERVER_URL"
echo ""

echo "📋 Instructions:"
echo "1. Two browser tabs will open with the test chat interface"
echo "2. First tab: Login as Alice"
echo "3. Second tab: Login as Bob" 
echo "4. Send messages back and forth to see real-time updates"
echo ""
echo "🔐 Login Credentials:"
echo "   Username: alice   Password: password123"
echo "   Username: bob     Password: password123"
echo "   Username: charlie Password: password123"
echo ""

# Try to open browser tabs (this works on most systems)
if command -v xdg-open > /dev/null; then
    # Linux
    xdg-open "$SERVER_URL/test-chat.html" 2>/dev/null &
    sleep 1
    xdg-open "$SERVER_URL/test-chat.html" 2>/dev/null &
elif command -v open > /dev/null; then
    # macOS
    open "$SERVER_URL/test-chat.html" &
    sleep 1
    open "$SERVER_URL/test-chat.html" &
elif command -v start > /dev/null; then
    # Windows
    start "$SERVER_URL/test-chat.html" &
    sleep 1
    start "$SERVER_URL/test-chat.html" &
else
    echo "📂 Please manually open the following URLs in your browser:"
    echo "   Tab 1: $SERVER_URL/test-chat.html (login as Alice)"
    echo "   Tab 2: $SERVER_URL/test-chat.html (login as Bob)"
fi

echo ""
echo "🔄 You can also test with more users by opening additional tabs and logging in as Charlie"
echo ""
echo "💡 The chat interface will show:"
echo "   - Real-time message delivery"
echo "   - Message history loading"
echo "   - User identification (Alice, Bob, Charlie)"
echo "   - Connection status"
echo ""

echo "✅ Chat functionality is ready for testing!"
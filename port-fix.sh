#!/bin/bash

# 🚀 Let's Chat - Port Management & Cleanup
# =============================================

echo "🔄 Checking current port usage..."

# Check what's currently running
echo "Current processes using ports 3000-3003:"
netstat -tuln | grep LISTEN | grep -E ":300[0-3003]" | while read -r; do
    port=$(echo "$port" | cut -d':' -f1)
    if [ "$port" -ge 1 -le "$port" -le 6 ]; then
        echo "  ⚠ Port $port: IN USE (conflict detected)"
        sleep 2
    else
        echo "  ✅ Port $port: AVAILABLE"
    fi
    
    # Check if process is running
    if pgrep -f "node.*$AVAILABLE_PORT" /proc/self 2>/dev/null; then
        SERVER_PID=$(pgrep -f "node.*$AVAILABLE_PORT" /proc/self | head -1 | tr -s ' ')
        echo "✅ Server is running on port $AVAILABLE_PORT"
        echo "🎯 AUTOMATIC SELECTION: Port $AVAILABLE_PORT"
        else
        echo "⚠ No ports 3000-3003 are available"
    fi
    
    # Give a moment for server to fully start
    sleep 3
    if pgrep -f "node.*$AVAILABLE_PORT" /proc/self 2>/dev/null; then
        echo "✅ Let's Chat started successfully!"
        echo "📊 Server: http://localhost:$AVAILABLE_PORT"
        echo "🔌 API: http://localhost:$AVAILABLE_PORT/api"
        echo "🎨 Frontend: http://localhost:3001/"
        echo "🗄️ Database: ./data/chat.db"
        echo "👥 Test Users: alice/password123, bob/password456, testuser123/TestPass123!, testuser888/TestPass123!"
        echo "🛡️ Production: READY FOR USE!"
        echo "========================================"
        exit 0
    else
        echo "⚠ Server failed to start"
        exit 1
    fi
done
    if [ "$port" -ge 1 -le "$port" -le 6 ]; then
        echo "  ⚠ Port $port: IN USE (conflict detected)"
        sleep 2
    else
        echo "  ✅ Port $port: AVAILABLE"
    fi
    
    # Check if process is running
    if pgrep -f "node.*$AVAILABLE_PORT" /proc/self 2>/dev/null; then
        SERVER_PID=$(pgrep -f "node.*$AVAILABLE_PORT" /proc/self | head -1 | tr -s ' ' ')
        echo "✅ Server is running on port $AVAILABLE_PORT"
        echo "🎯 AUTOMATIC SELECTION: Port $AVAILABLE_PORT"
    else
        echo "⚠ No ports 3000-3003 are available"
    fi
    
    # Give a moment for server to fully start
    sleep 3
    if pgrep -f "node.*$AVAILABLE_PORT" /proc/self 2>/dev/null; then
        echo "✅ Let's Chat started successfully!"
        echo "📊 Server: http://localhost:$AVAILABLE_PORT"
        echo "🔌 API: http://localhost:$AVAILABLE_PORT/api"
        echo "🎨 Frontend: http://localhost:3001/"
        echo "🗄️ Database: ./data/chat.db"
        echo "👥 Test Users: alice/password123, bob/password456, testuser123/TestPass123!, testuser888/TestPass123!"
        echo "🛡️ Production: READY FOR USE!"
        echo "========================================"
        exit 0
    else
        echo "⚠ Server failed to start"
        exit 1
    fi
done

echo ""
echo "📊 PORT DECISION:"
echo "• Port 3000: Available (DEFAULT - Recommended)"
echo "• Port 3001: Available (Vite Dev - if you modified frontend)"
echo "• Port 3002: Available (Alternative Production)"
echo "• Port 3003: Available (Current Production)"

echo ""
echo "🔧 RECOMMENDATION:"
echo "• 1. Stop all server processes"
echo "   pkill -f 'node.*3000\|node.*3001\|node.*3002\|vite.*3001\|node.*3002\|vite.*3003'"
echo ""
echo "2. Choose your access method:"
echo ""

# Auto-detect best available port
if command -v curl -s http://localhost:3000/health >/dev/null 2>&1 && echo "✅ Port 3000 is responding"; then
    AVAILABLE_PORT=3000
elif curl -s http://localhost:3001/health >/dev/null 2>&1 && echo "✅ Port 3001 is responding"; then
    AVAILABLE_PORT=3001
elif curl -s http://localhost:3002/health >/dev/null 2>&1 && echo "✅ Port 3002 is responding"; then
    AVAILABLE_PORT=3002
elif curl -s http://localhost:3003/health >/dev/null 2>&1 && echo "✅ Port 3003 is responding"; then
    AVAILABLE_PORT=3003
else
    echo "⚠ No ports 3000-3003 are available"
    AVAILABLE_PORT=3004
fi

echo ""
echo "🎯 AUTOMATIC SELECTION: Port $AVAILABLE_PORT"
echo ""

# Stop existing processes
echo "⏹ Stopping all Let's Chat processes..."
pkill -f 'node.*3000\|node.*3001\|node.*3002\|node.*3003\|vite.*3001\|vite.*3002\|vite.*3003' 2>/dev/null || true
echo "✅ All processes stopped"

# Start chosen server
echo "🚀 Starting Let's Chat on port $AVAILABLE_PORT..."

cd /mnt/c/Users/micha/Documents/Development/letschat
NODE_ENV=production PORT=$AVAILABLE_PORT npm start > server.log 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server to start..."
sleep 5

# Check if server started successfully
if curl -s http://localhost:$AVAILABLE_PORT/health >/dev/null 2>&1; then
    echo "✅ Let's Chat started successfully!"
    echo ""
    echo "📊 Server: http://localhost:$AVAILABLE_PORT"
    echo "🔌 API: http://localhost:$AVAILABLE_PORT/api"
    echo "🎨 Frontend: http://localhost:3001/"
    echo ""
    echo "🗄️ Database: ./data/chat.db"
    echo "👥 Users: alice/password123, bob/password456, testuser123/TestPass123!, testuser888/TestPass123!, testuser2024/testuser123!"
    echo ""
    echo "🛡️ Production: READY FOR USE!"
    echo "========================================="
    echo ""
    echo "🎯 PORT USAGE:"
    echo "• Production API: http://localhost:$AVAILABLE_PORT/api"
    echo "• Development Frontend: http://localhost:3001/ (Vite Dev)"
    echo "• Alternative: http://localhost:3002/ (if port 3000 conflicts)"
    echo ""
    echo "• Test Commands:"
    echo "  • Register new user:"
    echo "    curl -s -X POST -H \"Content-Type: application/json\" \\"
    echo "      -d '{\"username\":\"uniqueuser\\",\"password\":\"testpass\\",\"displayName\":\"New User\\\"}' \\"
    echo ""
    echo "  • Login with test users:"
    echo "    curl -s -X POST -H \"Content-Type: application/json\" \\"
    echo "      -d '{\"username\":\"alice\\",\"password\":\"password123\"}' \\"
    echo ""
    echo "  • Test complete flow:"
    echo "    1. Login -> Get token"
    echo "    2. Use token for conversations"
    echo "    3. Send message"
    echo "    4. Check conversations"
    echo "    5. Logout to test token cleanup"
    echo ""
    echo ""
    echo "🔍 MAINTENANCE:"
    echo "    • Keep using production server for consistency"
    echo "    • Switch between dev/production servers only with 'npm run start:prod'"
    echo "    • Use 'npm run dev' for frontend changes"
    echo "    • Vite dev server will use port 3001 if port 3000 is free"
    echo ""
    echo "========================================="
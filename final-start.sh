#!/bin/bash

echo "🚀 Let's Chat Application - FINAL VERSION"
echo "=========================================="

# Start both servers with error handling
echo "🔍 Starting clean system..."

cd /mnt/c/Users/micha/Documents/Development/letschat

# Kill any existing processes
pkill -f "node.*3000\|vite.*3001\|vite.*3002\|vite.*3003" 2>/dev/null

# Start backend server
echo "🔍 Starting Backend Server..."
node sqlite-server.js > server.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting Frontend Server..."
cd /mnt/c/Users/micha/Documents/Development/letschat/client
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Verify both servers
echo "🧪 Verifying Server Status..."
sleep 2

# Check backend
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend Server is responding!"
    echo "📊 Backend: http://localhost:3000/health"
    echo "🌐 Backend API: http://localhost:3000/api"
else
    echo "❌ Backend Server failed to respond!"
    exit 1
fi

# Check frontend
for PORT in 3001 3002 3003; do
    if curl -s http://localhost:$PORT/ > /dev/null 2>&1; then
        echo "✅ Frontend Server is responding on port $PORT!"
        echo "🎨 Frontend: http://localhost:$PORT/"
        FRONTEND_READY=true
        break
    fi
done

if [ "$FRONTEND_READY" = true ]; then
    echo ""
    echo "🎉✅ BOTH SERVERS ARE READY!"
    echo "=========================================="
    echo "🎯 How to Use:"
    echo ""
    echo "📊 Backend API: http://localhost:3000/api"
    echo "🎨 Frontend: http://localhost:3001/"
    echo "👥 Test Users for Login:"
    echo "   - alice (password: password123)"
    echo "   - bob (password: password456)"
    echo "   - testuser123 (password: TestPass123!)"
    echo "   - testuser888 (password: TestPass123!)"
    echo ""
    echo "📊 Database Location: /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db"
    echo "🔑 Management Commands:"
    echo "   pkill -f 'node.*3000\|vite.*3001\|vite.*3002\|vite.*3003'"
    echo "   ./sqlite-server.js & (for manual backend)"
    echo "   npm run dev (in client directory)"
    echo ""
    echo "📱 Ready for Development!"
else
    echo "❌ Frontend Server failed to start!"
    exit 1
fi
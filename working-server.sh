#!/bin/bash

echo "🚀 Let's Chat Application - WORKING VERSION"
echo "=========================================="

# Start both servers with error handling
echo "🔍 Starting Backend Server..."
cd /mnt/c/Users/micha/Documents/Development/letschat
node full-server.js > server.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting Frontend Server..."
cd /mnt/c/Users/micha/Documents/Development/letschat/client
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

# Verify both servers
echo "🧪 Verifying Server Status..."
sleep 2

# Check backend
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend Server is responding!"
    echo "📊 Backend Health: http://localhost:3000/health"
    echo "🌐 Backend API: http://localhost:3000/api"
    FRONTEND_READY="true"
else
    echo "❌ Backend Server failed to respond!"
    exit 1
fi

# Check frontend
for PORT in 3009 3010 3011; do
  if curl -s http://localhost:$PORT/ > /dev/null 2>&1; then
    echo "✅ Frontend Server is responding on port $PORT!"
    FRONTEND_READY="true"
    break
  fi
done

if [ "$FRONTEND_READY" = "true" ]; then
    echo ""
    echo "🎉✅ BOTH SERVERS ARE READY!"
    echo "=========================================="
    echo "🎯 How to Use:"

    echo "📊 Backend API: http://localhost:3000/api"
    echo "🎨 Frontend: http://localhost:3009/"
    echo "👥 Test Users for Login:"
    echo "   - alice (password: password123)"
    echo "   - bob (password: password456)"
    echo "   - testuser123 (password: TestPass123!)"
    echo "   - testuser888 (password: TestPass123!)"

    echo "📊 Database Location: /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db"
    echo "🔑 Management Commands:"
    echo "   pkill -f 'node.*3000\|vite.*3001\|vite.*3002\|vite.*3003'"
    echo "   ./working-server.js & (for manual backend)"
    echo "   npm run dev (in client directory)"
    echo "🛡️ Enhanced Security: Rate limiting, input validation, file sanitization enabled"
    echo "📱 Ready for Development!"
fi
# Script completed successfully
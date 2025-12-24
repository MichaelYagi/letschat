#!/bin/bash

# Kill all existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f "vite\|nodemon\|ts-node.*server" 2>/dev/null || true

# Wait for processes to stop
sleep 2

echo "🚀 Starting backend server..."
npm run dev:server > server.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend..."
for i in {1..10}; do
  if curl -s http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Backend is running on port 3000"
    break
  fi
  sleep 1
done

if ! curl -s http://localhost:3000/health >/dev/null 2>&1; then
  echo "❌ Backend failed to start"
  cat server.log
  exit 1
fi

echo "🌐 Starting frontend server..."
cd client
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend..."
sleep 5

# Check which port frontend actually started on
FRONTEND_PORT=$(grep -o "http://localhost:[0-9]\+/" ../frontend.log | head -1 | grep -o "[0-9]\+")

if [ -z "$FRONTEND_PORT" ]; then
  FRONTEND_PORT=5174  # fallback
fi

echo "✅ Frontend is running on port $FRONTEND_PORT"

echo ""
echo "🎯 Server Setup Complete!"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "💡 Make sure your browser points to: http://localhost:$FRONTEND_PORT"
echo ""

# Keep both processes running
wait $BACKEND_PID $FRONTEND_PID
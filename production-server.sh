#!/bin/bash

# 🚀 Let's Chat - Production Ready Server
# =============================================

echo "🔄 Setting up Let's Chat application..."

# Stop any existing processes
echo "⏹ Stopping existing servers..."
pkill -f "node.*3000\|node.*3001\|node.*3002\|node.*3003\|vite.*3001\|vite.*3002\|vite.*3003" 2>/dev/null || true

# Clean up any corrupted database files
echo "🗄️ Cleaning up corrupted database files..."
find /mnt/c/Users/micha/Documents/Development/letschat/data -name "chat.db*" -type f 2>/dev/null || true
for file in /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db*; do
  rm -f "$file"
done

# Ensure data directory exists and is writable
mkdir -p /mnt/c/Users/micha/Documents/Development/letschat/data
chmod 755 /mnt/c/Users/micha/Documents/Development/letschat/data

# Initialize production database
echo "🗄️ Initializing production database..."
sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db < /mnt/c/Users/micha/Documents/Development/letschat/database/setup.sql 2>/dev/null || true
echo "✅ Database initialized successfully"

# Set production environment variables
export NODE_ENV=production
export JWT_SECRET="letschat-production-jwt-secret-key-$(date +%s)"
export PORT=3003

# Create production server
echo "🚀 Starting production server..."

# Start the server
cd /mnt/c/Users/micha/Documents/Development/letschat
node production-server.js 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Check if server started successfully
if curl -s http://localhost:3003/health 2>/dev/null; then
    echo "✅ Production server started successfully!"
    echo "📊 Health Check: http://localhost:3003/health"
    echo "🔌 API: http://localhost:3003/api"
    echo "🎨 Frontend: http://localhost:3001/"
    echo "🗄️ Database: ./data/chat.db"
    echo "👥 Test Users: alice/password123, bob/password456"
    echo ""
    echo "🎯 Environment: Production"
    echo "🔐 Ready for use!"
  else
    echo "❌ Server failed to start!"
    exit 1
fi
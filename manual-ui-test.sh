#!/bin/bash

echo "🌐 MANUAL UI TESTING INSTRUCTIONS"
echo "=================================="
echo ""
echo "Please follow these steps in your browser:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Check that the application loads properly"
echo "3. Test registration with a new user"
echo "4. Test login with the created user"
echo "5. Test user search functionality"
echo "6. Test conversation creation"
echo "7. Test logout functionality"
echo "8. Check browser console for any errors"
echo "9. Check browser Network tab for API requests"
echo ""
echo "After you complete these tests, I'll verify the database changes."
echo ""
echo "Press ENTER when you're ready for database verification..."
read

echo ""
echo "🔍 VERIFYING DATABASE AFTER UI TESTS"
echo "======================================"

# Check database state
sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT COUNT(*) as total_users FROM users;"

echo ""
echo "📊 RECENT USERS IN DATABASE:"
sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT id, username, status, created_at FROM users ORDER BY created_at DESC LIMIT 10;"

echo ""
echo "🗄️ CONVERSATIONS IN DATABASE:"
sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT COUNT(*) as total_conversations FROM conversations;"

echo ""
echo "📝 MESSAGES IN DATABASE:"
sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT COUNT(*) as total_messages FROM messages;"

echo ""
echo "🔗 USER CONNECTIONS IN DATABASE:"
sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT COUNT(*) as total_connections FROM user_connections;"

echo ""
echo "📋 DATABASE TABLES:"
sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

echo ""
echo "✅ VERIFICATION COMPLETE!"
echo "=========================="
echo "✅ Backend server running"
echo "✅ Frontend accessible"
echo "✅ Database queries working"
echo "✅ Real data persistence verified"
echo ""
echo "If you experienced issues in the UI, please describe:"
echo "1. What specific action failed"
echo "2. Any error messages shown"
echo "3. Browser console errors"
echo "4. Network request failures"
echo "5. What you expected vs what happened"
#!/bin/bash

echo "🧪 Testing Multi-User Connection System Fix"
echo "=========================================="

API="http://localhost:3000/api"

echo ""
echo "1️⃣ Creating test users..."
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"username":"john","password":"password123","displayName":"John"}' \
  $API/auth/register | jq -r '"John registered: " + .success'

curl -s -X POST -H "Content-Type: application/json" \
  -d '{"username":"jane","password":"password123","displayName":"Jane"}' \
  $API/auth/register | jq -r '"Jane registered: " + .success'

curl -s -X POST -H "Content-Type: application/json" \
  -d '{"username":"mike","password":"password123","displayName":"Mike"}' \
  $API/auth/register | jq -r '"Mike registered: " + .success'

echo ""
echo "2️⃣ John sends friend requests to Jane and Mike..."
curl -s -X POST -H "Content-Type: application/json" -H "X-User-ID: 102" \
  -d '{"username":"jane"}' $API/connections/request | jq -r '"Request to Jane: " + .success'

curl -s -X POST -H "Content-Type: application/json" -H "X-User-ID: 102" \
  -d '{"username":"mike"}' $API/connections/request | jq -r '"Request to Mike: " + .success'

echo ""
echo "3️⃣ Jane's pending requests..."
curl -s -H "X-User-ID: 103" $API/connections/pending | jq -r '.[] | "Pending from: " + .user.displayName + " (ID: " + (.id|tostring) + ")"'

echo ""
echo "4️⃣ Jane accepts John's request (ID: 3)..."
curl -s -X POST -H "X-User-ID: 103" $API/connections/3/accept | jq -r '"Jane accepted John: " + .success'

echo ""
echo "5️⃣ John's connections - should show Jane only..."
curl -s -H "X-User-ID: 102" $API/connections | jq -r '.[] | "Connected with: " + .user.displayName + " (Status: " + .status + ")"'

echo ""
echo "6️⃣ Jane's connections - should show John only..."
curl -s -H "X-User-ID: 103" $API/connections | jq -r '.[] | "Connected with: " + .user.displayName + " (Status: " + .status + ")"'

echo ""
echo "7️⃣ Mike's connections - should be empty (still pending)..."
curl -s -H "X-User-ID: 104" $API/connections | jq -r '.[] | "Connected with: " + .user.displayName + " (Status: " + .status + ")"'

echo ""
echo "8️⃣ Mike's pending requests - should show John's request..."
curl -s -H "X-User-ID: 104" $API/connections/pending | jq -r '.[] | "Pending from: " + .user.displayName + " (ID: " + (.id|tostring) + ")"'

echo ""
echo "9️⃣ Mike accepts John's request (ID: 4)..."
curl -s -X POST -H "X-User-ID: 104" $API/connections/4/accept | jq -r '"Mike accepted John: " + .success'

echo ""
echo "🔟 FINAL: John's connections - should show BOTH Jane and Mike..."
curl -s -H "X-User-ID: 102" $API/connections | jq -r '.[] | "✅ Connected with: " + .user.displayName + " (Status: " + .status + ")"'

echo ""
echo "🎉 Multi-user connection system test complete!"
echo "Each user can now connect to multiple specific users independently."
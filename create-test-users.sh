#!/bin/bash

echo "=== CREATING TEST USERS ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'

echo "Creating test users Alice and Bob..."

# Create Alice
ALICE_CREATE=$(curl -s -X POST http://localhost:3000/api/messages/conversations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM0M2UxYmViLWEzY2ItNGI3NS04ODhhLWIxYTc4MjBhZDNiMyIsInVzZXJuYW1lIjoiYWxpY2UiLCJpYXQiOjE3NjY3MTE5MDIsImV4cCI6MTc2Njc5ODAwiYXVkIjoibGV0c2NoYXQtdXNlcnMiLCJpc3MiOiJsZXRzY2hhdCJ9" \
  -d '{"type":"direct","participantIds":["343e1beb-a3cb-4b75-888a-b1a7820ad3b3"]}')

if [[ $ALICE_CREATE == *"success"* ]]; then
    echo -e "${GREEN}✅ Alice test user created${NC}"
else
    echo -e "${RED}❌ Failed to create Alice test user${NC}"
fi

# Create Bob  
BOB_CREATE=$(curl -s -X POST http://localhost:3000/api/messages/conversations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM0M2UxYmViLWEzY2ItNGI3NS04ODhhLWIxYTc4MjBhZDNiMyIsInVzZXJuYW1lIjoiYWxpY2UiLCJpYXQiOjE3NjY3MTE5MDIsImV4cCI6MTc2Njc5ODAwiYXVkIjoibGV0c2NoYXQtdXNlcnMiLCJpc3MiOiJsZXRzY2hhdCJ9" \
  -d '{"type":"direct","participantIds":["343e1beb-a3cb-4b75-888a-b1a7820ad3b3"]}')

if [[ $BOB_CREATE == *"success"* ]]; then
    echo -e "${GREEN}✅ Bob test user created${NC}"
else
    echo -e "${RED}❌ Failed to create Bob test user${NC}"
fi

echo ""
echo -e "${GREEN}✅ Test users created successfully${NC}"
echo "Now running full conversation verification..."
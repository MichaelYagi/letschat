#!/bin/bash

echo "=== CONVERSATION INTERFACE VERIFICATION ==="
echo "Testing frontend conversation interface functionality"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Testing Frontend Connection${NC}"

# Check frontend accessibility
echo "Testing frontend accessibility..."
FRONTEND_TEST=$(curl -s http://localhost:5173 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is not accessible${NC}"
    exit 1
fi

echo -e "${BLUE}Step 2: Testing Backend-Frontend Integration${NC}"

# Test conversation API from frontend perspective
echo "Testing conversation API integration..."

# Test login and conversation access
ALICE_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}')

if [[ $ALICE_LOGIN == *"success"* ]]; then
    ALICE_TOKEN=$(echo $ALICE_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Alice login via frontend API${NC}"
    
    # Test conversations endpoint that frontend would use
    CONVERSATIONS=$(curl -s -H "Authorization: Bearer $ALICE_TOKEN" \
      http://localhost:3000/api/messages/conversations)
    
    if [[ $CONVERSATIONS == *"success"* ]] && [[ $CONVERSATIONS == *"id"* ]]; then
        echo -e "${GREEN}✅ Frontend can access conversations${NC}"
        CONV_ID=$(echo $CONVERSATIONS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo -e "${GREEN}   Conversation ID: $CONV_ID${NC}"
    else
        echo -e "${RED}❌ Frontend cannot access conversations${NC}"
        echo "Response: $CONVERSATIONS"
        exit 1
    fi
else
    echo -e "${RED}❌ Alice login failed${NC}"
    exit 1
fi

echo -e "${BLUE}Step 3: Testing Message API Integration${NC}"

# Test message loading API that frontend would use
echo "Testing message API integration..."

if [ ! -z "$ALICE_TOKEN" ] && [ ! -z "$CONV_ID" ]; then
    echo -e "${RED}❌ Missing token or conversation ID${NC}"
    exit 1
fi

# Test messages endpoint that frontend would use
MESSAGES=$(curl -s -H "Authorization: Bearer $ALICE_TOKEN" \
  "http://localhost:3000/api/messages/conversations/$CONV_ID/messages")

if [[ $MESSAGES == *"success"* ]]; then
    echo -e "${GREEN}✅ Frontend can load messages${NC}"
    
    # Check if messages include sender information
    if [[ $MESSAGES == *"sender"* ]]; then
        echo -e "${GREEN}✅ Messages include sender information${NC}"
    else
        echo -e "${RED}❌ Messages missing sender information${NC}"
        exit 1
    fi
    
    # Count messages
    MSG_COUNT=$(echo $MESSAGES | grep -o '"content":' | wc -l)
    echo -e "${GREEN}   Total messages: $MSG_COUNT${NC}"
else
    echo -e "${RED}❌ Frontend cannot load messages${NC}"
    echo "Response: $MESSAGES"
    exit 1
fi

echo -e "${BLUE}Step 4: Testing Message Sending${NC}"

# Test message sending API that frontend would use
TIMESTAMP=$(date +%s)
TEST_MESSAGE="Frontend test message at $TIMESTAMP"

SEND_RESPONSE=$(curl -s -X POST http://localhost:3000/api/messages/messages \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":\"$CONV_ID\",\"content\":\"$TEST_MESSAGE\"}")

if [[ $SEND_RESPONSE == *"success"* ]]; then
    echo -e "${GREEN}✅ Frontend can send messages${NC}"
    SENT_MSG_ID=$(echo $SEND_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}   Message ID: $SENT_MSG_ID${NC}"
else
    echo -e "${RED}❌ Frontend cannot send messages${NC}"
    echo "Response: $SEND_RESPONSE"
    exit 1
fi

echo -e "${BLUE}Step 5: Testing Cross-User Message Exchange${NC}"

# Test Bob authentication and message retrieval
echo "Testing cross-user message exchange..."

BOB_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"password123"}')

if [[ $BOB_LOGIN == *"success"* ]]; then
    BOB_TOKEN=$(echo $BOB_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Bob login successful${NC}"
    
    # Bob retrieves messages (should see Alice's test message)
    sleep 2
    BOB_MESSAGES=$(curl -s -H "Authorization: Bearer $BOB_TOKEN" \
      "http://localhost:3000/api/messages/conversations/$CONV_ID/messages")
    
    if [[ $BOB_MESSAGES == *"$TEST_MESSAGE"* ]]; then
        echo -e "${GREEN}✅ Bob can see Alice's test message${NC}"
    else
        echo -e "${RED}❌ Bob cannot see Alice's test message${NC}"
        echo "Alice message: $TEST_MESSAGE"
        echo "Bob response first 200 chars: ${BOB_MESSAGES:0:200}"
        exit 1
    fi
    
    # Bob sends reply
    BOB_REPLY="Bob reply at $TIMESTAMP"
    BOB_SEND=$(curl -s -X POST http://localhost:3000/api/messages/messages \
      -H "Authorization: Bearer $BOB_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"conversationId\":\"$CONV_ID\",\"content\":\"$BOB_REPLY\"}")
    
    if [[ $BOB_SEND == *"success"* ]]; then
        echo -e "${GREEN}✅ Bob can send reply${NC}"
    else
        echo -e "${RED}❌ Bob cannot send reply${NC}"
        exit 1
    fi
    
    # Alice retrieves Bob's reply
    sleep 2
    ALICE_MESSAGES=$(curl -s -H "Authorization: Bearer $ALICE_TOKEN" \
      "http://localhost:3000/api/messages/conversations/$CONV_ID/messages")
    
    if [[ $ALICE_MESSAGES == *"$BOB_REPLY"* ]]; then
        echo -e "${GREEN}✅ Alice can see Bob's reply${NC}"
    else
        echo -e "${RED}❌ Alice cannot see Bob's reply${NC}"
        echo "Bob reply: $BOB_REPLY"
        echo "Alice response first 200 chars: ${ALICE_MESSAGES:0:200}"
        exit 1
    fi
    
else
    echo -e "${RED}❌ Bob login failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 6: Testing Message Structure${NC}"

# Test message structure compatibility
echo "Testing message structure compatibility..."

# Check if backend response matches frontend expectations
STRUCTURE_TEST=$(curl -s -H "Authorization: Bearer $ALICE_TOKEN" \
  "http://localhost:3000/api/messages/conversations/$CONV_ID/messages" | head -1)

if [[ $STRUCTURE_TEST == *"sender":"* ]] && [[ $STRUCTURE_TEST == *"username"* ]] && [[ $STRUCTURE_TEST == *"displayName"* ]]; then
    echo -e "${GREEN}✅ Message structure compatible with frontend${NC}"
else
    echo -e "${RED}❌ Message structure incompatible with frontend${NC}"
    echo "Structure test: ${STRUCTURE_TEST:0:100}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🎯 FRONTEND INTERFACE VERIFICATION COMPLETE${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "${GREEN}✅ Frontend Accessibility: Working${NC}"
echo -e "${GREEN}✅ Conversation API Integration: Working${NC}"
echo -e "${GREEN}✅ Message API Integration: Working${NC}"
echo -e "${GREEN}✅ Message Sending: Working${NC}"
echo -e "${GREEN}✅ Cross-User Message Exchange: Working${NC}"
echo -e "${GREEN}✅ Message Structure Compatibility: Working${NC}"
echo ""
echo -e "${BLUE}🌐 Frontend Testing Instructions:${NC}"
echo ""
echo -e "${YELLOW}To test the actual frontend interface:${NC}"
echo ""
echo "1. Open your browser and go to: ${GREEN}http://localhost:5173${NC}"
echo ""
echo "2. Login as Alice:"
echo "   Username: ${GREEN}alice${NC}"
echo "   Password: ${GREEN}password123${NC}"
echo ""
echo "3. Open a new tab or private window"
echo "4. Login as Bob:"
echo "   Username: ${GREEN}bob${NC}"
echo "   Password: ${GREEN}password123${NC}"
echo ""
echo "5. Both users should see the same conversation with message history"
echo "6. Send messages back and forth - they should appear in real-time"
echo ""
echo -e "${YELLOW}🎯 Expected Results:${NC}"
echo "   ✅ Conversation list loads properly"
echo "   ✅ Messages load with sender information"
echo "   ✅ Real-time messaging works between users"
echo "   ✅ Messages persist in database"
echo "   ✅ Cross-user message exchange works"
echo ""
echo -e "${GREEN}The conversation feature is fully functional!${NC}"
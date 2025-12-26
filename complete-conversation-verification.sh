#!/bin/bash

echo "🎯 COMPLETE CONVERSATION FUNCTIONALITY VERIFICATION"
echo "Testing end-to-end conversation functionality"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to test health
test_health() {
    local health_check=$(curl -s http://localhost:3000/health 2>/dev/null)
    if [[ $health_check == *"ok"* ]]; then
        echo -e "${GREEN}✅ Backend server is running and healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend server is not responding${NC}"
        return 1
    fi
}

# Function to test authentication
test_authentication() {
    local user=$1
    local pass="password123"
    echo "Testing $user authentication..."
    
    local auth_response=$(curl -s -X POST http://localhost:3000/api/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$user\",\"password\":\"$pass\"}")
    
    if [[ $auth_response == *"success"* ]] && [[ $auth_response == *"token"* ]]; then
        local token=$(echo $auth_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ $user authenticated successfully${NC}"
        echo -e "${GREEN}   Token length: ${#token} characters${NC}"
        return "$token"
    else
        echo -e "${RED}❌ $user authentication failed${NC}"
        return ""
    fi
}

# Function to test conversation access
test_conversation_access() {
    local token=$1
    local user_name=$2
    
    echo "Testing conversation access for $user_name..."
    local conv_response=$(curl -s -H "Authorization: Bearer $token" \
        "http://localhost:3000/api/messages/conversations")
    
    if [[ $conv_response == *"success"* ]] && [[ $conv_response == *"id"* ]]; then
        local conv_id=$(echo $conv_response | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ $user_name can access conversations${NC}"
        echo -e "${GREEN}   Conversation ID: $conv_id${NC}"
        return "$conv_id"
    else
        echo -e "${RED}❌ $user_name cannot access conversations${NC}"
        echo -e "${RED}   Response: $conv_response${NC}"
        return ""
    fi
}

# Function to test message loading
test_message_loading() {
    local token=$1
    local conv_id=$2
    
    echo "Testing message loading for conversation $conv_id..."
    local msg_response=$(curl -s -H "Authorization: Bearer $token" \
        "http://localhost:3000/api/messages/conversations/$conv_id/messages")
    
    if [[ $msg_response == *"success"* ]] && [[ $msg_response == *"data"* ]]; then
        local msg_count=$(echo $msg_response | grep -o '"content":' | wc -l)
        echo -e "${GREEN}✅ Messages can be loaded ($msg_count messages)${NC}"
        
        # Check if messages include sender info
        if [[ $msg_response == *"sender":'* ]]; then
            echo -e "${GREEN}✅ Messages include sender information${NC}"
            return 0
        else
            echo -e "${RED}❌ Messages missing sender information${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Cannot load messages${NC}"
        echo -e "${RED}   Response: $msg_response${NC}"
        return 1
    fi
}

# Function to test message sending
test_message_sending() {
    local token=$1
    local conv_id=$2
    local user_name=$3
    local test_message=$4
    
    echo "Testing $user_name sending message: $test_message"
    local send_response=$(curl -s -X POST http://localhost:3000/api/messages/messages \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{\"conversationId\":\"$conv_id\",\"content\":\"$test_message\"}")
    
    if [[ $send_response == *"success"* ]]; then
        echo -e "${GREEN}✅ $user_name sent message successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ $user_name failed to send message${NC}"
        echo -e "${RED}   Response: $send_response${NC}"
        return 1
    fi
}

# Function to test message receipt
test_message_receipt() {
    local token=$1
    local conv_id=$2
    local expected_message=$3
    local user_name=$4
    
    echo "Testing if $expected_message is received by $user_name..."
    sleep 2
    local check_response=$(curl -s -H "Authorization: Bearer $token" \
        "http://localhost:3000/api/messages/conversations/$conv_id/messages")
    
    if [[ $check_response == *"$expected_message"* ]]; then
        echo -e "${GREEN}✅ $expected_message received by $user_name${NC}"
        return 0
    else
        echo -e "${RED}❌ $expected_message was not received${NC}"
        return 1
    fi
}

# Main verification function
main() {
    local success_count=0
    local total_tests=8
    
    echo -e "${BLUE}🎯 CONVERSATION FUNCTIONALITY VERIFICATION${NC}"
    echo "==========================================="
    echo ""
    
    echo -e "${BLUE}1. Server Connectivity Test${NC}"
    if test_health; then
        echo -e "${GREEN}✅ Backend server is running and healthy${NC}"
        ((success_count++))
    else
        echo -e "${RED}❌ Backend server is not responding${NC}"
        return 1
    fi
    
    echo ""
    echo -e "${BLUE}2. Authentication Test${NC}"
    
    # Create test users if needed
    ALICE_TOKEN=$(test_authentication "testuser1")
    BOB_TOKEN=$(test_authentication "testuser2")
    
    if [[ -n "$ALICE_TOKEN" || -n "$BOB_TOKEN" ]]; then
        echo -e "${RED}❌ User Authentication: Failed${NC}"
        return 1
    fi
    ((success_count++))
    
    echo ""
    echo -e "${BLUE}3. Conversation Access Test${NC}"
    
    ALICE_CONV_ID=$(test_conversation_access "$ALICE_TOKEN" "Alice")
    BOB_CONV_ID=$(test_conversation_access "$BOB_TOKEN" "Bob")
    
    if [[ -z "$ALICE_CONV_ID" || -z "$BOB_CONV_ID" ]]; then
        echo -e "${RED}❌ Conversation Access: Failed${NC}"
        return 1
    elif [[ "$ALICE_CONV_ID" != "$BOB_CONV_ID" ]]; then
        echo -e "${RED}❌ Users accessing different conversations${NC}"
        return 1
    fi
    ((success_count++))
    
    echo -e "${GREEN}✅ Conversation Access: Working${NC}"
    echo -e "${GREEN}   Both users access same conversation: $ALICE_CONV_ID${NC}"
    
    echo ""
    echo -e "${BLUE}4. Message Loading Test${NC}"
    
    if ! test_message_loading "$ALICE_TOKEN" "$ALICE_CONV_ID"; then
        echo -e "${RED}❌ Message Loading: Failed${NC}"
        return 1
    fi
    
    ((success_count++))
    
    echo ""
    echo -e "${BLUE}5. Message Exchange Test${NC}"
    
    TIMESTAMP=$(date +%s)
    ALICE_MSG="Message from Alice at $TIMESTAMP"
    if ! test_message_sending "$ALICE_TOKEN" "$ALICE_CONV_ID" "Alice" "$ALICE_MSG"; then
        echo -e "${RED}❌ Message Sending: Failed${NC}"
        return 1
    fi
    
    sleep 2
    
    if ! test_message_receipt "$BOB_TOKEN" "$ALICE_CONV_ID" "Alice" "$ALICE_MSG"; then
        echo -e "${RED}❌ Message Receipt: Failed${NC}"
        return 1
    fi
    
    BOB_REPLY="Reply from Bob at $TIMESTAMP"
    if ! test_message_sending "$BOB_TOKEN" "$ALICE_CONV_ID" "Bob" "$BOB_REPLY"; then
        echo -e "${RED}❌ Message Reply: Failed${NC}"
        return 1
    fi
    
    sleep 2
    
    if ! test_message_receipt "$ALICE_TOKEN" "$ALICE_CONV_ID" "Bob" "$BOB_REPLY"; then
        echo -e "${RED}❌ Message Receipt: Failed${NC}"
        return 1
    fi
    
    ((success_count++))
    
    echo ""
    echo -e "${BLUE}6. Message Persistence Test${NC}"
    
    if ! test_message_persistence "$ALICE_TOKEN" "$ALICE_CONV_ID"; then
        echo -e "${RED}❌ Message Persistence: Failed${NC}"
        return 1
    fi
    
    ((success_count++))
    
    echo ""
    echo -e "${BLUE}🎯 VERIFICATION RESULTS${NC}"
    echo ""
    echo -e "${BLUE}✅ Summary:${NC}"
    echo ""
    
    # Display results
    if [ $success_count -eq $total_tests ]; then
        echo -e "${GREEN}🎉 CONVERSATION FEATURE IS FULLY FUNCTIONAL!${NC}"
        echo ""
        echo -e "${BLUE}📋 What's Working:${NC}"
        echo ""
        echo -e "${GREEN}✅ End-to-end conversation messaging${NC}"
        echo -e "${GREEN}✅ Real-time message delivery${NC}"
        echo -e "${GREEN}✅ Message persistence and history${NC}"
        echo -e "${GREEN}✅ User authentication${NC}"
        echo -e "${GREEN}✅ Cross-user message visibility${NC}"
        echo ""
        echo -e "${BLUE}🌐 Frontend Testing Instructions:${NC}"
        echo ""
        echo "1. Open: ${GREEN}http://localhost:5173${NC}"
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
        echo "5. Both users should see:"
        echo "   ${GREEN}✓${NC} The same conversation"
        echo "   ${GREEN}✓${NC} Message history"
        echo "   ${GREEN}✓${NC} Real-time message updates"
        echo "   ${GREEN}✓${NC} Sender information (username/avatar)"
        echo ""
        echo "6. Send messages back and forth"
        echo "   ${GREEN}✓${NC} Messages should appear instantly"
    else
        echo ""
        echo -e "${RED}❌ VERIFICATION FAILED${NC}"
        echo ""
        echo -e "${RED}   Tests passed: $success_count/$total_tests"
        echo -e "${RED}   Tests failed: $((total_tests - success_count))"
        echo ""
        echo -e "${RED}   CONVERSATION FEATURE HAS ISSUES${NC}"
        echo ""
        echo -e "${YELLOW}Check backend server health and logs${NC}"
        echo -e "${YELLOW}Verify API endpoints directly with curl${NC}"
        echo -e "${YELLOW}Check frontend browser console for errors${NC}"
        echo ""
        echo -e "${YELLOW}Ensure both users can access the same conversation${NC}"
    fi
    
    echo "================================="
}

# Run main function
main
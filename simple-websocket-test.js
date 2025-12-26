const io = require('socket.io-client');

// Test token first
async function getToken() {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'alice', password: 'password123' }),
  });
  const data = await response.json();
  return data.success ? data.data.token : null;
}

async function testWebSocket() {
  const token = await getToken();
  if (!token) {
    console.log('❌ Cannot get token');
    return;
  }

  console.log('🔐 Connecting with token...');

  const socket = io('http://localhost:3000', {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket');

    // Join conversation
    socket.emit('join_conversation', { conversationId: '1' });
  });

  socket.on('joined_conversation', data => {
    console.log('✅ Joined conversation:', data);
  });

  socket.on('new_message', message => {
    console.log(
      '✅ Received message:',
      message.content,
      'from:',
      message.sender?.username || 'Unknown'
    );
  });

  socket.on('error', error => {
    console.log('❌ WebSocket error:', error);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected');
  });

  // Send test message
  setTimeout(() => {
    console.log('📤 Sending test message...');
    socket.emit('send_message', {
      conversationId: '1',
      content: 'WebSocket test message at ' + Date.now(),
    });
  }, 2000);

  // Listen for messages for 5 seconds
  setTimeout(() => {
    console.log('🔍 Test completed - disconnecting...');
    socket.disconnect();
  }, 7000);
}

console.log('🧪 Starting WebSocket test...');
testWebSocket().catch(console.error);

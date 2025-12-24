const io = require('socket.io-client');

console.log('🧪 Testing WebSocket Connection');

// Test with a valid token
const testToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3Yjk3ZmY2LWZlODctOTRmLWM2YjFmY2MjE3Y2MjIiLCJ1cWF0IjoxNzY2NTA2NDEyLCJleHAiOjE3NjU5Mjk2NCwiYXVkIjoibGV0c2NoYXQtdXNlcnMiLCJpc3MiOiJsZXRzY2hhdCJ9.invalid-token-for-testing';

console.log('Attempting WebSocket connection...');

const socket = io('http://localhost:3000', {
  auth: {
    token: testToken,
  },
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('✅ Successfully connected to WebSocket');
  process.exit(0);
});

socket.on('connect_error', error => {
  console.error('❌ Connection error:', error.message);
  console.error('Full error object:', error);
  process.exit(1);
});

socket.on('disconnect', reason => {
  console.log('🔌 Disconnected:', reason);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Connection timeout');
  process.exit(1);
}, 10000);

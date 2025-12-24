#!/usr/bin/env node

const io = require('socket.io-client');

console.log('🧪 Testing Friend Request Notification System\n');

// Test data with unique usernames and strong passwords
const timestamp = Date.now();
const testUsers = {
  user1: { username: `notifuser1_${timestamp}`, password: 'TestPass123!' },
  user2: { username: `notifuser2_${timestamp}`, password: 'TestPass123!' },
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function registerUser(userData) {
  const axios = require('axios');
  try {
    const response = await axios.post(
      'http://localhost:3000/api/auth/register',
      userData
    );
    console.log(`✅ Registered ${userData.username}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`ℹ️  ${userData.username} already exists, logging in...`);
      return await loginUser(userData);
    }
    console.error(
      `❌ Failed to register ${userData.username}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function loginUser(userData) {
  const axios = require('axios');
  try {
    const response = await axios.post(
      'http://localhost:3000/api/auth/login',
      userData
    );
    console.log(`✅ Logged in ${userData.username}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to login ${userData.username}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function sendFriendRequest(token, targetUsername) {
  const axios = require('axios');
  try {
    const response = await axios.post(
      'http://localhost:3000/api/connections/request',
      { username: targetUsername },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Friend request sent from user1 to ${targetUsername}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to send friend request:`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function checkNotifications(token) {
  const axios = require('axios');
  try {
    const response = await axios.get(
      'http://localhost:3000/api/notifications',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(
      `📬 Found ${response.data.notifications?.length || 0} notifications`
    );
    response.data.notifications?.forEach((notif, i) => {
      console.log(
        `   ${i + 1}. ${notif.title}: ${notif.message} (${notif.type})`
      );
    });
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to check notifications:`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function acceptFriendRequest(token, connectionId) {
  const axios = require('axios');
  try {
    const response = await axios.post(
      'http://localhost:3000/api/connections/accept',
      { connectionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Friend request accepted`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to accept friend request:`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function main() {
  try {
    // Register/login users
    console.log('👥 Setting up test users...');
    const user1Auth = await registerUser(testUsers.user1);
    const user2Auth = await registerUser(testUsers.user2);

    if (!user1Auth?.token || !user2Auth?.token) {
      console.log('❌ Failed to setup users');
      process.exit(1);
    }

    // Create WebSocket connections
    console.log('\n🔌 Setting up WebSocket connections...');
    const user1Socket = io('http://localhost:3000', {
      auth: { token: user1Auth.token },
    });
    const user2Socket = io('http://localhost:3000', {
      auth: { token: user2Auth.token },
    });

    user1Socket.on('connect', () =>
      console.log('✅ User1 connected to WebSocket')
    );
    user2Socket.on('connect', () =>
      console.log('✅ User2 connected to WebSocket')
    );

    user2Socket.on('new_notification', data => {
      console.log('🔔 User2 received notification:', data.notification);
    });

    user1Socket.on('new_notification', data => {
      console.log('🔔 User1 received notification:', data.notification);
    });

    // Wait for WebSocket connections
    await sleep(2000);

    // Check initial notifications
    console.log('\n📬 Checking initial notifications...');
    await checkNotifications(user2Auth.token);

    // Send friend request
    console.log('\n🤝 Sending friend request...');
    const friendRequest = await sendFriendRequest(
      user1Auth.token,
      testUsers.user2.username
    );

    if (!friendRequest) {
      console.log('❌ Failed to send friend request');
      process.exit(1);
    }

    // Wait for notification to be delivered
    console.log('\n⏳ Waiting for notification delivery...');
    await sleep(3000);

    // Check notifications for user2
    console.log('\n📬 Checking notifications for user2 (recipient)...');
    const notifications = await checkNotifications(user2Auth.token);

    if (
      notifications &&
      notifications.notifications &&
      notifications.notifications.length > 0
    ) {
      const connectionNotif = notifications.notifications.find(
        n => n.type === 'connection_request'
      );
      if (connectionNotif) {
        console.log('\n✅ SUCCESS: Friend request notification found!');

        // Accept the friend request
        console.log('\n👍 Accepting friend request...');
        await acceptFriendRequest(user2Auth.token, connectionNotif.id);

        // Wait for acceptance notification
        await sleep(2000);

        // Check user1 notifications
        console.log('\n📬 Checking notifications for user1 (requester)...');
        await checkNotifications(user1Auth.token);
      } else {
        console.log('\n❌ No connection request notification found');
      }
    } else {
      console.log('\n❌ No notifications found for user2');
    }

    // Cleanup
    setTimeout(() => {
      user1Socket.disconnect();
      user2Socket.disconnect();
      console.log('\n🧹 Test completed!');
      process.exit(0);
    }, 2000);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();

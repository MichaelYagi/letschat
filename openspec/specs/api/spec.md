# API Endpoints Specification

## API Design Principles
- **RESTful design**: Resource-oriented URLs with proper HTTP methods
- **Versioning**: API versioning in URL path (/api/v1/)
- **Consistent responses**: Standardized response format across all endpoints
- **Security**: JWT authentication, rate limiting, input validation
- **Documentation**: OpenAPI 3.0 specification for all endpoints

## Authentication

### JWT Token Format
```json
{
  "sub": "user_id",
  "username": "johndoe",
  "iat": 1640995200,
  "exp": 1641081600,
  "scope": ["read", "write"]
}
```

### Authentication Endpoints

#### POST /api/v1/auth/register
Register new user account

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "username": "johndoe",
      "displayName": "John Doe",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "expiresIn": 3600
    }
  }
}
```

#### POST /api/v1/auth/login
Authenticate user and receive tokens

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "username": "johndoe",
      "displayName": "John Doe",
      "lastSeen": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "expiresIn": 3600
    }
  }
}
```

#### POST /api/v1/auth/refresh
Refresh access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### POST /api/v1/auth/logout
Invalidate current session

**Headers:** `Authorization: Bearer jwt_token_here`

#### DELETE /api/v1/auth/sessions/:sessionId
Invalidate specific session

## User Management

### GET /api/v1/users/profile
Get current user profile

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "status": "online",
    "settings": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

### PUT /api/v1/users/profile
Update user profile

**Request Body:**
```json
{
  "displayName": "John Smith",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

### PUT /api/v1/users/settings
Update user settings

**Request Body:**
```json
{
  "theme": "dark",
  "notifications": false,
  "messagePreview": true
}
```

### GET /api/v1/users/search?query=john&limit=10
Search for users by username

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    ],
    "total": 1
  }
}
```

## Connections

### GET /api/v1/connections
Get user's connections and pending requests

**Response (200):**
```json
{
  "success": true,
  "data": {
    "connections": [
      {
        "id": "456",
        "user": {
          "username": "janedoe",
          "displayName": "Jane Doe"
        },
        "status": "accepted",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pendingRequests": [
      {
        "id": "789",
        "user": {
          "username": "bobsmith",
          "displayName": "Bob Smith"
        },
        "type": "received",
        "createdAt": "2024-01-02T00:00:00Z"
      }
    ]
  }
}
```

### POST /api/v1/connections/request
Send connection request

**Request Body:**
```json
{
  "username": "janedoe"
}
```

### PUT /api/v1/connections/:requestId/accept
Accept connection request

### PUT /api/v1/connections/:requestId/reject
Reject connection request

### DELETE /api/v1/connections/:userId
Remove connection

### POST /api/v1/connections/:userId/block
Block user

### DELETE /api/v1/connections/:userId/block
Unblock user

## Conversations

### GET /api/v1/conversations
Get user's conversations

**Query Parameters:**
- `limit`: Number of conversations to return (default: 20)
- `offset`: Pagination offset (default: 0)
- `type`: Filter by type (direct, group)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "123",
        "type": "direct",
        "name": null,
        "participant": {
          "username": "janedoe",
          "displayName": "Jane Doe",
          "status": "online",
          "avatarUrl": "https://example.com/avatar.jpg"
        },
        "lastMessage": {
          "content": "Hey there!",
          "senderId": "456",
          "createdAt": "2024-01-01T00:00:00Z"
        },
        "unreadCount": 2,
        "lastReadAt": "2024-01-01T12:00:00Z"
      }
    ],
    "hasMore": true
  }
}
```

### POST /api/v1/conversations
Create new conversation

**Request Body:**
```json
{
  "type": "direct",
  "participantUsername": "janedoe"
}
```

or for group:
```json
{
  "type": "group",
  "name": "Project Team",
  "description": "Team chat for project updates",
  "participantUsernames": ["janedoe", "bobsmith"]
}
```

### GET /api/v1/conversations/:conversationId
Get conversation details

### PUT /api/v1/conversations/:conversationId
Update conversation details (group only)

### DELETE /api/v1/conversations/:conversationId
Leave/delete conversation

### POST /api/v1/conversations/:conversationId/participants
Add participants to group

### DELETE /api/v1/conversations/:conversationId/participants/:userId
Remove participant from group

## Messages

### GET /api/v1/conversations/:conversationId/messages
Get messages for conversation

**Query Parameters:**
- `limit`: Number of messages to return (default: 50)
- `before`: Get messages before this message ID
- `after`: Get messages after this message ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "123",
        "content": "Hello world!",
        "contentType": "text",
        "sender": {
          "id": "456",
          "username": "janedoe",
          "displayName": "Jane Doe"
        },
        "replyTo": null,
        "threadId": null,
        "isEdited": false,
        "status": "read",
        "createdAt": "2024-01-01T00:00:00Z",
        "editedAt": null
      }
    ],
    "hasMore": true
  }
}
```

### POST /api/v1/conversations/:conversationId/messages
Send message

**Request Body:**
```json
{
  "content": "Hello world!",
  "contentType": "text",
  "replyToId": null
}
```

### PUT /api/v1/messages/:messageId
Edit message

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

### DELETE /api/v1/messages/:messageId
Delete message

### POST /api/v1/messages/:messageId/reactions
Add reaction to message

**Request Body:**
```json
{
  "emoji": "👍"
}
```

### DELETE /api/v1/messages/:messageId/reactions/:emoji
Remove reaction

### GET /api/v1/messages/search
Search messages

**Query Parameters:**
- `query`: Search query
- `conversationId`: Optional conversation filter
- `limit`: Number of results (default: 20)

## Files

### POST /api/v1/files/upload
Upload file

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file`: File to upload
- `conversationId`: Target conversation ID
- `messageId`: Optional message ID for existing message

**Response (201):**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "123",
      "filename": "document.pdf",
      "originalFilename": "my-document.pdf",
      "mimeType": "application/pdf",
      "fileSize": 1024000,
      "downloadUrl": "/api/v1/files/123/download",
      "thumbnailUrl": "/api/v1/files/123/thumbnail",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### GET /api/v1/files/:fileId/download
Download file

**Response:** File content with appropriate headers

### GET /api/v1/files/:fileId/thumbnail
Get file thumbnail

**Response:** Thumbnail image with appropriate headers

### DELETE /api/v1/files/:fileId
Delete file

## Notifications

### GET /api/v1/notifications
Get user notifications

**Query Parameters:**
- `limit`: Number of notifications (default: 20)
- `offset`: Pagination offset (default: 0)
- `unreadOnly`: Filter unread notifications (true/false)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "123",
        "type": "message",
        "title": "New message from Jane Doe",
        "content": "Hey there!",
        "data": {
          "conversationId": "456",
          "messageId": "789"
        },
        "isRead": false,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "unreadCount": 5,
    "hasMore": true
  }
}
```

### PUT /api/v1/notifications/:notificationId/read
Mark notification as read

### PUT /api/v1/notifications/read-all
Mark all notifications as read

### DELETE /api/v1/notifications/:notificationId
Delete notification

## WebSocket Events

### Connection
```javascript
const socket = io('wss://example.com', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Client Events

#### join_conversation
```javascript
socket.emit('join_conversation', {
  conversationId: '123'
});
```

#### send_message
```javascript
socket.emit('send_message', {
  conversationId: '123',
  content: 'Hello world!',
  contentType: 'text',
  replyToId: null
});
```

#### typing_start
```javascript
socket.emit('typing_start', {
  conversationId: '123'
});
```

#### typing_stop
```javascript
socket.emit('typing_stop', {
  conversationId: '123'
});
```

### Server Events

#### message_received
```javascript
socket.on('message_received', (data) => {
  // {
  //   id: '123',
  //   conversationId: '123',
  //   content: 'Hello world!',
  //   sender: { id: '456', username: 'janedoe' },
  //   createdAt: '2024-01-01T00:00:00Z'
  // }
});
```

#### message_updated
```javascript
socket.on('message_updated', (data) => {
  // Message update event
});
```

#### message_deleted
```javascript
socket.on('message_deleted', (data) => {
  // Message deletion event
});
```

#### user_typing
```javascript
socket.on('user_typing', (data) => {
  // {
  //   conversationId: '123',
  //   userId: '456',
  //   username: 'janedoe'
  // }
});
```

#### user_status_changed
```javascript
socket.on('user_status_changed', (data) => {
  // {
  //   userId: '456',
  //   status: 'online',
  //   lastSeen: '2024-01-01T00:00:00Z'
  // }
});
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "username",
      "reason": "Username already exists"
    }
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid input data
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Rate Limiting

### Rate Limits
- **Authentication**: 5 requests per minute
- **Messages**: 60 messages per minute per user
- **File uploads**: 10 uploads per hour per user
- **API requests**: 1000 requests per hour per user
- **Search**: 30 searches per minute per user

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```
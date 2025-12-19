# Database Schema Specification

## Database Design Principles
- **Normalization**: Third normal form with denormalization for performance where appropriate
- **Security**: Encrypted fields for sensitive data with proper access controls
- **Scalability**: Optimized indexes and query patterns for concurrent access
- **Integrity**: Foreign key constraints and proper data validation
- **Migration**: Version-controlled schema migrations

## Core Tables

### users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email_hash TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    public_key TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'offline',
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_seen ON users(last_seen);
```

### connections
```sql
CREATE TABLE connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(requester_id, recipient_id)
);

CREATE INDEX idx_connections_user ON connections(requester_id);
CREATE INDEX idx_connections_status ON connections(status);
```

### conversations
```sql
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
    name TEXT, -- Only for group conversations
    description TEXT, -- Only for group conversations
    avatar_url TEXT, -- Only for group conversations
    created_by INTEGER NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
```

### conversation_participants
```sql
CREATE TABLE conversation_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_read_at DATETIME,
    is_muted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
```

### messages
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content_encrypted TEXT NOT NULL,
    content_type TEXT DEFAULT 'text',
    reply_to_id INTEGER, -- For threaded messages
    thread_id INTEGER, -- For grouping threaded messages
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at DATETIME,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_reply ON messages(reply_to_id);
```

### message_status
```sql
CREATE TABLE message_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_status_message ON message_status(message_id);
CREATE INDEX idx_message_status_user ON message_status(user_id);
```

### files
```sql
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    uploader_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    is_encrypted BOOLEAN DEFAULT TRUE,
    encryption_key_encrypted TEXT,
    download_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_files_message ON files(message_id);
CREATE INDEX idx_files_uploader ON files(uploader_id);
CREATE INDEX idx_files_mime_type ON files(mime_type);
```

### mentions
```sql
CREATE TABLE mentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    mentioned_user_id INTEGER NOT NULL,
    mentioned_by_user_id INTEGER NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_mentions_message ON mentions(message_id);
CREATE INDEX idx_mentions_user ON mentions(mentioned_user_id);
CREATE INDEX idx_mentions_unread ON mentions(mentioned_user_id, is_read);
```

### notifications
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    data_encrypted TEXT, -- JSON data for notification-specific info
    is_read BOOLEAN DEFAULT FALSE,
    is_push_sent BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
```

### user_sessions
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE NOT NULL,
    device_info TEXT, -- JSON object with device details
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_refresh ON user_sessions(refresh_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

### user_settings
```sql
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    message_preview BOOLEAN DEFAULT TRUE,
    read_receipts BOOLEAN DEFAULT TRUE,
    typing_indicators BOOLEAN DEFAULT TRUE,
    auto_download_files BOOLEAN DEFAULT FALSE,
    settings_encrypted TEXT, -- JSON for additional settings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Security and Encryption

### Encrypted Fields
- `users.private_key_encrypted` - User's private encryption key
- `messages.content_encrypted` - Encrypted message content
- `files.encryption_key_encrypted` - File encryption key
- `notifications.data_encrypted` - Notification-specific encrypted data
- `user_settings.settings_encrypted` - Additional user settings

### Encryption Strategy
- **Per-user encryption keys**: Each user has unique encryption key pair
- **Message encryption**: Messages encrypted with conversation-specific keys
- **File encryption**: Files encrypted with unique keys per file
- **Database encryption**: SQLite encryption at rest with master key

## Performance Optimizations

### Indexing Strategy
- **Primary queries**: Conversation message retrieval
- **Search queries**: Content search with full-text search
- **Status queries**: User presence and connection status
- **Notification queries**: Unread notification counts

### Query Patterns
```sql
-- Get recent messages for conversation
SELECT m.*, u.username, u.display_name
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.conversation_id = ? AND m.is_deleted = FALSE
ORDER BY m.created_at DESC
LIMIT 50;

-- Get user's conversations with unread counts
SELECT c.*, 
       cp.last_read_at,
       COUNT(m.id) - COUNT(CASE WHEN m.created_at <= cp.last_read_at THEN 1 END) as unread_count
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
LEFT JOIN messages m ON c.id = m.conversation_id AND m.is_deleted = FALSE
WHERE cp.user_id = ?
GROUP BY c.id
ORDER BY MAX(m.created_at) DESC;

-- Get user's online status
SELECT username, status, last_seen
FROM users
WHERE id IN (SELECT user_id FROM conversation_participants WHERE conversation_id = ?);
```

## Data Migration Strategy

### Version Control
- **Migration files**: Sequential migration files with version numbers
- **Rollback support**: Each migration includes rollback procedure
- **Testing**: Migrations tested against production data samples

### Migration Example
```sql
-- Migration 001_create_users.sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    -- ... other fields
);

-- Migration 002_add_user_status.sql
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'offline';
CREATE INDEX idx_users_status ON users(status);
```

## Backup and Recovery

### Backup Strategy
- **Full backups**: Daily full database backups
- **Incremental backups**: Hourly incremental backups
- **Point-in-time recovery**: WAL mode for consistent backups
- **Encryption**: Backups encrypted with separate backup key

### Recovery Procedures
- **Database corruption**: Restore from latest full backup
- **Partial data loss**: Point-in-time recovery to specific timestamp
- **Key rotation**: Re-encrypt sensitive data during recovery

## Data Retention

### Retention Policies
- **Deleted messages**: Soft delete for 30 days, then permanent deletion
- **User sessions**: Automatic cleanup of expired sessions
- **Notifications**: Cleanup of read notifications older than 90 days
- **File storage**: Cleanup of orphaned files and old thumbnails

### Cleanup Jobs
```sql
-- Cleanup old deleted messages
DELETE FROM messages 
WHERE is_deleted = TRUE AND deleted_at < datetime('now', '-30 days');

-- Cleanup expired sessions
DELETE FROM user_sessions 
WHERE expires_at < datetime('now') OR is_active = FALSE;

-- Cleanup old notifications
DELETE FROM notifications 
WHERE is_read = TRUE AND read_at < datetime('now', '-90 days');
```
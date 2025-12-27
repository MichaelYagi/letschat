-- Remove plaintext content from existing messages table (if it exists)
-- Check if messages table exists first and modify accordingly

-- Create messages table without content column (only encrypted)
CREATE TABLE IF NOT EXISTS messages_new (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'system')),
  encrypted_content TEXT,
  signature TEXT,
  reply_to_id TEXT,
  thread_id TEXT,
  edited_at DATETIME,
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL,
  FOREIGN KEY (thread_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- If old messages table exists, migrate data (excluding plaintext content)
-- INSERT INTO messages_new SELECT id, conversation_id, sender_id, content_type, encrypted_content, signature, reply_to_id, thread_id, edited_at, deleted_at, created_at FROM messages;

-- Drop old table and rename new one
-- DROP TABLE IF EXISTS messages;
-- ALTER TABLE messages_new RENAME TO messages;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages_new(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages_new(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages_new(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages_new(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages_new(reply_to_id);
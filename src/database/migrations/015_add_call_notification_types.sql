-- Add call notification types to the notifications table constraint
-- This migration extends the allowed notification types to include call-related notifications

-- SQLite doesn't support ALTER CONSTRAINT, so we need to recreate the table
CREATE TABLE notifications_new AS SELECT * FROM notifications;

DROP TABLE notifications;

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'connection_request', 'mention', 'system', 'incoming-call', 'call-missed', 'call-ended')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT, -- JSON data for additional info
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data back
INSERT INTO notifications SELECT * FROM notifications_new;

-- Drop the temporary table
DROP TABLE notifications_new;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
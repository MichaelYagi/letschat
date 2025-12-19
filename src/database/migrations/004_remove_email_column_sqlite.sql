-- Remove email column from users table - SQLite version
-- This migration removes the email requirement for user registration

-- Create new users table without email column
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline',
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table to new table (excluding email column)
INSERT INTO users_new (
  id, username, password_hash, display_name, avatar_url, 
  status, last_seen, created_at, updated_at
)
SELECT 
  id, username, password_hash, display_name, avatar_url,
  status, last_seen, created_at, updated_at
FROM users;

-- Drop the old table
DROP TABLE users;

-- Rename the new table to the original name
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes (without email index)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Recreate triggers
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
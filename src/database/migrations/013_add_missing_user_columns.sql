-- Add missing columns to users table for displayName removal cleanup
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN last_seen DATETIME;
UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE last_seen IS NULL;
-- Add encryption keys to users table
ALTER TABLE users ADD COLUMN public_key TEXT;
ALTER TABLE users ADD COLUMN private_key TEXT;

-- Create indexes for key lookups
CREATE INDEX IF NOT EXISTS idx_users_public_key ON users(public_key);
-- Add encryption key to conversations table
ALTER TABLE conversations ADD COLUMN encryption_key TEXT;

-- Create index for encryption key lookups
CREATE INDEX IF NOT EXISTS idx_conversations_encryption_key ON conversations(encryption_key);

-- Remove encryption keys from users table
ALTER TABLE users DROP COLUMN IF EXISTS public_key;
ALTER TABLE users DROP COLUMN IF EXISTS private_key;

-- Drop the old index if it exists
DROP INDEX IF EXISTS idx_users_public_key;
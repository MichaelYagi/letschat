-- Remove plaintext content column for better security
-- Only keep encrypted_content for end-to-end encryption

-- First, create a backup of content for encrypted messages (optional)
-- CREATE TEMPORARY TABLE message_backup AS SELECT id, content FROM messages WHERE encrypted_content IS NOT NULL;

-- Update any plaintext messages that should be encrypted
UPDATE messages 
SET content = '[Legacy message]', 
    encrypted_content = NULL 
WHERE encrypted_content IS NULL AND content IS NOT NULL;

-- Drop the content column (removes plaintext storage)
ALTER TABLE messages DROP COLUMN content;

-- Recreate indexes that might reference the dropped column (if any)
-- Note: Most indexes should still work as they reference other columns
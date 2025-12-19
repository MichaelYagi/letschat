-- Remove email column from users table
-- This migration removes the email requirement for user registration

-- Drop the email index
DROP INDEX IF EXISTS idx_users_email;

-- Remove the email column from users table
-- Note: This will delete all existing email data
ALTER TABLE users DROP COLUMN IF EXISTS email;
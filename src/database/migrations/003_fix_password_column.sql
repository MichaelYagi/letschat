-- Fix password column name
ALTER TABLE users RENAME COLUMN password TO password_hash;
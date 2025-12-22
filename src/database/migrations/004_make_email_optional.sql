-- Make email field optional by adding a default value and removing NOT NULL constraint
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE DEFAULT '',
  password_hash TEXT NOT NULL,
  display_name TEXT,
  status TEXT DEFAULT 'offline',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  public_key TEXT,
  private_key TEXT,
  updated_at DATETIME
);

-- Copy data from old table
INSERT INTO users_new SELECT id, username, COALESCE(email, ''), password_hash, display_name, status, created_at, public_key, private_key, updated_at FROM users;

-- Drop old table and rename new one
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_public_key ON users(public_key);

-- Recreate trigger
CREATE TRIGGER update_users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
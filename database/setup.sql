CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  display_name TEXT,
  status TEXT DEFAULT 'offline',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(conversation_id, user_id)
);

INSERT INTO users (id, username, password, display_name, status) VALUES 
  ('1', 'alice', 'password123', 'Alice', 'online'),
  ('2', 'bob', 'password456', 'Bob', 'online');

INSERT INTO conversations (id, type, created_by) VALUES 
  ('1', 'direct', '1');

INSERT INTO conversation_participants (id, conversation_id, user_id, role, joined_at, last_read_at) VALUES 
  ('1', '1', '1', 'member', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('2', '1', '2', 'member', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
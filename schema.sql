-- D1 Database Schema for robotysnet

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'registered', -- 'registered', 'paid'
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS apps_access (
  slug TEXT PRIMARY KEY,
  access_level TEXT NOT NULL -- 'public', 'restricted'
);

-- Prepopulate apps accessibility metadata
INSERT OR IGNORE INTO apps_access (slug, access_level) VALUES ('json-formatter', 'public');
INSERT OR IGNORE INTO apps_access (slug, access_level) VALUES ('base64-codec', 'public');
INSERT OR IGNORE INTO apps_access (slug, access_level) VALUES ('hash-generator', 'public');
INSERT OR IGNORE INTO apps_access (slug, access_level) VALUES ('premium-analytics', 'restricted');

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'unpublished', -- 'published', 'unpublished'
  tags TEXT,
  title TEXT NOT NULL,
  hook TEXT,
  markdown TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_posts_uuid ON posts(uuid);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  url TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_links_sort ON links(sort);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT NOT NULL,
  attempt_time INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip, attempt_time);

CREATE TABLE IF NOT EXISTS facilitators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT UNIQUE NOT NULL,
  facilitator_id INTEGER NOT NULL,
  session_date TEXT NOT NULL,
  topic TEXT NOT NULL,
  attendee_count INTEGER NOT NULL CHECK (attendee_count >= 0),
  notes TEXT,
  created_offline INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (facilitator_id) REFERENCES facilitators(id)
);
CREATE TABLE IF NOT EXISTS user_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  target_url TEXT NOT NULL,
  event TEXT NOT NULL,
  watchlist_only INTEGER NOT NULL DEFAULT 1,
  port_filter TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  last_fired_at INTEGER,
  last_status INTEGER,
  label TEXT
);
CREATE INDEX IF NOT EXISTS idx_user_alerts_user ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_event ON user_alerts(event, active);

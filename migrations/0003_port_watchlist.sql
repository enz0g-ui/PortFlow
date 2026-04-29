CREATE TABLE IF NOT EXISTS user_port_watchlist (
  user_id TEXT NOT NULL,
  port_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, port_id)
);
CREATE INDEX IF NOT EXISTS idx_uport_watch_user ON user_port_watchlist(user_id);

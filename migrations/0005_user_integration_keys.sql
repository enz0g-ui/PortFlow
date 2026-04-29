CREATE TABLE IF NOT EXISTS user_integration_keys (
  user_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  env_key_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  iv TEXT NOT NULL,
  tag TEXT NOT NULL,
  configured_at INTEGER NOT NULL,
  validated_at INTEGER,
  last_status TEXT,
  PRIMARY KEY (user_id, source_id, env_key_name)
);
CREATE INDEX IF NOT EXISTS idx_uik_user ON user_integration_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_uik_source ON user_integration_keys(user_id, source_id);

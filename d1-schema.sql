-- Cloudflare D1 SQLite 数据库初始化表结构

CREATE TABLE IF NOT EXISTS user_sync (
  user_id TEXT PRIMARY KEY,
  user_data TEXT,
  accounts_data TEXT,
  transactions_data TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sync_updated ON user_sync(updated_at);

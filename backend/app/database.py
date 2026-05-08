import sqlite3
from contextlib import contextmanager

from .config import DATA_DIR, DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL UNIQUE,
  duty_score REAL NOT NULL,
  duty_salience TEXT NOT NULL,
  intellect_score REAL NOT NULL,
  intellect_salience TEXT NOT NULL,
  adversity_score REAL NOT NULL,
  adversity_salience TEXT NOT NULL,
  mating_score REAL NOT NULL,
  mating_salience TEXT NOT NULL,
  positivity_score REAL NOT NULL,
  positivity_salience TEXT NOT NULL,
  negativity_score REAL NOT NULL,
  negativity_salience TEXT NOT NULL,
  deception_score REAL NOT NULL,
  deception_salience TEXT NOT NULL,
  sociality_score REAL NOT NULL,
  sociality_salience TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
"""


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript(SCHEMA)


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
